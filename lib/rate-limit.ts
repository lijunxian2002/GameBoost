import { env } from 'cloudflare:workers';
import { getDb, sha256Hex } from '@/lib/releases';

export interface RateLimitPolicy {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** 对外模型接口：每个地址 10 分钟内最多 12 次。 */
export const AGENT_RATE_LIMIT: RateLimitPolicy = { limit: 12, windowMs: 10 * 60 * 1000 };

/** DOCX 生成相对耗时：每个地址 30 分钟内最多 4 次。 */
export const TUTORIAL_RATE_LIMIT: RateLimitPolicy = { limit: 4, windowMs: 30 * 60 * 1000 };

function clientAddress(request: Request): string {
  // Cloudflare 会覆盖 CF-Connecting-IP；后两个只用于本地预览和开发环境。
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('cf-connecting-ip') ?? forwarded ?? request.headers.get('x-real-ip') ?? 'unknown';
}

async function fingerprint(request: Request, scope: string): Promise<string> {
  const salt = env.RATE_LIMIT_SALT;
  if (!salt) throw new Error('RATE_LIMIT_SALT is not configured');
  const value = `${scope}:${salt}:${clientAddress(request)}`;
  return sha256Hex(new TextEncoder().encode(value));
}

/**
 * D1 固定窗口限流。数据库只保存哈希后的地址桶，不保存原始 IP 或对话内容。
 * 当 D1 不可用时调用端应拒绝高成本请求，不能绕过保护直接调用模型。
 */
export async function enforceRateLimit(
  request: Request,
  scope: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
  const expiresAt = windowStart + policy.windowMs;
  const key = `${scope}:${windowStart}:${await fingerprint(request, scope)}`;
  const db = getDb();

  // 每天首次访问清理已过期桶，避免限流表无限增长；不会碰当前窗口记录。
  const cleanupKey = `__cleanup__:${Math.floor(now / (24 * 60 * 60 * 1000))}`;
  const cleanup = await db
    .prepare(
      `INSERT OR IGNORE INTO request_limits (bucket_key, count, expires_at, updated_at)
       VALUES (?, 0, ?, ?)`,
    )
    .bind(cleanupKey, now + 2 * 24 * 60 * 60 * 1000, now)
    .run();
  if ((cleanup.meta.changes ?? 0) > 0) {
    await db
      .prepare("DELETE FROM request_limits WHERE expires_at < ? AND bucket_key NOT GLOB '__cleanup__:*'")
      .bind(now)
      .run();
  }

  const result = await db
    .prepare(
      `INSERT INTO request_limits (bucket_key, count, expires_at, updated_at)
       VALUES (?, 1, ?, ?)
       ON CONFLICT(bucket_key) DO UPDATE SET
         count = request_limits.count + 1,
         updated_at = excluded.updated_at
       RETURNING count, expires_at`,
    )
    .bind(key, expiresAt, now)
    .first<{ count: number; expires_at: number }>();

  if (!result) throw new Error('rate limit counter did not return a result');
  return {
    allowed: result.count <= policy.limit,
    remaining: Math.max(0, policy.limit - result.count),
    retryAfterSeconds: Math.max(1, Math.ceil((result.expires_at - now) / 1000)),
  };
}
