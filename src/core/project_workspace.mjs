import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { makeId } from "./utils.mjs";
import { clone } from "./workspace_state.mjs";

export const PROJECT_WORKSPACE_VERSION = "forge_project_workspace_v1";

const defaultWorkspaceRootUrl = new URL("../../data/workspaces/", import.meta.url);

export function defaultProjectWorkspaceRoot() {
  return process.env.FORGE_WORKSPACE_ROOT || fileURLToPath(defaultWorkspaceRootUrl);
}

export function projectWorkspacePath(workspaceId, { rootDir = defaultProjectWorkspaceRoot() } = {}) {
  return join(rootDir, safePathSegment(workspaceId || "unknown_workspace"));
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
  writeJson(join(workspacePath, "project_manifest.json"), manifest);
  writeJson(join(workspacePath, "product_plan.json"), plan.workspaceState?.productPlan || {});
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
  const geometrySpec = revision.geometrySpec || {};
  writeJson(join(revisionPath, "product_plan.json"), revision.productPlanSnapshot || {});
  writeJson(join(revisionPath, "geometry-spec.json"), geometrySpec);
  writeJson(join(revisionPath, "component_selections.json"), geometrySpec.componentSelections || {});
  writeJson(join(revisionPath, "component_descriptors.json"), geometrySpec.componentDescriptors || []);
  writeJson(join(revisionPath, "component_asset_manifest.json"), geometrySpec.componentAssetManifest || {});
  writeJson(join(revisionPath, "validation_report.json"), validation);
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
      componentDescriptors: "component_descriptors.json"
    },
    derivedArtifacts: {
      validationReport: "validation_report.json",
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
  ensureProjectWorkspace({ plan, rootDir });
  return appendWorkspaceEvent({
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
  return appendWorkspaceEvent({
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
  return appendWorkspaceEvent({
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
    join(workspacePath, "review")
  ]) {
    mkdirSync(path, { recursive: true });
  }
}

function projectManifestFor(plan, previous = {}) {
  const now = new Date().toISOString();
  return {
    version: PROJECT_WORKSPACE_VERSION,
    projectId: plan.planId,
    workspaceId: plan.planId,
    title: plan.workspaceState?.title || plan.revisions?.at(-1)?.requestText || "Forge hardware prototype",
    status: plan.status || "",
    currentRevisionId: plan.currentRevisionId || "",
    currentProductPlanPath: "product_plan.json",
    eventsPath: "events.jsonl",
    proposalsPath: "proposals/",
    revisionsPath: "revisions/",
    sourceMaterialsPath: "source-materials/",
    reviewPath: "review/",
    createdAt: previous.createdAt || plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  };
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

## Components

${modules}

## Validation

- Status: ${validation?.status || "unknown"}
${warnings}
`;
}

function writeMarkdownIndexes({ workspacePath, plan, manifest }) {
  writeFileSync(join(workspacePath, "CURRENT_STATE.md"), currentStateMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "WORK_INDEX.md"), workIndexMarkdown(plan, manifest));
  writeFileSync(join(workspacePath, "DECISIONS.md"), decisionsMarkdown(plan));
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

Project folder runtime index. JSON files remain the source of truth.

## Project

- Workspace: ${manifest.workspaceId}
- Current revision: ${manifest.currentRevisionId || "none"}
- ProductPlan: ${manifest.currentProductPlanPath}
- Events: ${manifest.eventsPath}

## Recent Revisions

${revisions}

## Recent Proposals

${proposals}
`;
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
