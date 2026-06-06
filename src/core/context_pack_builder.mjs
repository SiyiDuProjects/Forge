import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  defaultProjectWorkspaceRoot,
  projectWorkspacePath,
  readWorkspaceEvents,
  runtimeBindingFromSources
} from "./project_workspace.mjs";
import { listToolMetadata } from "./tool_registry.mjs";

export function buildContextPack({
  workspaceId,
  rootDir = defaultProjectWorkspaceRoot(),
  recentEventLimit = 8
} = {}) {
  if (!workspaceId) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_WORKSPACE",
        message: "workspaceId is required."
      }
    };
  }

  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  const manifest = readJson(join(workspacePath, "project_manifest.json"));
  if (!manifest) {
    return {
      ok: false,
      error: {
        code: "WORKSPACE_FOLDER_NOT_FOUND",
        message: `No Forge project folder found for ${workspaceId}.`
      }
    };
  }

  const productPlan = readJson(join(workspacePath, manifest.currentProductPlanPath || "product_plan.json")) || {};
  const runtimeBinding = runtimeBindingFromSources({ manifest, productPlan });
  const currentRevisionId = manifest.currentRevisionId || "";
  const revisionPath = currentRevisionId
    ? join(workspacePath, "revisions", currentRevisionId)
    : "";
  const revisionManifest = revisionPath ? readJson(join(revisionPath, "revision_manifest.json")) : null;
  const validationReport = revisionPath ? readJson(join(revisionPath, "validation_report.json")) : null;
  const proposals = readProposalSummaries(join(workspacePath, "proposals"));
  const events = readWorkspaceEvents({
    workspaceId,
    rootDir,
    limit: recentEventLimit
  });
  const allowedTools = listToolMetadata().map((tool) => ({
    name: tool.name,
    requiresConfirmation: Boolean(tool.permission?.requiresConfirmation),
    readOnly: Boolean(tool.behavior?.readOnly),
    mutatesCurrentState: Boolean(tool.behavior?.mutatesCurrentState),
    writesArtifacts: Boolean(tool.behavior?.writesArtifacts),
    safeToRunInParallel: Boolean(tool.concurrency?.safeToRunInParallel),
    lock: tool.concurrency?.lock || null
  }));

  return {
    ok: true,
    workspaceId,
    projectSummary: {
      title: manifest.title,
      status: manifest.status,
      currentRevisionId,
      runtimeBinding,
      projectPath: workspacePath,
      updatedAt: manifest.updatedAt,
      eventsPath: manifest.eventsPath || "events.jsonl"
    },
    currentProductPlanSummary: productPlanSummary(productPlan),
    currentRevisionSummary: revisionSummary(revisionManifest, validationReport),
    openProposals: proposals.filter((proposal) => ["proposed", "staged"].includes(proposal.status)),
    recentEvents: events.map((event) => ({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: event.type,
      actor: event.actor,
      summary: eventSummary(event)
    })),
    recentDecisions: decisionSummary(productPlan),
    validationWarnings: validationWarnings(validationReport),
    allowedTools,
    artifactSummary: (revisionManifest?.artifactSummary || []).map((artifact) => ({
      artifactKey: artifact.artifactKey,
      type: artifact.type,
      relativePath: artifact.relativePath,
      bytes: artifact.bytes,
      caption: artifact.caption
    })),
    exclusions: [
      "raw GLB/STL/STEP bytes",
      "full events.jsonl",
      "arbitrary project file contents",
      "direct GeometrySpec mutation instructions"
    ]
  };
}

function productPlanSummary(productPlan = {}) {
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const geometryPreferences = productPlan.geometryPreferences || {};
  const selectedComponents = [];
  if (requirements.display) selectedComponents.push("display");
  if (requirements.usbC) selectedComponents.push("usb_c");
  if (requirements.ambientSensor) selectedComponents.push("ambient_sensor");
  if (requirements.buttons) selectedComponents.push(`${requirements.buttons} button(s)`);
  if (requirements.speaker) selectedComponents.push("speaker");
  if (requirements.buzzer) selectedComponents.push("buzzer");
  if (requirements.camera) selectedComponents.push("camera_review");
  if (requirements.battery) selectedComponents.push("battery_review");
  return {
    productType: productPlan.productType || "desktop_display",
    userIntent: productPlan.userIntent || "",
    requirements: {
      displaySizeInches: requirements.displaySizeInches || null,
      usbC: Boolean(requirements.usbC),
      camera: Boolean(requirements.camera),
      battery: Boolean(requirements.battery),
      buttons: Number(requirements.buttons || 0)
    },
    components: selectedComponents,
    manufacturingMethod: constraints.manufacturingMethod || "fdm_3d_printing",
    finish: constraints.finish || "",
    shapeProfile: geometryPreferences.enclosure?.shapeProfile || constraints.preferredStyle || "rounded_rect"
  };
}

function revisionSummary(revisionManifest, validationReport) {
  if (!revisionManifest) {
    return {
      revisionId: "",
      generationStatus: "none",
      validationStatus: "unknown",
      directEditingAllowed: false
    };
  }
  return {
    revisionId: revisionManifest.revisionId,
    generationStatus: revisionManifest.generationStatus,
    validationStatus: revisionManifest.validationStatus || validationReport?.status || "unknown",
    sourceOfTruth: revisionManifest.sourceOfTruth || {},
    derivedArtifacts: revisionManifest.derivedArtifacts || {},
    artifactCount: Array.isArray(revisionManifest.artifactSummary) ? revisionManifest.artifactSummary.length : 0,
    directEditingAllowed: false
  };
}

function readProposalSummaries(proposalDir) {
  if (!existsSync(proposalDir)) return [];
  return readdirSync(proposalDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => readJson(join(proposalDir, fileName)))
    .filter(Boolean)
    .map((proposal) => ({
      proposalId: proposal.proposalId,
      status: proposal.status,
      summary: proposal.summary || proposal.assistantSummary || "",
      baseRevisionId: proposal.baseRevisionId || "",
      committedRevisionId: proposal.committedRevisionId || null,
      patchCount: Array.isArray(proposal.patches) ? proposal.patches.length : 0,
      updatedAt: proposal.updatedAt || proposal.createdAt || ""
    }));
}

function validationWarnings(validationReport = {}) {
  return (validationReport?.issues || [])
    .filter((issue) => issue.level === "warn" || issue.level === "block")
    .map((issue) => ({
      level: issue.level,
      code: issue.code || "",
      moduleId: issue.moduleId || "",
      message: issue.message || ""
    }));
}

function decisionSummary(productPlan = {}) {
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  return [
    `Manufacturing path: ${constraints.manufacturingMethod || "fdm_3d_printing"}`,
    `Finish treatment: ${constraints.finish || "unspecified"}`,
    requirements.usbC ? "USB-C desktop power is in scope." : "Power method remains open.",
    requirements.battery ? "Battery is a human-review risk." : "Battery is excluded from the current standard path.",
    requirements.camera ? "Camera is a human-review risk." : "Camera is excluded from the current standard path.",
    "GeometrySpec is the only 3D-generation input for locked revisions."
  ];
}

function eventSummary(event = {}) {
  const payload = event.payload || {};
  if (payload.summary) return payload.summary;
  if (payload.revisionId) return `${event.type}: ${payload.revisionId}`;
  if (payload.proposalId) return `${event.type}: ${payload.proposalId}`;
  if (payload.status) return `${event.type}: ${payload.status}`;
  return event.type || "";
}

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  if (statSync(filePath).size === 0) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}
