import type { Task, TaskStatus } from "../types.js";
import { TaskItem } from "./TaskItem.js";
import { EmptyState } from "./EmptyState.js";
import { pluralize } from "../lib/format.js";

export function TaskList({
  tasks,
  onStatus,
  onRemove,
  onBump,
}: {
  tasks: Task[];
  onStatus: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
  onBump: (id: string) => void;
}) {
  if (tasks.length === 0) {
    return <EmptyState title="No matching tasks" body="Try a different filter or add a new task." />;
  }

  return (
    <section className="task-list">
      <div className="list-heading">
        <h2>Tasks</h2>
        <span>{pluralize(tasks.length, "task")}</span>
      </div>
      <div className="stack">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onStatus={onStatus}
            onRemove={onRemove}
            onBump={onBump}
          />
        ))}
      </div>
    </section>
  );
}
