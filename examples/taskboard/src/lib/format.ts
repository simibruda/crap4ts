export function formatRelativeDue(dueAt: number | null, now = Date.now()): string {
  if (dueAt == null) {
    return "No due date";
  }
  const delta = dueAt - now;
  const day = 24 * 60 * 60 * 1000;
  if (delta < 0) {
    const days = Math.ceil(Math.abs(delta) / day);
    return days === 1 ? "1 day overdue" : `${days} days overdue`;
  }
  if (delta < day) {
    const hours = Math.max(1, Math.round(delta / (60 * 60 * 1000)));
    return hours === 1 ? "Due in 1 hour" : `Due in ${hours} hours`;
  }
  const days = Math.round(delta / day);
  return days === 1 ? "Due tomorrow" : `Due in ${days} days`;
}

export function formatTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return "Untitled";
  }
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}
