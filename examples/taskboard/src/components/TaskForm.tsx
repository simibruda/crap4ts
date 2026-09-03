import { useState, type FormEvent } from "react";
import type { Priority } from "../types.js";
import { parseDueDate, validateNotes, validateTitle } from "../lib/validation.js";

export function TaskForm({
  onSubmit,
}: {
  onSubmit: (input: {
    title: string;
    notes: string;
    priority: Priority;
    dueAt: number | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const titleError = validateTitle(title);
    if (titleError) {
      setError(titleError);
      return;
    }
    const notesError = validateNotes(notes);
    if (notesError) {
      setError(notesError);
      return;
    }
    const dueValue = parseDueDate(due);
    if (dueValue && typeof dueValue === "object" && "error" in dueValue) {
      setError(dueValue.error);
      return;
    }
    onSubmit({
      title,
      notes,
      priority,
      dueAt: typeof dueValue === "number" ? dueValue : null,
    });
    setTitle("");
    setNotes("");
    setPriority("medium");
    setDue("");
    setError(null);
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>Add task</h2>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        aria-label="Task title"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        aria-label="Notes"
      />
      <div className="row">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="datetime-local"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
        />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit">Create task</button>
    </form>
  );
}
