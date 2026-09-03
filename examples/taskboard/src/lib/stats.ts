import type { Task } from "../types.js";
import { isOverdue } from "./taskLogic.js";
import { needsAttention } from "./priority.js";

export interface BoardStats {
  total: number;
  todo: number;
  doing: number;
  done: number;
  overdue: number;
  attention: number;
  completionRate: number;
}

export function computeStats(tasks: Task[], now = Date.now()): BoardStats {
  let todo = 0;
  let doing = 0;
  let done = 0;
  let overdue = 0;
  let attention = 0;

  for (const task of tasks) {
    if (task.status === "todo") todo++;
    else if (task.status === "doing") doing++;
    else done++;

    if (isOverdue(task, now)) {
      overdue++;
    }
    if (needsAttention(task, now)) {
      attention++;
    }
  }

  const total = tasks.length;
  return {
    total,
    todo,
    doing,
    done,
    overdue,
    attention,
    completionRate: total === 0 ? 0 : done / total,
  };
}

export function riskLevel(stats: BoardStats): "calm" | "busy" | "critical" {
  if (stats.overdue > 3 || stats.attention > 5) {
    return "critical";
  }
  if (stats.todo + stats.doing > 8 || stats.overdue > 0) {
    return "busy";
  }
  return "calm";
}
