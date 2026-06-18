import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id          TEXT PRIMARY KEY,
          email       TEXT UNIQUE NOT NULL,
          name        TEXT NOT NULL,
          password    TEXT NOT NULL,
          created_at  TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id              TEXT PRIMARY KEY,
          user_email      TEXT NOT NULL,
          user_name       TEXT NOT NULL,
          user_initials   TEXT NOT NULL,
          text            TEXT NOT NULL,
          created_at      TEXT NOT NULL
        )
      `;
    })();
  }
  return schemaReady;
}
