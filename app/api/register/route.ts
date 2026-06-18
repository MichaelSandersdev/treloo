import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readUsers, writeUsers } from "@/app/lib/users";

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const users = await readUsers();
  if (users.find((u) => u.email === email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = { id: crypto.randomUUID(), email, name, password: hashed, createdAt: new Date().toISOString() };
  await writeUsers([...users, user]);

  return NextResponse.json({ success: true });
}
