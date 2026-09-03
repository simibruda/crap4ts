# crap4ts Specification

## 1. Purpose

`crap4ts` is a CRAP metric analyzer for TypeScript, JavaScript, and React projects.

It shall:

- locate TS/JS/TSX/JSX source files to analyze
- generate Istanbul-compatible coverage for the owning package of each analyzed file set
- parse functions, methods, and React components and estimate cyclomatic complexity
- combine complexity and coverage into CRAP scores
- print a tabular report sorted by worst score first
- fail when the maximum CRAP score exceeds the configured threshold

`crap4ts` is intended as a project-quality gate rather than a mutation tool.

## 2. Scope

This specification defines:

- the command-line contract
- source file selection rules
- coverage generation behavior
- function/component parsing behavior
- CRAP score computation
- report ordering and exit codes

## 3. Terminology

- `project root`
  The working root from which `crap4ts` is invoked.

- `package root`
  The nearest ancestor directory of an analyzed file that contains `package.json`. If none exists below the project root, the project root is the package root.

- `function metric`
  A single report row consisting of function identity, cyclomatic complexity, coverage, and CRAP score.

- `coverage N/A`
  The state where no coverage report was found for the package and therefore coverage could not be assigned.

## 4. Command-Line Interface

### 4.1 Supported Forms

- `crap4ts`
- `crap4ts --changed`
- `crap4ts --use-existing-coverage`
- `crap4ts <path...>`
- `crap4ts --help`

### 4.2 Mode Semantics

- no arguments
  Analyze all source files under `src/`.

- `--changed`
  Analyze changed source files under `src/`.

- `<path...>`
  For each explicit path:
  - if it is a file, analyze that file
  - if it is a directory, analyze all source files under that directory's `src/` subtree

- `--use-existing-coverage`
  Skip coverage regeneration and read existing `coverage/` artifacts.

- `--help`
  Print usage text and exit successfully.

## 5. File Selection Rules

### 5.1 Default Source Discovery

Analyze files under `<project-root>/src/**` with extensions:

- `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`

Declaration files (`.d.ts`, `.d.mts`, `.d.cts`) shall be excluded.

### 5.2 Changed-File Discovery

In `--changed` mode, invoke `git status --porcelain`, retain modified/added/untracked source files under `src/`, and sort by path.

### 5.3 Empty Selection

If no files are selected:

- print `No TypeScript/JavaScript files to analyze.`
- exit successfully

## 6. Package Grouping

Group selected files by package root before coverage generation.
Coverage generation and lookup occur once per package group.

## 7. Coverage Pipeline

For each package group:

1. delete stale `coverage/` (unless `--use-existing-coverage`)
2. run the resolved coverage command
3. read `coverage/coverage-final.json` or `coverage/lcov.info`
4. analyze selected files

If coverage artifacts are missing after generation, print a warning and report coverage as `N/A`.

## 8. Function and Component Parsing

Parse sources with the TypeScript compiler API (TSX/JSX enabled as needed).

The parser shall identify:

- function declarations with bodies
- module-level variable-bound arrow/function expressions
- concrete class methods (excluding constructors)

React components (PascalCase names that contain JSX, and class `render` methods) shall be tagged as `component` but use the same complexity/coverage rules.

### 8.1 Exclusions

- constructors
- nested anonymous arrow/function callbacks

### 8.2 Complexity Counting

Cyclomatic complexity starts at 1 and increments for:

- `if`
- `for` / `for...in` / `for...of`
- `while` / `do...while`
- `catch`
- conditional expressions (`?:`)
- `case` clauses
- `&&`, `||`, `??`

Nested function bodies shall not contribute to an outer unit's complexity.
Keywords inside comments and strings shall not be counted.

## 9. Coverage Attribution

Match parsed functions to Istanbul function entries by file path, name, and line, with nearest-line and statement-range fallbacks.

If no usable coverage data is available:

- coverage shall be reported as `N/A`
- CRAP score shall be reported as `N/A`

## 10. CRAP Formula

`CRAP = CC^2 * (1 - coverage)^3 + CC`

Where coverage is a fraction `0.0..1.0` derived from statement coverage within the function.

## 11. Report

Print a tabular report with:

- function name
- container name (module or class)
- cyclomatic complexity
- coverage percentage or `N/A`
- CRAP score or `N/A`

Sort by CRAP descending; `N/A` rows last.

## 12. Threshold

The CRAP threshold shall be `8.0`.

If the maximum numeric CRAP value is greater than `8.0`, print a threshold message to stderr and exit with status `2`.

## 13. Exit Codes

- `0` success / empty selection / all scores at or below threshold
- `1` CLI usage error or hard failure
- `2` CRAP threshold exceeded

## 14. Non-Goals

Not required:

- configurable thresholds via CLI
- mutation analysis
- machine-readable report formats beyond the text table
