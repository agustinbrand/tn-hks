import { pool } from "../lib/db.js";

export type BundleConfigRecord = {
  store_id: number;
  product_id: number;
  config: unknown;
};

export async function upsertBundleConfig(record: BundleConfigRecord) {
  await pool.query(
    `
      insert into bundle_configs (store_id, product_id, config)
      values ($1, $2, $3)
      on conflict (store_id, product_id) do update set
        config = excluded.config,
        updated_at = now()
    `,
    [record.store_id, record.product_id, record.config],
  );
}

export async function getBundleConfig(storeId: number, productId: number) {
  const { rows } = await pool.query(
    `
      select config
      from bundle_configs
      where store_id = $1 and product_id = $2
    `,
    [storeId, productId],
  );

  return (rows[0]?.config ?? null) as Record<string, unknown> | null;
}

export async function listBundleConfigs(storeId: number) {
  const { rows } = await pool.query(
    `
      select product_id, config
      from bundle_configs
      where store_id = $1
      order by updated_at desc
    `,
    [storeId],
  );
  return rows as { product_id: number; config: Record<string, unknown> }[];
}
