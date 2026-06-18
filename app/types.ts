export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
  dueDate?: string;
  labels: string[];
}

export interface Column {
  id: string;
  title: string;
  color: string;
  cardIds: string[];
}

export interface BoardState {
  boardTitle: string;
  cards: Record<string, Card>;
  columns: Column[];
  labels: Record<string, Label>;
}
