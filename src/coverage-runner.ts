import { existsSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CommandExecutor } from "./types.js";

export class CoverageRunner {
  constructor(private readonly executor: CommandExecutor) {}

  async generateCoverage(projectRoot: string): Promise<void> {
    const coverageDir = join(projectRoot, "coverage");
    if (existsSync(coverageDir)) {
      rmSync(coverageDir, { recursive: true, force: true });
    }

    const command = resolveCoverageCommand(projectRoot);
    const exit = await this.executor.run(command, projectRoot);
    if (exit !== 0) {
      throw new Error(`Coverage command failed with exit ${exit}: ${command.join(" ")}`);
    }
  }
}

export function resolveCoverageCommand(projectRoot: string): string[] {
  const packageJsonPath = join(projectRoot, "package.json");
  if (existsSync(packageJsonPath)) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    if (pkg.scripts?.["crap:coverage"]) {
      return ["npm", "run", "crap:coverage", "--silent"];
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.vitest) {
      return [
        "npx",
        "vitest",
        "run",
        "--coverage",
        "--coverage.reporter=json",
        "--coverage.reporter=lcov",
      ];
    }
    if (deps.jest || deps["@jest/core"]) {
      return ["npx", "jest", "--coverage", "--coverageReporters=json", "--coverageReporters=lcov"];
    }
    if (pkg.scripts?.test) {
      return ["npm", "test", "--", "--coverage"];
    }
  }
  return ["npm", "test", "--", "--coverage"];
}

export class ProcessCommandExecutor implements CommandExecutor {
  async run(command: string[], directory: string): Promise<number> {
    const { spawn } = await import("node:child_process");
    return new Promise((resolve, reject) => {
      const child = spawn(command[0]!, command.slice(1), {
        cwd: directory,
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      child.on("error", reject);
      child.on("close", (code) => resolve(code ?? 1));
    });
  }
}
