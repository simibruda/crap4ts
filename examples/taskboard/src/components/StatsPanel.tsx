import type { BoardStats } from "../lib/stats.js";
import { riskLevel } from "../lib/stats.js";

export function StatsPanel({ stats }: { stats: BoardStats }) {
  const risk = riskLevel(stats);
  const completion = Math.round(stats.completionRate * 100);

  return (
    <section className={`stats-panel risk-${risk}`}>
      <h2>Board health</h2>
      <p className="risk-label">Risk: {risk}</p>
      <ul>
        <li>Total: {stats.total}</li>
        <li>Todo: {stats.todo}</li>
        <li>Doing: {stats.doing}</li>
        <li>Done: {stats.done}</li>
        <li>Overdue: {stats.overdue}</li>
        <li>Needs attention: {stats.attention}</li>
        <li>Completion: {completion}%</li>
      </ul>
    </section>
  );
}
