import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatReport } from "../src/report-formatter.js";
import { analyze, maxCrap } from "../src/crap-analyzer.js";
import { parseIstanbulCoverage, coveragePercent } from "../src/coverage-parser.js";
import { findAllSourceFilesUnderSrc, isSourceFile } from "../src/source-file-finder.js";
import type { FunctionMetrics } from "../src/types.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "crap4ts-"));
  tempDirs.push(dir);
  return dir;
}

describe("formatReport", () => {
  it("formats exact report with scores and N/A values", () => {
    const scored: FunctionMetrics = {
      functionName: "foo",
      containerName: "Sample",
      filePath: "/x/Sample.ts",
      complexity: 3,
      coveragePercent: 85.0,
      crapScore: 4.5,
      kind: "function",
    };
    const unknown: FunctionMetrics = {
      functionName: "bar",
      containerName: "Sample",
      filePath: "/x/Sample.ts",
      complexity: 2,
      coveragePercent: null,
      crapScore: null,
      kind: "function",
    };

    const report = formatReport([scored, unknown]);
    expect(report).toContain("CRAP Report");
    expect(report).toContain("foo");
    expect(report).toContain("85.0%");
    expect(report).toContain("4.5");
    expect(report).toContain("N/A");
    expect(report.indexOf("foo")).toBeLessThan(report.indexOf("bar"));
  });

  it("sorts scored entries ahead of N/A and higher scores first", () => {
    const lower: FunctionMetrics = {
      functionName: "low",
      containerName: "Sample",
      filePath: "/x",
      complexity: 2,
      coveragePercent: 100,
      crapScore: 2,
      kind: "function",
    };
    const unknown: FunctionMetrics = {
      functionName: "unknown",
      containerName: "Sample",
      filePath: "/x",
      complexity: 2,
      coveragePercent: null,
      crapScore: null,
      kind: "function",
    };
    const higher: FunctionMetrics = {
      functionName: "high",
      containerName: "Sample",
      filePath: "/x",
      complexity: 5,
      coveragePercent: 10,
      crapScore: 9,
      kind: "function",
    };
    const report = formatReport([lower, unknown, higher]);
    expect(report.indexOf("high")).toBeLessThan(report.indexOf("low"));
    expect(report.indexOf("low")).toBeLessThan(report.indexOf("unknown"));
  });
});

describe("source discovery", () => {
  it("finds ts/tsx/js/jsx under src and skips declaration files", () => {
    const root = tempDir();
    mkdirSync(join(root, "src/components"), { recursive: true });
    writeFileSync(join(root, "src/a.ts"), "export const a = 1;");
    writeFileSync(join(root, "src/components/B.tsx"), "export const B = () => <div/>;");
    writeFileSync(join(root, "src/c.js"), "export const c = 1;");
    writeFileSync(join(root, "src/d.jsx"), "export const D = () => <div/>;");
    writeFileSync(join(root, "src/types.d.ts"), "export type T = string;");

    const files = findAllSourceFilesUnderSrc(root);
    expect(files.every(isSourceFile)).toBe(true);
    expect(files.some((f) => f.endsWith("types.d.ts"))).toBe(false);
    expect(files).toHaveLength(4);
  });
});

describe("coverage parsing and analysis", () => {
  it("parses istanbul coverage and computes CRAP for a function", () => {
    const root = tempDir();
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "coverage"), { recursive: true });
    const file = join(root, "src/sample.ts");
    writeFileSync(
      file,
      `export function alpha(a: boolean, b: boolean): number {
  if (a && b) {
    return 1;
  }
  return 0;
}
`,
    );

    const coverage = {
      [file]: {
        path: file,
        statementMap: {
          "0": { start: { line: 2, column: 2 }, end: { line: 4, column: 3 } },
          "1": { start: { line: 3, column: 4 }, end: { line: 3, column: 12 } },
          "2": { start: { line: 5, column: 2 }, end: { line: 5, column: 10 } },
        },
        s: { "0": 1, "1": 1, "2": 0 },
        fnMap: {
          "0": {
            name: "alpha",
            decl: { start: { line: 1, column: 16 }, end: { line: 1, column: 21 } },
            loc: { start: { line: 1, column: 0 }, end: { line: 6, column: 1 } },
          },
        },
        f: { "0": 1 },
      },
    };
    writeFileSync(join(root, "coverage/coverage-final.json"), JSON.stringify(coverage));

    const map = parseIstanbulCoverage(join(root, "coverage/coverage-final.json"));
    expect(map.size).toBeGreaterThan(0);

    const metrics = analyze(root, [file], join(root, "coverage"));
    expect(metrics).toHaveLength(1);
    expect(metrics[0]?.functionName).toBe("alpha");
    expect(metrics[0]?.complexity).toBe(3);
    expect(metrics[0]?.coveragePercent).not.toBeNull();
    expect(metrics[0]?.crapScore).not.toBeNull();
    expect(maxCrap(metrics)).toBeGreaterThan(0);
    expect(coveragePercent({ covered: 2, total: 3 })).toBeCloseTo(66.666, 2);
  });

  it("reports N/A when coverage is missing", () => {
    const root = tempDir();
    mkdirSync(join(root, "src"), { recursive: true });
    const file = join(root, "src/sample.ts");
    writeFileSync(file, `export function alpha() { return 1; }\n`);
    const metrics = analyze(root, [file], join(root, "coverage"));
    expect(metrics[0]?.coveragePercent).toBeNull();
    expect(metrics[0]?.crapScore).toBeNull();
    expect(maxCrap(metrics)).toBe(0);
  });
});
