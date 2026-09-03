import type { FunctionMetrics } from "./types.js";

export function formatReport(entries: FunctionMetrics[]): string {
  const sorted = [...entries].sort((a, b) => {
    if (a.crapScore == null && b.crapScore == null) {
      return 0;
    }
    if (a.crapScore == null) {
      return 1;
    }
    if (b.crapScore == null) {
      return -1;
    }
    return b.crapScore - a.crapScore;
  });

  const header = sprintf("%-30s %-35s %4s %7s %8s", "Function", "Container", "CC", "Cov%", "CRAP");
  const separator = "-".repeat(header.length);
  const lines = ["CRAP Report", "===========", header, separator];

  for (const entry of sorted) {
    lines.push(
      sprintf(
        "%-30s %-35s %4d %7s %8s",
        entry.functionName,
        entry.containerName,
        entry.complexity,
        formatCoverage(entry.coveragePercent),
        formatCrap(entry.crapScore),
      ),
    );
  }

  return `${lines.join("\n")}\n`;
}

function formatCoverage(coverage: number | null): string {
  if (coverage == null) {
    return "  N/A ";
  }
  return `${sprintf("%5.1f", coverage)}%`;
}

function formatCrap(score: number | null): string {
  if (score == null) {
    return "     N/A";
  }
  return sprintf("%8.1f", score);
}

/** Minimal sprintf supporting %s, %d, and %f with width/precision. */
function sprintf(format: string, ...args: Array<string | number>): string {
  let i = 0;
  return format.replace(/%(-?\d+)?(?:\.(\d+))?([sdf])/g, (_match, widthText, precisionText, type) => {
    const arg = args[i++];
    let text: string;
    if (type === "d") {
      text = String(Math.trunc(Number(arg)));
    } else if (type === "f") {
      const precision = precisionText != null ? Number(precisionText) : 6;
      text = Number(arg).toFixed(precision);
    } else {
      text = String(arg);
    }

    if (widthText == null) {
      return text;
    }
    const width = Number(widthText);
    const absWidth = Math.abs(width);
    if (text.length >= absWidth) {
      return text;
    }
    const padding = " ".repeat(absWidth - text.length);
    return width < 0 ? text + padding : padding + text;
  });
}
