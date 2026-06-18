import { sql, ensureSchema } from "./db";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

function rowToUser(r: Record<string, string>): StoredUser {
  return { id: r.id, email: r.email, name: r.name, password: r.password, createdAt: r.created_at };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  await ensureSchema();
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows.length ? rowToUser(rows[0] as Record<string, string>) : null;
}

export async function createUser(user: StoredUser): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO users (id, email, name, password, created_at)
    VALUES (${user.id}, ${user.email}, ${user.name}, ${user.password}, ${user.createdAt})
  `;
}
