"use client";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { BoardState, Card, Column } from "../types";
import ColumnItem from "./ColumnItem";
import { useState } from "react";

const COLUMN_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  state: BoardState;
  searchQuery: string;
  onChange: (state: BoardState) => void;
}

export default function Board({ state, searchQuery, onChange }: Props) {
  const [addingCol, setAddingCol] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  function update(next: BoardState) {
    onChange(next);
  }

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const cols = state.columns.map((c) => ({ ...c, cardIds: [...c.cardIds] }));
    const src = cols.find((c) => c.id === source.droppableId)!;
    const dst = cols.find((c) => c.id === destination.droppableId)!;
    src.cardIds.splice(source.index, 1);
    dst.cardIds.splice(destination.index, 0, draggableId);
    update({ ...state, columns: cols });
  }

  function addCard(columnId: string, title: string) {
    const id = uid();
    const card: Card = { id, title, description: "", priority: "medium", labels: [], createdAt: new Date().toISOString() };
    const cols = state.columns.map((c) =>
      c.id === columnId ? { ...c, cardIds: [...c.cardIds, id] } : c
    );
    update({ ...state, cards: { ...state.cards, [id]: card }, columns: cols });
  }

  function deleteCard(columnId: string, cardId: string) {
    const cols = state.columns.map((c) =>
      c.id === columnId ? { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) } : c
    );
    const cards = { ...state.cards };
    delete cards[cardId];
    update({ ...state, cards, columns: cols });
  }

  function updateCard(cardId: string, updates: Partial<Card>) {
    update({ ...state, cards: { ...state.cards, [cardId]: { ...state.cards[cardId], ...updates } } });
  }

  function addColumn() {
    if (!newColTitle.trim()) return;
    const col: Column = {
      id: uid(),
      title: newColTitle.trim(),
      color: COLUMN_COLORS[state.columns.length % COLUMN_COLORS.length],
      cardIds: [],
    };
    update({ ...state, columns: [...state.columns, col] });
    setNewColTitle("");
    setAddingCol(false);
  }

  function deleteColumn(columnId: string) {
    const col = state.columns.find((c) => c.id === columnId)!;
    const cards = { ...state.cards };
    col.cardIds.forEach((id) => delete cards[id]);
    update({ ...state, cards, columns: state.columns.filter((c) => c.id !== columnId) });
  }

  function renameColumn(columnId: string, title: string) {
    update({ ...state, columns: state.columns.map((c) => (c.id === columnId ? { ...c, title } : c)) });
  }

  const q = searchQuery.toLowerCase().trim();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-5 items-start overflow-x-auto pb-4 px-1">
        {state.columns.map((col) => {
          const cards = col.cardIds
            .map((id) => state.cards[id])
            .filter(Boolean)
            .filter((c) => !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));

          return (
            <ColumnItem
              key={col.id}
              column={col}
              cards={cards}
              labels={state.labels}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onUpdateCard={updateCard}
              onDeleteColumn={deleteColumn}
              onRenameColumn={renameColumn}
            />
          );
        })}

        {/* Add column */}
        <div className="shrink-0 w-72">
          {addingCol ? (
            <div className="bg-gray-100/60 rounded-2xl p-3">
              <input
                autoFocus
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addColumn(); if (e.key === "Escape") setAddingCol(false); }}
                placeholder="Column name…"
                className="w-full text-sm outline-none text-gray-700 placeholder-gray-300 bg-white border border-gray-200 rounded-xl px-3 py-2.5 mb-2.5 focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button onClick={addColumn} className="text-sm bg-indigo-600 text-white font-medium px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition">
                  Add
                </button>
                <button onClick={() => setAddingCol(false)} className="text-sm text-gray-400 px-3 py-1.5 rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="w-full text-sm text-gray-400 hover:text-indigo-600 bg-white/50 hover:bg-white border border-dashed border-gray-300 hover:border-indigo-300 rounded-2xl py-5 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add column
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}
