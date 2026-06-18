"use client";
import { Droppable } from "@hello-pangea/dnd";
import { Column, Card, Label } from "../types";
import CardItem from "./CardItem";
import CardModal from "./CardModal";
import { useState } from "react";

interface Props {
  column: Column;
  cards: Card[];
  labels: Record<string, Label>;
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
}

export default function ColumnItem({ column, cards, labels, onAddCard, onDeleteCard, onUpdateCard, onDeleteColumn, onRenameColumn }: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  function submitCard() {
    if (newTitle.trim()) {
      onAddCard(column.id, newTitle.trim());
      setNewTitle("");
      setAdding(false);
    }
  }

  function saveColTitle() {
    if (colTitle.trim()) onRenameColumn(column.id, colTitle.trim());
    setEditingTitle(false);
  }

  return (
    <>
      <div className="flex flex-col w-72 shrink-0">
        {/* Column header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
            {editingTitle ? (
              <input
                autoFocus
                value={colTitle}
                onChange={(e) => setColTitle(e.target.value)}
                onBlur={saveColTitle}
                onKeyDown={(e) => e.key === "Enter" && saveColTitle()}
                className="text-sm font-semibold text-gray-700 border-b-2 border-indigo-400 outline-none bg-transparent w-32"
              />
            ) : (
              <span
                className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-indigo-600 transition"
                onDoubleClick={() => setEditingTitle(true)}
              >
                {column.title}
              </span>
            )}
            <span className="text-xs text-gray-400 bg-gray-200 rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {cards.length}
            </span>
          </div>
          <button
            onClick={() => { if (confirm(`Delete "${column.title}" and all its cards?`)) onDeleteColumn(column.id); }}
            className="text-gray-300 hover:text-red-400 transition p-1 rounded"
            title="Delete column"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Cards droppable */}
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex flex-col gap-2 min-h-[80px] rounded-2xl p-2 transition-colors ${
                snapshot.isDraggingOver ? "bg-indigo-50/80 ring-2 ring-indigo-200 ring-dashed" : "bg-gray-100/60"
              }`}
            >
              {cards.map((card, index) => (
                <CardItem
                  key={card.id}
                  card={card}
                  index={index}
                  labels={labels}
                  onOpen={() => setActiveCard(card)}
                  onDelete={() => onDeleteCard(column.id, card.id)}
                />
              ))}
              {provided.placeholder}

              {/* Inline add card */}
              {adding ? (
                <div className="bg-white rounded-xl p-3 shadow-sm border border-indigo-200">
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitCard(); if (e.key === "Escape") setAdding(false); }}
                    placeholder="Card title…"
                    className="w-full text-sm outline-none text-gray-700 placeholder-gray-300"
                  />
                  <div className="flex gap-1.5 mt-2.5">
                    <button onClick={submitCard} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium">
                      Add card
                    </button>
                    <button onClick={() => { setAdding(false); setNewTitle(""); }} className="text-xs text-gray-400 px-2 py-1.5 rounded-lg hover:bg-gray-100">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className="w-full text-xs text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl py-2 px-3 transition text-left flex items-center gap-1.5 group"
                >
                  <svg className="w-3.5 h-3.5 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add a card
                </button>
              )}
            </div>
          )}
        </Droppable>
      </div>

      {activeCard && (
        <CardModal
          card={activeCard}
          labels={labels}
          columnTitle={column.title}
          onClose={() => setActiveCard(null)}
          onUpdate={(updates) => { onUpdateCard(activeCard.id, updates); setActiveCard({ ...activeCard, ...updates }); }}
          onDelete={() => onDeleteCard(column.id, activeCard.id)}
        />
      )}
    </>
  );
}
