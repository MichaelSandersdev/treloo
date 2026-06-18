"use client";
import { useEffect, useRef, useState } from "react";
import { Card, Label } from "../types";

const PRIORITY_OPTIONS: { value: Card["priority"]; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "medium", label: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "high", label: "High", color: "text-red-600 bg-red-50 border-red-200" },
];

interface Props {
  card: Card;
  labels: Record<string, Label>;
  columnTitle: string;
  onClose: () => void;
  onUpdate: (updates: Partial<Card>) => void;
  onDelete: () => void;
}

export default function CardModal({ card, labels, columnTitle, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [selectedLabels, setSelectedLabels] = useState<string[]>(card.labels);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function save() {
    onUpdate({ title: title.trim() || card.title, description, priority, dueDate: dueDate || undefined, labels: selectedLabels });
    onClose();
  }

  function toggleLabel(id: string) {
    setSelectedLabels((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  }

  const isOverdue = dueDate && new Date(dueDate) < new Date() && priority !== "low";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{columnTitle}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (confirm("Delete this card?")) { onDelete(); onClose(); } }}
              className="text-xs text-gray-400 hover:text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Delete
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-medium text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none placeholder-gray-300"
            />
          </div>

          {/* Priority + Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Priority</label>
              <div className="flex flex-col gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border text-left transition ${priority === p.value ? p.color + " border" : "text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full text-sm border rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${isOverdue ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200"}`}
              />
              {isOverdue && <p className="text-xs text-red-500 mt-1">Overdue</p>}
              {dueDate && (
                <button onClick={() => setDueDate("")} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Clear</button>
              )}
            </div>
          </div>

          {/* Labels */}
          {Object.keys(labels).length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Labels</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(labels).map((label) => {
                  const selected = selectedLabels.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleLabel(label.id)}
                      className={`text-xs font-medium px-3 py-1 rounded-full border transition ${selected ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      style={selected ? { backgroundColor: label.color, borderColor: label.color } : {}}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-300">Created {new Date(card.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm text-gray-500 px-4 py-2 rounded-xl hover:bg-gray-100 transition">Cancel</button>
          <button onClick={save} className="text-sm bg-indigo-600 text-white font-medium px-5 py-2 rounded-xl hover:bg-indigo-700 transition">Save changes</button>
        </div>
      </div>
    </div>
  );
}
