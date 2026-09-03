import type { Priority, Task, TaskFilter, TaskStatus } from "../types.js";

export function createTask(input: {
  title: string;
  notes?: string;
  priority?: Priority;
  dueAt?: number | null;
}): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    priority: input.priority ?? "medium",
    status: "todo",
    createdAt: Date.now(),
    dueAt: input.dueAt ?? null,
  };
}

export function updateTaskStatus(task: Task, status: TaskStatus): Task {
  if (task.status === status) {
    return task;
  }
  return { ...task, status };
}

export function isOverdue(task: Task, now = Date.now()): boolean {
  if (task.dueAt == null || task.status === "done") {
    return false;
  }
  return task.dueAt < now;
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter((task) => {
    if (filter.status !== "all" && task.status !== filter.status) {
      return false;
    }
    if (filter.priority !== "all" && task.priority !== filter.priority) {
      return false;
    }
    const q = filter.query.trim().toLowerCase();
    if (!q) {
      return true;
    }
    return (
      task.title.toLowerCase().includes(q) ||
      task.notes.toLowerCase().includes(q)
    );
  });
}

export function sortTasks(tasks: Task[]): Task[] {
  const weight: Record<Priority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return [...tasks].sort((a, b) => {
    const byPriority = weight[b.priority] - weight[a.priority];
    if (byPriority !== 0) {
      return byPriority;
    }
    if (a.dueAt != null && b.dueAt != null) {
      return a.dueAt - b.dueAt;
    }
    if (a.dueAt != null) {
      return -1;
    }
    if (b.dueAt != null) {
      return 1;
    }
    return b.createdAt - a.createdAt;
  });
}
