import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { imageForPlace, listedDropFare, POPULAR_ROUTES } from "@jc/shared";

const { Pool } = pg;
const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "supabase", "schema.sql");

let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Paste the Supabase Postgres connection string into server/.env.");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false },
      max: 10,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  const result = await getPool().query(text, params);
  return result.rows;
}

export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

const defaultTrips = POPULAR_ROUTES.map((row) => [row.from, row.to, listedDropFare(row.km), row.km]);
const oldCityDrops = new Set(["chennai", "bengaluru", "salem", "coimbatore", "hosur", "krishnagiri", "madurai", "tirupati"]);

export async function initDb() {
  const sql = fs.readFileSync(schemaPath, "utf8");
  await getPool().query(sql);
  await getPool().query(`
    alter table bookings add column if not exists payment_choice text not null default 'advance';
    alter table bookings add column if not exists amount_paid integer not null default 0;
    alter table bookings add column if not exists driver_name text not null default '';
    alter table bookings add column if not exists driver_mobile text not null default '';
    alter table bookings add column if not exists vehicle_number text not null default '';
    alter table bookings add column if not exists payment_receipt jsonb not null default '{}'::jsonb;
    alter table bookings add column if not exists days integer;
    alter table popular_trips add column if not exists km integer;
  `);
  const existing = await query("select id, to_place from popular_trips");
  const hasOldCities = existing.some((row) => oldCityDrops.has(String(row.to_place || "").toLowerCase()));
  if (!existing.length || hasOldCities) {
    await query("delete from popular_trips");
    for (const [index, [from, to, fare, km]] of defaultTrips.entries()) {
      await query(
        `insert into popular_trips (from_place, to_place, fare, km, image_url, sort_order)
         values ($1,$2,$3,$4,$5,$6)`,
        [from, to, fare, km, imageForPlace(to), index]
      );
    }
  } else {
    const remote = await query("select id, to_place, image_url from popular_trips");
    for (const row of remote) {
      const current = String(row.image_url || "");
      if (!current || current.startsWith("http") || current.endsWith(".svg")) {
        await query("update popular_trips set image_url = $2 where id = $1", [row.id, imageForPlace(row.to_place)]);
      }
    }
  }
  console.log("[db] Connected. Bookings and popular trips are ready.");
}
