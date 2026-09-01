import { env } from 'cloudflare:workers';
import {
  AGENT_MODEL,
  MAX_INPUT_LENGTH,
  MAX_MESSAGES,
  MAX_OUTPUT_TOKENS,
  MAX_TOTAL_INPUT_LENGTH,
  OPENING_HTML,
  SYSTEM_PROMPT,
} from '@/lib/agent';
import { AGENT_RATE_LIMIT, enforceRateLimit } from '@/lib/rate-limit';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function sseEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 第一轮：返回固定开场白（不调用模型）。 */
function openingResponse(remaining: number): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        sseEvent({
          id: 'opening',
          object: 'chat.completion.chunk',
          choices: [{ index: 0, delta: { role: 'assistant', content: OPENING_HTML }, finish_reason: null }],
        }),
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-agent-model': AGENT_MODEL,
      'x-ratelimit-remaining': String(remaining),
    },
  });
}

/**
 * DeepSeek v4-flash 会在 SSE 里附带 reasoning_content。它既不需要展示，
 * 也不该被传到浏览器，因此只重新输出正文 content 与结束事件。
 */
function contentOnlySse(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = '';
  let sentDone = false;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();

      const processEvent = (raw: string) => {
        const data = raw
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .join('\n');
        if (!data) return;
        if (data === '[DONE]') {
          if (!sentDone) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            sentDone = true;
          }
          return;
        }

        try {
          const event = JSON.parse(data) as {
            id?: string;
            object?: string;
            created?: number;
            model?: string;
            choices?: Array<{
              index?: number;
              delta?: { content?: unknown };
            }>;
          };
          const choice = event.choices?.[0];
          const content = choice?.delta?.content;
          if (typeof content !== 'string' || !content) return;
          controller.enqueue(
            sseEvent({
              id: event.id ?? 'gameboost-agent',
              object: event.object ?? 'chat.completion.chunk',
              created: event.created,
              model: event.model ?? AGENT_MODEL,
              choices: [{ index: choice?.index ?? 0, delta: { content }, finish_reason: null }],
            }),
          );
        } catch {
          // 上游偶发的非 JSON keep-alive 直接忽略，不向浏览器泄露原始内容。
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          let separator = pending.indexOf('\n\n');
          while (separator !== -1) {
            processEvent(pending.slice(0, separator));
            pending = pending.slice(separator + 2);
            separator = pending.indexOf('\n\n');
          }
        }
        pending += decoder.decode();
        if (pending.trim()) processEvent(pending);
      } finally {
        if (!sentDone) controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

/**
 * 官网 Agent 对话接口（浏览器永不接触 API Key）。
 * - 第一轮：固定开场白
 * - 后续：受限流保护的 DeepSeek 流式回复，只转发可见正文
 */
export async function POST(request: Request) {
  let payload: { messages?: unknown };
  try {
    payload = (await request.json()) as { messages?: unknown };
  } catch {
    return json({ error: 'invalid_body', message: '请求体必须是 JSON' }, 400);
  }

  const rawMessages = payload.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length < 1 || rawMessages.length > MAX_MESSAGES) {
    return json({ error: 'invalid_parameter', message: `消息数量必须在 1 到 ${MAX_MESSAGES} 条之间` }, 400);
  }
  if (rawMessages.length % 2 === 0) {
    return json({ error: 'invalid_parameter', message: '对话需要以用户消息开始并结束' }, 400);
  }

  const messages: ChatMessage[] = [];
  let totalLength = 0;
  for (const [index, item] of rawMessages.entries()) {
    const role = (item as ChatMessage)?.role;
    const content = (item as ChatMessage)?.content;
    const expectedRole = index % 2 === 0 ? 'user' : 'assistant';
    if (role !== expectedRole || typeof content !== 'string' || !content.trim()) {
      return json({ error: 'invalid_parameter', message: '消息顺序或格式不正确' }, 400);
    }
    if (content.length > MAX_INPUT_LENGTH) {
      return json({ error: 'too_long', message: `单条消息不能超过 ${MAX_INPUT_LENGTH} 字` }, 400);
    }
    totalLength += content.length;
    messages.push({ role, content });
  }
  if (totalLength > MAX_TOTAL_INPUT_LENGTH) {
    return json({ error: 'too_long', message: `本轮对话总长度不能超过 ${MAX_TOTAL_INPUT_LENGTH} 字` }, 400);
  }

  let rate;
  try {
    rate = await enforceRateLimit(request, 'agent', AGENT_RATE_LIMIT);
  } catch {
    // 限流依赖失效时宁可临时暂停模型，不给 API 余额留下敞口。
    return json({ error: 'service_protected', message: '服务正在进行保护，请稍后再试或联系李俊贤' }, 503);
  }
  if (!rate.allowed) {
    return json(
      { error: 'rate_limited', message: '为了保证每位访客都能使用，请稍后再聊。' },
      429,
      { 'retry-after': String(rate.retryAfterSeconds), 'x-ratelimit-remaining': '0' },
    );
  }

  if (messages.length === 1) return openingResponse(rate.remaining);

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return json({ error: 'server_not_configured', message: '模型服务还没有配置好，请稍后再试' }, 500);
  }

  let upstream: Response;
  try {
    upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AGENT_MODEL,
        stream: true,
        temperature: 0.4,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
  } catch {
    return json({ error: 'upstream_unreachable', message: '暂时连不上模型服务，请稍后再试' }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    return json({ error: 'upstream_error', message: '模型服务暂时不可用，请稍后再试' }, 502);
  }

  return new Response(contentOnlySse(upstream.body), {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-agent-model': AGENT_MODEL,
      'x-ratelimit-remaining': String(rate.remaining),
    },
  });
}
