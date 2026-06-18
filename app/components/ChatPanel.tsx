"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  userEmail: string;
  userName: string;
  userInitials: string;
  text: string;
  createdAt: string;
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (isSameDay(iso, today.toISOString())) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(iso, yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600",
  "bg-violet-100 text-violet-600",
  "bg-pink-100 text-pink-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-sky-100 text-sky-600",
];

function avatarColor(email: string) {
  let hash = 0;
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

interface Props {
  onUnreadChange: (count: number) => void;
}

export default function ChatPanel({ onUnreadChange }: Props) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastTimestampRef = useRef<string | null>(null);
  const lastSeenAtRef = useRef<string>(new Date().toISOString());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const myEmail = session?.user?.email ?? "";

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Initial load
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data: Message[] = await res.json();
          setMessages(data);
          if (data.length) lastTimestampRef.current = data[data.length - 1].createdAt;
        }
      } finally {
        setLoading(false);
      }
      lastSeenAtRef.current = new Date().toISOString();
    }
    load();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [loading, scrollToBottom]);

  // Poll every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const since = lastTimestampRef.current;
      const url = since ? `/api/messages?since=${encodeURIComponent(since)}` : "/api/messages";
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const incoming: Message[] = await res.json();
        if (!incoming.length) return;

        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !seen.has(m.id));
          if (!fresh.length) return prev;
          lastTimestampRef.current = fresh[fresh.length - 1].createdAt;

          // Count unread (messages from others after lastSeen)
          const unread = fresh.filter(
            (m) => m.userEmail !== myEmail && m.createdAt > lastSeenAtRef.current
          ).length;
          if (unread > 0) onUnreadChange(unread);

          return [...prev, ...fresh];
        });
        scrollToBottom();
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [myEmail, onUnreadChange, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      userEmail: myEmail,
      userName: session?.user?.name ?? "Me",
      userInitials: session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    scrollToBottom();
    setSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: optimistic.text }),
      });
      if (res.ok) {
        const real: Message = await res.json();
        lastTimestampRef.current = real.createdAt;
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? real : m)));
      }
    } finally {
      setSending(false);
    }
  }

  // Group messages: same sender within 5 mins = collapsed header
  function shouldShowHeader(index: number) {
    if (index === 0) return true;
    const prev = messages[index - 1];
    const curr = messages[index];
    if (prev.userEmail !== curr.userEmail) return true;
    const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return diff > 5 * 60 * 1000;
  }

  function shouldShowDate(index: number) {
    if (index === 0) return true;
    return !isSameDay(messages[index - 1].createdAt, messages[index].createdAt);
  }

  return (
    <div className="w-80 flex flex-col border-l border-gray-200 bg-white shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="relative">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white" />
        </div>
        <h2 className="text-sm font-semibold text-gray-800">Team Thread</h2>
        <span className="ml-auto text-xs text-gray-400">{messages.length} msgs</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {loading ? (
          <div className="flex justify-center items-center h-24 text-gray-300 text-sm">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300 gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">No messages yet. Say hello!</span>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userEmail === myEmail;
            const showHeader = shouldShowHeader(i);
            const showDate = shouldShowDate(i);
            const color = avatarColor(msg.userEmail);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] text-gray-400 font-medium">{formatDate(msg.createdAt)}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                )}

                <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${showHeader ? "mt-3" : "mt-0.5"}`}>
                  {/* Avatar — only show on first message of a group */}
                  <div className="w-7 shrink-0">
                    {showHeader && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${color}`}>
                        {msg.userInitials}
                      </div>
                    )}
                  </div>

                  <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                    {showHeader && (
                      <div className={`flex items-baseline gap-1.5 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className="text-xs font-semibold text-gray-700">{isMe ? "You" : msg.userName}</span>
                        <span className="text-[10px] text-gray-300">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}
                    <div
                      className={`px-3 py-2 text-sm leading-snug break-words ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm"
                          : "bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {!showHeader && (
                      <span className="text-[9px] text-gray-200 mt-0.5 px-1">{formatTime(msg.createdAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-transparent transition">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message the team…"
            maxLength={1000}
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-300"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            <svg className="w-3.5 h-3.5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 mt-1.5 px-1">Press Enter to send</p>
      </form>
    </div>
  );
}
