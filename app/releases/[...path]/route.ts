import {
  FILENAME_RE,
  PRODUCT_GAMEBOOST,
  getBucket,
  getDb,
} from '@/lib/releases';

function notFound(): Response {
  return new Response('not found', { status: 404, headers: { 'cache-control': 'no-store' } });
}

function streamObject(key: string, filename: string): Promise<Response> {
  return getBucket().get(key).then((object) => {
    if (!object) return notFound();
    return new Response(object.body, {
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="${filename}"`,
        'content-length': String(object.size),
        etag: `"${object.httpEtag}"`,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  });
}

/**
 * 两种下载地址都支持：
 * - 深路径：/releases/gameboost/stable/windows-x64/0.2.0/GameBoost-0.2.0-windows-x64.exe
 *   先确认它是已经校验过、仍激活的发布记录，再读取 R2 不可变对象。
 * - 扁平路径：/releases/GameBoost-0.2.0-windows-x64.exe
 *   按文件名回查最新激活版本（兼容交接文档中的示例地址）。
 * R2 对象不可变：同一个 key 永远不会被覆盖，旧版本可一直下载。
 */
export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!Array.isArray(path) || path.length === 0 || path.some((segment) => !/^[A-Za-z0-9._-]+$/.test(segment))) {
    return notFound();
  }

  if (path.length === 5) {
    const key = `releases/${path.join('/')}`;
    const row = await getDb()
      .prepare(
        `SELECT object_key FROM releases
         WHERE object_key = ? AND is_active = 1 AND binary_format = 'windows-pe'`,
      )
      .bind(key)
      .first<{ object_key: string }>();
    if (!row) return notFound();
    return streamObject(row.object_key, path[4]);
  }

  if (path.length === 1) {
    const filename = path[0];
    const match = FILENAME_RE.exec(filename);
    if (!match) return notFound();
    const version = match[1];
    const platform = match[2];
    const row = await getDb()
      .prepare(
        `SELECT object_key FROM releases
         WHERE product = ? AND platform = ? AND version = ? AND is_active = 1
           AND binary_format = 'windows-pe'
         ORDER BY CASE channel WHEN 'stable' THEN 0 ELSE 1 END, published_at DESC LIMIT 1`,
      )
      .bind(PRODUCT_GAMEBOOST, platform, version)
      .first<{ object_key: string }>();
    if (!row) return notFound();
    return streamObject(row.object_key, filename);
  }

  return notFound();
}
