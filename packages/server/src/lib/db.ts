import pkg from "pg";
import env from "../config/env.js";
import logger from "./logger.js";

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  ssl:
    env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
});

pool.on("error", (err) => {
  logger.error({ err }, "Postgres pool error");
});

export async function migrate() {
  await pool.query(`
    create table if not exists stores (
      id serial primary key,
      store_id integer unique not null,
      permanent_domain text not null,
      name text,
      country text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);

  await pool.query(`
    create table if not exists store_tokens (
      id serial primary key,
      store_id integer references stores(store_id) on delete cascade,
      access_token text not null,
      scope text not null,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  `);

  await pool.query(`
    create table if not exists bundle_configs (
      id serial primary key,
      store_id integer references stores(store_id) on delete cascade,
      product_id integer not null,
      config jsonb not null,
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      unique (store_id, product_id)
    );
  `);
}
