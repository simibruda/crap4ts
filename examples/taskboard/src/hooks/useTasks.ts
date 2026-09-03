import { useCallback, useMemo } from "react";
import type { Priority, Task, TaskStatus } from "../types.js";
import { createTask, sortTasks, updateTaskStatus } from "../lib/taskLogic.js";
import { escalatePriority } from "../lib/priority.js";
import { useLocalStorage } from "./useLocalStorage.js";

const STORAGE_KEY = "taskboard.tasks";

export function useTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEY, seedTasks());

  const addTask = useCallback(
    (input: { title: string; notes?: string; priority?: Priority; dueAt?: number | null }) => {
      setTasks([...tasks, createTask(input)]);
    },
    [tasks, setTasks],
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setTasks(tasks.map((task) => (task.id === id ? updateTaskStatus(task, status) : task)));
    },
    [tasks, setTasks],
  );

  const removeTask = useCallback(
    (id: string) => {
      setTasks(tasks.filter((task) => task.id !== id));
    },
    [tasks, setTasks],
  );

  const bumpPriority = useCallback(
    (id: string) => {
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, priority: escalatePriority(task.priority) } : task,
        ),
      );
    },
    [tasks, setTasks],
  );

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  return { tasks: sorted, addTask, setStatus, removeTask, bumpPriority };
}

function seedTasks(): Task[] {
  const now = Date.now();
  return [
    createTask({
      title: "Ship crap4ts demo",
      notes: "Record video of the CRAP report",
      priority: "high",
      dueAt: now + 2 * 60 * 60 * 1000,
    }),
    createTask({
      title: "Refactor risky helpers",
      notes: "Lower complexity or add tests",
      priority: "critical",
      dueAt: now - 60 * 60 * 1000,
    }),
    createTask({
      title: "Polish empty states",
      priority: "low",
    }),
  ];
}
