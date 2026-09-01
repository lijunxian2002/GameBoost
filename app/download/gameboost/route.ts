import {
  CHANNELS,
  DEFAULT_PLATFORM,
  PRODUCT_GAMEBOOST,
  latestRelease,
  downloadUnavailableHtml,
} from '@/lib/releases';

/**
 * 官网固定下载入口：永远从同一个地址下载最新稳定版。
 * 没有已发布版本时返回 404 与清楚错误，不返回空文件。
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const channel = url.searchParams.get('channel') ?? 'stable';

  if (!(CHANNELS as readonly string[]).includes(channel)) {
    return downloadUnavailableHtml();
  }

  const row = await latestRelease(PRODUCT_GAMEBOOST, channel, DEFAULT_PLATFORM);
  if (!row) {
    return downloadUnavailableHtml();
  }

  return new Response(null, {
    status: 302,
    headers: {
      location: `${url.origin}/${row.object_key}`,
      'cache-control': 'no-store',
    },
  });
}
