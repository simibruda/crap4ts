import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveCoverageCommand } from "../src/coverage-runner.js";
import { packageRootFor } from "../src/cli-application.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveCoverageCommand", () => {
  it("prefers crap:coverage script", () => {
    const root = mkdtempSync(join(tmpdir(), "crap4ts-cov-"));
    tempDirs.push(root);
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ scripts: { "crap:coverage": "vitest --coverage" } }),
    );
    expect(resolveCoverageCommand(root)).toEqual(["npm", "run", "crap:coverage", "--silent"]);
  });

  it("detects vitest", () => {
    const root = mkdtempSync(join(tmpdir(), "crap4ts-cov-"));
    tempDirs.push(root);
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { vitest: "^3.0.0" } }),
    );
    expect(resolveCoverageCommand(root)[1]).toBe("vitest");
  });
});

describe("packageRootFor", () => {
  it("finds nearest package.json walking up", () => {
    const root = mkdtempSync(join(tmpdir(), "crap4ts-pkg-"));
    tempDirs.push(root);
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "demo" }));
    const file = join(root, "src/a.ts");
    writeFileSync(file, "export const a = 1;");
    expect(packageRootFor("/tmp", file)).toBe(root);
  });
});
