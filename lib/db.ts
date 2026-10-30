import { createClient } from "@libsql/client";
import path from "path";

// Support both local SQLite file and cloud LibSQL / Turso for seamless Vercel deployment
const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "intel_signals.db")}`;

export const db = createClient({
  url: dbUrl,
});

export async function query<T = any>(sql: string, args: any[] = []): Promise<T[]> {
  try {
    const result = await db.execute({ sql, args });
    return result.rows as unknown as T[];
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function queryOne<T = any>(sql: string, args: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, args);
  return rows.length > 0 ? rows[0] : null;
}
