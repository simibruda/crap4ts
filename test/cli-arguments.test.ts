import { describe, expect, it } from "vitest";
import { parseCliArguments, usage } from "../src/cli-arguments.js";

describe("parseCliArguments", () => {
  it("defaults to all-src with no args", () => {
    expect(parseCliArguments([])).toEqual({
      mode: "all-src",
      fileArgs: [],
      useExistingCoverage: false,
    });
  });

  it("parses --changed", () => {
    expect(parseCliArguments(["--changed"])).toEqual({
      mode: "changed-src",
      fileArgs: [],
      useExistingCoverage: false,
    });
  });

  it("parses explicit files", () => {
    expect(parseCliArguments(["src/a.ts", "src/b.tsx"])).toEqual({
      mode: "explicit-files",
      fileArgs: ["src/a.ts", "src/b.tsx"],
      useExistingCoverage: false,
    });
  });

  it("parses --use-existing-coverage", () => {
    expect(parseCliArguments(["--use-existing-coverage"])).toEqual({
      mode: "all-src",
      fileArgs: [],
      useExistingCoverage: true,
    });
  });

  it("rejects --changed with file args", () => {
    expect(() => parseCliArguments(["--changed", "src/a.ts"])).toThrow(
      "--changed cannot be combined with file arguments",
    );
  });

  it("parses help", () => {
    expect(parseCliArguments(["--help"]).mode).toBe("help");
    expect(usage()).toContain("crap4ts");
  });
});
