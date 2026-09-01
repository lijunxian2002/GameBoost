import { buildCoolingTutorial, fetchTutorialImages, SUPPORTED_TOPICS } from '@/lib/tutorial';

const MODEL_MAX_LENGTH = 40;

/**
 * 生成教程 DOCX（供官网 Agent 在对话中触发）。
 * 当前只支持 cooling（降温清灰完整教程）；GET 便于前端直接用 <a> 下载。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic') ?? '';
  const model = (url.searchParams.get('model') ?? 'R7000P').trim().slice(0, MODEL_MAX_LENGTH);

  if (!(SUPPORTED_TOPICS as readonly string[]).includes(topic)) {
    return new Response(
      JSON.stringify({ error: 'unsupported_topic', message: `教程主题只支持：${SUPPORTED_TOPICS.join('、')}` }),
      {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
      },
    );
  }
  if (!model) {
    return new Response(JSON.stringify({ error: 'invalid_parameter', message: '缺少机型参数 model' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const images = await fetchTutorialImages(url.origin);
  const buffer = await buildCoolingTutorial(model, images);
  const filename = encodeURIComponent(`${model}降温清灰完整教程.docx`);

  return new Response(buffer, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'content-disposition': `attachment; filename*=UTF-8''${filename}`,
      'cache-control': 'no-store',
    },
  });
}
