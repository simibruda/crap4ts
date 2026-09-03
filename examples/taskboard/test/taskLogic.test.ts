import { describe, expect, it } from "vitest";
import {
  createTask,
  filterTasks,
  isOverdue,
  sortTasks,
  updateTaskStatus,
} from "../src/lib/taskLogic.js";

describe("taskLogic", () => {
  it("creates and updates tasks", () => {
    const task = createTask({ title: " Demo ", notes: " n ", priority: "high" });
    expect(task.title).toBe("Demo");
    expect(task.status).toBe("todo");
    expect(updateTaskStatus(task, "doing").status).toBe("doing");
    expect(updateTaskStatus(task, "todo")).toBe(task);
  });

  it("detects overdue tasks", () => {
    const overdue = createTask({ title: "Late", dueAt: Date.now() - 1000 });
    const done = updateTaskStatus(overdue, "done");
    expect(isOverdue(overdue)).toBe(true);
    expect(isOverdue(done)).toBe(false);
  });

  it("filters and sorts", () => {
    const a = createTask({ title: "Alpha", priority: "low" });
    const b = createTask({ title: "Beta notes", notes: "search me", priority: "critical" });
    const filtered = filterTasks([a, b], {
      status: "all",
      priority: "critical",
      query: "search",
    });
    expect(filtered).toEqual([b]);
    const sorted = sortTasks([a, b]);
    expect(sorted[0]?.priority).toBe("critical");
  });
});
