export type Priority = "low" | "medium" | "high" | "critical";

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  dueAt: number | null;
}

export type TaskFilter = {
  status: TaskStatus | "all";
  priority: Priority | "all";
  query: string;
};
