import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);

export function isSourceFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".d.ts") || lower.endsWith(".d.mts") || lower.endsWith(".d.cts")) {
    return false;
  }
  const dot = lower.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }
  return SOURCE_EXTENSIONS.has(lower.slice(dot));
}

export function findAllSourceFilesUnderSrc(projectRoot: string): string[] {
  const src = join(projectRoot, "src");
  if (!existsSync(src)) {
    return [];
  }
  return walk(src).filter(isSourceFile).sort();
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry === "node_modules" || entry === "coverage" || entry === "dist") {
      continue;
    }
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...walk(full));
    } else if (stats.isFile()) {
      files.push(full);
    }
  }
  return files;
}

export function isUnderSrc(projectRoot: string, filePath: string): boolean {
  const normalizedRoot = resolve(projectRoot);
  const normalizedFile = resolve(filePath);
  const srcRoot = resolve(normalizedRoot, "src");
  const rel = relative(srcRoot, normalizedFile);
  return rel !== "" && !rel.startsWith("..") && !rel.startsWith("/");
}
