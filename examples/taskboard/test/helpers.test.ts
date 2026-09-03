import { describe, expect, it } from "vitest";
import { formatRelativeDue, formatTitle, pluralize } from "../src/lib/format.js";
import { escalatePriority, needsAttention, priorityRank } from "../src/lib/priority.js";
import { validateNotes, validateTitle } from "../src/lib/validation.js";
import { createTask } from "../src/lib/taskLogic.js";

describe("format helpers", () => {
  it("formats titles and plurals", () => {
    expect(formatTitle("  Hello  ")).toBe("Hello");
    expect(formatTitle("")).toBe("Untitled");
    expect(pluralize(1, "task")).toBe("1 task");
    expect(pluralize(2, "task")).toBe("2 tasks");
  });

  it("formats due dates", () => {
    const now = Date.now();
    expect(formatRelativeDue(null, now)).toBe("No due date");
    expect(formatRelativeDue(now - 2 * 24 * 60 * 60 * 1000, now)).toContain("overdue");
    expect(formatRelativeDue(now + 2 * 60 * 60 * 1000, now)).toContain("Due in");
  });
});

describe("priority helpers", () => {
  it("ranks and escalates", () => {
    expect(priorityRank("critical")).toBeGreaterThan(priorityRank("low"));
    expect(escalatePriority("low")).toBe("medium");
    expect(escalatePriority("critical")).toBe("critical");
  });

  it("flags attention for critical tasks", () => {
    const task = createTask({ title: "Hot", priority: "critical" });
    expect(needsAttention(task)).toBe(true);
  });
});

describe("validation", () => {
  it("validates titles and notes", () => {
    expect(validateTitle("")).toBeTruthy();
    expect(validateTitle("ok title")).toBeNull();
    expect(validateNotes("x".repeat(501))).toBeTruthy();
    expect(validateNotes("fine")).toBeNull();
  });
});
