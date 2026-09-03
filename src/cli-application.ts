import { existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseCliArguments, usage } from "./cli-arguments.js";
import { changedSourceFilesUnderSrc } from "./changed-file-detector.js";
import { analyze, CRAP_THRESHOLD, maxCrap } from "./crap-analyzer.js";
import { CoverageRunner } from "./coverage-runner.js";
import { formatReport } from "./report-formatter.js";
import { findAllSourceFilesUnderSrc, isSourceFile } from "./source-file-finder.js";
import type { CliArguments, FunctionMetrics } from "./types.js";

export class CliApplication {
  constructor(
    private readonly projectRoot: string,
    private readonly out: NodeJS.WritableStream,
    private readonly err: NodeJS.WritableStream,
    private readonly coverageRunner: CoverageRunner,
  ) {}

  async execute(args: string[]): Promise<number> {
    let parsed: CliArguments;
    try {
      parsed = parseCliArguments(args);
    } catch (error) {
      this.err.write(`${error instanceof Error ? error.message : String(error)}\n`);
      this.out.write(usage());
      return 1;
    }

    if (parsed.mode === "help") {
      this.out.write(usage());
      return 0;
    }

    const filesToAnalyze = await this.filesForMode(parsed);
    if (filesToAnalyze.length === 0) {
      this.out.write("No TypeScript/JavaScript files to analyze.\n");
      return 0;
    }

    const metrics = await this.analyzeByPackage(filesToAnalyze, parsed.useExistingCoverage);
    this.out.write(formatReport(metrics));

    const max = maxCrap(metrics);
    if (max > CRAP_THRESHOLD) {
      this.err.write(`CRAP threshold exceeded: ${max.toFixed(1)} > ${CRAP_THRESHOLD.toFixed(1)}\n`);
      return 2;
    }
    return 0;
  }

  private async analyzeByPackage(
    filesToAnalyze: string[],
    useExistingCoverage: boolean,
  ): Promise<FunctionMetrics[]> {
    const metrics: FunctionMetrics[] = [];
    for (const [packageRoot, files] of groupByPackageRoot(this.projectRoot, filesToAnalyze)) {
      const coverageDir = join(packageRoot, "coverage");
      if (!useExistingCoverage) {
        await this.coverageRunner.generateCoverage(packageRoot);
      }
      const istanbul = join(coverageDir, "coverage-final.json");
      const lcov = join(coverageDir, "lcov.info");
      if (!existsSync(istanbul) && !existsSync(lcov)) {
        this.err.write(
          `Warning: coverage report not found under ${coverageDir}. Coverage will be N/A.\n`,
        );
      }
      metrics.push(...analyze(packageRoot, files, coverageDir));
    }
    return metrics.sort((a, b) => {
      if (a.crapScore == null && b.crapScore == null) return 0;
      if (a.crapScore == null) return 1;
      if (b.crapScore == null) return -1;
      return b.crapScore - a.crapScore;
    });
  }

  private async filesForMode(parsed: CliArguments): Promise<string[]> {
    switch (parsed.mode) {
      case "all-src":
        return findAllSourceFilesUnderSrc(this.projectRoot);
      case "changed-src":
        return changedSourceFilesUnderSrc(this.projectRoot);
      case "explicit-files":
        return this.explicitFiles(parsed.fileArgs);
      case "help":
        return [];
    }
  }

  private explicitFiles(args: string[]): string[] {
    const files = new Set<string>();
    for (const arg of args) {
      const path = resolve(this.projectRoot, arg);
      if (existsSync(path) && isDirectory(path)) {
        for (const file of findAllSourceFilesUnderSrc(path)) {
          files.add(file);
        }
      } else if (existsSync(path) && isSourceFile(path)) {
        files.add(path);
      } else {
        files.add(path);
      }
    }
    return [...files].sort();
  }
}

export function packageRootFor(workspaceRoot: string, file: string): string {
  let current = isDirectory(file) ? resolve(file) : dirname(resolve(file));
  while (true) {
    if (existsSync(join(current, "package.json"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return resolve(workspaceRoot);
}

function groupByPackageRoot(workspaceRoot: string, files: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const file of files) {
    const root = packageRootFor(workspaceRoot, file);
    const list = grouped.get(root) ?? [];
    list.push(file);
    grouped.set(root, list);
  }
  return grouped;
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}
