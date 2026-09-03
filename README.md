# crap4ts

`crap4ts` is a standalone CRAP metric tool for TypeScript, JavaScript, and React projects, modeled after [`crap4java`](https://github.com/unclebob/crap4java) / `crap4clj`.

It combines function/component cyclomatic complexity with Istanbul coverage and reports CRAP scores.
On each run it deletes stale coverage artifacts, runs coverage, then analyzes the selected files.

## Formula

`CRAP = CC^2 * (1 - coverage)^3 + CC`

- `CC` is cyclomatic complexity.
- `coverage` is the covered fraction of statements in the function/component (from Istanbul `coverage-final.json`, with `lcov.info` as fallback).

## What it analyzes

- `.ts`, `.tsx`, `.js`, `.jsx` (and `.mts` / `.cts`) under `src/`
- Named function declarations
- Module-level `const fn = () => {}` / `function` expressions (including React components)
- Class methods (including React class `render` and other methods)
- JSX decision points: `condition && <X/>`, `condition ? <A/> : <B/>`, etc.

Nested anonymous callbacks (for example `items.map(x => ...)`) are ignored, similar to how `crap4java` skips anonymous-class methods.

## Coverage Pipeline

For each package root (`package.json`):

1. Delete `coverage/`
2. Run a coverage command (first match wins):
   - `npm run crap:coverage` if defined
   - `npx vitest run --coverage ...` if `vitest` is installed
   - `npx jest --coverage ...` if `jest` is installed
   - otherwise `npm test -- --coverage`
3. Read `coverage/coverage-final.json` (or `coverage/lcov.info`)
4. Analyze selected source files

Use `--use-existing-coverage` to skip regeneration.

## Install

```bash
npm install -g crap4ts
# or from this repo:
npm install
npm run build
```

## Run

From the project root you want to analyze:

```bash
npx crap4ts
# or
node path/to/crap4ts/dist/cli.js
```

## CLI

```text
--help                  Print usage to stdout
--changed               Analyze changed source files under src/
--use-existing-coverage Reuse coverage/ instead of regenerating
(no args)               Analyze all TS/JS files under src/
<file ...>              Analyze only these files
<directory ...>         Analyze all source files under each directory's src/ subtree
```

Examples:

```bash
crap4ts
crap4ts --changed
crap4ts --use-existing-coverage
crap4ts src/components/Button.tsx
crap4ts packages/app packages/ui
```

## Exit codes

- `0` success, threshold respected
- `1` invalid CLI usage / hard failure
- `2` CRAP threshold exceeded (`> 8.0`)

## Demo React app

A mini React taskboard lives in `examples/taskboard` (~20 source files with UI, hooks, and logic):

```bash
npm run build
cd examples/taskboard
npm install
npm run crap:coverage   # generate Istanbul coverage
npm run crap            # analyze with --use-existing-coverage
```
