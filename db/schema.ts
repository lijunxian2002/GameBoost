import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const releases = sqliteTable(
  'releases',
  {
    id: text('id').primaryKey(),
    product: text('product').notNull(),
    channel: text('channel').notNull(),
    platform: text('platform').notNull(),
    version: text('version').notNull(),
    object_key: text('object_key').notNull(),
    download_url: text('download_url').notNull(),
    sha256: text('sha256').notNull(),
    signature: text('signature').notNull(),
    /** 只有发布端确认过的 Windows PE 安装包才允许成为官方下载版本。 */
    binary_format: text('binary_format').notNull().default('unknown'),
    size_bytes: integer('size_bytes').notNull(),
    minimum_supported_version: text('minimum_supported_version'),
    mandatory: integer('mandatory').notNull().default(0),
    notes_url: text('notes_url'),
    published_at: text('published_at').notNull(),
    is_active: integer('is_active').notNull().default(1),
    created_at: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('releases_product_channel_platform_version_unique').on(
      table.product,
      table.channel,
      table.platform,
      table.version,
    ),
    index('releases_latest_idx').on(
      table.product,
      table.channel,
      table.platform,
      table.is_active,
      table.published_at,
    ),
  ],
);

/**
 * 公共接口的固定窗口限流计数器。
 * bucket_key 只包含经盐哈希后的地址，不保存原始 IP 或聊天内容。
 */
export const requestLimits = sqliteTable(
  'request_limits',
  {
    bucket_key: text('bucket_key').primaryKey(),
    count: integer('count').notNull().default(0),
    expires_at: integer('expires_at').notNull(),
    updated_at: integer('updated_at').notNull(),
  },
  (table) => [index('request_limits_expires_idx').on(table.expires_at)],
);

// P1 anonymous service loop. Hardware fingerprints are deliberately absent from
// installations; they only exist inside a sample/config binding payload.
export const installations = sqliteTable('installations', { id: text('id').primaryKey(), app_version: text('app_version').notNull(), created_at: text('created_at').notNull(), last_seen_at: text('last_seen_at').notNull() });
export const cases = sqliteTable('cases', { id: text('id').primaryKey(), case_code: text('case_code').notNull(), installation_id: text('installation_id').notNull(), player_description: text('player_description').notNull(), status: text('status').notNull(), view_token_hash: text('view_token_hash').notNull(), view_token_used_at: text('view_token_used_at'), created_at: text('created_at').notNull(), updated_at: text('updated_at').notNull() });
export const samples = sqliteTable('samples', { id: text('id').primaryKey(), case_id: text('case_id').notNull(), sample_id: text('sample_id').notNull(), schema_version: text('schema_version').notNull(), sha256: text('sha256').notNull(), object_key: text('object_key').notNull(), size_bytes: integer('size_bytes').notNull(), summary_json: text('summary_json').notNull(), created_at: text('created_at').notNull() });
export const reports = sqliteTable('reports', { id: text('id').primaryKey(), case_id: text('case_id').notNull(), status: text('status').notNull(), content_json: text('content_json').notNull(), created_at: text('created_at').notNull(), updated_at: text('updated_at').notNull() });
export const conversations = sqliteTable('conversations', { id: text('id').primaryKey(), case_id: text('case_id').notNull(), author: text('author').notNull(), body: text('body').notNull(), created_at: text('created_at').notNull() });
export const prescriptions = sqliteTable('prescriptions', { id: text('id').primaryKey(), case_id: text('case_id').notNull(), sample_id: text('sample_id').notNull(), sha256: text('sha256').notNull(), signature: text('signature').notNull(), key_id: text('key_id').notNull(), object_key: text('object_key').notNull(), created_at: text('created_at').notNull(), revoked_at: text('revoked_at') });
export const applyReceipts = sqliteTable('apply_receipts', { id: text('id').primaryKey(), case_id: text('case_id').notNull(), prescription_id: text('prescription_id').notNull(), installation_id: text('installation_id').notNull(), receipt_json: text('receipt_json').notNull(), created_at: text('created_at').notNull() });
