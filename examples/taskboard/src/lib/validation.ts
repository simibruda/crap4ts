import type { Priority } from "../types.js";

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

export function validateTitle(title: string): string | null {
  const value = title.trim();
  if (!value) {
    return "Title is required";
  }
  if (value.length < 3) {
    return "Title must be at least 3 characters";
  }
  if (value.length > 80) {
    return "Title must be at most 80 characters";
  }
  return null;
}

export function validateNotes(notes: string): string | null {
  if (notes.length > 500) {
    return "Notes must be at most 500 characters";
  }
  return null;
}

export function isPriority(value: string): value is Priority {
  return PRIORITIES.includes(value as Priority);
}

export function parseDueDate(value: string): number | null | { error: string } {
  if (!value.trim()) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { error: "Invalid date" };
  }
  if (parsed < Date.now() - 60_000) {
    return { error: "Due date cannot be in the past" };
  }
  return parsed;
}
