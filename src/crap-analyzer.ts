import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateCrap } from "./crap-score.js";
import {
  coveragePercent,
  normalizePath,
  parseIstanbulCoverage,
  parseLcovCoverage,
} from "./coverage-parser.js";
import { parseFunctions } from "./ts-function-parser.js";
import type { CoverageData, FunctionMetrics } from "./types.js";

export function analyze(
  projectRoot: string,
  files: string[],
  coverageDir = join(projectRoot, "coverage"),
): FunctionMetrics[] {
  const coverageMap = loadCoverage(coverageDir);
  const metrics: FunctionMetrics[] = [];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }
    const source = readFileSync(file, "utf8");
    const functions = parseFunctions(file, source);
    const normalizedFile = normalizePath(file);

    for (const fn of functions) {
      const coverage = lookupCoverage(
        coverageMap,
        normalizedFile,
        fn.name,
        fn.startLine,
        fn.endLine,
      );
      const coveragePct = coveragePercent(coverage);
      metrics.push({
        functionName: fn.name,
        containerName: fn.containerName,
        filePath: normalizedFile,
        complexity: fn.complexity,
        coveragePercent: coveragePct,
        crapScore: calculateCrap(fn.complexity, coveragePct),
        kind: fn.kind,
      });
    }
  }

  return sortMetrics(metrics);
}

export function loadCoverage(coverageDir: string): Map<string, CoverageData> {
  const istanbulPath = join(coverageDir, "coverage-final.json");
  if (existsSync(istanbulPath)) {
    return parseIstanbulCoverage(istanbulPath);
  }
  // vitest/c8 sometimes write json under coverage/
  const altJson = join(coverageDir, "coverage-final.json");
  void altJson;
  const lcovPath = join(coverageDir, "lcov.info");
  if (existsSync(lcovPath)) {
    return parseLcovCoverage(lcovPath);
  }
  return new Map();
}

export function lookupCoverage(
  coverageMap: Map<string, CoverageData>,
  filePath: string,
  functionName: string,
  startLine: number,
  endLine: number,
): CoverageData | null {
  const normalizedFile = normalizePath(filePath);
  const exact = exactCoverage(coverageMap, normalizedFile, functionName, startLine);
  if (exact != null) {
    return exact;
  }

  const nearest = nearestCoverage(coverageMap, normalizedFile, functionName, startLine);
  if (nearest != null) {
    return nearest;
  }

  return statementCoverageInRange(coverageMap, normalizedFile, startLine, endLine);
}

export function exactCoverage(
  coverageMap: Map<string, CoverageData>,
  filePath: string,
  functionName: string,
  line: number,
): CoverageData | null {
  return coverageMap.get(`${filePath}#${functionName}:${line}`) ?? null;
}

export function nearestCoverage(
  coverageMap: Map<string, CoverageData>,
  filePath: string,
  functionName: string,
  line: number,
): CoverageData | null {
  const prefix = `${filePath}#${functionName}:`;
  let nearest: CoverageData | null = null;
  let nearestDistance = Number.MAX_SAFE_INTEGER;
  for (const [key, value] of coverageMap) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    const jacocoLine = parseTrailingLine(key);
    const distance = Math.abs(jacocoLine - line);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = value;
    }
  }
  return nearest;
}

export function statementCoverageInRange(
  coverageMap: Map<string, CoverageData>,
  filePath: string,
  startLine: number,
  endLine: number,
): CoverageData | null {
  let covered = 0;
  let total = 0;
  for (let line = startLine; line <= endLine; line++) {
    const data = coverageMap.get(`${filePath}#*:${line}`);
    if (data == null) {
      continue;
    }
    covered += data.covered;
    total += data.total;
  }
  if (total === 0) {
    return null;
  }
  return { covered, total };
}

export function parseTrailingLine(key: string): number {
  const separator = key.lastIndexOf(":");
  if (separator < 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  const lineText = key.slice(separator + 1);
  if (lineText === "") {
    return Number.MAX_SAFE_INTEGER;
  }
  const value = Number(lineText);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

export function sortMetrics(metrics: FunctionMetrics[]): FunctionMetrics[] {
  return [...metrics].sort((a, b) => {
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
}

export function maxCrap(metrics: FunctionMetrics[]): number {
  let max = 0;
  for (const metric of metrics) {
    if (metric.crapScore != null) {
      max = Math.max(max, metric.crapScore);
    }
  }
  return max;
}

export const CRAP_THRESHOLD = 8.0;
