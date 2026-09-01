import { env } from 'cloudflare:workers';
import {
  AGENT_MODEL,
  MAX_INPUT_LENGTH,
  MAX_MESSAGES,
  OPENING_HTML,
  SYSTEM_PROMPT,
} from '@/lib/agent';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function sseEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 第一轮：返回固定开场白（不调用模型），并带上模型署名 */
function openingResponse(): Response {
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
    },
  });
}

/**
 * 官网 Agent 对话接口（仅本站服务端调用，浏览器永不接触 API Key）。
 * - 第一轮：固定开场白
 * - 之后：流式调用 DeepSeek，把 SSE 原样转发给前端
 * - 限制：单条 ≤1000 字、历史 ≤12 条、输出 ≤500 token
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

  const messages: ChatMessage[] = [];
  for (const item of rawMessages) {
    const role = (item as ChatMessage)?.role;
    const content = (item as ChatMessage)?.content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return json({ error: 'invalid_parameter', message: '消息格式不正确' }, 400);
    }
    if (content.length > MAX_INPUT_LENGTH) {
      return json({ error: 'too_long', message: `单条消息不能超过 ${MAX_INPUT_LENGTH} 字` }, 400);
    }
    messages.push({ role, content });
  }

  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return json({ error: 'server_not_configured', message: '模型服务还没有配置好，请稍后再试' }, 500);
  }

  // 第一轮：固定开场白，不由模型临场生成
  if (messages.length === 1) {
    return openingResponse();
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
        temperature: 0.6,
        // v4-flash 先输出思维链再输出正文，上限要同时容纳两者，避免正文被截断
        max_tokens: 1200,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
  } catch {
    return json({ error: 'upstream_unreachable', message: '暂时连不上模型服务，请稍后再试' }, 502);
  }

  if (!upstream.ok) {
    return json(
      { error: 'upstream_error', message: '模型服务暂时不可用，请稍后再试' },
      502,
    );
  }

  return new Response(upstream.body, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-agent-model': AGENT_MODEL,
    },
  });
}
