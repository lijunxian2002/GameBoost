import { env } from 'cloudflare:workers';
import {
  CHANNELS,
  MAX_RELEASE_SIZE,
  SAFE_TOKEN_RE,
  VERSION_RE,
  compareVersions,
  getBucket,
  getDb,
  isWindowsPe,
  json,
  objectKey,
  releaseError,
  rowToRelease,
  sha256Hex,
  signRelease,
  tokenMatches,
  toLocalIso,
} from '@/lib/releases';
import type { ReleaseRow } from '@/lib/releases';

/**
 * 发布接口（仅李俊贤本机发布脚本调用，不开放网页后台）：
 * 1. 验证令牌与输入
 * 2. 计算 SHA-256 并签名
 * 3. 上传 R2 不可变路径
 * 4. 写入 D1 但不激活
 * 5. 从 R2 重新读取并校验哈希
 * 6. 校验通过后才激活
 * 任何一步失败都不能让不完整版本成为 latest，旧版本永远不被覆盖。
 */
export async function POST(request: Request) {
  const token = request.headers.get('x-release-token') ?? '';
  const expectedToken = env.RELEASE_TOKEN;
  if (!expectedToken) {
    return releaseError(500, 'server_not_configured', '环境值 RELEASE_TOKEN 未设置，发布已拒绝');
  }
  if (!(await tokenMatches(token, expectedToken))) {
    return releaseError(401, 'unauthorized', '发布令牌无效');
  }

  const product = request.headers.get('x-product') ?? '';
  const channel = request.headers.get('x-channel') ?? '';
  const platform = request.headers.get('x-platform') ?? '';
  const version = request.headers.get('x-version') ?? '';
  const minimumSupportedVersion = request.headers.get('x-minimum-supported-version') ?? null;
  const mandatoryHeader = request.headers.get('x-mandatory') ?? '0';
  const notesUrl = request.headers.get('x-notes-url') ?? null;

  if (!SAFE_TOKEN_RE.test(product)) {
    return releaseError(400, 'invalid_parameter', 'x-product 只允许小写字母、数字和连字符');
  }
  if (!(CHANNELS as readonly string[]).includes(channel)) {
    return releaseError(400, 'invalid_parameter', 'x-channel 只支持 stable 或 beta');
  }
  if (!SAFE_TOKEN_RE.test(platform)) {
    return releaseError(400, 'invalid_parameter', 'x-platform 只允许小写字母、数字和连字符');
  }
  if (!VERSION_RE.test(version)) {
    return releaseError(400, 'invalid_version', `版本号格式不正确：${version}`);
  }
  if (minimumSupportedVersion !== null && !VERSION_RE.test(minimumSupportedVersion)) {
    return releaseError(400, 'invalid_version', `minimum_supported_version 格式不正确：${minimumSupportedVersion}`);
  }
  if (mandatoryHeader !== '0' && mandatoryHeader !== '1') {
    return releaseError(400, 'invalid_parameter', 'x-mandatory 只支持 0 或 1');
  }
  if (notesUrl !== null) {
    try {
      const parsed = new URL(notesUrl);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('not http(s)');
      }
    } catch {
      return releaseError(400, 'invalid_parameter', 'x-notes-url 必须是合法的 http(s) 地址');
    }
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_RELEASE_SIZE) {
    return releaseError(413, 'release_too_large', `安装包超过 ${MAX_RELEASE_SIZE / 1024 / 1024} MB 上限`);
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await request.arrayBuffer());
  } catch {
    return releaseError(400, 'invalid_body', '无法读取上传的安装包');
  }
  if (bytes.length === 0) {
    return releaseError(400, 'invalid_body', '安装包内容为空');
  }
  if (bytes.length > MAX_RELEASE_SIZE) {
    return releaseError(413, 'release_too_large', `安装包超过 ${MAX_RELEASE_SIZE / 1024 / 1024} MB 上限`);
  }
  if (!isWindowsPe(bytes)) {
    return releaseError(400, 'invalid_installer', '安装包必须是有效 Windows PE EXE，已拒绝发布');
  }

  let db: D1Database;
  let bucket: R2Bucket;
  try {
    db = getDb();
    bucket = getBucket();
  } catch (error) {
    return releaseError(500, 'server_not_configured', error instanceof Error ? error.message : '存储绑定不可用');
  }

  const key = objectKey(product, channel, platform, version);
  const id = crypto.randomUUID();

  // 版本号和对象路径都是不可变的：不接受同版本覆写，也不接受降级发布。
  const existing = await db
    .prepare('SELECT id, is_active FROM releases WHERE product = ? AND channel = ? AND platform = ? AND version = ?')
    .bind(product, channel, platform, version)
    .first<{ id: string; is_active: number }>();
  if (existing) {
    return releaseError(409, 'release_already_exists', `版本 ${version} 已存在，版本对象不可覆盖`);
  }

  const current = await db
    .prepare(
      `SELECT * FROM releases
       WHERE product = ? AND channel = ? AND platform = ? AND is_active = 1
         AND binary_format = 'windows-pe'`,
    )
    .bind(product, channel, platform)
    .all<ReleaseRow>();
  const latest = (current.results ?? []).reduce<ReleaseRow | null>(
    (candidate, row) => (!candidate || compareVersions(row.version, candidate.version) > 0 ? row : candidate),
    null,
  );
  if (latest && compareVersions(version, latest.version) <= 0) {
    return releaseError(409, 'version_not_newer', `新版本必须高于当前 ${latest.version}`);
  }
  if (minimumSupportedVersion && compareVersions(minimumSupportedVersion, version) > 0) {
    return releaseError(400, 'invalid_version', 'minimum_supported_version 不能高于当前发布版本');
  }

  const sha256 = await sha256Hex(bytes);
  let signature: string;
  try {
    signature = await signRelease(sha256);
  } catch (error) {
    return releaseError(500, 'server_not_configured', error instanceof Error ? error.message : '发布签名不可用');
  }
  const publishedAt = toLocalIso(new Date());
  const now = new Date().toISOString();

  try {
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: 'application/octet-stream' },
      customMetadata: { product, channel, platform, version, sha256, binary_format: 'windows-pe' },
    });
  } catch {
    return releaseError(500, 'r2_upload_failed', '上传对象存储失败，版本未激活');
  }

  try {
    await db
      .prepare(
        `INSERT INTO releases
         (id, product, channel, platform, version, object_key, download_url, sha256, signature,
          binary_format, size_bytes, minimum_supported_version, mandatory, notes_url, published_at, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      )
      .bind(
        id,
        product,
        channel,
        platform,
        version,
        key,
        `https://xiaotongcn.mom/${key}`,
        sha256,
        signature,
        'windows-pe',
        bytes.length,
        minimumSupportedVersion,
        mandatoryHeader === '1' ? 1 : 0,
        notesUrl,
        publishedAt,
        now,
      )
      .run();
  } catch {
    await bucket.delete(key);
    return releaseError(500, 'db_write_failed', '写入版本元数据失败，已回滚上传对象');
  }

  // 从 R2 重新读取并校验哈希，防止上传过程被破坏
  try {
    const stored = await bucket.get(key);
    if (!stored) {
      throw new Error('object missing after put');
    }
    const storedBytes = new Uint8Array(await stored.arrayBuffer());
    const rehash = await sha256Hex(storedBytes);
    if (rehash !== sha256 || storedBytes.length !== bytes.length) {
      throw new Error(`hash mismatch: expected ${sha256}, got ${rehash}`);
    }
  } catch {
    await db.prepare('DELETE FROM releases WHERE id = ?').bind(id).run();
    await bucket.delete(key);
    return releaseError(500, 'hash_verification_failed', '重新读取的安装包与上传内容不一致，版本未激活');
  }

  await db.prepare('UPDATE releases SET is_active = 1 WHERE id = ?').bind(id).run();

  const row = await db
    .prepare('SELECT * FROM releases WHERE id = ?')
    .bind(id)
    .first<ReleaseRow>();
  if (!row) {
    return releaseError(500, 'db_write_failed', '版本已激活但读取不到记录');
  }
  const origin = new URL(request.url).origin;
  return json(rowToRelease(row, origin), 201);
}

// 不需要 GET：本接口只接受发布脚本的 POST。返回 405 时给出明确提示。
export function GET() {
  return releaseError(405, 'method_not_allowed', '发布接口只接受 POST');
}
