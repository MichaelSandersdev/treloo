import fs from "fs/promises";
import path from "path";

export interface Message {
  id: string;
  userEmail: string;
  userName: string;
  userInitials: string;
  text: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const MAX_MESSAGES = 200;

export async function readMessages(): Promise<Message[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(MESSAGES_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function appendMessage(message: Message): Promise<void> {
  const messages = await readMessages();
  const trimmed = [...messages, message].slice(-MAX_MESSAGES);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(trimmed, null, 2));
}
