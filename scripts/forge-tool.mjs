#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  applyDesignPatch,
  commitStagedChange,
  getRevisionArtifacts,
  getWorkspaceSummary,
  proposeDesignChange,
  regenerateRevision,
  rejectStagedChange,
  revertRevision,
  searchComponentLibrary,
  stageDesignPatch,
  validateDesign
} from "../src/core/forge_actions.mjs";
import { submitProductPlanReview, hydrateProductPlanFromWorkspace } from "../src/core/product_plan.mjs";

const COMMANDS = {
  summary: runSummary,
  "search-component": runSearchComponent,
  propose: runPropose,
  stage: runStage,
  commit: runCommit,
  apply: runApply,
  validate: runValidate,
  generate: runGenerate,
  revert: runRevert,
  artifacts: runArtifacts,
  review: runReview,
  reject: runReject
};

main().catch((error) => {
  writeJson({
    ok: false,
    error: {
      code: "FORGE_TOOL_FAILED",
      message: error instanceof Error ? error.message : "forge-tool failed"
    }
  }, 1);
});

async function main() {
  const { command, options } = parseCli(process.argv.slice(2));
  if (!command || command === "help" || command === "--help" || command === "-h") {
    writeJson({
      ok: true,
      usage: "forge-tool <summary|search-component|propose|stage|commit|apply|validate|generate|revert|artifacts|review|reject> [--key value]",
      note: "Run from a Forge project workspace or pass --workspaceId."
    });
    return;
  }
  const handler = COMMANDS[command];
  if (!handler) {
    writeJson({
      ok: false,
      error: {
        code: "UNKNOWN_COMMAND",
        message: `Unknown forge-tool command: ${command}`
      }
    }, 1);
    return;
  }

  const workspace = resolveWorkspace(options);
  if (!workspace.workspaceId) {
    writeJson({
      ok: false,
      error: {
        code: "WORKSPACE_NOT_FOUND",
        message: "Run inside a Forge project workspace or pass --workspaceId."
      }
    }, 1);
    return;
  }
  if (workspace.rootDir) process.env.FORGE_WORKSPACE_ROOT = workspace.rootDir;
  const plan = hydrateProductPlanFromWorkspace({
    planId: workspace.workspaceId,
    rootDir: workspace.rootDir
  });
  if (!plan) {
    writeJson({
      ok: false,
      workspaceId: workspace.workspaceId,
      error: {
        code: "RUNTIME_PLAN_NOT_FOUND",
        message: `Could not restore Forge runtime plan for ${workspace.workspaceId}.`
      }
    }, 1);
    return;
  }

  const result = await handler({
    workspaceId: workspace.workspaceId,
    options
  });
  writeJson({
    command,
    workspaceId: workspace.workspaceId,
    ...result
  }, result?.ok === false ? 1 : 0);
}

function runSummary({ workspaceId }) {
  return getWorkspaceSummary({ workspaceId });
}

function runSearchComponent({ options }) {
  return searchComponentLibrary({
    query: options.query || "",
    componentType: options.componentType || options.type || "",
    limit: numberOption(options.limit, 10)
  });
}

function runPropose({ workspaceId, options }) {
  return proposeDesignChange({
    workspaceId,
    message: required(options.message, "message")
  });
}

function runStage({ workspaceId, options }) {
  return stageDesignPatch({
    workspaceId,
    patches: parsePatches(options),
    summary: options.summary || options.message || ""
  });
}

function runCommit({ workspaceId, options }) {
  return commitStagedChange({
    workspaceId,
    proposalId: required(options.proposalId || options.proposal, "proposalId")
  });
}

function runApply({ workspaceId, options }) {
  return applyDesignPatch({
    workspaceId,
    message: options.message || "",
    patches: parsePatches(options)
  });
}

function runValidate({ workspaceId, options }) {
  return validateDesign({
    workspaceId,
    proposalId: options.proposalId || options.proposal || "",
    patches: options.patches || options.patchesFile || options.patchFile ? parsePatches(options) : null,
    mode: options.mode || "current_or_proposal"
  });
}

function runGenerate({ workspaceId, options }) {
  return regenerateRevision({
    workspaceId,
    revisionId: options.revisionId || options.revision || "",
    reason: options.reason || "user_confirmed_model_generation"
  });
}

function runRevert({ workspaceId, options }) {
  return revertRevision({
    workspaceId,
    revisionId: required(options.revisionId || options.revision, "revisionId")
  });
}

function runArtifacts({ workspaceId, options }) {
  return getRevisionArtifacts({
    workspaceId,
    revisionId: options.revisionId || options.revision || ""
  });
}

async function runReview({ workspaceId, options }) {
  return submitProductPlanReview({
    planId: workspaceId,
    revisionId: options.revisionId || options.revision || "",
    contactInfo: {
      name: options.name || "",
      email: options.email || ""
    }
  });
}

function runReject({ workspaceId, options }) {
  return rejectStagedChange({
    workspaceId,
    proposalId: required(options.proposalId || options.proposal, "proposalId"),
    reason: options.reason || ""
  });
}

function parseCli(args) {
  const [command, ...rest] = args;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) continue;
    const key = normalizeKey(token.slice(2));
    const next = rest[index + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options };
}

function normalizeKey(key) {
  const aliases = {
    "workspace-id": "workspaceId",
    "proposal-id": "proposalId",
    "revision-id": "revisionId",
    "patches-file": "patchesFile",
    "patch-file": "patchesFile",
    "component-type": "componentType"
  };
  return aliases[key] || key;
}

function resolveWorkspace(options = {}) {
  const explicit = options.workspaceId || process.env.FORGE_WORKSPACE_ID || "";
  if (explicit) {
    return {
      workspaceId: explicit,
      rootDir: process.env.FORGE_WORKSPACE_ROOT || ""
    };
  }
  let current = resolve(process.cwd());
  while (current && current !== dirname(current)) {
    const manifestPath = join(current, "project_manifest.json");
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      return {
        workspaceId: manifest.workspaceId || manifest.projectId || "",
        rootDir: dirname(current),
        workspacePath: current
      };
    }
    current = dirname(current);
  }
  return { workspaceId: "", rootDir: "" };
}

function parsePatches(options = {}) {
  const raw = options.patches || options.patch || "";
  const filePath = options.patchesFile || "";
  if (filePath) return JSON.parse(readFileSync(resolve(filePath), "utf8"));
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [parsed];
}

function required(value, name) {
  const text = String(value || "").trim();
  if (!text) {
    const error = new Error(`Missing required option --${name}.`);
    error.code = "MISSING_OPTION";
    throw error;
  }
  return text;
}

function numberOption(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function writeJson(payload, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = exitCode;
}
