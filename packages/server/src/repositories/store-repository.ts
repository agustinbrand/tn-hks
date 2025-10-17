import { pool } from "../lib/db.js";

export type StoreRecord = {
  store_id: number;
  permanent_domain: string;
  name: string | null;
  country: string | null;
};

export async function upsertStore(record: StoreRecord) {
  await pool.query(
    `
      insert into stores (store_id, permanent_domain, name, country)
      values ($1, $2, $3, $4)
      on conflict (store_id) do update set
        permanent_domain = excluded.permanent_domain,
        name = excluded.name,
        country = excluded.country,
        updated_at = now()
    `,
    [record.store_id, record.permanent_domain, record.name, record.country],
  );
}

export async function saveToken({
  storeId,
  accessToken,
  scope,
}: {
  storeId: number;
  accessToken: string;
  scope: string;
}) {
  await pool.query(
    `
      insert into store_tokens (store_id, access_token, scope)
      values ($1, $2, $3)
      on conflict (store_id) do update set
        access_token = excluded.access_token,
        scope = excluded.scope,
        updated_at = now()
    `,
    [storeId, accessToken, scope],
  );
}

export async function getToken(storeId: number) {
  const { rows } = await pool.query(
    `select access_token, scope from store_tokens where store_id = $1`,
    [storeId],
  );
  return rows[0] as { access_token: string; scope: string } | undefined;
}

export async function deleteStore(storeId: number) {
  await pool.query(`delete from stores where store_id = $1`, [storeId]);
}
