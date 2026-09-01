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
