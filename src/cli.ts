#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { CliApplication } from "./cli-application.js";
import { CoverageRunner, ProcessCommandExecutor } from "./coverage-runner.js";

export async function run(
  args: string[],
  projectRoot = resolve("."),
  out: NodeJS.WritableStream = process.stdout,
  err: NodeJS.WritableStream = process.stderr,
  coverageRunner = new CoverageRunner(new ProcessCommandExecutor()),
): Promise<number> {
  return new CliApplication(projectRoot, out, err, coverageRunner).execute(args);
}

async function main(): Promise<void> {
  try {
    const code = await run(process.argv.slice(2));
    process.exitCode = code;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  void main();
}
