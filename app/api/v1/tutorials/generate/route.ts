import { enforceRateLimit, TUTORIAL_RATE_LIMIT } from '@/lib/rate-limit';
import { buildCoolingTutorial, SUPPORTED_TOPICS } from '@/lib/tutorial';

const MODEL_MAX_LENGTH = 40;
const MODEL_RE = /^[\p{L}\p{N} _+.-]{1,40}$/u;

function json(data: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders },
  });
}

/**
 * 生成教程 DOCX（供官网 Agent 在对话中触发）。
 * 当前只支持 cooling（降温清灰完整教程）；GET 便于前端直接用 <a> 下载。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic') ?? '';
  const model = (url.searchParams.get('model') ?? 'R7000P').trim().slice(0, MODEL_MAX_LENGTH);

  if (!(SUPPORTED_TOPICS as readonly string[]).includes(topic)) {
    return json({ error: 'unsupported_topic', message: `教程主题只支持：${SUPPORTED_TOPICS.join('、')}` }, 400);
  }
  if (!model || !MODEL_RE.test(model)) {
    return json({ error: 'invalid_parameter', message: '机型只支持中英文、数字、空格、+、-、. 和 _' }, 400);
  }

  let rate;
  try {
    rate = await enforceRateLimit(request, 'tutorial', TUTORIAL_RATE_LIMIT);
  } catch {
    return json({ error: 'service_protected', message: '文档服务正在进行保护，请稍后再试' }, 503);
  }
  if (!rate.allowed) {
    return json(
      { error: 'rate_limited', message: '为了保证每位访客都能下载，请稍后再试。' },
      429,
      { 'retry-after': String(rate.retryAfterSeconds), 'x-ratelimit-remaining': '0' },
    );
  }

  const buffer = await buildCoolingTutorial(model);
  const filename = encodeURIComponent(`${model}散热维护安全清单.docx`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'content-disposition': `attachment; filename*=UTF-8''${filename}`,
      'cache-control': 'no-store',
      'x-ratelimit-remaining': String(rate.remaining),
    },
  });
}
