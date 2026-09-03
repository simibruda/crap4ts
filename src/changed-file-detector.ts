import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { isSourceFile, isUnderSrc } from "./source-file-finder.js";

export async function changedSourceFiles(projectRoot: string): Promise<string[]> {
  const output = await gitStatus(projectRoot);
  const files: string[] = [];
  for (const line of output.split(/\r?\n/)) {
    const file = parseStatusLine(projectRoot, line);
    if (file != null) {
      files.push(file);
    }
  }
  return files.sort();
}

export async function changedSourceFilesUnderSrc(projectRoot: string): Promise<string[]> {
  const files = await changedSourceFiles(projectRoot);
  return files.filter((file) => isUnderSrc(projectRoot, file));
}

export function isCandidateLine(line: string | null | undefined): boolean {
  if (line == null || line.trim() === "") {
    return false;
  }
  return line.length >= 4;
}

export function renameTarget(pathPart: string): string {
  const index = pathPart.indexOf(" -> ");
  if (index < 0) {
    return pathPart;
  }
  return pathPart.slice(index + 4);
}

function parseStatusLine(root: string, line: string): string | null {
  if (!isCandidateLine(line)) {
    return null;
  }
  const pathPart = line.slice(3).trim();
  const finalPath = renameTarget(pathPart);
  if (!isSourceFile(finalPath)) {
    return null;
  }
  return resolve(root, finalPath);
}

function gitStatus(projectRoot: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("git", ["-C", projectRoot, "status", "--porcelain"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`git status failed: ${stderr || stdout}`));
        return;
      }
      resolvePromise(stdout);
    });
  });
}
