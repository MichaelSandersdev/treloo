"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Board from "./Board";
import ChatPanel from "./ChatPanel";
import { BoardState } from "../types";

const DEFAULT_STATE: BoardState = {
  boardTitle: "My Workspace",
  labels: {
    "label-1": { id: "label-1", name: "Feature", color: "#6366f1" },
    "label-2": { id: "label-2", name: "Bug", color: "#ef4444" },
    "label-3": { id: "label-3", name: "Design", color: "#8b5cf6" },
    "label-4": { id: "label-4", name: "Research", color: "#f59e0b" },
    "label-5": { id: "label-5", name: "Docs", color: "#10b981" },
  },
  cards: {
    "card-1": { id: "card-1", title: "Design landing page", description: "Create wireframes and high-fidelity mockups for the marketing site.", priority: "high", labels: ["label-1", "label-3"], createdAt: "2026-06-19T00:00:00.000Z", dueDate: "2026-06-28" },
    "card-2": { id: "card-2", title: "Set up database schema", description: "Configure PostgreSQL tables for users and boards.", priority: "medium", labels: ["label-1"], createdAt: "2026-06-19T00:00:00.000Z" },
    "card-3": { id: "card-3", title: "Write unit tests", description: "", priority: "low", labels: ["label-5"], createdAt: "2026-06-19T00:00:00.000Z" },
    "card-4": { id: "card-4", title: "Build auth flow", description: "Implement login, signup, and password reset pages.", priority: "high", labels: ["label-2"], createdAt: "2026-06-19T00:00:00.000Z", dueDate: "2026-06-22" },
    "card-5": { id: "card-5", title: "Deploy to production", description: "Set up CI/CD pipeline and deploy to Vercel.", priority: "medium", labels: [], createdAt: "2026-06-19T00:00:00.000Z" },
    "card-6": { id: "card-6", title: "Research competitors", description: "Analyze Trello, Linear, and Monday.com features.", priority: "low", labels: ["label-4"], createdAt: "2026-06-19T00:00:00.000Z" },
  },
  columns: [
    { id: "col-1", title: "Backlog", color: "#94a3b8", cardIds: ["card-6", "card-3"] },
    { id: "col-2", title: "In Progress", color: "#f59e0b", cardIds: ["card-1", "card-4"] },
    { id: "col-3", title: "Review", color: "#6366f1", cardIds: ["card-2"] },
    { id: "col-4", title: "Done", color: "#10b981", cardIds: ["card-5"] },
  ],
};

function storageKey(email?: string | null) {
  return `kanban-v3-${email ?? "guest"}`;
}

export default function KanbanApp() {
  const { data: session } = useSession();
  const [boardState, setBoardState] = useState<BoardState | null>(null);
  const [search, setSearch] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    try {
      const saved = localStorage.getItem(storageKey(session.user?.email));
      const state = saved ? JSON.parse(saved) : DEFAULT_STATE;
      setBoardState(state);
      setBoardTitle(state.boardTitle);
    } catch {
      setBoardState(DEFAULT_STATE);
      setBoardTitle(DEFAULT_STATE.boardTitle);
    }
  }, [session]);

  function handleChange(state: BoardState) {
    setBoardState(state);
    localStorage.setItem(storageKey(session?.user?.email), JSON.stringify(state));
  }

  function saveBoardTitle() {
    if (boardState && boardTitle.trim()) {
      const next = { ...boardState, boardTitle: boardTitle.trim() };
      handleChange(next);
    }
    setEditingTitle(false);
  }

  function handleReset() {
    if (!confirm("Reset board to default? All data will be lost.")) return;
    localStorage.removeItem(storageKey(session?.user?.email));
    setBoardState(DEFAULT_STATE);
    setBoardTitle(DEFAULT_STATE.boardTitle);
  }

  const handleUnread = useCallback((n: number) => {
    if (!chatOpen) setUnread((prev) => prev + n);
  }, [chatOpen]);

  function openChat() {
    setChatOpen(true);
    setUnread(0);
  }

  const totalCards = boardState ? Object.keys(boardState.cards).length : 0;
  const initials = session?.user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  if (!boardState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            <span className="text-sm font-bold text-gray-900 hidden sm:block">KanbanFlow</span>
          </div>
          <span className="text-gray-300">/</span>
          {editingTitle ? (
            <input
              autoFocus
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={saveBoardTitle}
              onKeyDown={(e) => e.key === "Enter" && saveBoardTitle()}
              className="text-sm font-semibold text-gray-700 border-b-2 border-indigo-400 outline-none bg-transparent"
            />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">
              {boardState.boardTitle}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards…"
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 w-44"
            />
          </div>

          <span className="hidden md:block text-xs bg-gray-100 px-2 py-1 rounded-lg font-medium text-gray-600">{totalCards} cards</span>

          <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition border border-gray-200 hidden sm:block">
            Reset
          </button>

          {/* Chat toggle */}
          <button
            onClick={chatOpen ? () => setChatOpen(false) : openChat}
            className={`relative p-2 rounded-lg border transition ${chatOpen ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            title="Team Thread"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* User */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-indigo-600">{initials}</span>
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-gray-700 leading-none">{session?.user?.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-6 shrink-0">
        {boardState.columns.map((col) => (
          <div key={col.id} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
            <span>{col.title}</span>
            <span className="font-semibold text-gray-700">{col.cardIds.length}</span>
          </div>
        ))}
      </div>

      {/* Body: board + chat side by side */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 p-6 overflow-auto">
          <Board state={boardState} searchQuery={search} onChange={handleChange} />
        </main>

        {chatOpen && <ChatPanel onUnreadChange={handleUnread} />}
      </div>
    </div>
  );
}
