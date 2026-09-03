import ts from "typescript";
import type { FunctionDescriptor } from "./types.js";

export function parseFunctions(filePath: string, source: string): FunctionDescriptor[] {
  const scriptKind = scriptKindFor(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );

  const results: FunctionDescriptor[] = [];
  const moduleName = containerNameFromPath(filePath);

  const visit = (
    node: ts.Node,
    containerName: string,
    insideFunction: boolean,
  ): void => {
    if (ts.isFunctionDeclaration(node) && node.body != null) {
      const name = node.name?.text ?? "default";
      results.push(descriptorFor(node, name, containerName, sourceFile, isLikelyComponent(name, node)));
      visitChildren(node, name, true);
      return;
    }

    if (ts.isMethodDeclaration(node) && node.body != null) {
      const name = methodName(node);
      if (name != null && name !== "constructor") {
        results.push(descriptorFor(node, name, containerName, sourceFile, name === "render"));
      }
      visitChildren(node, name ?? containerName, true);
      return;
    }

    if (ts.isClassDeclaration(node)) {
      const className = node.name?.text ?? "AnonymousClass";
      for (const member of node.members) {
        visit(member, className, false);
      }
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || declaration.initializer == null) {
          continue;
        }
        const initializer = declaration.initializer;
        const isFn =
          ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer);
        // Only module/class-level const fn = () => ... units are reported.
        // Nested callbacks stay out of the report, like anonymous Java methods.
        if (isFn && !insideFunction) {
          const name = declaration.name.text;
          results.push(
            descriptorFor(
              initializer,
              name,
              containerName,
              sourceFile,
              isLikelyComponent(name, initializer),
            ),
          );
          visitChildren(initializer, name, true);
        } else if (!isFn) {
          visit(initializer, containerName, insideFunction);
        }
      }
      return;
    }

    // Skip descending into nested arrow/function expressions so anonymous
    // callbacks are not reported; nested function declarations are still
    // reached because they are FunctionDeclaration nodes visited above.
    if (
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node)
    ) {
      return;
    }

    visitChildren(node, containerName, insideFunction);
  };

  const visitChildren = (
    node: ts.Node,
    containerName: string,
    insideFunction: boolean,
  ): void => {
    ts.forEachChild(node, (child) => visit(child, containerName, insideFunction));
  };

  visitChildren(sourceFile, moduleName, false);
  return results;
}

function descriptorFor(
  node: ts.Node,
  name: string,
  containerName: string,
  sourceFile: ts.SourceFile,
  component: boolean,
): FunctionDescriptor {
  const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    name,
    containerName,
    startLine: startLine + 1,
    endLine: endLine + 1,
    complexity: countComplexity(node),
    kind: component ? "component" : ts.isMethodDeclaration(node) ? "method" : "function",
  };
}

export function countComplexity(node: ts.Node): number {
  let complexity = 1;

  const visit = (current: ts.Node): void => {
    // Do not count nested function/method bodies toward the outer unit.
    if (
      current !== node &&
      (ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current) ||
        ts.isMethodDeclaration(current) ||
        ts.isConstructorDeclaration(current) ||
        ts.isGetAccessorDeclaration(current) ||
        ts.isSetAccessorDeclaration(current))
    ) {
      return;
    }

    switch (current.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CatchClause:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.CaseClause:
      case ts.SyntaxKind.DefaultClause:
        complexity++;
        break;
      case ts.SyntaxKind.BinaryExpression: {
        const binary = current as ts.BinaryExpression;
        if (
          binary.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
          binary.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          binary.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
          complexity++;
        }
        break;
      }
      default:
        break;
    }

    ts.forEachChild(current, visit);
  };

  // Count only inside the body when present.
  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)) &&
    node.body != null
  ) {
    visit(node.body);
  } else {
    visit(node);
  }

  return complexity;
}

function isLikelyComponent(name: string, node: ts.Node): boolean {
  if (!/^[A-Z]/.test(name)) {
    return false;
  }
  return containsJsx(node);
}

function containsJsx(node: ts.Node): boolean {
  let found = false;
  const visit = (current: ts.Node): void => {
    if (found) {
      return;
    }
    if (
      ts.isJsxElement(current) ||
      ts.isJsxSelfClosingElement(current) ||
      ts.isJsxFragment(current)
    ) {
      found = true;
      return;
    }
    // Skip nested functions when detecting component JSX of the outer unit.
    if (
      current !== node &&
      (ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current) ||
        ts.isMethodDeclaration(current))
    ) {
      return;
    }
    ts.forEachChild(current, visit);
  };
  visit(node);
  return found;
}

function methodName(node: ts.MethodDeclaration): string | null {
  if (ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) {
    return node.name.text;
  }
  return null;
}

function scriptKindFor(filePath: string): ts.ScriptKind {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".tsx")) {
    return ts.ScriptKind.TSX;
  }
  if (lower.endsWith(".jsx")) {
    return ts.ScriptKind.JSX;
  }
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

export function containerNameFromPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const fileName = normalized.slice(normalized.lastIndexOf("/") + 1);
  return fileName.replace(/\.(tsx|ts|jsx|js|mts|cts)$/i, "");
}
