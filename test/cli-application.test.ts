import { describe, expect, it, vi } from "vitest";
import { PassThrough } from "node:stream";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach } from "vitest";
import { CliApplication } from "../src/cli-application.js";
import { CoverageRunner } from "../src/coverage-runner.js";
import type { CommandExecutor } from "../src/types.js";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function collect(stream: PassThrough): { text: () => string } {
  let data = "";
  stream.on("data", (chunk) => {
    data += chunk.toString();
  });
  return { text: () => data };
}

describe("CliApplication", () => {
  it("prints help and exits 0", async () => {
    const out = new PassThrough();
    const err = new PassThrough();
    const outText = collect(out);
    const app = new CliApplication(
      process.cwd(),
      out,
      err,
      new CoverageRunner({ run: async () => 0 }),
    );
    const code = await app.execute(["--help"]);
    expect(code).toBe(0);
    expect(outText.text()).toContain("Usage:");
  });

  it("returns 0 when no files found", async () => {
    const root = mkdtempSync(join(tmpdir(), "crap4ts-cli-"));
    tempDirs.push(root);
    const out = new PassThrough();
    const err = new PassThrough();
    const outText = collect(out);
    const executor: CommandExecutor = { run: vi.fn(async () => 0) };
    const app = new CliApplication(root, out, err, new CoverageRunner(executor));
    const code = await app.execute([]);
    expect(code).toBe(0);
    expect(outText.text()).toContain("No TypeScript/JavaScript files");
    expect(executor.run).not.toHaveBeenCalled();
  });

  it("analyzes with existing coverage and fails threshold", async () => {
    const root = mkdtempSync(join(tmpdir(), "crap4ts-cli-"));
    tempDirs.push(root);
    mkdirSync(join(root, "src"), { recursive: true });
    mkdirSync(join(root, "coverage"), { recursive: true });
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "demo" }));
    const file = join(root, "src/risky.ts");
    writeFileSync(
      file,
      `export function risky(a: boolean, b: boolean, c: boolean) {
  if (a) {}
  if (b) {}
  if (c) {}
  if (a && b && c) {}
  return 1;
}
`,
    );
    writeFileSync(
      join(root, "coverage/coverage-final.json"),
      JSON.stringify({
        [file]: {
          path: file,
          statementMap: {
            "0": { start: { line: 2, column: 2 }, end: { line: 2, column: 10 } },
            "1": { start: { line: 3, column: 2 }, end: { line: 3, column: 10 } },
            "2": { start: { line: 4, column: 2 }, end: { line: 4, column: 10 } },
            "3": { start: { line: 5, column: 2 }, end: { line: 5, column: 20 } },
            "4": { start: { line: 6, column: 2 }, end: { line: 6, column: 10 } },
          },
          s: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0 },
          fnMap: {
            "0": {
              name: "risky",
              loc: { start: { line: 1, column: 0 }, end: { line: 7, column: 1 } },
            },
          },
          f: { "0": 0 },
        },
      }),
    );

    const out = new PassThrough();
    const err = new PassThrough();
    const outText = collect(out);
    const errText = collect(err);
    const executor: CommandExecutor = { run: vi.fn(async () => 0) };
    const app = new CliApplication(root, out, err, new CoverageRunner(executor));
    const code = await app.execute(["--use-existing-coverage"]);
    expect(executor.run).not.toHaveBeenCalled();
    expect(outText.text()).toContain("risky");
    expect(code).toBe(2);
    expect(errText.text()).toContain("CRAP threshold exceeded");
  });
});
