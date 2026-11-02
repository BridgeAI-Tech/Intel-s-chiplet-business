import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient, type InValue } from "@libsql/client";

// Order: DATABASE_URL (Turso/libSQL) -> web/data/chiplet.db snapshot (deployments) -> ../data/chiplet.db
// (the live pipeline database during local development).
const snapshot = path.join(process.cwd(), "data", "chiplet.db");
const pipelineDb = path.join(process.cwd(), "..", "data", "chiplet.db");
const url =
  process.env.DATABASE_URL ??
  pathToFileURL(process.env.USE_SNAPSHOT === "1" || !fs.existsSync(pipelineDb) ? snapshot : pipelineDb).href;

const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await client.execute({ sql, args });
  return result.rows as unknown as T[];
}

export async function queryOne<T = Row>(sql: string, args: InValue[] = []): Promise<T | null> {
  return (await query<T>(sql, args))[0] ?? null;
}

export function parseJsonList(value: unknown): string[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
