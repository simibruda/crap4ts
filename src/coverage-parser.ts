import { existsSync, readFileSync } from "node:fs";
import { resolve, normalize } from "node:path";
import type { CoverageData } from "./types.js";

/**
 * Parses Istanbul coverage-final.json into keyed coverage entries.
 * Keys: "<absoluteOrNormalizedPath>#<functionName>:<startLine>"
 */
export function parseIstanbulCoverage(coverageJsonPath: string): Map<string, CoverageData> {
  if (!existsSync(coverageJsonPath)) {
    return new Map();
  }

  const raw = JSON.parse(readFileSync(coverageJsonPath, "utf8")) as Record<
    string,
    IstanbulFileCoverage
  >;
  const coverage = new Map<string, CoverageData>();

  for (const [filePath, fileCoverage] of Object.entries(raw)) {
    const normalizedPath = normalizePath(filePath);
    addFunctionCoverage(coverage, normalizedPath, fileCoverage);
    addStatementRangeCoverage(coverage, normalizedPath, fileCoverage);
  }

  return coverage;
}

interface IstanbulFileCoverage {
  path?: string;
  fnMap?: Record<string, IstanbulFunction>;
  f?: Record<string, number>;
  statementMap?: Record<string, IstanbulRange>;
  s?: Record<string, number>;
}

interface IstanbulFunction {
  name?: string;
  decl?: IstanbulRange;
  loc?: IstanbulRange;
}

interface IstanbulRange {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

function addFunctionCoverage(
  coverage: Map<string, CoverageData>,
  filePath: string,
  fileCoverage: IstanbulFileCoverage,
): void {
  const fnMap = fileCoverage.fnMap ?? {};
  const hits = fileCoverage.f ?? {};
  for (const [id, fn] of Object.entries(fnMap)) {
    const name = normalizeFunctionName(fn.name ?? `(anonymous_${id})`);
    const startLine = fn.loc?.start.line ?? fn.decl?.start.line ?? 0;
    const hitCount = hits[id] ?? 0;
    // Function hit is binary; prefer statement coverage when available.
    const key = `${filePath}#${name}:${startLine}`;
    if (!coverage.has(key)) {
      coverage.set(key, {
        covered: hitCount > 0 ? 1 : 0,
        total: 1,
      });
    }
  }
}

function addStatementRangeCoverage(
  coverage: Map<string, CoverageData>,
  filePath: string,
  fileCoverage: IstanbulFileCoverage,
): void {
  const fnMap = fileCoverage.fnMap ?? {};
  const statementMap = fileCoverage.statementMap ?? {};
  const statementHits = fileCoverage.s ?? {};

  for (const [id, fn] of Object.entries(fnMap)) {
    const name = normalizeFunctionName(fn.name ?? `(anonymous_${id})`);
    const startLine = fn.loc?.start.line ?? fn.decl?.start.line ?? 0;
    const endLine = fn.loc?.end.line ?? startLine;
    let covered = 0;
    let total = 0;
    for (const [stmtId, range] of Object.entries(statementMap)) {
      const line = range.start.line;
      if (line < startLine || line > endLine) {
        continue;
      }
      total++;
      if ((statementHits[stmtId] ?? 0) > 0) {
        covered++;
      }
    }
    if (total === 0) {
      continue;
    }
    coverage.set(`${filePath}#${name}:${startLine}`, { covered, total });
  }

  // Also index file-level statement coverage by line for nearest matching.
  for (const [stmtId, range] of Object.entries(statementMap)) {
    const line = range.start.line;
    const key = `${filePath}#*:${line}`;
    const hit = (statementHits[stmtId] ?? 0) > 0 ? 1 : 0;
    const existing = coverage.get(key);
    if (existing == null) {
      coverage.set(key, { covered: hit, total: 1 });
    } else {
      coverage.set(key, {
        covered: existing.covered + hit,
        total: existing.total + 1,
      });
    }
  }
}

export function coveragePercent(data: CoverageData | null | undefined): number | null {
  if (data == null || data.total === 0) {
    return null;
  }
  return (data.covered * 100.0) / data.total;
}

export function normalizeFunctionName(name: string): string {
  if (name.startsWith("(anonymous_")) {
    return name;
  }
  // Istanbul sometimes prefixes with object path.
  const parts = name.split(".");
  return parts[parts.length - 1] ?? name;
}

export function normalizePath(filePath: string): string {
  return normalize(resolve(filePath)).replace(/\\/g, "/");
}

/**
 * Parse LCOV as a fallback when coverage-final.json is missing.
 * Builds file#line keys from DA records aggregated into crude function ranges via FN/FNDA.
 */
export function parseLcovCoverage(lcovPath: string): Map<string, CoverageData> {
  if (!existsSync(lcovPath)) {
    return new Map();
  }

  const text = readFileSync(lcovPath, "utf8");
  const coverage = new Map<string, CoverageData>();
  let currentFile = "";
  const functions: Array<{ name: string; line: number }> = [];
  const lineHits = new Map<number, number>();

  const flush = (): void => {
    if (currentFile === "") {
      return;
    }
    const normalized = normalizePath(currentFile);
    for (const fn of functions) {
      const endGuess = nextFunctionLine(functions, fn.line) - 1;
      let covered = 0;
      let total = 0;
      for (const [line, hits] of lineHits) {
        if (line < fn.line || line > endGuess) {
          continue;
        }
        total++;
        if (hits > 0) {
          covered++;
        }
      }
      if (total > 0) {
        coverage.set(`${normalized}#${fn.name}:${fn.line}`, { covered, total });
      }
    }
    for (const [line, hits] of lineHits) {
      coverage.set(`${normalized}#*:${line}`, {
        covered: hits > 0 ? 1 : 0,
        total: 1,
      });
    }
    functions.length = 0;
    lineHits.clear();
  };

  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.startsWith("SF:")) {
      flush();
      currentFile = rawLine.slice(3);
    } else if (rawLine.startsWith("FN:")) {
      const [lineText, name] = rawLine.slice(3).split(",");
      functions.push({ name: name ?? "(anonymous)", line: Number(lineText) || 0 });
    } else if (rawLine.startsWith("DA:")) {
      const [lineText, hitText] = rawLine.slice(3).split(",");
      lineHits.set(Number(lineText) || 0, Number(hitText) || 0);
    } else if (rawLine === "end_of_record") {
      flush();
      currentFile = "";
    }
  }
  flush();
  return coverage;
}

function nextFunctionLine(
  functions: Array<{ name: string; line: number }>,
  line: number,
): number {
  let next = Number.MAX_SAFE_INTEGER;
  for (const fn of functions) {
    if (fn.line > line && fn.line < next) {
      next = fn.line;
    }
  }
  return next;
}
