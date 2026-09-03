import { describe, expect, it } from "vitest";
import { countComplexity, parseFunctions } from "../src/ts-function-parser.js";

describe("parseFunctions", () => {
  it("extracts concrete functions with lines and complexity", () => {
    const source = `
export function alpha(a: boolean, b: boolean): number {
  if (a && b) {
    return 1;
  }
  return 0;
}

export function beta(x: number): number {
  switch (x) {
    case 1: return 1;
    case 2: return 2;
    default: return 0;
  }
}
`;
    const methods = parseFunctions("sample.ts", source);
    expect(methods).toEqual([
      {
        name: "alpha",
        containerName: "sample",
        startLine: 2,
        endLine: 7,
        complexity: 3,
        kind: "function",
      },
      {
        name: "beta",
        containerName: "sample",
        startLine: 9,
        endLine: 15,
        complexity: 4,
        kind: "function",
      },
    ]);
  });

  it("parses React function and arrow components", () => {
    const source = `
import React from "react";

export function UserCard({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }
  return <div>{active ? "on" : "off"}</div>;
}

export const Badge = ({ count }: { count: number }) => {
  return <span>{count > 0 && count}</span>;
};
`;
    const methods = parseFunctions("UserCard.tsx", source);
    expect(methods.map((m) => ({ name: m.name, kind: m.kind, complexity: m.complexity }))).toEqual([
      { name: "UserCard", kind: "component", complexity: 3 },
      { name: "Badge", kind: "component", complexity: 2 },
    ]);
  });

  it("parses class component methods and ignores constructors", () => {
    const source = `
import React from "react";

export class Panel extends React.Component<{ open: boolean }> {
  constructor(props: { open: boolean }) {
    super(props);
  }

  render() {
    if (!this.props.open) {
      return null;
    }
    return <div>open</div>;
  }

  toggle(flag: boolean) {
    return flag ? 1 : 0;
  }
}
`;
    const methods = parseFunctions("Panel.tsx", source);
    expect(methods.map((m) => m.name)).toEqual(["render", "toggle"]);
    expect(methods.find((m) => m.name === "render")?.kind).toBe("component");
    expect(methods.find((m) => m.name === "toggle")?.complexity).toBe(2);
  });

  it("ignores nested anonymous callbacks", () => {
    const source = `
export function outer(items: number[]) {
  return items.map((n) => {
    if (n > 0) {
      return n;
    }
    return 0;
  });
}
`;
    const methods = parseFunctions("sample.ts", source);
    expect(methods).toHaveLength(1);
    expect(methods[0]?.name).toBe("outer");
    // map callback is nested and excluded from complexity of outer
    expect(methods[0]?.complexity).toBe(1);
  });

  it("ignores keywords inside comments and strings", () => {
    const source = `
export function stable() {
  const text = "if && || ? case default catch";
  // if && || ? case default catch
  /* if && || ? case default catch */
  return 1;
}
`;
    const methods = parseFunctions("sample.ts", source);
    expect(methods[0]?.complexity).toBe(1);
  });

  it("counts decision nodes from the AST", () => {
    const source = `
export function score(a: boolean, b: boolean, values: number[]) {
  for (let i = 0; i < values.length; i++) {}
  for (const value of values) {}
  while (a) {
    a = false;
  }
  do {
    b = false;
  } while (b);
  if (a && b || values.length > 0) {}
  try {
    return a ? 1 : 0;
  } catch (ex) {
    return 2;
  }
}
`;
    const methods = parseFunctions("sample.ts", source);
    expect(methods[0]?.complexity).toBe(10);
  });

  it("exposes countComplexity for isolated nodes", () => {
    const source = `const x = a ? 1 : 0;`;
    // sanity: module parse still works
    expect(parseFunctions("x.ts", `export function f(a: boolean) { return a ? 1 : 0; }`)[0]?.complexity).toBe(2);
    expect(typeof countComplexity).toBe("function");
    void source;
  });
});
