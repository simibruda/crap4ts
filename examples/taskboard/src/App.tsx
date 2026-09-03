import { useMemo, useState } from "react";
import { Header } from "./components/Header.js";
import { FilterBar } from "./components/FilterBar.js";
import { TaskForm } from "./components/TaskForm.js";
import { TaskList } from "./components/TaskList.js";
import { StatsPanel } from "./components/StatsPanel.js";
import { ConfirmDialog } from "./components/ConfirmDialog.js";
import { useTasks } from "./hooks/useTasks.js";
import { useFilter } from "./hooks/useFilter.js";
import { computeStats } from "./lib/stats.js";

export function App() {
  const { tasks, addTask, setStatus, removeTask, bumpPriority } = useTasks();
  const {
    visible,
    status,
    setStatus: setFilterStatus,
    priority,
    setPriority,
    query,
    setQuery,
  } = useFilter(tasks);
  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <div className="app-shell">
      <Header
        title="Sprint Taskboard"
        subtitle="A small React app for exercising crap4ts on UI, hooks, and logic."
      />
      <div className="layout">
        <main>
          <TaskForm onSubmit={addTask} />
          <FilterBar
            status={status}
            priority={priority}
            query={query}
            onStatus={setFilterStatus}
            onPriority={setPriority}
            onQuery={setQuery}
          />
          <TaskList
            tasks={visible}
            onStatus={setStatus}
            onRemove={setPendingDelete}
            onBump={bumpPriority}
          />
        </main>
        <aside>
          <StatsPanel stats={stats} />
        </aside>
      </div>
      <ConfirmDialog
        open={pendingDelete != null}
        title="Delete task?"
        body="This cannot be undone."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            removeTask(pendingDelete);
          }
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
