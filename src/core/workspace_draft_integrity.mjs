import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const defaultWorkspaceRootUrl = new URL("../../data/workspaces/", import.meta.url);

export function defaultWorkspaceDraftRoot() {
  return process.env.FORGE_WORKSPACE_ROOT || fileURLToPath(defaultWorkspaceRootUrl);
}

export function readWorkspaceDescriptorDraftPackage({
  workspaceId = "",
  draftId = "",
  rootDir = defaultWorkspaceDraftRoot()
} = {}) {
  const id = String(draftId || "").trim();
  if (!id) return fail("UNKNOWN_DESCRIPTOR_DRAFT", "draftId is required.");
  const safeId = safeDraftId(id);
  if (safeId !== id) return fail("INVALID_DRAFT_ID", `Invalid draftId: ${id}`);
  const packageDir = workspaceDraftPackagePath({ workspaceId, draftId: id, rootDir });
  if (!existsSync(packageDir)) {
    return fail("UNKNOWN_DESCRIPTOR_DRAFT", `Unknown workspace descriptor draft: ${id}`);
  }
  const descriptorFile = join(packageDir, "descriptor.json");
  const sourcesFile = join(packageDir, "sources.md");
  if (!existsSync(descriptorFile)) {
    return fail("DESCRIPTOR_DRAFT_FILE_MISSING", `Workspace descriptor draft ${id} is missing descriptor.json.`);
  }
  const descriptorJson = readFileSync(descriptorFile, "utf8");
  const sourcesText = existsSync(sourcesFile) ? readFileSync(sourcesFile, "utf8") : "";
  return {
    ok: true,
    draftId: id,
    packagePath: `component-drafts/${id}`,
    descriptorPath: `component-drafts/${id}/descriptor.json`,
    sourcesPath: `component-drafts/${id}/sources.md`,
    descriptorFilePresent: true,
    sourcesFilePresent: existsSync(sourcesFile),
    descriptorBytes: Buffer.byteLength(descriptorJson),
    sourcesBytes: Buffer.byteLength(sourcesText),
    descriptorSha256: sha256ForText(descriptorJson),
    sourcesSha256: sourcesText ? sha256ForText(sourcesText) : "",
    descriptorJson,
    sourcesText
  };
}

export function workspaceDraftIntegrityStatus({
  workspaceId = "",
  workspaceDraft = null,
  rootDir = defaultWorkspaceDraftRoot()
} = {}) {
  if (!workspaceId || !workspaceDraft?.draftId) return null;
  const promoted = workspaceDraftIntegritySnapshot(workspaceDraft);
  const currentPackage = readWorkspaceDescriptorDraftPackage({
    workspaceId,
    draftId: workspaceDraft.draftId,
    rootDir
  });
  if (!currentPackage.ok) {
    return {
      available: false,
      status: currentPackage.error?.code === "UNKNOWN_DESCRIPTOR_DRAFT" ? "missing" : "unavailable",
      promoted,
      current: null,
      changedFields: [],
      error: currentPackage.error,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    };
  }

  const current = workspaceDraftIntegritySnapshot(currentPackage);
  const changedFields = [];
  for (const field of ["descriptorSha256", "sourcesSha256", "descriptorBytes", "sourcesBytes"]) {
    if (String(promoted[field] ?? "") !== String(current[field] ?? "")) changedFields.push(field);
  }

  const hasPromotedIntegrity = Boolean(
    promoted.descriptorSha256
      || promoted.sourcesSha256
      || promoted.descriptorBytes
      || promoted.sourcesBytes
  );
  const status = hasPromotedIntegrity
    ? (changedFields.length > 0 ? "changed" : "matched")
    : "untracked";

  return {
    available: true,
    status,
    promoted,
    current,
    changedFields,
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

export function workspaceDraftIntegritySnapshot(source = {}) {
  return {
    draftId: source.draftId || "",
    packagePath: source.packagePath || (source.draftId ? `component-drafts/${source.draftId}` : ""),
    descriptorPath: source.descriptorPath || (source.draftId ? `component-drafts/${source.draftId}/descriptor.json` : ""),
    sourcesPath: source.sourcesPath || (source.draftId ? `component-drafts/${source.draftId}/sources.md` : ""),
    descriptorSha256: source.descriptorSha256 || "",
    sourcesSha256: source.sourcesSha256 || "",
    descriptorBytes: Number(source.descriptorBytes || 0),
    sourcesBytes: Number(source.sourcesBytes || 0),
    specPatch: compactSpecPatch(source.specPatch)
  };
}

function compactSpecPatch(specPatch = null) {
  if (!specPatch) {
    return {
      applied: false
    };
  }
  return {
    applied: specPatch.applied === true,
    eventId: specPatch.eventId || "",
    timestamp: specPatch.timestamp || "",
    draftId: specPatch.draftId || "",
    componentId: specPatch.componentId || "",
    componentType: specPatch.componentType || "",
    baseComponentId: specPatch.baseComponentId || "",
    specsSourcePath: specPatch.specsSourcePath || "",
    extractedFields: Array.isArray(specPatch.extractedFields) ? [...specPatch.extractedFields] : [],
    readyForLibraryPromotion: specPatch.readyForLibraryPromotion === true,
    blockingIssueCount: Number(specPatch.blockingIssueCount || 0),
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

export function workspaceDraftPackagePath({
  workspaceId = "",
  draftId = "",
  rootDir = defaultWorkspaceDraftRoot()
} = {}) {
  return join(rootDir || defaultWorkspaceDraftRoot(), safePathSegment(workspaceId || "unknown_workspace"), "component-drafts", safeDraftId(draftId));
}

export function safeDraftId(value = "") {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function sha256ForText(text = "") {
  return createHash("sha256").update(String(text || "")).digest("hex");
}

function safePathSegment(value = "") {
  return String(value || "unknown_workspace").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function fail(code, message, details = {}) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...details
    }
  };
}
