"use client";
import { Draggable } from "@hello-pangea/dnd";
import { Card, Label } from "../types";

const priorityBorder: Record<Card["priority"], string> = {
  low: "border-l-emerald-400",
  medium: "border-l-amber-400",
  high: "border-l-red-400",
};

const priorityDot: Record<Card["priority"], string> = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
};

interface Props {
  card: Card;
  index: number;
  labels: Record<string, Label>;
  onOpen: () => void;
  onDelete: () => void;
}

function isOverdue(dueDate?: string) {
  return dueDate && new Date(dueDate) < new Date();
}

export default function CardItem({ card, index, labels, onOpen, onDelete }: Props) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onOpen}
          className={`bg-white rounded-xl border-l-4 ${priorityBorder[card.priority]} shadow-sm border border-gray-100 border-l-4 group cursor-pointer transition-all select-none ${
            snapshot.isDragging ? "shadow-xl scale-[1.02] rotate-1 border-indigo-100" : "hover:shadow-md hover:-translate-y-0.5"
          }`}
        >
          <div className="px-3 py-3">
            {/* Labels */}
            {card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map((lid) => {
                  const label = labels[lid];
                  if (!label) return null;
                  return (
                    <span
                      key={lid}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Title + delete */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-800 leading-snug">{card.title}</p>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this card?")) onDelete(); }}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition p-0.5 shrink-0 mt-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Description */}
            {card.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{card.description}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[card.priority]}`} />
                <span className="text-[10px] text-gray-400 capitalize">{card.priority}</span>
              </div>
              {card.dueDate && (
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isOverdue(card.dueDate) ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-400"}`}>
                  {isOverdue(card.dueDate) ? "⚠ " : ""}
                  {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
