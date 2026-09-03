import { useMemo, useState } from "react";
import type { Priority, Task, TaskFilter, TaskStatus } from "../types.js";
import { filterTasks } from "../lib/taskLogic.js";
import { useDebounce } from "./useDebounce.js";

export function useFilter(tasks: Task[]) {
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 200);

  const filter: TaskFilter = useMemo(
    () => ({ status, priority, query: debouncedQuery }),
    [status, priority, debouncedQuery],
  );

  const visible = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);

  return {
    filter,
    visible,
    status,
    setStatus,
    priority,
    setPriority,
    query,
    setQuery,
  };
}
