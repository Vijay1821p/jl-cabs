import { defaultSite, mergeSite } from "@jc/shared";
import { one, query } from "./db.js";

let cache = defaultSite();

export function getSite() {
  return cache;
}

export async function initSite() {
  await query(`
    create table if not exists site_settings (
      id text primary key,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `);
  const row = await one("select data from site_settings where id = $1", ["main"]);
  if (!row) {
    cache = defaultSite();
    await query("insert into site_settings (id, data) values ($1, $2::jsonb)", ["main", JSON.stringify(cache)]);
    return cache;
  }
  cache = mergeSite(row.data);
  return cache;
}

export async function saveSite(partial) {
  cache = mergeSite({ ...cache, ...partial, company: { ...cache.company, ...(partial.company || {}) }, pages: { ...cache.pages, ...(partial.pages || {}) } });
  await query(
    `insert into site_settings (id, data, updated_at) values ($1, $2::jsonb, now())
     on conflict (id) do update set data = excluded.data, updated_at = now()`,
    ["main", JSON.stringify(cache)]
  );
  return cache;
}
