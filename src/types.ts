export type CliMode = "help" | "all-src" | "changed-src" | "explicit-files";

export interface CliArguments {
  mode: CliMode;
  fileArgs: string[];
  useExistingCoverage: boolean;
}

export interface FunctionDescriptor {
  name: string;
  containerName: string;
  startLine: number;
  endLine: number;
  complexity: number;
  kind: "function" | "method" | "component";
}

export interface CoverageData {
  covered: number;
  total: number;
}

export interface FunctionMetrics {
  functionName: string;
  containerName: string;
  filePath: string;
  complexity: number;
  coveragePercent: number | null;
  crapScore: number | null;
  kind: "function" | "method" | "component";
}

export interface CommandExecutor {
  run(command: string[], directory: string): Promise<number>;
}
