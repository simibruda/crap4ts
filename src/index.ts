export { calculateCrap } from "./crap-score.js";
export { analyze, maxCrap, CRAP_THRESHOLD, lookupCoverage } from "./crap-analyzer.js";
export { parseFunctions, countComplexity } from "./ts-function-parser.js";
export { formatReport } from "./report-formatter.js";
export { parseCliArguments, usage } from "./cli-arguments.js";
export { run } from "./cli.js";
export type {
  FunctionDescriptor,
  FunctionMetrics,
  CoverageData,
  CliArguments,
  CliMode,
} from "./types.js";
