import type { Priority, TaskStatus } from "../types.js";

export function FilterBar({
  status,
  priority,
  query,
  onStatus,
  onPriority,
  onQuery,
}: {
  status: TaskStatus | "all";
  priority: Priority | "all";
  query: string;
  onStatus: (value: TaskStatus | "all") => void;
  onPriority: (value: Priority | "all") => void;
  onQuery: (value: string) => void;
}) {
  return (
    <section className="filter-bar">
      <label>
        Status
        <select value={status} onChange={(e) => onStatus(e.target.value as TaskStatus | "all")}>
          <option value="all">All</option>
          <option value="todo">Todo</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
      </label>
      <label>
        Priority
        <select
          value={priority}
          onChange={(e) => onPriority(e.target.value as Priority | "all")}
        >
          <option value="all">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <label className="grow">
        Search
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search title or notes"
        />
      </label>
    </section>
  );
}
