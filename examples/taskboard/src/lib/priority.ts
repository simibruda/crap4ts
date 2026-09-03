import type { Priority, Task } from "../types.js";

export function priorityRank(priority: Priority): number {
  switch (priority) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function escalatePriority(priority: Priority): Priority {
  if (priority === "low") {
    return "medium";
  }
  if (priority === "medium") {
    return "high";
  }
  if (priority === "high") {
    return "critical";
  }
  return "critical";
}

export function needsAttention(task: Task, now = Date.now()): boolean {
  if (task.status === "done") {
    return false;
  }
  if (task.priority === "critical") {
    return true;
  }
  if (task.dueAt != null && task.dueAt - now < 24 * 60 * 60 * 1000) {
    return true;
  }
  return task.priority === "high" && task.status === "todo";
}
