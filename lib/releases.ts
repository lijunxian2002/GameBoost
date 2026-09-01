import { env } from 'cloudflare:workers';

export const PRODUCT_GAMEBOOST = 'gameboost';
export const DEFAULT_PLATFORM = 'windows-x64';
export const CHANNELS = ['stable', 'beta'] as const;
export type Channel = (typeof CHANNELS)[number];

export const MAX_RELEASE_SIZE = 100 * 1024 * 1024;
export const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
export const SAFE_TOKEN_RE = /^[a-z0-9][a-z0-9-]*$/;
export const FILENAME_RE =
  /^GameBoost-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)-(windows-x64)\.exe$/;

export interface ReleaseRow {
  id: string;
  product: string;
  channel: string;
  platform: string;
  version: string;
  object_key: string;
  download_url: string;
  sha256: string;
  signature: string;
  size_bytes: number;
  minimum_supported_version: string | null;
  mandatory: number;
  notes_url: string | null;
  published_at: string;
  is_active: number;
  created_at: string;
}

export function getDb(): D1Database {
  if (!env.DB) {
    throw new Error('D1 binding `DB` is unavailable');
  }
  return env.DB;
}

export function getBucket(): R2Bucket {
  if (!env.FILES) {
    throw new Error('R2 binding `FILES` is unavailable');
  }
  return env.FILES;
}

const PRODUCT_BRAND: Record<string, string> = { gameboost: 'GameBoost' };

export function releaseFileName(product: string, version: string, platform: string): string {
  const brand = PRODUCT_BRAND[product] ?? product.charAt(0).toUpperCase() + product.slice(1);
  return `${brand}-${version}-${platform}.exe`;
}

export function objectKey(
  product: string,
  channel: string,
  platform: string,
  version: string,
): string {
  return `releases/${product}/${channel}/${platform}/${version}/${releaseFileName(product, version, platform)}`;
}

/** 北京时间（UTC+8）的 ISO 8601 时间戳，例如 2026-09-01T21:30:00+08:00 */
export function toLocalIso(date: Date): string {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${shifted.toISOString().slice(0, 19)}+08:00`;
}

/** 响应里的下载地址不写死域名：以请求来源为准，预览域名与正式域名都正确。object_key 已含 releases/ 前缀 */
export function downloadUrl(origin: string, key: string): string {
  return `${origin}/${key}`;
}

export function rowToRelease(row: ReleaseRow, origin: string) {
  return {
    product: row.product,
    channel: row.channel,
    platform: row.platform,
    version: row.version,
    download_url: downloadUrl(origin, row.object_key),
    sha256: row.sha256,
    signature: row.signature,
    size_bytes: row.size_bytes,
    published_at: row.published_at,
    minimum_supported_version: row.minimum_supported_version,
    mandatory: row.mandatory === 1,
    notes_url: row.notes_url,
  };
}

export async function latestRelease(
  product: string,
  channel: string,
  platform: string,
): Promise<ReleaseRow | null> {
  const row = await getDb()
    .prepare(
      `SELECT * FROM releases
       WHERE product = ? AND channel = ? AND platform = ? AND is_active = 1
       ORDER BY published_at DESC LIMIT 1`,
    )
    .bind(product, channel, platform)
    .first();
  return (row as ReleaseRow | null) ?? null;
}

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function releaseError(status: number, code: string, message: string): Response {
  return json({ error: code, message }, status);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 发布签名：用 ed25519 私钥对 sha256 十六进制字符串签名，返回 base64。
 * 私钥来自环境值 RELEASE_SIGNING_KEY（base64 编码的 PKCS8），由 scripts/release-keygen.mjs 生成。
 */
export async function signRelease(sha256: string): Promise<string> {
  const privateKeyBase64 = env.RELEASE_SIGNING_KEY;
  if (!privateKeyBase64) {
    throw new Error(
      '环境值 RELEASE_SIGNING_KEY 未设置：请先用 scripts/release-keygen.mjs 生成密钥，并在控制平面配置',
    );
  }
  const key = await crypto.subtle.importKey(
    'pkcs8',
    base64ToBytes(privateKeyBase64).buffer,
    { name: 'ED25519' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    { name: 'ED25519' },
    key,
    new TextEncoder().encode(sha256),
  );
  return bytesToBase64(new Uint8Array(signature));
}

/** 常量时间比较，避免时序侧信道 */
export async function tokenMatches(provided: string, expected: string): Promise<boolean> {
  const a = new TextEncoder().encode(provided);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  const x = new Uint8Array(Math.max(a.length, b.length));
  const y = new Uint8Array(x.length);
  x.set(a);
  y.set(b);
  const ok = await crypto.subtle.digest('SHA-256', x);
  const expectedDigest = await crypto.subtle.digest('SHA-256', y);
  return bytesToBase64(new Uint8Array(ok)) === bytesToBase64(new Uint8Array(expectedDigest));
}

/** 下载入口无版本时的 404 页面（给浏览器访问者看的清楚错误，不返回空文件） */
export function downloadUnavailableHtml(): Response {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>下载暂时不可用 · GameBoost</title>
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #0b0e14; color: #d8d8d0; font: 15px/1.8 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
  main { max-width: 30rem; padding: 2.5rem 1.5rem; text-align: center; }
  h1 { font-size: 1.25rem; font-weight: 500; margin: 0 0 0.75rem; letter-spacing: 0.02em; }
  p { margin: 0.4rem 0; color: #9a9a92; }
  a { color: #b8b8ae; }
</style>
</head>
<body>
<main>
  <h1>下载暂时不可用，请稍后再试。</h1>
  <p>GameBoost 当前还没有已发布的稳定版本。</p>
  <p>李俊贤 微信 / 手机同号：<a href="tel:17695989770">17695989770</a></p>
  <p><a href="/">返回首页</a></p>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
