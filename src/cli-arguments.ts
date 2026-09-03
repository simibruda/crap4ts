import type { CliArguments, CliMode } from "./types.js";

export function parseCliArguments(args: string[]): CliArguments {
  if (args.includes("--help") || args.includes("-h")) {
    return { mode: "help", fileArgs: [], useExistingCoverage: false };
  }

  const useExistingCoverage = args.includes("--use-existing-coverage");
  const changed = args.includes("--changed");
  const values = args.filter((arg) => !arg.startsWith("--"));

  if (changed && values.length > 0) {
    throw new Error("--changed cannot be combined with file arguments");
  }

  if (changed) {
    return { mode: "changed-src", fileArgs: [], useExistingCoverage };
  }

  if (values.length === 0) {
    return { mode: "all-src", fileArgs: [], useExistingCoverage };
  }

  return {
    mode: "explicit-files" satisfies CliMode,
    fileArgs: values,
    useExistingCoverage,
  };
}

export function usage(): string {
  return `Usage:
  crap4ts                         Analyze all TS/JS/TSX/JSX files under src/
  crap4ts --changed               Analyze changed source files under src/
  crap4ts <path...>               Analyze files, or for directory args analyze <dir>/src/**
  crap4ts --use-existing-coverage Reuse coverage/ instead of regenerating
  crap4ts --help                  Print this help message
`;
}
