import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { readMessages, appendMessage } from "@/app/lib/messages";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");

  const messages = await readMessages();
  const result = since ? messages.filter((m) => m.createdAt > since) : messages.slice(-50);

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const name = session.user.name ?? "Unknown";
  const message = {
    id: crypto.randomUUID(),
    userEmail: session.user.email ?? "",
    userName: name,
    userInitials: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  await appendMessage(message);
  return NextResponse.json(message, { status: 201 });
}
