import { describe, expect, it } from "vitest";
import { computeStats, riskLevel } from "../src/lib/stats.js";
import { createTask, updateTaskStatus } from "../src/lib/taskLogic.js";

describe("stats", () => {
  it("computes board stats and risk", () => {
    const todo = createTask({ title: "One", priority: "low" });
    const doing = updateTaskStatus(createTask({ title: "Two", priority: "medium" }), "doing");
    const done = updateTaskStatus(createTask({ title: "Three", priority: "low" }), "done");
    const overdue = createTask({
      title: "Late",
      priority: "high",
      dueAt: Date.now() - 10_000,
    });

    const stats = computeStats([todo, doing, done, overdue]);
    expect(stats.total).toBe(4);
    expect(stats.todo).toBe(2);
    expect(stats.doing).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.completionRate).toBeCloseTo(0.25);
    expect(["calm", "busy", "critical"]).toContain(riskLevel(stats));
  });
});
