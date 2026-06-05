import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { projectWorkspacePath, readWorkspaceEvents } from "./project_workspace.mjs";

export const GUARDED_FILE_PATTERNS = [
  "project_manifest.json",
  "product_plan.json",
  "runtime_plan.json",
  "events.jsonl",
  "proposals/*.json",
  "revisions/*/revision_manifest.json",
  "revisions/*/product_plan.json",
  "revisions/*/geometry-spec.json",
  "revisions/*/component_descriptors.json",
  "revisions/*/artifacts/*"
];

const TOOL_EVENT_TYPES = new Set([
  "tool_call",
  "tool_result",
  "tool_failed",
  "proposal_created",
  "proposal_staged",
  "proposal_committed",
  "proposal_rejected",
  "revision_created",
  "revision_reverted",
  "validation_completed",
  "artifacts_generated",
  "review_submitted",
  "review_submission_failed"
]);

export function snapshotGuardedFiles({
  workspaceId,
  rootDir
} = {}) {
  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  const files = {};
  if (!workspaceId || !existsSync(workspacePath)) {
    return { workspaceId, workspacePath, files };
  }
  for (const absolutePath of walk(workspacePath)) {
    const relativePath = normalizePath(relative(workspacePath, absolutePath));
    if (!isGuardedPath(relativePath)) continue;
    const stats = statSync(absolutePath);
    files[relativePath] = {
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      hash: fileHash(absolutePath)
    };
  }
  return { workspaceId, workspacePath, files };
}

export function detectGuardViolations({
  workspaceId,
  rootDir,
  before,
  beforeEventCount = 0
} = {}) {
  const after = snapshotGuardedFiles({ workspaceId, rootDir });
  const changedPaths = changedGuardedPaths(before?.files || {}, after.files || {});
  if (changedPaths.length === 0) return [];
  const events = readWorkspaceEvents({ workspaceId, rootDir });
  const newEvents = events.slice(beforeEventCount);
  const hasToolEvent = newEvents.some((event) => TOOL_EVENT_TYPES.has(event.type));
  if (hasToolEvent) return [];
  return changedPaths.map((path) => ({
    code: "GUARD_VIOLATION",
    path,
    message: `Guarded file changed without a corresponding Forge tool event: ${path}`
  }));
}

export function guardedEventCount({ workspaceId, rootDir } = {}) {
  return readWorkspaceEvents({ workspaceId, rootDir }).length;
}

export function isGuardedPath(path = "") {
  const normalized = normalizePath(path);
  return GUARDED_FILE_PATTERNS.some((pattern) => guardedPatternRegex(pattern).test(normalized));
}

function changedGuardedPaths(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed = [];
  for (const key of keys) {
    const previous = before[key];
    const current = after[key];
    if (!previous || !current || previous.hash !== current.hash || previous.size !== current.size) {
      changed.push(key);
    }
  }
  return changed.sort();
}

function walk(dir) {
  const output = [];
  if (!existsSync(dir)) return output;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walk(absolutePath));
    } else if (entry.isFile()) {
      output.push(absolutePath);
    }
  }
  return output;
}

function fileHash(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function guardedPatternRegex(pattern) {
  const escaped = normalizePath(pattern)
    .split("*")
    .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&"))
    .join("[^/]+");
  return new RegExp(`^${escaped}$`);
}

function normalizePath(path) {
  return String(path || "").replaceAll("\\", "/");
}
