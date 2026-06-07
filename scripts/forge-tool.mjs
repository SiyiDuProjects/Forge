#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { hydrateProductPlanFromWorkspace } from "../src/core/product_plan.mjs";
import { projectWorkspacePath } from "../src/core/project_workspace.mjs";
import { executeForgeToolWithPolicy } from "../src/core/tool_executor.mjs";

const COMMANDS = {
  summary: runSummary,
  "search-component": runSearchComponent,
  "component-package": runComponentPackage,
  "descriptor-draft": runDescriptorDraft,
  "descriptor-drafts": runDescriptorDrafts,
  "descriptor-scaffold": runDescriptorScaffold,
  "descriptor-specs": runDescriptorSpecs,
  "descriptor-promote": runDescriptorPromote,
  "descriptor-select": runDescriptorSelect,
  "descriptor-retire": runDescriptorRetire,
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
      usage: "forge-tool <summary|search-component|component-package|descriptor-draft|descriptor-drafts|descriptor-scaffold|descriptor-specs|descriptor-promote|descriptor-select|descriptor-retire|propose|stage|commit|apply|validate|generate|revert|artifacts|review|reject> [--key value]",
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
    workspace,
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
  return runTool({ workspaceId, toolName: "getWorkspaceSummary" });
}

function runSearchComponent({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "searchComponentLibrary",
    input: {
      query: options.query || "",
      componentType: options.componentType || options.type || "",
      limit: numberOption(options.limit, 10)
    }
  });
}

function runComponentPackage({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "inspectComponentPackage",
    input: {
      componentId: required(options.componentId || options.component || options.id, "componentId")
    }
  });
}

function runDescriptorDraft({ workspaceId, options }) {
  const descriptorFile = required(options.descriptorFile || options.file, "descriptorFile");
  const sourcesFile = options.sourcesFile || options.sources || "";
  return runTool({
    workspaceId,
    toolName: "inspectComponentDescriptorDraft",
    input: {
      descriptorJson: readFileSync(resolve(descriptorFile), "utf8"),
      expectedId: options.expectedId || options.id || "",
      sourcesText: sourcesFile ? readFileSync(resolve(sourcesFile), "utf8") : ""
    }
  });
}

function runDescriptorDrafts({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "inspectWorkspaceComponentDescriptorDrafts",
    input: {
      draftId: options.draftId || options.id || "",
      limit: numberOption(options.limit, 20)
    }
  });
}

function runDescriptorScaffold({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "scaffoldWorkspaceComponentDescriptorDraft",
    input: {
      draftId: required(options.draftId || options.id, "draftId"),
      componentType: required(options.componentType || options.type, "componentType"),
      displayName: options.displayName || options.name || "",
      overwrite: Boolean(options.overwrite)
    },
    userMessage: "scaffold workspace descriptor draft",
    mode: "confirmed"
  });
}

function runDescriptorSpecs({ workspace, workspaceId, options }) {
  const specsFile = options.specsFile || options.file || "";
  const specsInput = readDescriptorSpecsInput({
    workspace,
    specsFile,
    specsText: options.specsText || options.specs || ""
  });
  return runTool({
    workspaceId,
    toolName: "applyWorkspaceDescriptorDraftSpecs",
    input: {
      draftId: required(options.draftId || options.id, "draftId"),
      specsText: required(specsInput.specsText, "specsText"),
      specsSourcePath: specsInput.specsSourcePath,
      baseComponentId: options.baseComponentId || options.base || "",
      markReviewable: Boolean(options.markReviewable || options.reviewable)
    },
    userMessage: "apply workspace descriptor draft specs",
    mode: "confirmed"
  });
}

function runDescriptorPromote({ workspaceId, options }) {
  if (options.draftId) {
    return runTool({
      workspaceId,
      toolName: "promoteWorkspaceComponentDescriptorDraft",
      input: {
        draftId: options.draftId,
        replaceExisting: Boolean(options.replaceExisting)
      },
      userMessage: "promote workspace descriptor draft",
      mode: "confirmed"
    });
  }
  const descriptorFile = required(options.descriptorFile || options.file, "descriptorFile");
  const sourcesFile = options.sourcesFile || options.sources || "";
  return runTool({
    workspaceId,
    toolName: "promoteComponentDescriptorDraft",
    input: {
      descriptorJson: readFileSync(resolve(descriptorFile), "utf8"),
      expectedId: options.expectedId || options.id || "",
      sourcesText: sourcesFile ? readFileSync(resolve(sourcesFile), "utf8") : "",
      replaceExisting: Boolean(options.replaceExisting)
    },
    userMessage: "promote descriptor draft",
    mode: "confirmed"
  });
}

function runDescriptorSelect({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "selectComponentDescriptor",
    input: {
      componentId: required(options.componentId || options.component || options.id, "componentId"),
      quantity: numberOption(options.quantity, 1),
      message: options.message || ""
    },
    userMessage: options.message || "select component descriptor",
    mode: "confirmed"
  });
}

function runDescriptorRetire({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "retirePromotedComponentDescriptor",
    input: {
      componentId: required(options.componentId || options.component || options.id, "componentId"),
      reason: options.reason || "",
      clearPreference: options.clearPreference !== "false"
    },
    userMessage: options.reason || "retire promoted descriptor",
    mode: "confirmed"
  });
}

function runPropose({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "proposeDesignChange",
    input: {
      message: required(options.message, "message")
    },
    userMessage: options.message || ""
  });
}

function runStage({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "stageDesignPatch",
    input: {
      patches: parsePatches(options),
      summary: options.summary || options.message || ""
    },
    userMessage: options.summary || options.message || ""
  });
}

function runCommit({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "commitStagedChange",
    input: {
      proposalId: required(options.proposalId || options.proposal, "proposalId")
    },
    userMessage: "confirm commit staged change",
    mode: "confirmed"
  });
}

function runApply({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "applyDesignPatch",
    input: {
      message: options.message || "",
      patches: parsePatches(options)
    },
    userMessage: options.message || "apply design patch",
    mode: "confirmed"
  });
}

function runValidate({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "validateDesign",
    input: {
      proposalId: options.proposalId || options.proposal || "",
      patches: options.patches || options.patchesFile || options.patchFile ? parsePatches(options) : null,
      mode: options.mode || "current_or_proposal"
    },
    userMessage: "validate design"
  });
}

function runGenerate({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "regenerateRevision",
    input: {
      revisionId: options.revisionId || options.revision || "",
      reason: options.reason || "user_confirmed_model_generation"
    },
    userMessage: options.reason || "generate model artifacts",
    mode: "confirmed"
  });
}

function runRevert({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "revertRevision",
    input: {
      revisionId: required(options.revisionId || options.revision, "revisionId")
    },
    userMessage: "revert revision",
    mode: "confirmed"
  });
}

function runArtifacts({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "getRevisionArtifacts",
    input: {
      revisionId: options.revisionId || options.revision || ""
    }
  });
}

async function runReview({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "submitReviewPacket",
    input: {
      revisionId: options.revisionId || options.revision || "",
      contactInfo: {
        name: options.name || "",
        email: options.email || ""
      }
    },
    userMessage: "submit review packet",
    mode: "confirmed"
  });
}

function runReject({ workspaceId, options }) {
  return runTool({
    workspaceId,
    toolName: "rejectStagedChange",
    input: {
      proposalId: required(options.proposalId || options.proposal, "proposalId"),
      reason: options.reason || ""
    },
    userMessage: options.reason || "reject staged change"
  });
}

async function runTool({
  workspaceId,
  toolName,
  input = {},
  userMessage = "",
  mode = "normal"
} = {}) {
  const execution = await executeForgeToolWithPolicy({
    workspaceId,
    toolCall: {
      name: toolName,
      input: {
        workspaceId,
        ...(input || {})
      }
    },
    userMessage,
    mode,
    confirmation: mode === "confirmed" ? { approved: true } : null
  });
  const result = execution.result || {
    ok: false,
    error: {
      code: "FORGE_TOOL_EXECUTION_FAILED",
      message: "Forge tool execution did not return a result."
    }
  };
  return compactCliToolResult({
    toolName,
    result,
    resultSummary: execution.summary
  });
}

function compactCliToolResult({
  toolName = "",
  result = {},
  resultSummary = null
} = {}) {
  if (!result || result.ok === false) return result;
  if (toolName === "getWorkspaceSummary" || toolName === "searchComponentLibrary" || toolName === "inspectComponentPackage" || toolName === "inspectComponentDescriptorDraft" || toolName === "inspectWorkspaceComponentDescriptorDrafts" || toolName === "getRevisionArtifacts") {
    return omitLargeState(result);
  }

  const compact = {
    ok: true
  };
  copyPresent(compact, result, [
    "proposalId",
    "status",
    "newRevisionId",
    "revisionId",
    "sourceRevisionId",
    "currentRevisionId",
    "committed",
    "applied",
    "regenerated",
    "reverted",
    "rejected",
    "submitted",
    "selected",
    "promoted",
    "retired",
    "scaffolded",
    "specsApplied",
    "draftId",
    "draftCount",
    "readyForPromotionCount",
    "reviewId",
    "requiresConfirmation",
    "canCommit",
    "summary",
    "componentId",
    "componentType",
    "quantity",
    "packageStatus",
    "readyForSelection",
    "readyForReviewableGeneration",
    "readyForLibraryPromotion",
    "componentPreferencePath",
    "packagePath",
    "descriptorPath",
    "sourcesPath",
    "specsSourcePath",
    "overwritten",
    "previousStatus",
    "clearedComponentPreference",
    "directGeometryMutationAllowed",
    "rawArtifactMutationAllowed"
  ]);
  if (Array.isArray(result.authoringChecklist)) compact.authoringChecklist = result.authoringChecklist;
  if (Array.isArray(result.extractedFields)) compact.extractedFields = result.extractedFields;
  if (Array.isArray(result.blockingIssues)) compact.blockingIssues = result.blockingIssues;
  if (Array.isArray(result.reviewWarnings)) compact.reviewWarnings = result.reviewWarnings;
  if (result.draftReport) compact.draftReport = result.draftReport;
  if (result.packageReport) compact.packageReport = result.packageReport;
  if (Array.isArray(result.results)) compact.results = result.results;
  if (Array.isArray(result.warnings)) compact.warnings = result.warnings;
  if (Array.isArray(result.errors)) compact.errors = result.errors;
  if (result.diff) compact.diff = result.diff;
  if (result.validationReport) compact.validationReport = result.validationReport;
  if (result.geometryValidation) compact.geometryValidation = result.geometryValidation;
  if (result.validationPreview) compact.validationPreview = result.validationPreview;
  if (result.expectedEffects) compact.expectedEffects = result.expectedEffects;
  if (result.expectedWarnings) compact.expectedWarnings = result.expectedWarnings;
  if (result.artifactPaths) compact.artifactPaths = result.artifactPaths;
  if (result.artifactStatus) compact.artifactStatus = result.artifactStatus;
  if (result.libraryStatus) compact.libraryStatus = result.libraryStatus;
  if (result.replacement) compact.replacement = result.replacement;
  if (result.submission) compact.submission = result.submission;
  if (resultSummary) compact.resultSummary = resultSummary;
  return compact;
}

function omitLargeState(result = {}) {
  const compact = { ...result };
  delete compact.productPlan;
  delete compact.revision;
  return compact;
}

function copyPresent(target, source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined) target[key] = source[key];
  }
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
    "component-type": "componentType",
    "descriptor-file": "descriptorFile",
    "sources-file": "sourcesFile",
    "specs-file": "specsFile",
    "specs-text": "specsText",
    "expected-id": "expectedId",
    "draft-id": "draftId",
    "display-name": "displayName",
    "base-component-id": "baseComponentId",
    "mark-reviewable": "markReviewable",
    "replace-existing": "replaceExisting"
  };
  return aliases[key] || key;
}

function readDescriptorSpecsInput({
  workspace = {},
  specsFile = "",
  specsText = ""
} = {}) {
  if (!specsFile) {
    return {
      specsText,
      specsSourcePath: ""
    };
  }
  const absoluteSpecsPath = resolve(specsFile);
  const workspacePath = workspace.workspacePath || projectWorkspacePath(workspace.workspaceId, {
    rootDir: workspace.rootDir || undefined
  });
  const specsSourcePath = workspaceRelativePath({
    workspacePath,
    absolutePath: absoluteSpecsPath
  });
  if (!specsSourcePath) {
    const error = new Error("--specs-file must point to a file inside the Forge project workspace.");
    error.code = "SPECS_FILE_OUTSIDE_WORKSPACE";
    throw error;
  }
  return {
    specsText: readFileSync(absoluteSpecsPath, "utf8"),
    specsSourcePath
  };
}

function workspaceRelativePath({
  workspacePath = "",
  absolutePath = ""
} = {}) {
  const rel = relative(resolve(workspacePath), resolve(absolutePath)).replace(/\\/g, "/");
  if (!rel || rel === ".." || rel.startsWith("../") || isAbsolute(rel)) return "";
  return rel;
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
