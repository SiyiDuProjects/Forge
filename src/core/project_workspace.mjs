import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { makeId } from "./utils.mjs";
import { clone } from "./workspace_state.mjs";
import { buildRevisionLedger } from "./revision_ledger.mjs";
import { listToolMetadata } from "./tool_registry.mjs";

export const PROJECT_WORKSPACE_VERSION = "forge_project_workspace_v1";
export const RUNTIME_BINDING_VERSION = "forge_runtime_binding_v1";

const defaultWorkspaceRootUrl = new URL("../../data/workspaces/", import.meta.url);
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

export function defaultProjectWorkspaceRoot() {
  return process.env.FORGE_WORKSPACE_ROOT || fileURLToPath(defaultWorkspaceRootUrl);
}

export function projectWorkspacePath(workspaceId, { rootDir = defaultProjectWorkspaceRoot() } = {}) {
  return join(rootDir, safePathSegment(workspaceId || "unknown_workspace"));
}

export function readProjectManifest({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!workspaceId) return null;
  return readJsonIfExists(join(projectWorkspacePath(workspaceId, { rootDir }), "project_manifest.json"));
}

export function readRuntimePlan({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!workspaceId) return null;
  const manifest = readProjectManifest({ workspaceId, rootDir }) || {};
  return readJsonIfExists(join(projectWorkspacePath(workspaceId, { rootDir }), manifest.runtimePlanPath || "runtime_plan.json"));
}

export function readRevisionLedger({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!workspaceId) return null;
  const manifest = readProjectManifest({ workspaceId, rootDir }) || {};
  return readJsonIfExists(join(projectWorkspacePath(workspaceId, { rootDir }), manifest.revisionLedgerPath || "revision_ledger.json"));
}

export function readRuntimeBinding({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!workspaceId) return null;
  const manifest = readProjectManifest({ workspaceId, rootDir }) || {};
  const productPlan = readRuntimePlanIfReadable({ workspaceId, rootDir });
  return runtimeBindingFromSources({ manifest, productPlan });
}

export function runtimeBindingFromSources({ manifest = {}, productPlan = {} } = {}) {
  const explicit = normalizeRuntimeBinding(manifest?.runtimeBinding || productPlan?.workspaceState?.runtimeBinding || null);
  if (explicit) return explicit;

  const legacyThreadId = manifest?.codexThreadId || productPlan?.workspaceState?.codexThreadId || "";
  if (!legacyThreadId) return null;
  return normalizeRuntimeBinding({
    provider: "codex",
    status: "ready",
    bindingId: legacyThreadId,
    providerState: {
      threadId: legacyThreadId
    },
    migratedFrom: "codexThreadId",
    updatedAt: manifest?.updatedAt || productPlan?.updatedAt || ""
  });
}

export function updateRuntimeBinding({
  workspaceId,
  provider = "",
  status = "",
  bindingId = "",
  providerState = {},
  error = null,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!workspaceId) throw new Error("updateRuntimeBinding requires workspaceId.");
  const previous = readRuntimeBinding({ workspaceId, rootDir }) || {};
  const next = normalizeRuntimeBinding({
    ...previous,
    provider: provider || previous.provider,
    status: status || previous.status,
    bindingId: bindingId || previous.bindingId,
    providerState: {
      ...(previous.providerState || {}),
      ...(providerState || {})
    },
    error,
    updatedAt: new Date().toISOString()
  });
  return updateProjectManifest({
    workspaceId,
    rootDir,
    patch: {
      runtimeBinding: next
    }
  }).runtimeBinding || next;
}

export function readProjectWorkspacePlan({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  return readRuntimePlanIfReadable({ workspaceId, rootDir });
}

export function listProjectWorkspaces({ limit = 12, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!existsSync(rootDir)) return [];
  const numericLimit = Number(limit);
  const resultLimit = Number.isFinite(numericLimit) ? numericLimit : 12;
  const entries = readdirSync(rootDir, { withFileTypes: true });
  const sorted = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => workspaceSummaryFromDir(entry.name, { rootDir, includeProductPlan: false }))
    .filter(Boolean)
    .sort((a, b) => timestampForSort(b) - timestampForSort(a));
  const workspaces = [];
  for (const workspace of sorted) {
    const fullWorkspace = workspaceSummaryFromDir(workspace.workspaceId, { rootDir, includeProductPlan: true });
    if (fullWorkspace?.productPlan?.planId) workspaces.push(fullWorkspace);
    if (resultLimit > 0 && workspaces.length >= resultLimit) break;
  }
  return workspaces;
}

export function updateProjectManifest({ workspaceId, patch = {}, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  if (!workspaceId) throw new Error("updateProjectManifest requires workspaceId.");
  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  ensureWorkspaceDirs(workspacePath);
  const previous = readProjectManifest({ workspaceId, rootDir }) || {
    version: PROJECT_WORKSPACE_VERSION,
    projectId: workspaceId,
    workspaceId
  };
  const runtimeBinding = normalizeRuntimeBinding(patch.runtimeBinding)
    || runtimeBindingFromSources({ manifest: previous });
  const manifest = {
    ...previous,
    ...clone(patch || {}),
    ...(runtimeBinding ? { runtimeBinding } : {}),
    updatedAt: new Date().toISOString()
  };
  delete manifest.codexThreadId;
  writeJson(join(workspacePath, "project_manifest.json"), manifest);
  return manifest;
}

export function ensureProjectWorkspace({ plan, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  const workspaceId = plan?.planId || plan?.workspaceState?.workspaceId;
  if (!workspaceId) throw new Error("ensureProjectWorkspace requires a ProductPlan.");

  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  const manifestPath = join(workspacePath, "project_manifest.json");
  const created = !existsSync(manifestPath);
  ensureWorkspaceDirs(workspacePath);

  const previousManifest = readJsonIfExists(manifestPath) || {};
  const manifest = projectManifestFor(plan, previousManifest);
  scrubLegacyRuntimeFields(plan);
  writeJson(join(workspacePath, "project_manifest.json"), manifest);
  writeJson(join(workspacePath, manifest.runtimePlanPath || "runtime_plan.json"), plan);
  writeJson(join(workspacePath, "product_plan.json"), plan.workspaceState?.productPlan || {});
  writeRevisionLedger({ workspacePath, plan, manifest, rootDir });
  writeMarkdownIndexes({ workspacePath, plan, manifest });

  if (created) {
    appendWorkspaceEvent({
      workspaceId,
      rootDir,
      type: "workspace_created",
      actor: "system",
      payload: {
        title: manifest.title,
        currentRevisionId: manifest.currentRevisionId
      }
    });
  }

  return {
    workspaceId,
    workspacePath,
    manifestPath,
    manifest,
    created
  };
}

export function appendWorkspaceEvent({
  plan = null,
  workspaceId = "",
  type,
  actor = "system",
  payload = {},
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const resolvedWorkspaceId = workspaceId || plan?.planId || plan?.workspaceState?.workspaceId;
  if (!resolvedWorkspaceId) throw new Error("appendWorkspaceEvent requires workspaceId.");
  if (!type) throw new Error("appendWorkspaceEvent requires type.");

  const workspacePath = projectWorkspacePath(resolvedWorkspaceId, { rootDir });
  mkdirSync(workspacePath, { recursive: true });
  const event = {
    eventId: makeId("event"),
    timestamp: new Date().toISOString(),
    workspaceId: resolvedWorkspaceId,
    type,
    actor,
    payload: clone(payload || {})
  };
  appendFileSync(join(workspacePath, "events.jsonl"), `${JSON.stringify(event)}\n`);
  return event;
}

export function persistProjectPlan({ plan, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  return ensureProjectWorkspace({ plan, rootDir });
}

export function persistProposal({
  plan,
  proposal,
  eventType = "proposal_created",
  actor = "assistant",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!plan || !proposal?.proposalId) throw new Error("persistProposal requires plan and proposal.");
  const { workspacePath } = ensureProjectWorkspace({ plan, rootDir });
  writeJson(join(workspacePath, "proposals", `${safePathSegment(proposal.proposalId)}.json`), proposal);
  const event = appendWorkspaceEvent({
    plan,
    rootDir,
    type: eventType,
    actor,
    payload: {
      proposalId: proposal.proposalId,
      status: proposal.status,
      baseRevisionId: proposal.baseRevisionId || "",
      committedRevisionId: proposal.committedRevisionId || null,
      patchCount: Array.isArray(proposal.patches) ? proposal.patches.length : 0,
      summary: proposal.summary || proposal.assistantSummary || ""
    }
  });
  writeRevisionLedger({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {}),
    rootDir
  });
  writeMarkdownIndexes({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {})
  });
  return { workspacePath, event };
}

export function persistRevision({
  plan,
  revision,
  eventType = "revision_created",
  actor = "system",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!plan || !revision?.revisionId) throw new Error("persistRevision requires plan and revision.");
  const { workspacePath, manifest } = ensureProjectWorkspace({ plan, rootDir });
  const revisionPath = join(workspacePath, "revisions", safePathSegment(revision.revisionId));
  const revisionManifestPath = join(revisionPath, "revision_manifest.json");
  const created = !existsSync(revisionManifestPath);
  mkdirSync(join(revisionPath, "artifacts"), { recursive: true });

  const artifactSummary = copyRevisionArtifacts({ revision, revisionPath });
  const validation = revision.geometryValidation || revision.modelArtifacts?.validation || {};
  const generationEvidence = revision.modelArtifacts?.generationEvidence || null;
  const geometrySpec = revision.geometrySpec || {};
  writeJson(join(revisionPath, "product_plan.json"), revision.productPlanSnapshot || {});
  writeJson(join(revisionPath, "geometry-spec.json"), geometrySpec);
  writeJson(join(revisionPath, "component_selections.json"), geometrySpec.componentSelections || {});
  writeJson(join(revisionPath, "component_descriptors.json"), geometrySpec.componentDescriptors || []);
  writeJson(join(revisionPath, "component_asset_manifest.json"), geometrySpec.componentAssetManifest || {});
  writeJson(join(revisionPath, "validation_report.json"), validation);
  writeJson(join(revisionPath, "electronics_spec.json"), revision.electronicsSpec || {});
  writeJson(join(revisionPath, "electronics_validation_report.json"), revision.electronicsValidation || {});
  writeJson(join(revisionPath, "assembly_plan.json"), revision.assemblyPlan || {});
  writeJson(join(revisionPath, "development_board_scaffold.json"), revision.developmentBoardScaffold || {});
  writeJson(join(revisionPath, "prototype_readiness_report.json"), revision.prototypeReadinessReport || {});
  if (generationEvidence) {
    writeJson(join(revisionPath, "generation_evidence_report.json"), generationEvidence);
  }
  writeFileSync(join(revisionPath, "design_summary.md"), designSummaryForRevision(revision, validation));
  writeJson(join(revisionPath, "generation_inputs.json"), generationInputsForRevision(revision));

  const revisionManifest = {
    version: PROJECT_WORKSPACE_VERSION,
    revisionId: revision.revisionId,
    workspaceId: plan.planId,
    sourceTurnId: revision.sourceTurnId || "",
    productCategory: revision.productCategory || "",
    generationStatus: revision.generationStatus || revision.modelArtifacts?.status || "unknown",
    validationStatus: validation.status || "",
    createdAt: revision.createdAt || new Date().toISOString(),
    sourceOfTruth: {
      productPlan: "product_plan.json",
      geometrySpec: "geometry-spec.json",
      componentSelections: "component_selections.json",
      componentDescriptors: "component_descriptors.json",
      electronicsSpec: "electronics_spec.json"
    },
    derivedArtifacts: {
      validationReport: "validation_report.json",
      electronicsValidationReport: "electronics_validation_report.json",
      assemblyPlan: "assembly_plan.json",
      developmentBoardScaffold: "development_board_scaffold.json",
      prototypeReadinessReport: "prototype_readiness_report.json",
      ...(generationEvidence ? { generationEvidenceReport: "generation_evidence_report.json" } : {}),
      componentAssetManifest: "component_asset_manifest.json",
      designSummary: "design_summary.md",
      generationInputs: "generation_inputs.json",
      artifactsDir: "artifacts/"
    },
    artifactSummary,
    directEditingAllowed: false
  };
  writeJson(revisionManifestPath, revisionManifest);

  writeJson(join(workspacePath, "product_plan.json"), plan.workspaceState?.productPlan || revision.productPlanSnapshot || {});
  writeJson(join(workspacePath, "project_manifest.json"), projectManifestFor(plan, manifest));
  writeMarkdownIndexes({ workspacePath, plan, manifest: projectManifestFor(plan, manifest) });

  if (created) {
    appendWorkspaceEvent({
      plan,
      rootDir,
      type: eventType,
      actor,
      payload: {
        revisionId: revision.revisionId,
        generationStatus: revisionManifest.generationStatus,
        validationStatus: revisionManifest.validationStatus,
        artifactCount: artifactSummary.length
      }
    });
    if (revision.modelArtifacts?.status === "generated") {
      appendWorkspaceEvent({
        plan,
        rootDir,
        type: "artifacts_generated",
        actor,
        payload: {
          revisionId: revision.revisionId,
          artifacts: artifactSummary.map((artifact) => artifact.relativePath)
        }
      });
    }
  }
  writeRevisionLedger({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {}),
    rootDir
  });

  return {
    workspacePath,
    revisionPath,
    revisionManifest,
    artifactSummary
  };
}

export function persistValidationEvent({
  plan,
  status,
  proposalId = "",
  source = "",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!plan) throw new Error("persistValidationEvent requires plan.");
  const { workspacePath } = ensureProjectWorkspace({ plan, rootDir });
  const event = appendWorkspaceEvent({
    plan,
    rootDir,
    type: "validation_completed",
    actor: "system",
    payload: {
      status,
      proposalId,
      source,
      currentRevisionId: plan.currentRevisionId || ""
    }
  });
  writeRevisionLedger({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {}),
    rootDir
  });
  return event;
}

export function persistRevisionRevert({
  plan,
  fromRevisionId = "",
  toRevisionId = "",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!plan) throw new Error("persistRevisionRevert requires plan.");
  const { workspacePath } = ensureProjectWorkspace({ plan, rootDir });
  writeMarkdownIndexes({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {})
  });
  const event = appendWorkspaceEvent({
    plan,
    rootDir,
    type: "revision_reverted",
    actor: "user",
    payload: {
      fromRevisionId,
      toRevisionId,
      currentRevisionId: plan.currentRevisionId || ""
    }
  });
  writeRevisionLedger({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {}),
    rootDir
  });
  return event;
}

export function persistReviewSubmission({
  plan,
  revision,
  submission,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!plan) throw new Error("persistReviewSubmission requires plan.");
  const { workspacePath } = ensureProjectWorkspace({ plan, rootDir });
  const reviewRequest = {
    workspaceId: plan.planId,
    revisionId: revision?.revisionId || plan.currentRevisionId || "",
    submission: submission || null,
    status: submission?.status || (submission?.accepted === false ? "not_accepted" : "unknown"),
    createdAt: new Date().toISOString()
  };
  writeJson(join(workspacePath, "review", "review_request.json"), reviewRequest);
  writeFileSync(
    join(workspacePath, "review", "human_review_notes.md"),
    reviewNotesForSubmission(reviewRequest)
  );
  const event = appendWorkspaceEvent({
    plan,
    rootDir,
    type: submission?.accepted === false ? "review_submission_failed" : "review_submitted",
    actor: "user",
    payload: {
      revisionId: reviewRequest.revisionId,
      status: reviewRequest.status,
      reviewId: submission?.reviewId || ""
    }
  });
  writeRevisionLedger({
    workspacePath,
    plan,
    manifest: projectManifestFor(plan, readJsonIfExists(join(workspacePath, "project_manifest.json")) || {}),
    rootDir
  });
  return event;
}

export function readWorkspaceEvents({
  workspaceId,
  limit = 0,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const eventsPath = join(projectWorkspacePath(workspaceId, { rootDir }), "events.jsonl");
  if (!existsSync(eventsPath)) return [];
  const events = readFileSync(eventsPath, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return limit > 0 ? events.slice(-limit) : events;
}

function ensureWorkspaceDirs(workspacePath) {
  for (const path of [
    workspacePath,
    join(workspacePath, "proposals"),
    join(workspacePath, "revisions"),
    join(workspacePath, "source-materials"),
    join(workspacePath, "source-materials", "uploads"),
    join(workspacePath, "source-materials", "datasheets"),
    join(workspacePath, "source-materials", "notes"),
    join(workspacePath, "review"),
    join(workspacePath, "skills")
  ]) {
    mkdirSync(path, { recursive: true });
  }
}

function projectManifestFor(plan, previous = {}) {
  const now = new Date().toISOString();
  const runtimeBinding = runtimeBindingFromSources({ manifest: previous, productPlan: plan });
  return {
    version: PROJECT_WORKSPACE_VERSION,
    projectId: plan.planId,
    workspaceId: plan.planId,
    title: plan.workspaceState?.title || plan.revisions?.at(-1)?.requestText || "Forge hardware prototype",
    status: plan.status || "",
    currentRevisionId: plan.currentRevisionId || "",
    currentProductPlanPath: "product_plan.json",
    runtimePlanPath: "runtime_plan.json",
    revisionLedgerPath: "revision_ledger.json",
    eventsPath: "events.jsonl",
    proposalsPath: "proposals/",
    revisionsPath: "revisions/",
    sourceMaterialsPath: "source-materials/",
    reviewPath: "review/",
    ...(runtimeBinding ? { runtimeBinding } : {}),
    createdAt: previous.createdAt || plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  };
}

function workspaceSummaryFromDir(workspaceId, { rootDir = defaultProjectWorkspaceRoot(), includeProductPlan = true } = {}) {
  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  const manifest = readJsonIfExists(join(workspacePath, "project_manifest.json"));
  if (!manifest?.workspaceId && !manifest?.projectId) return null;
  const resolvedWorkspaceId = manifest.workspaceId || manifest.projectId || workspaceId;
  const productPlan = includeProductPlan ? readRuntimePlanIfReadable({ workspaceId: resolvedWorkspaceId, rootDir }) : null;
  const runtimeBinding = runtimeBindingFromSources({ manifest, productPlan });
  const updatedAt = manifest.updatedAt
    || productPlan?.updatedAt
    || statMtimeIso(join(workspacePath, "project_manifest.json"))
    || "";
  return {
    workspaceId: resolvedWorkspaceId,
    projectId: manifest.projectId || resolvedWorkspaceId,
    title: manifest.title || productPlan?.workspaceState?.title || "Forge hardware prototype",
    status: manifest.status || productPlan?.status || "",
    currentRevisionId: manifest.currentRevisionId || productPlan?.currentRevisionId || "",
    runtimeBinding,
    runtimeInitializationFailed: runtimeBinding?.status === "failed",
    createdAt: manifest.createdAt || productPlan?.createdAt || "",
    updatedAt,
    manifest,
    productPlan
  };
}

function timestampForSort(workspace) {
  const parsed = Date.parse(workspace?.updatedAt || workspace?.createdAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function readRuntimePlanIfReadable({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  try {
    return readRuntimePlan({ workspaceId, rootDir });
  } catch {
    return null;
  }
}

function normalizeRuntimeBinding(binding = null) {
  if (!binding || typeof binding !== "object" || Array.isArray(binding)) return null;
  const provider = String(binding.provider || "").trim();
  const bindingId = String(binding.bindingId || binding.providerState?.threadId || "").trim();
  if (!provider && !bindingId) return null;
  const status = String(binding.status || (bindingId ? "ready" : "pending")).trim() || "pending";
  const normalized = {
    version: binding.version || RUNTIME_BINDING_VERSION,
    provider,
    status,
    bindingId,
    providerState: clone(binding.providerState || {}),
    updatedAt: binding.updatedAt || ""
  };
  if (provider === "codex" && bindingId && !normalized.providerState.threadId) {
    normalized.providerState.threadId = bindingId;
  }
  if (binding.createdAt) normalized.createdAt = binding.createdAt;
  if (binding.error) normalized.error = clone(binding.error);
  if (binding.migratedFrom) normalized.migratedFrom = binding.migratedFrom;
  return normalized;
}

function scrubLegacyRuntimeFields(plan) {
  if (!plan?.workspaceState || typeof plan.workspaceState !== "object") return;
  delete plan.workspaceState.codexThreadId;
  delete plan.workspaceState.runtimeBinding;
}

function writeRevisionLedger({ workspacePath, plan, manifest, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  const ledger = buildRevisionLedger({
    plan,
    rootDir,
    events: readWorkspaceEvents({
      workspaceId: plan?.planId || plan?.workspaceState?.workspaceId,
      rootDir
    })
  });
  writeJson(join(workspacePath, manifest?.revisionLedgerPath || "revision_ledger.json"), ledger);
  return ledger;
}

function statMtimeIso(path) {
  try {
    return statSync(path).mtime.toISOString();
  } catch {
    return "";
  }
}

function copyRevisionArtifacts({ revision, revisionPath }) {
  const artifacts = revision.modelArtifacts?.artifacts || {};
  const mapping = {
    glb: "model.glb",
    stl: "model.stl",
    shellFront: "shell_front.stl",
    shellBack: "shell_back.stl",
    step: "model.step"
  };
  const copied = [];
  for (const [artifactKey, fileName] of Object.entries(mapping)) {
    const sourcePath = artifacts[artifactKey]?.localPath;
    if (!sourcePath || !existsSync(sourcePath)) continue;
    const targetPath = join(revisionPath, "artifacts", fileName);
    copyFileSync(sourcePath, targetPath);
    const stats = statSync(targetPath);
    copied.push({
      artifactKey,
      type: artifacts[artifactKey]?.type || artifactKey,
      relativePath: relative(revisionPath, targetPath),
      sourcePath,
      bytes: stats.size,
      caption: artifacts[artifactKey]?.caption || ""
    });
  }
  return copied;
}

function generationInputsForRevision(revision) {
  return {
    revisionId: revision.revisionId,
    requestText: revision.requestText || "",
    patches: revision.patches || [],
    spec: revision.spec || {},
    modules: revision.modules || [],
    riskReport: revision.riskReport || {},
    quote: revision.quote || {},
    generationStatus: revision.generationStatus || "",
    generationConfirmed: Boolean(revision.generationConfirmed),
    prototypeReadinessStatus: revision.prototypeReadinessStatus || "",
    modelProvider: revision.modelArtifacts?.provider || "",
    targetProvider: revision.modelArtifacts?.targetProvider || ""
  };
}

function designSummaryForRevision(revision, validation) {
  const productPlan = revision.productPlanSnapshot || {};
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const shape = productPlan.geometryPreferences?.enclosure?.shapeProfile
    || constraints.preferredStyle
    || "rounded_rect";
  const modules = (revision.geometrySpec?.componentSelections?.selectedComponentIds || [])
    .map((item) => `- ${item}`)
    .join("\n") || "- pending component selection";
  const warnings = (validation?.issues || [])
    .filter((issue) => issue.level === "warn" || issue.level === "block")
    .map((issue) => `- [${issue.level}] ${issue.code || "validation"}: ${issue.message || ""}`)
    .join("\n") || "- none";
  return `# Forge Revision ${revision.revisionId}

## Source

- ProductPlan is the editable source object.
- GeometrySpec is the only 3D-generation input for this locked revision.
- GLB/STL/STEP files under \`artifacts/\` are derived outputs.

## Product

- Type: ${productPlan.productType || "desktop_display"}
- Display: ${requirements.displaySizeInches || "unknown"} inch
- Finish: ${constraints.finish || "unspecified"}
- Shape: ${shape}
- Generation status: ${revision.generationStatus || "unknown"}
- Prototype readiness: ${revision.prototypeReadinessStatus || "unknown"}

## Components

${modules}

## Validation

- Status: ${validation?.status || "unknown"}
${warnings}
`;
}

function writeMarkdownIndexes({ workspacePath, plan, manifest }) {
  writeFileSync(join(workspacePath, "AGENTS.md"), agentsMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "CURRENT_STATE.md"), currentStateMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "WORK_INDEX.md"), workIndexMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "FORGE_TOOLS.md"), forgeToolsMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "DECISIONS.md"), decisionsMarkdown(plan));
  writeSkillFiles({ workspacePath, manifest });
}

function agentsMarkdown(plan, manifest) {
  return `# Forge Project Agent Rules

This directory is a Forge hardware project workspace for Codex SDK.

## Role

- Codex owns product-task reasoning: understand the user's hardware goal, ask follow-up questions, split work, choose Forge tools, inspect tool output, and summarize progress.
- Forge owns state, validation, generation, revisions, guarded files, and UI-ready outputs.

## Required Workflow

1. Start from \`WORK_INDEX.md\`, \`CURRENT_STATE.md\`, \`DECISIONS.md\`, and \`FORGE_TOOLS.md\`.
2. Read JSON files only when details are needed.
3. Use skills under \`skills/\` for task-specific method.
4. Use \`forge-tool\` for every project-changing action.
5. Never directly edit guarded source-of-truth or generated artifact files.

## Guarded Files

Do not write these files directly:

- \`project_manifest.json\`
- \`product_plan.json\`
- \`runtime_plan.json\`
- \`revision_ledger.json\`
- \`events.jsonl\`
- \`proposals/*.json\`
- \`revisions/*/revision_manifest.json\`
- \`revisions/*/product_plan.json\`
- \`revisions/*/geometry-spec.json\`
- \`revisions/*/component_descriptors.json\`
- \`revisions/*/artifacts/*\`
- \`component-drafts/*/descriptor.json\`
- \`component-drafts/*/sources.md\`
- GLB/STL/STEP artifacts
- ComponentDescriptor source-of-truth files outside this project workspace

Allowed scratch space:

- \`source-materials/notes/\`
- new markdown notes that do not replace the generated state files
- raw component source notes such as \`component-drafts/<draftId>/source-specs.md\`

## Current Project

- Workspace: ${manifest.workspaceId}
- Title: ${manifest.title}
- Current revision: ${manifest.currentRevisionId || "none"}
- Status: ${manifest.status || "unknown"}
`;
}

function currentStateMarkdown(plan, manifest) {
  const productPlan = plan.workspaceState?.productPlan || {};
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const current = plan.revisions?.find((revision) => revision.revisionId === plan.currentRevisionId) || plan.revisions?.at(-1);
  const warnings = [
    ...(current?.riskReport?.items || []),
    ...(current?.geometryValidation?.issues || [])
  ].filter((item) => item.level === "warn" || item.level === "block");
  return `# Current State

- Workspace: ${manifest.workspaceId}
- Title: ${manifest.title}
- Current revision: ${manifest.currentRevisionId || "none"}
- Product type: ${productPlan.productType || "desktop_display"}
- Display size: ${requirements.displaySizeInches || "unknown"} inch
- Finish: ${constraints.finish || "unspecified"}
- Manufacturing method: ${constraints.manufacturingMethod || "fdm_3d_printing"}
- Generation status: ${current?.generationStatus || "unknown"}
- Open proposals: ${(plan.workspaceState?.proposals || []).filter((proposal) => ["proposed", "staged"].includes(proposal.status)).length}
- Validation warnings: ${warnings.length}
`;
}

function workIndexMarkdown(plan, manifest) {
  const revisions = (plan.revisions || []).slice(-8).map((revision) => (
    `- ${revision.revisionId}: ${revision.generationStatus || "unknown"} (${revision.createdAt || ""})`
  )).join("\n") || "- none";
  const proposals = (plan.workspaceState?.proposals || []).slice(-8).map((proposal) => (
    `- ${proposal.proposalId}: ${proposal.status} - ${proposal.summary || proposal.assistantSummary || ""}`
  )).join("\n") || "- none";
  return `# Forge Work Index

Project folder runtime index for Codex SDK. JSON files remain the source of truth; markdown files are navigation aids.

## Project

- Workspace: ${manifest.workspaceId}
- Current revision: ${manifest.currentRevisionId || "none"}
- ProductPlan: ${manifest.currentProductPlanPath}
- Revision ledger: ${manifest.revisionLedgerPath || "revision_ledger.json"}
- Events: ${manifest.eventsPath}
- Tools: FORGE_TOOLS.md
- Skills: skills/

## Recent Revisions

${revisions}

## Recent Proposals

${proposals}
`;
}

function forgeToolsMarkdown(plan, manifest) {
  const command = forgeToolCommand();
  const tools = listToolMetadata().map((tool) => {
    const sideEffects = (tool.sideEffects || []).map((item) => `    - ${item}`).join("\n") || "    - none";
    return `### ${cliNameForTool(tool.name)}

- Forge action: \`${tool.name}\`
- Requires confirmation: ${Boolean(tool.permission?.requiresConfirmation)}
- Read-only: ${Boolean(tool.behavior?.readOnly)}
- Creates revision: ${Boolean(tool.behavior?.createsRevision)}
- Writes artifacts: ${Boolean(tool.behavior?.writesArtifacts)}
- Side effects:
${sideEffects}
`;
  }).join("\n");
  return `# Forge Tools

Use \`forge-tool\` to inspect or change this project. Commands output stable JSON.

Default workspace: ${manifest.workspaceId}

Command prefix:

\`\`\`bash
${command}
\`\`\`

Examples:

\`\`\`bash
${command} summary
${command} search-component --query button --componentType button --limit 5
${command} component-package --componentId button_6mm
${command} descriptor-scaffold --draft-id button_8mm --component-type button --display-name "8 mm Button"
${command} descriptor-draft --descriptor-file ./component-drafts/button_8mm/descriptor.json --sources-file ./component-drafts/button_8mm/sources.md --expected-id button_8mm
${command} descriptor-drafts --draft-id button_8mm
${command} descriptor-specs --draft-id button_8mm --specs "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; measurement basis caliper measurement; reviewable"
${command} descriptor-specs --draft-id button_8mm --specs-file ./component-drafts/button_8mm/source-specs.md
${command} descriptor-promote --descriptor-file ./component-drafts/button_8mm/descriptor.json --sources-file ./component-drafts/button_8mm/sources.md --expected-id button_8mm
${command} descriptor-promote --draft-id button_8mm
${command} descriptor-select --componentId button_8mm
${command} propose --message "Add two right-side buttons."
${command} validate
${command} generate --reason user_confirmed_model_generation
${command} revert --revisionId <revision-id>
${command} review --name "Reviewer" --email reviewer@example.com
\`\`\`

Rules:

- Read project files freely.
- Write project-changing state only through these commands.
- Do not directly edit guarded files listed in \`AGENTS.md\`.
- If a command returns \`ok: false\`, report the error and do not fake success.

## Commands

${tools}
`;
}

function writeSkillFiles({ workspacePath }) {
  const skills = {
    "hardware-workflow.md": `# Forge Skill: Hardware Workflow

- Understand the hardware idea in plain language first.
- Extract product type, display size, power, enclosure finish, user-facing functions, and risk modules.
- Ask concise follow-up questions when core build constraints are missing.
- Keep MVP scope on USB-C low-voltage desktop display/frame/sensor-screen prototypes.
- Treat battery and camera as human-review risk items.
- Treat motion structures, supplier ordering, payment, and real manufacturing as out of scope.
`,
    "product-plan-update.md": `# Forge Skill: ProductPlan Update

- Use ProductPlan as the source object for requirements and constraints.
- Prefer proposal/stage for exploratory changes.
- Use apply/commit only when the user is explicit.
- Never rewrite ProductPlan JSON directly; call forge-tool.
- Summarize the resulting revision or proposal id.
`,
    "component-selection.md": `# Forge Skill: Component Selection

- Search ComponentDescriptor-backed modules before adding parts.
- Inspect a component package when changing to a specific descriptor id.
- Use descriptor-scaffold to create a workspace draft package skeleton only for Forge-controlled or vetted supplier/internal same-type component specs, not arbitrary user uploads.
- Use descriptor-specs to apply explicit source-spec text from controlled source notes to an existing workspace draft package. Prefer --specs-file for source notes placed inside the project workspace, such as component-drafts/<draftId>/source-specs.md; this writes draft files only and must still be followed by inspection, promotion, selection, and explicit generation.
- Do not directly edit component-drafts/<draftId>/descriptor.json or sources.md; those canonical draft files are guarded and must be written through descriptor-scaffold or descriptor-specs.
- Inspect a descriptor draft before adding a controlled same-type component package.
- Promote a valid descriptor draft only when the Forge-controlled library pipeline should make it available in this ProductPlan's component library.
- Use supported components when possible.
- Do not invent mechanical metadata, holes, connectors, keepouts, or cable exits.
- If a component is missing from the loaded library, treat a valid draft as ready for library promotion only; it is not selectable until promoted into the ProductPlan component library or added to the global ComponentDescriptor library.
- After promotion, select it through descriptor-select or a normal component patch/ProductPlan revision; do not mutate GeometrySpec directly.
- If a component is missing or unverified, surface it as a review/validation issue.
`,
    "3d-generation.md": `# Forge Skill: 3D Generation

- GeometrySpec is the only 3D-generation input for a locked revision.
- Ordinary conversation may update requirements or geometry preferences, but must not write GLB/STL/STEP.
- Generate artifacts only after explicit user confirmation such as "生成 3D 模型" or "build it".
- Use validate before generate when risk or geometry is unclear.
`,
    "validation-review.md": `# Forge Skill: Validation And Review

- Use forge-tool validate for fit, descriptor, geometry, and guarded-workflow checks.
- Review material is local human-review material only.
- Do not claim production readiness, certification, supplier ordering, or payment.
- Surface warnings and blocked items plainly.
`,
    "revision-revert.md": `# Forge Skill: Revision And Revert

- Revisions are immutable history.
- Revert by calling forge-tool revert with a revision id.
- Do not edit historical revision folders directly.
- After revert, summarize the active revision and any available artifacts.
`
  };
  for (const [fileName, body] of Object.entries(skills)) {
    writeFileSync(join(workspacePath, "skills", fileName), body);
  }
}

function forgeToolCommand() {
  return `node ${join(repoRoot, "scripts", "forge-tool.mjs")}`;
}

function cliNameForTool(actionName) {
  const mapping = {
    getWorkspaceSummary: "summary",
    searchComponentLibrary: "search-component",
    inspectComponentPackage: "component-package",
    inspectComponentDescriptorDraft: "descriptor-draft",
    inspectWorkspaceComponentDescriptorDrafts: "descriptor-drafts",
    scaffoldWorkspaceComponentDescriptorDraft: "descriptor-scaffold",
    applyWorkspaceDescriptorDraftSpecs: "descriptor-specs",
    promoteComponentDescriptorDraft: "descriptor-promote",
    promoteWorkspaceComponentDescriptorDraft: "descriptor-promote",
    selectComponentDescriptor: "descriptor-select",
    retirePromotedComponentDescriptor: "descriptor-retire",
    proposeDesignChange: "propose",
    stageDesignPatch: "stage",
    commitStagedChange: "commit",
    applyDesignPatch: "apply",
    validateDesign: "validate",
    regenerateRevision: "generate",
    revertRevision: "revert",
    getRevisionArtifacts: "artifacts",
    rejectStagedChange: "reject",
    submitReviewPacket: "review"
  };
  return mapping[actionName] || actionName;
}

function decisionsMarkdown(plan) {
  const productPlan = plan.workspaceState?.productPlan || {};
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const decisions = [
    `Use ${constraints.manufacturingMethod || "fdm_3d_printing"} as the MVP enclosure path.`,
    `Treat ${constraints.finish || "the requested finish"} as a surface treatment on the standard 3D printed shell.`,
    requirements.usbC === true ? "Use USB-C desktop power for the standard path." : "Power method is not locked.",
    requirements.battery ? "Battery request is a human-review risk item." : "Battery is not part of the current standard plan.",
    requirements.camera ? "Camera request is a human-review risk item." : "Camera is not part of the current standard plan.",
    "GeometrySpec, not raw chat text, is the only 3D-generation input for a locked revision.",
    "GLB/STL/STEP files are derived artifacts and are not directly editable source."
  ];
  return `# Decisions

${decisions.map((item) => `- ${item}`).join("\n")}
`;
}

function reviewNotesForSubmission(reviewRequest) {
  return `# Human Review Notes

- Workspace: ${reviewRequest.workspaceId}
- Revision: ${reviewRequest.revisionId}
- Status: ${reviewRequest.status}
- Review ID: ${reviewRequest.submission?.reviewId || "not assigned"}

This local review packet is not a payment, supplier order, or manufacturing start.
`;
}

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value ?? null, null, 2));
}

function safePathSegment(value) {
  return String(value || "item").replace(/[^a-zA-Z0-9._-]/g, "_");
}
