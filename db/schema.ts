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
