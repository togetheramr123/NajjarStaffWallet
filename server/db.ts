import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const ssl = process.env.DATABASE_URL.includes("render.com") || process.env.DATABASE_URL.includes("neon.tech")
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
});

export const db = drizzle(pool, { schema });
