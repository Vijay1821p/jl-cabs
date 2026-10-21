import { defaultSite, mergeSite } from "@jc/shared";
import { one, query } from "./db.js";

/**
 * The database is the source of truth. The in-memory copy is only a short-lived cache, so every
 * server instance (and every restart) converges on what is saved instead of serving an old phone number.
 */
const CACHE_MS = 5000;

let cache = defaultSite();
let version = 0;
let loadedAt = 0;
let loading = null;

function versionOf(row) {
  return new Date(row.updated_at).getTime();
}

async function load() {
  const row = await one("select data, updated_at from site_settings where id = $1", ["main"]);
  if (!row) {
    cache = defaultSite();
    const created = await one(
      "insert into site_settings (id, data) values ($1, $2::jsonb) on conflict (id) do update set id = excluded.id returning updated_at",
      ["main", JSON.stringify(cache)],
    );
    version = versionOf(created);
  } else {
    cache = mergeSite(row.data);
    version = versionOf(row);
  }
  loadedAt = Date.now();
  return cache;
}

function refresh() {
  if (!loading) loading = load().finally(() => { loading = null; });
  return loading;
}

/** Sync access to the last loaded copy. Prefer currentSite() in request handlers. */
export function getSite() {
  return cache;
}

/** Latest saved settings, re-read from the database when the copy is older than a few seconds. */
export async function currentSite() {
  if (Date.now() - loadedAt > CACHE_MS) {
    try {
      await refresh();
    } catch (error) {
      console.error("[site] Could not refresh settings, using the last copy.", error.message);
    }
  }
  return cache;
}

export function siteVersion() {
  return version;
}

export async function initSite() {
  await query(`
    create table if not exists site_settings (
      id text primary key,
      data jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `);
  return refresh();
}

/**
 * Save settings. If the caller sends the version it loaded and someone else saved in the meantime,
 * refuse instead of silently overwriting their change (for example an old Admin tab).
 */
export async function saveSite(partial, baseVersion) {
  await refresh();
  if (baseVersion !== undefined && baseVersion !== null && Number(baseVersion) !== version) {
    const error = new Error("The settings were changed from another tab or device. Reload the Admin page, then make your change again.");
    error.status = 409;
    throw error;
  }
  const next = mergeSite({
    ...cache,
    ...partial,
    company: { ...cache.company, ...(partial.company || {}) },
    pages: { ...cache.pages, ...(partial.pages || {}) },
  });
  delete next._version;
  const row = await one(
    `insert into site_settings (id, data, updated_at) values ($1, $2::jsonb, now())
     on conflict (id) do update set data = excluded.data, updated_at = now()
     returning data, updated_at`,
    ["main", JSON.stringify(next)],
  );
  cache = mergeSite(row.data);
  version = versionOf(row);
  loadedAt = Date.now();
  return cache;
}
