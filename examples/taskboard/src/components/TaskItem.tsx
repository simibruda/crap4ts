import type { Task, TaskStatus } from "../types.js";
import { formatRelativeDue, formatTitle } from "../lib/format.js";
import { isOverdue } from "../lib/taskLogic.js";
import { needsAttention } from "../lib/priority.js";

export function TaskItem({
  task,
  onStatus,
  onRemove,
  onBump,
}: {
  task: Task;
  onStatus: (id: string, status: TaskStatus) => void;
  onRemove: (id: string) => void;
  onBump: (id: string) => void;
}) {
  const overdue = isOverdue(task);
  const attention = needsAttention(task);

  return (
    <article className={`task-item priority-${task.priority}${overdue ? " overdue" : ""}`}>
      <div className="task-main">
        <h3>{formatTitle(task.title)}</h3>
        {task.notes ? <p>{task.notes}</p> : null}
        <div className="meta">
          <span className="pill">{task.priority}</span>
          <span className="pill">{task.status}</span>
          <span className="pill">{formatRelativeDue(task.dueAt)}</span>
          {attention ? <span className="pill warn">needs attention</span> : null}
        </div>
      </div>
      <div className="task-actions">
        <select
          value={task.status}
          onChange={(e) => onStatus(task.id, e.target.value as TaskStatus)}
          aria-label={`Status for ${task.title}`}
        >
          <option value="todo">Todo</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
        <button type="button" onClick={() => onBump(task.id)}>
          Escalate
        </button>
        <button type="button" className="danger" onClick={() => onRemove(task.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
