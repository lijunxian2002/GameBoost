import {
  CHANNELS,
  DEFAULT_PLATFORM,
  PRODUCT_GAMEBOOST,
  latestRelease,
  json,
  releaseError,
  rowToRelease,
  SAFE_TOKEN_RE,
} from '@/lib/releases';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const product = url.searchParams.get('product') ?? PRODUCT_GAMEBOOST;
  const channel = url.searchParams.get('channel') ?? 'stable';
  const platform = url.searchParams.get('platform') ?? DEFAULT_PLATFORM;

  if (!SAFE_TOKEN_RE.test(product) || !SAFE_TOKEN_RE.test(platform)) {
    return releaseError(400, 'invalid_parameter', 'product 或 platform 只允许小写字母、数字和连字符');
  }
  if (!(CHANNELS as readonly string[]).includes(channel)) {
    return releaseError(400, 'invalid_parameter', 'channel 只支持 stable 或 beta');
  }

  const row = await latestRelease(product, channel, platform);
  if (!row) {
    return releaseError(404, 'release_not_found', '当前通道还没有可下载版本');
  }

  return json(rowToRelease(row, url.origin));
}
