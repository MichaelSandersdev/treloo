import { sql, ensureSchema } from "./db";

export interface Message {
  id: string;
  userEmail: string;
  userName: string;
  userInitials: string;
  text: string;
  createdAt: string;
}

function rowToMessage(r: Record<string, string>): Message {
  return {
    id: r.id,
    userEmail: r.user_email,
    userName: r.user_name,
    userInitials: r.user_initials,
    text: r.text,
    createdAt: r.created_at,
  };
}

export async function readMessages(): Promise<Message[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM messages ORDER BY created_at ASC LIMIT 50
  `;
  return (rows as Record<string, string>[]).map(rowToMessage);
}

export async function readMessagesSince(since: string): Promise<Message[]> {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM messages WHERE created_at > ${since} ORDER BY created_at ASC
  `;
  return (rows as Record<string, string>[]).map(rowToMessage);
}

export async function appendMessage(message: Message): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO messages (id, user_email, user_name, user_initials, text, created_at)
    VALUES (${message.id}, ${message.userEmail}, ${message.userName}, ${message.userInitials}, ${message.text}, ${message.createdAt})
  `;
}
