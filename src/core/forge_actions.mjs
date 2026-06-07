import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listComponentDescriptors } from "./component_library.mjs";
import {
  componentTypeForProductPlanComponentId,
  getSelectableComponentDescriptor,
  listSelectableComponentDescriptors
} from "./component_selection.mjs";
import {
  normalizeComponentDescriptor,
  validateComponentDescriptorV2
} from "./component_descriptor_schema.mjs";
import { createGeometrySpec, validateGeometrySpec } from "./geometry_generation.mjs";
import {
  artifactPathsForRevision,
  createProductPlanRevisionFromPatches,
  currentRevision,
  getProductPlan,
  regenerateProductPlanRevision,
  revertProductPlanRevision,
  submitProductPlanReview
} from "./product_plan.mjs";
import {
  appendWorkspaceEvent,
  persistProjectPlan,
  persistProposal,
  persistValidationEvent,
  projectWorkspacePath,
  readWorkspaceEvents
} from "./project_workspace.mjs";
import { processUserTurn } from "./sparker_orchestrator.mjs";
import { makeId } from "./utils.mjs";
import { applyWorkspacePatches, clone, createEmptyProductPlan, productPlanToDraft } from "./workspace_state.mjs";
import {
  readWorkspaceDescriptorDraftPackage,
  safeDraftId,
  workspaceDraftIntegritySnapshot,
  workspaceDraftIntegrityStatus,
  workspaceDraftPackagePath
} from "./workspace_draft_integrity.mjs";
import { MIN_PREVIEW_SOLID_THICKNESS_MM } from "./validation_engine.mjs";

const PATCH_TYPES = new Set(["plan_patch", "component_patch", "geometry_preference_patch"]);
const MAX_DESCRIPTOR_OPENING_OVERSIZE_MM = 8;
const MAX_DESCRIPTOR_LOCAL_POSITION_OVERSHOOT_MM = 2.5;
const COMPONENT_TYPES = new Set([
  "display",
  "core_board",
  "usb_c",
  "ambient_sensor",
  "button",
  "buzzer",
  "speaker",
  "camera",
  "battery"
]);
const PLAN_PATCH_PATHS = new Set([
  "productType",
  "userIntent",
  "requirements.display",
  "requirements.displaySizeInches",
  "requirements.ambientSensor",
  "requirements.usbC",
  "requirements.battery",
  "requirements.camera",
  "requirements.speaker",
  "requirements.buzzer",
  "requirements.buttons",
  "requirements.desktopUse",
  "requirements.wallMount",
  "requirements.portable",
  "constraints.manufacturingMethod",
  "constraints.material",
  "constraints.wallThicknessMm",
  "constraints.clearanceMm",
  "constraints.maxWidthMm",
  "constraints.maxHeightMm",
  "constraints.maxDepthMm",
  "constraints.preferredStyle",
  "constraints.finish",
  "constraints.priority",
  "componentPreferences.core_board",
  "componentPreferences.display",
  "componentPreferences.usb_c",
  "componentPreferences.ambient_sensor",
  "componentPreferences.button",
  "componentPreferences.speaker",
  "componentPreferences.camera",
  "componentPreferences.battery"
]);
const GEOMETRY_PATCH_PATHS = new Set([
  "enclosure.shapeProfile",
  "placements.usb_c.semanticPosition",
  "placements.buttons.semanticPosition",
  "placements.ambient_sensor.semanticPosition",
  "placements.speaker.semanticPosition",
  "placements.camera.semanticPosition",
  "placements.battery.semanticPosition",
  "display.tiltDeg",
  "dimensions.widthScale",
  "dimensions.heightScale",
  "dimensions.depthDeltaMm",
  "dimensions.bezelDeltaMm"
]);
const SEMANTIC_POSITIONS = new Set([
  "back_left",
  "back_right",
  "front_top",
  "front_bottom",
  "front_left",
  "front_right",
  "right_side",
  "left_side",
  "back",
  "front",
  "top",
  "bottom",
  "center_front"
]);
const SHAPE_PROFILES = new Set([
  "rounded_rect",
  "cat_ear_photo_frame",
  "photo_frame",
  "desktop_wedge",
  "arched_frame",
  "wide_landscape",
  "tall_portrait"
]);

export function getWorkspaceSummary({ workspaceId } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const revision = currentRevision(plan);
  const productPlan = revision?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  return ok({
    workspaceId: plan.planId,
    title: plan.workspaceState?.title || revision?.requestText || "Forge hardware prototype",
    currentRevisionId: plan.currentRevisionId || revision?.revisionId || "",
    productType: productPlan.productType || "desktop_display",
    requirements: clone(productPlan.requirements || {}),
    components: componentSummaryForRevision(revision),
    geometryPreferences: clone(productPlan.geometryPreferences || {}),
    shapeProfile: productPlan.geometryPreferences?.enclosure?.shapeProfile
      || productPlan.constraints?.preferredStyle
      || "rounded_rect",
    validationWarnings: collectWarnings(revision),
    artifactStatus: artifactStatusForRevision(revision),
    proposalCount: proposalStore(plan).length,
    directEditingAllowed: false
  });
}

export function searchComponentLibrary({ workspaceId = "", query = "", componentType = "", limit = 10 } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const requestedType = normalizeComponentType(componentType);
  if (requestedType && !COMPONENT_TYPES.has(requestedType)) {
    return fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${componentType}`);
  }

  const productPlan = productPlanForOptionalWorkspace(workspaceId);
  const descriptors = listSelectableComponentDescriptors(productPlan)
    .map((descriptor) => componentSearchRow(descriptor, { workspaceId }))
    .filter((item) => {
      if (requestedType && item.componentType !== requestedType) return false;
      if (!q) return true;
      return [
        item.componentId,
        item.componentType,
        item.displayName
      ].some((value) => String(value || "").toLowerCase().includes(q));
    })
    .slice(0, Math.max(1, Math.min(50, Number(limit) || 10)));

  return ok({ results: descriptors });
}

export function inspectComponentPackage({ workspaceId = "", componentId = "" } = {}) {
  const id = String(componentId || "").trim();
  if (!id) return fail("UNKNOWN_COMPONENT", "componentId is required.");
  const descriptor = workspaceId
    ? getSelectableComponentDescriptor(id, productPlanForOptionalWorkspace(workspaceId))
    : listComponentDescriptors().find((item) => item.id === id);
  if (!descriptor) return fail("UNKNOWN_COMPONENT", `Unknown component: ${id}`);
  return ok(componentPackageReport(descriptor, { workspaceId }));
}

export function scaffoldWorkspaceComponentDescriptorDraft({
  workspaceId,
  draftId = "",
  componentType = "",
  displayName = "",
  overwrite = false
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const id = String(draftId || "").trim();
  recordToolCalled(plan, "scaffoldWorkspaceComponentDescriptorDraft", {
    draftId: id,
    componentType,
    overwrite: Boolean(overwrite)
  });
  if (!id) {
    const result = fail("INVALID_DRAFT_ID", "draftId is required.");
    recordToolFailed(plan, "scaffoldWorkspaceComponentDescriptorDraft", result.error);
    return result;
  }
  if (safeDraftId(id) !== id) {
    const result = fail("INVALID_DRAFT_ID", `Invalid draftId: ${id}`);
    recordToolFailed(plan, "scaffoldWorkspaceComponentDescriptorDraft", result.error);
    return result;
  }

  if (!String(componentType || "").trim()) {
    const result = fail("UNSUPPORTED_COMPONENT_TYPE", "componentType is required for descriptor draft scaffolding.");
    recordToolFailed(plan, "scaffoldWorkspaceComponentDescriptorDraft", result.error);
    return result;
  }
  const normalizedType = normalizeComponentType(componentType);
  const descriptorCategory = descriptorCategoryForComponentType(normalizedType);
  if (!COMPONENT_TYPES.has(normalizeComponentType(descriptorCategory))) {
    const result = fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${componentType || id}`);
    recordToolFailed(plan, "scaffoldWorkspaceComponentDescriptorDraft", result.error);
    return result;
  }

  const packageDir = workspaceDraftPackagePath({
    workspaceId: plan.planId,
    draftId: id
  });
  const descriptorPath = join(packageDir, "descriptor.json");
  const sourcesPath = join(packageDir, "sources.md");
  if (!overwrite && (existsSync(descriptorPath) || existsSync(sourcesPath))) {
    const result = fail("DESCRIPTOR_DRAFT_EXISTS", `Workspace descriptor draft already exists: ${id}`);
    recordToolFailed(plan, "scaffoldWorkspaceComponentDescriptorDraft", result.error);
    return result;
  }

  const reviewedDate = new Date().toISOString().slice(0, 10);
  const descriptor = scaffoldDescriptorTemplate({
    draftId: id,
    componentType: descriptorCategory,
    displayName: String(displayName || "").trim() || titleFromDraftId(id),
    reviewedDate
  });
  const sourcesText = scaffoldSourcesTemplate({
    draftId: id,
    componentType: descriptorCategory,
    displayName: descriptor.identity.displayName,
    reviewedDate
  });

  mkdirSync(packageDir, { recursive: true });
  writeFileSync(descriptorPath, `${JSON.stringify(descriptor, null, 2)}\n`);
  writeFileSync(sourcesPath, sourcesText);
  appendWorkspaceEvent({
    plan,
    type: "component_descriptor_draft_scaffolded",
    actor: "assistant",
    payload: {
      draftId: id,
      componentType: normalizeComponentType(descriptorCategory),
      packagePath: `component-drafts/${id}`,
      descriptorPath: `component-drafts/${id}/descriptor.json`,
      sourcesPath: `component-drafts/${id}/sources.md`,
      overwrite: Boolean(overwrite),
      readyForLibraryPromotion: false,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    }
  });

  const draftReport = workspaceDraftReport({
    workspaceId: plan.planId,
    draftId: id,
    productPlan: productPlanWithWorkspaceLibrary(plan)
  });
  return ok({
    scaffolded: true,
    draftId: id,
    componentType: normalizeComponentType(descriptorCategory),
    packagePath: `component-drafts/${id}`,
    descriptorPath: `component-drafts/${id}/descriptor.json`,
    sourcesPath: `component-drafts/${id}/sources.md`,
    overwritten: Boolean(overwrite),
    readyForLibraryPromotion: false,
    readyForSelection: false,
    readyForReviewableGeneration: false,
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false,
    authoringChecklist: descriptorAuthoringChecklist(descriptorCategory),
    draftReport
  });
}

export function applyWorkspaceDescriptorDraftSpecs({
  workspaceId,
  draftId = "",
  specsText = "",
  specsSourcePath = "",
  baseComponentId = "",
  markReviewable = false
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const id = String(draftId || "").trim();
  recordToolCalled(plan, "applyWorkspaceDescriptorDraftSpecs", {
    draftId: id,
    specsTextLength: String(specsText || "").length,
    specsSourcePath: safeWorkspaceSourcePath(specsSourcePath),
    baseComponentId,
    markReviewable: Boolean(markReviewable)
  });
  if (!id) {
    const result = fail("INVALID_DRAFT_ID", "draftId is required.");
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", result.error);
    return result;
  }
  if (safeDraftId(id) !== id) {
    const result = fail("INVALID_DRAFT_ID", `Invalid draftId: ${id}`);
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", result.error);
    return result;
  }
  const rawSpecs = String(specsText || "").trim();
  const sourcePath = safeWorkspaceSourcePath(specsSourcePath);
  if (!rawSpecs) {
    const result = fail("EMPTY_DESCRIPTOR_SPECS", "specsText is required.");
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", result.error);
    return result;
  }

  const packageResult = readWorkspaceDescriptorDraftPackage({
    workspaceId: plan.planId,
    draftId: id
  });
  if (!packageResult.ok) {
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", packageResult.error);
    return packageResult;
  }
  const parseResult = parseDescriptorDraftInput({ descriptorJson: packageResult.descriptorJson });
  if (!parseResult.ok) {
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", parseResult.error);
    return parseResult;
  }
  const currentDescriptor = parseResult.descriptor;
  const currentCategory = currentDescriptor.identity?.category || currentDescriptor.category || "";
  const reference = referenceDescriptorForDraft({
    componentType: currentCategory,
    baseComponentId,
    productPlan: productPlanWithWorkspaceLibrary(plan)
  });
  if (!reference.ok) {
    recordToolFailed(plan, "applyWorkspaceDescriptorDraftSpecs", reference.error);
    return reference;
  }

  const extracted = extractDescriptorSpecs(rawSpecs);
  const reviewedDate = new Date().toISOString().slice(0, 10);
  const descriptor = descriptorFromReferenceAndSpecs({
    draftId: id,
    currentDescriptor,
    referenceDescriptor: reference.descriptor,
    extracted,
    markReviewable: Boolean(markReviewable || extracted.reviewable),
    reviewedDate
  });
  const sourcesText = appendSpecTextToSources({
    existingSourcesText: packageResult.sourcesText,
    draftId: id,
    specsText: rawSpecs,
    specsSourcePath: sourcePath,
    extracted,
    reviewedDate
  });

  const packageDir = workspaceDraftPackagePath({
    workspaceId: plan.planId,
    draftId: id
  });
  writeFileSync(join(packageDir, "descriptor.json"), `${JSON.stringify(descriptor, null, 2)}\n`);
  writeFileSync(join(packageDir, "sources.md"), sourcesText);

  const draftReport = workspaceDraftReport({
    workspaceId: plan.planId,
    draftId: id,
    productPlan: productPlanWithWorkspaceLibrary(plan)
  });
  const specPatchEvent = appendWorkspaceEvent({
    plan,
    type: "component_descriptor_draft_specs_applied",
    actor: "assistant",
    payload: {
      draftId: id,
      componentId: descriptor.identity?.id || id,
      componentType: normalizeComponentType(descriptor.identity?.category || ""),
      packagePath: packageResult.packagePath,
      descriptorPath: packageResult.descriptorPath,
      sourcesPath: packageResult.sourcesPath,
      specsSourcePath: sourcePath,
      baseComponentId: reference.descriptor.id || "",
      extractedFields: extracted.fieldNames,
      readyForLibraryPromotion: Boolean(draftReport.readyForLibraryPromotion),
      blockingIssueCount: draftReport.blockingIssues?.length || 0,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    }
  });
  const specPatch = compactSpecPatchEvent(specPatchEvent);
  return ok({
    specsApplied: true,
    draftId: id,
    componentId: descriptor.identity?.id || id,
    componentType: normalizeComponentType(descriptor.identity?.category || ""),
    packagePath: packageResult.packagePath,
    descriptorPath: packageResult.descriptorPath,
    sourcesPath: packageResult.sourcesPath,
    specsSourcePath: sourcePath,
    baseComponentId: reference.descriptor.id || "",
    extractedFields: extracted.fieldNames,
    readyForLibraryPromotion: Boolean(draftReport.readyForLibraryPromotion),
    readyForSelection: false,
    readyForReviewableGeneration: false,
    specPatch,
    blockingIssues: clone(draftReport.blockingIssues || []),
    reviewWarnings: clone(draftReport.reviewWarnings || []),
    draftReport,
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  });
}

export function promoteComponentDescriptorDraft({
  workspaceId,
  descriptor = null,
  descriptorJson = "",
  expectedId = "",
  sourcesText = "",
  replaceExisting = false,
  source = null
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  recordToolCalled(plan, "promoteComponentDescriptorDraft", {
    expectedId,
    replaceExisting: Boolean(replaceExisting)
  });
  const draftReport = inspectComponentDescriptorDraft({
    descriptor,
    descriptorJson,
    expectedId,
    sourcesText
  });
  if (!draftReport.ok) {
    recordToolFailed(plan, "promoteComponentDescriptorDraft", draftReport.error);
    return draftReport;
  }
  if (!draftReport.readyForLibraryPromotion) {
    const result = fail("DESCRIPTOR_DRAFT_NOT_PROMOTABLE", "Descriptor draft is not ready for library promotion.", {
      draftReport
    });
    recordToolFailed(plan, "promoteComponentDescriptorDraft", result.error);
    return result;
  }
  if (draftReport.libraryStatus.loadedComponentExists) {
    const result = fail("COMPONENT_ALREADY_LOADED", `Component ${draftReport.componentId} is already in the global descriptor library.`);
    recordToolFailed(plan, "promoteComponentDescriptorDraft", result.error);
    return result;
  }

  const parseResult = parseDescriptorDraftInput({ descriptor, descriptorJson });
  if (!parseResult.ok) return parseResult;
  const rawDescriptor = parseResult.descriptor;
  const productPlan = productPlanWithWorkspaceLibrary(plan);
  const library = normalizeProductPlanComponentLibrary(productPlan.componentLibrary);
  const existingIndex = library.descriptors.findIndex((entry) => componentIdForDescriptorEntry(entry) === draftReport.componentId);
  const existingEntry = existingIndex >= 0 ? library.descriptors[existingIndex] : null;
  if (existingIndex >= 0 && !replaceExisting) {
    const result = fail("COMPONENT_ALREADY_PROMOTED", `Component ${draftReport.componentId} is already promoted in this ProductPlan component library.`);
    recordToolFailed(plan, "promoteComponentDescriptorDraft", result.error);
    return result;
  }

  const promotedAt = new Date().toISOString();
  const replacement = replacementAuditForPromotion({
    previousEntry: existingEntry,
    replacedAt: promotedAt
  });
  const promotedEntry = {
    componentId: draftReport.componentId,
    componentType: draftReport.componentType,
    status: "reviewable",
    promotedAt,
    source: source && typeof source === "object" && !Array.isArray(source) ? clone(source) : {
      type: "descriptor_draft",
      expectedId: String(expectedId || "").trim()
    },
    descriptor: clone(rawDescriptor),
    sourcesText: String(sourcesText || ""),
    sourcesFilePresent: String(sourcesText || "").trim().length > 0,
    descriptorPath: `productPlan.componentLibrary.${draftReport.componentId}.descriptor`,
    sourcesPath: `productPlan.componentLibrary.${draftReport.componentId}.sources.md`,
    replacement,
    replacementHistory: replacementHistoryForPromotion({
      previousEntry: existingEntry,
      replacement
    })
  };
  if (existingIndex >= 0) library.descriptors[existingIndex] = promotedEntry;
  else library.descriptors.push(promotedEntry);
  productPlan.componentLibrary = library;
  plan.workspaceState.productPlan = productPlan;
  appendWorkspaceEvent({
    plan,
    type: "component_descriptor_promoted",
    actor: "assistant",
    payload: {
      componentId: draftReport.componentId,
      componentType: draftReport.componentType,
      replaceExisting: Boolean(existingIndex >= 0),
      replacement: clone(replacement),
      readyForSelection: true,
      readyForReviewableGeneration: true
    }
  });
  persistProjectPlan({ plan });

  const promotedDescriptor = getSelectableComponentDescriptor(draftReport.componentId, productPlan);
  return ok({
    promoted: true,
    componentId: draftReport.componentId,
    componentType: draftReport.componentType,
    packageStatus: draftReport.packageStatus,
    readyForSelection: Boolean(promotedDescriptor),
    readyForReviewableGeneration: Boolean(promotedDescriptor),
    componentPreferencePath: draftReport.replacementPolicy.componentPreferencePath,
    replacement: clone(replacement),
    libraryStatus: {
      scope: "product_plan",
      loadedComponentExists: false,
      promotedComponentExists: Boolean(promotedDescriptor),
      descriptorCount: library.descriptors.length
    },
    source: clone(promotedEntry.source),
    replacementPolicy: {
      ...draftReport.replacementPolicy,
      canSelectSameType: Boolean(promotedDescriptor),
      loadedLibraryRequired: false,
      requiresProductPlanRevision: true,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    },
    draftReport
  });
}

export function retirePromotedComponentDescriptor({
  workspaceId,
  componentId = "",
  reason = "",
  clearPreference = true
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const id = String(componentId || "").trim();
  recordToolCalled(plan, "retirePromotedComponentDescriptor", {
    componentId: id,
    clearPreference: Boolean(clearPreference)
  });
  if (!id) {
    const result = fail("UNKNOWN_PROMOTED_COMPONENT", "componentId is required.");
    recordToolFailed(plan, "retirePromotedComponentDescriptor", result.error);
    return result;
  }

  const productPlan = productPlanWithWorkspaceLibrary(plan);
  const library = normalizeProductPlanComponentLibrary(productPlan.componentLibrary);
  const existingIndex = library.descriptors.findIndex((entry) => componentIdForDescriptorEntry(entry) === id);
  if (existingIndex < 0) {
    const result = fail("UNKNOWN_PROMOTED_COMPONENT", `Unknown promoted ProductPlan component descriptor: ${id}`);
    recordToolFailed(plan, "retirePromotedComponentDescriptor", result.error);
    return result;
  }

  const entry = library.descriptors[existingIndex];
  const previousStatus = entry.status || "";
  const componentType = normalizeComponentType(
    entry.componentType
    || entry.descriptor?.identity?.category
    || entry.descriptor?.type
    || entry.descriptor?.category
  );
  if (!COMPONENT_TYPES.has(componentType)) {
    const result = fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported promoted descriptor type for ${id}.`);
    recordToolFailed(plan, "retirePromotedComponentDescriptor", result.error);
    return result;
  }

  const retiredAt = new Date().toISOString();
  const retirementReason = String(reason || "").trim() || "No reason provided.";
  library.descriptors[existingIndex] = {
    ...clone(entry),
    componentId: id,
    componentType,
    status: "retired",
    active: false,
    retiredAt,
    retirementReason
  };
  productPlan.componentLibrary = library;

  let clearedComponentPreference = false;
  const preferenceKey = componentPreferenceKeyForType(componentType);
  productPlan.componentPreferences ||= {};
  if (clearPreference && preferenceKey && productPlan.componentPreferences[preferenceKey] === id) {
    delete productPlan.componentPreferences[preferenceKey];
    clearedComponentPreference = true;
  }

  plan.workspaceState ||= {};
  plan.workspaceState.productPlan = productPlan;
  appendWorkspaceEvent({
    plan,
    type: "component_descriptor_retired",
    actor: "assistant",
    payload: {
      componentId: id,
      componentType,
      previousStatus,
      clearedComponentPreference,
      reason: retirementReason
    }
  });
  persistProjectPlan({ plan });

  return ok({
    retired: true,
    componentId: id,
    componentType,
    previousStatus,
    clearedComponentPreference,
    componentPreferencePath: preferenceKey ? `componentPreferences.${preferenceKey}` : "",
    libraryStatus: productPlanComponentLibraryStatus(library),
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  });
}

export function inspectComponentDescriptorDraft({
  descriptor = null,
  descriptorJson = "",
  expectedId = "",
  sourcesText = ""
} = {}) {
  const parseResult = parseDescriptorDraftInput({ descriptor, descriptorJson });
  if (!parseResult.ok) return parseResult;
  const rawDescriptor = parseResult.descriptor;
  const draftId = String(rawDescriptor.identity?.id || rawDescriptor.id || expectedId || "").trim();
  const sourceFileName = rawDescriptor.sourceNotes?.sourcesFile || "sources.md";
  const knownConnectorIdsByComponentId = knownConnectorIdsForDraft(rawDescriptor);
  const validation = validateComponentDescriptorV2(rawDescriptor, {
    expectedId: String(expectedId || "").trim(),
    knownConnectorIdsByComponentId,
    sourcesFileExists: String(sourcesText || "").trim().length > 0
  });
  const normalized = {
    ...normalizeComponentDescriptor(rawDescriptor),
    descriptorPath: draftId ? `draft:${draftId}/descriptor.json` : "draft:descriptor.json",
    sourcesPath: draftId ? `draft:${draftId}/${sourceFileName}` : `draft:${sourceFileName}`,
    schemaValidation: validation
  };
  const loadedDescriptor = draftId
    ? listComponentDescriptors().find((item) => item.id === draftId)
    : null;
  const report = componentPackageReport(normalized, { loaded: false });
  const readyForLibraryPromotion = report.supported
    && report.descriptorValidation.valid === true
    && report.blockingIssues.length === 0;
  return ok({
    ...report,
    draft: true,
    readyForLibraryPromotion,
    readyForSelection: false,
    readyForReviewableGeneration: false,
    libraryStatus: {
      loadedComponentExists: Boolean(loadedDescriptor),
      loadedComponentId: loadedDescriptor?.id || "",
      canPromoteToLibrary: readyForLibraryPromotion && !loadedDescriptor,
      targetDirectory: draftId ? `src/core/component_assets/${draftId}/` : "",
      requiresDescriptorJson: true,
      requiresSourcesMd: true
    },
    replacementPolicy: {
      ...report.replacementPolicy,
      canSelectSameType: false,
      loadedLibraryRequired: true,
      readyAfterLibraryPromotion: readyForLibraryPromotion
    }
  });
}

export function inspectWorkspaceComponentDescriptorDrafts({
  workspaceId,
  draftId = "",
  limit = 20
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const draftIdsResult = listWorkspaceDraftIds({ workspaceId: planResult.plan.planId, draftId, limit });
  if (!draftIdsResult.ok) return draftIdsResult;
  const drafts = draftIdsResult.draftIds.map((id) => workspaceDraftReport({
    workspaceId: planResult.plan.planId,
    draftId: id,
    productPlan: productPlanWithWorkspaceLibrary(planResult.plan)
  }));
  return ok({
    workspaceId: planResult.plan.planId,
    draftCount: drafts.length,
    readyForPromotionCount: drafts.filter((draft) => draft.ok && draft.readyForLibraryPromotion).length,
    drafts,
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  });
}

export function promoteWorkspaceComponentDescriptorDraft({
  workspaceId,
  draftId = "",
  replaceExisting = false
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const id = String(draftId || "").trim();
  const packageResult = readWorkspaceDescriptorDraftPackage({
    workspaceId: planResult.plan.planId,
    draftId: id
  });
  if (!packageResult.ok) return packageResult;
  const promoted = promoteComponentDescriptorDraft({
    workspaceId: planResult.plan.planId,
    descriptorJson: packageResult.descriptorJson,
    expectedId: id,
    sourcesText: packageResult.sourcesText,
    replaceExisting,
    source: {
      type: "workspace_descriptor_draft",
      expectedId: id,
      workspaceDraft: {
        draftId: id,
        packagePath: packageResult.packagePath,
        descriptorPath: packageResult.descriptorPath,
        sourcesPath: packageResult.sourcesPath,
        descriptorSha256: packageResult.descriptorSha256,
        sourcesSha256: packageResult.sourcesSha256,
        descriptorBytes: packageResult.descriptorBytes,
        sourcesBytes: packageResult.sourcesBytes,
        specPatch: latestWorkspaceDraftSpecPatch({
          workspaceId: planResult.plan.planId,
          draftId: id
        })
      }
    }
  });
  if (!promoted.ok) return promoted;
  return {
    ...promoted,
    draftId: id,
    packagePath: packageResult.packagePath,
    descriptorPath: packageResult.descriptorPath,
    sourcesPath: packageResult.sourcesPath
  };
}

export function selectComponentDescriptor({
  workspaceId,
  componentId = "",
  quantity = 1,
  message = ""
} = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const id = String(componentId || "").trim();
  recordToolCalled(plan, "selectComponentDescriptor", {
    componentId: id,
    quantity
  });
  if (!id) {
    const result = fail("UNKNOWN_COMPONENT", "componentId is required.");
    recordToolFailed(plan, "selectComponentDescriptor", result.error);
    return result;
  }

  const baseProductPlan = productPlanWithWorkspaceLibrary(plan);
  const descriptor = getSelectableComponentDescriptor(id, baseProductPlan);
  if (!descriptor) {
    const result = fail("UNKNOWN_COMPONENT", `Unknown selectable component: ${id}`);
    recordToolFailed(plan, "selectComponentDescriptor", result.error);
    return result;
  }

  const packageReport = componentPackageReport(descriptor, {
    loaded: true,
    workspaceId: plan.planId
  });
  if (!packageReport.readyForSelection) {
    const result = fail("COMPONENT_NOT_SELECTABLE", `Component ${id} is not ready for ProductPlan selection.`, {
      packageReport
    });
    recordToolFailed(plan, "selectComponentDescriptor", result.error);
    return result;
  }

  const componentType = normalizeComponentType(
    descriptor.identity?.category
      || descriptor.type
      || descriptor.category
      || id
  );
  const preferenceKey = componentPreferenceKeyForType(componentType);
  if (!preferenceKey) {
    const result = fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${componentType || "unknown"}`);
    recordToolFailed(plan, "selectComponentDescriptor", result.error);
    return result;
  }

  const selectedQuantity = Math.max(1, Math.min(99, Number(quantity) || 1));
  const patches = [
    {
      type: "component_patch",
      add: [
        {
          componentType,
          componentId: id,
          quantity: selectedQuantity
        }
      ]
    }
  ];
  const validationResult = validateActionPatches(patches, { productPlan: baseProductPlan });
  if (!validationResult.ok) {
    recordToolFailed(plan, "selectComponentDescriptor", validationResult.error);
    return validationResult;
  }
  const result = safeCreateRevision({
    planId: plan.planId,
    patches: validationResult.patches,
    summary: String(message || `Select ${id} as ${componentType} descriptor`),
    source: "select_component_descriptor",
    generateArtifacts: false
  });
  if (!result.ok) {
    recordToolFailed(plan, "selectComponentDescriptor", result.error);
    return result;
  }

  return ok({
    selected: true,
    componentId: id,
    componentType,
    quantity: selectedQuantity,
    componentPreferencePath: `componentPreferences.${preferenceKey}`,
    readyForReviewableGeneration: packageReport.readyForReviewableGeneration === true,
    newRevisionId: result.revision.revisionId,
    diff: clone(result.revision.diff || {}),
    validationReport: clone(result.revision.geometryValidation || {}),
    artifactPaths: actionArtifactPaths(result.revision),
    packageReport,
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  });
}

export function proposeDesignChange({ workspaceId, message = "" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  recordToolCalled(plan, "proposeDesignChange", {
    messageLength: String(message || "").length
  });
  const baseRevision = currentRevision(plan);
  const baseProductPlan = productPlanWithWorkspaceLibrary(plan, baseRevision?.productPlanSnapshot);
  const sparkerResult = processUserTurn({
    workspaceState: plan.workspaceState,
    currentProductPlan: baseProductPlan,
    currentConversation: plan.conversation || [],
    userMessage: message
  });
  const validationResult = validateActionPatches(sparkerResult.appliedPatches, { productPlan: baseProductPlan });
  if (!validationResult.ok) {
    recordToolFailed(plan, "proposeDesignChange", validationResult.error);
    return validationResult;
  }
  const preview = previewForPatches(baseProductPlan, validationResult.patches);
  if (!preview.ok) {
    recordToolFailed(plan, "proposeDesignChange", preview.error);
    return preview;
  }
  const proposal = createProposal(plan, {
    status: "proposed",
    source: {
      type: "user_message",
      message: String(message || "")
    },
    assistantSummary: sparkerResult.assistantMessage || summaryForPatches(validationResult.patches),
    patches: validationResult.patches,
    expectedEffects: expectedEffects(validationResult.patches),
    expectedWarnings: warningsFromValidation(preview.validationPreview),
    validationPreview: preview.validationPreview,
    baseRevisionId: baseRevision?.revisionId || "",
    requiresConfirmation: validationResult.patches.length > 0
  });

  return ok({
    proposalId: proposal.proposalId,
    status: proposal.status,
    assistantSummary: proposal.assistantSummary,
    patches: clone(proposal.patches),
    expectedEffects: proposal.expectedEffects,
    expectedWarnings: proposal.expectedWarnings,
    validationPreview: clone(proposal.validationPreview),
    requiresConfirmation: proposal.requiresConfirmation
  });
}

export function stageDesignPatch({ workspaceId, patches = [], summary = "" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  recordToolCalled(plan, "stageDesignPatch", {
    patchCount: Array.isArray(patches) ? patches.length : 0
  });
  const baseRevision = currentRevision(plan);
  const baseProductPlan = productPlanWithWorkspaceLibrary(plan, baseRevision?.productPlanSnapshot);
  const validationResult = validateActionPatches(patches, { productPlan: baseProductPlan });
  if (!validationResult.ok) {
    recordToolFailed(plan, "stageDesignPatch", validationResult.error);
    return validationResult;
  }
  const preview = previewForPatches(baseProductPlan, validationResult.patches);
  if (!preview.ok) {
    recordToolFailed(plan, "stageDesignPatch", preview.error);
    return preview;
  }
  const proposal = createProposal(plan, {
    status: "staged",
    source: { type: "structured_patch" },
    summary: String(summary || summaryForPatches(validationResult.patches)),
    assistantSummary: String(summary || summaryForPatches(validationResult.patches)),
    patches: validationResult.patches,
    expectedEffects: expectedEffects(validationResult.patches),
    expectedWarnings: warningsFromValidation(preview.validationPreview),
    validationPreview: preview.validationPreview,
    baseRevisionId: baseRevision?.revisionId || "",
    requiresConfirmation: true
  });
  return ok({
    proposalId: proposal.proposalId,
    status: proposal.status,
    patches: clone(proposal.patches),
    summary: proposal.summary,
    canCommit: proposal.validationPreview?.blocked !== true,
    validationPreview: clone(proposal.validationPreview)
  });
}

export function commitStagedChange({ workspaceId, proposalId } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const proposalResult = resolveProposal(plan, proposalId);
  if (!proposalResult.ok) return proposalResult;
  const { proposal } = proposalResult;
  recordToolCalled(plan, "commitStagedChange", {
    proposalId
  });
  if (proposal.status === "rejected" || proposal.status === "expired") {
    const result = fail("PROPOSAL_NOT_COMMITTABLE", `Proposal ${proposalId} is ${proposal.status}.`);
    recordToolFailed(plan, "commitStagedChange", result.error);
    return result;
  }
  if (proposal.status === "committed") {
    const result = fail("PROPOSAL_ALREADY_COMMITTED", `Proposal ${proposalId} is already committed.`);
    recordToolFailed(plan, "commitStagedChange", result.error);
    return result;
  }
  if (proposal.validationPreview?.blocked) {
    const result = fail("VALIDATION_BLOCKED", `Proposal ${proposalId} is blocked by validation.`);
    recordToolFailed(plan, "commitStagedChange", result.error);
    return result;
  }

  const result = safeCreateRevision({
    planId: plan.planId,
    patches: proposal.patches,
    summary: proposal.summary || proposal.assistantSummary || `Commit ${proposal.proposalId}`,
    source: "commit_staged_change",
    generateArtifacts: false
  });
  if (!result.ok) {
    recordToolFailed(plan, "commitStagedChange", result.error);
    return result;
  }

  proposal.status = "committed";
  proposal.committedRevisionId = result.revision.revisionId;
  proposal.committedAt = new Date().toISOString();
  proposal.updatedAt = proposal.committedAt;
  persistProposal({
    plan,
    proposal,
    eventType: "proposal_committed",
    actor: "assistant"
  });
  return ok({
    committed: true,
    newRevisionId: result.revision.revisionId,
    diff: clone(result.revision.diff || {}),
    validationReport: clone(result.revision.geometryValidation || {}),
    artifactPaths: actionArtifactPaths(result.revision)
  });
}

export function applyDesignPatch({ workspaceId, message = "", patches = [] } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  recordToolCalled(planResult.plan, "applyDesignPatch", {
    patchCount: Array.isArray(patches) ? patches.length : 0
  });
  const baseProductPlan = productPlanWithWorkspaceLibrary(planResult.plan);
  const validationResult = validateActionPatches(patches, { productPlan: baseProductPlan });
  if (!validationResult.ok) {
    recordToolFailed(planResult.plan, "applyDesignPatch", validationResult.error);
    return validationResult;
  }
  const result = safeCreateRevision({
    planId: planResult.plan.planId,
    patches: validationResult.patches,
    summary: String(message || summaryForPatches(validationResult.patches)),
    source: "apply_design_patch",
    generateArtifacts: false
  });
  if (!result.ok) {
    recordToolFailed(planResult.plan, "applyDesignPatch", result.error);
    return result;
  }
  return ok({
    applied: true,
    newRevisionId: result.revision.revisionId,
    diff: clone(result.revision.diff || {}),
    validationReport: clone(result.revision.geometryValidation || {}),
    artifactPaths: actionArtifactPaths(result.revision)
  });
}

export function regenerateRevision({ workspaceId, revisionId = "", reason = "manual_regeneration" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  recordToolCalled(planResult.plan, "regenerateRevision", {
    revisionId,
    reason
  });
  try {
    const result = regenerateProductPlanRevision({
      planId: planResult.plan.planId,
      revisionId,
      reason
    });
    return ok({
      regenerated: true,
      revisionId: result.revision.revisionId,
      sourceRevisionId: result.sourceRevision.revisionId,
      artifactPaths: actionArtifactPaths(result.revision),
      validationReport: clone(result.revision.geometryValidation || {})
    });
  } catch (error) {
    const result = errorFromException(error, "REGENERATION_FAILED");
    recordToolFailed(planResult.plan, "regenerateRevision", result.error);
    return result;
  }
}

export function validateDesign({ workspaceId, proposalId = "", patches = null, mode = "current_or_proposal" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  recordToolCalled(plan, "validateDesign", {
    proposalId,
    patchCount: Array.isArray(patches) ? patches.length : 0,
    mode
  });
  const baseRevision = currentRevision(plan);
  const baseProductPlan = productPlanWithWorkspaceLibrary(plan, baseRevision?.productPlanSnapshot);
  let planToValidate = baseProductPlan;
  let source = mode;

  if (proposalId) {
    const proposalResult = resolveProposal(plan, proposalId);
    if (!proposalResult.ok) {
      recordToolFailed(plan, "validateDesign", proposalResult.error);
      return proposalResult;
    }
    const preview = previewForPatches(baseProductPlan, proposalResult.proposal.patches);
    if (!preview.ok) {
      recordToolFailed(plan, "validateDesign", preview.error);
      return preview;
    }
    planToValidate = preview.productPlan;
    source = "proposal";
  } else if (Array.isArray(patches)) {
    const validationResult = validateActionPatches(patches, { productPlan: baseProductPlan });
    if (!validationResult.ok) {
      recordToolFailed(plan, "validateDesign", validationResult.error);
      return validationResult;
    }
    const preview = previewForPatches(baseProductPlan, validationResult.patches);
    if (!preview.ok) {
      recordToolFailed(plan, "validateDesign", preview.error);
      return preview;
    }
    planToValidate = preview.productPlan;
    source = "patches";
  }

  const validation = validationForProductPlan(planToValidate);
  const result = ok({
    source,
    status: actionValidationStatus(validation),
    errors: validation.issues.filter((issue) => issue.level === "block"),
    warnings: validation.issues.filter((issue) => issue.level === "warn"),
    blocked: !validation.canGenerateArtifacts,
    geometryValidation: validation
  });
  persistValidationEvent({
    plan,
    status: result.status,
    proposalId,
    source
  });
  return result;
}

export function revertRevision({ workspaceId, revisionId } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  recordToolCalled(planResult.plan, "revertRevision", {
    revisionId
  });
  try {
    const result = revertProductPlanRevision({
      planId: planResult.plan.planId,
      revisionId
    });
    return ok({
      reverted: true,
      currentRevisionId: result.revision.revisionId,
      artifactPaths: actionArtifactPaths(result.revision),
      productPlan: clone(result.productPlan || null),
      summary: `Reverted to ${result.revision.revisionId}.`
    });
  } catch (error) {
    const result = errorFromException(error, "REVERT_FAILED");
    recordToolFailed(planResult.plan, "revertRevision", result.error);
    return result;
  }
}

export function getRevisionArtifacts({ workspaceId, revisionId = "" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const revision = findRevision(planResult.plan, revisionId || planResult.plan.currentRevisionId);
  if (!revision) return fail("UNKNOWN_REVISION", `Unknown revision: ${revisionId}`);
  const artifacts = artifactMap(revision);
  return ok({
    revisionId: revision.revisionId,
    artifacts,
    artifactPaths: Object.fromEntries(
      Object.entries(artifacts).map(([key, value]) => [key, value?.localPath || value?.url || null])
    ),
    artifactStatus: artifactStatusForRevision(revision),
    directEditingAllowed: false
  });
}

export function rejectStagedChange({ workspaceId, proposalId, reason = "" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const proposalResult = resolveProposal(planResult.plan, proposalId);
  if (!proposalResult.ok) return proposalResult;
  const { proposal } = proposalResult;
  recordToolCalled(planResult.plan, "rejectStagedChange", {
    proposalId
  });
  if (proposal.status === "committed") {
    const result = fail("PROPOSAL_ALREADY_COMMITTED", `Proposal ${proposalId} is already committed.`);
    recordToolFailed(planResult.plan, "rejectStagedChange", result.error);
    return result;
  }
  proposal.status = "rejected";
  proposal.rejectedAt = new Date().toISOString();
  proposal.rejectionReason = String(reason || "rejected_by_user");
  proposal.updatedAt = proposal.rejectedAt;
  persistProposal({
    plan: planResult.plan,
    proposal,
    eventType: "proposal_rejected",
    actor: "user"
  });
  return ok({
    rejected: true,
    proposalId: proposal.proposalId,
    status: proposal.status
  });
}

export async function submitReviewPacket({ workspaceId, revisionId = "", contactInfo = {} } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  recordToolCalled(planResult.plan, "submitReviewPacket", {
    revisionId,
    hasName: Boolean(contactInfo?.name),
    hasEmail: Boolean(contactInfo?.email)
  });
  try {
    const result = await submitProductPlanReview({
      planId: planResult.plan.planId,
      revisionId,
      contactInfo
    });
    return ok({
      submitted: true,
      status: result.submission?.status || "",
      reviewId: result.submission?.reviewId || "",
      submission: clone(result.submission || null),
      productPlan: clone(result.productPlan || null)
    });
  } catch (error) {
    const result = errorFromException(error, "REVIEW_SUBMISSION_FAILED");
    recordToolFailed(planResult.plan, "submitReviewPacket", result.error);
    return result;
  }
}

export function validateActionPatches(patches = [], { productPlan = null } = {}) {
  if (!Array.isArray(patches)) return fail("INVALID_PATCH_SET", "Patches must be an array.");
  const normalized = [];
  for (const patch of patches) {
    if (!patch || typeof patch !== "object") return fail("INVALID_PATCH", "Patch must be an object.");
    if (!PATCH_TYPES.has(patch.type)) {
      return fail("INVALID_PATCH_TYPE", `Unsupported patch type: ${patch.type || "unknown"}`);
    }
    if (patch.type === "plan_patch") {
      const error = validatePlanPatch(patch);
      if (error) return error;
    }
    if (patch.type === "geometry_preference_patch") {
      const error = validateGeometryPatch(patch);
      if (error) return error;
    }
    if (patch.type === "component_patch") {
      const error = validateComponentPatch(patch, { productPlan });
      if (error) return error;
    }
    normalized.push(clone(patch));
  }
  return ok({ patches: normalized });
}

function validatePlanPatch(patch) {
  for (const path of [...Object.keys(patch.set || {}), ...(patch.unset || [])]) {
    if (!PLAN_PATCH_PATHS.has(path)) return fail("INVALID_PATCH_PATH", `Unknown patch path: ${path}`);
    if (Object.hasOwn(patch.set || {}, path) && path === "constraints.preferredStyle" && !SHAPE_PROFILES.has(patch.set[path])) {
      return fail("UNSUPPORTED_SHAPE_PROFILE", `Unsupported shape profile: ${patch.set[path]}`);
    }
  }
  if (patch.set?.productType === "manual_expansion") return null;
  if (patch.set?.productType && !["desktop_display", "desk_clock", "digital_photo_frame", "sensor_display"].includes(patch.set.productType)) {
    return fail("UNSUPPORTED_PRODUCT_TYPE", `Unsupported product type: ${patch.set.productType}`);
  }
  return null;
}

function validateGeometryPatch(patch) {
  for (const [path, value] of Object.entries(patch.set || {})) {
    if (!GEOMETRY_PATCH_PATHS.has(path)) return fail("INVALID_PATCH_PATH", `Unknown patch path: ${path}`);
    if (path === "enclosure.shapeProfile" && !SHAPE_PROFILES.has(value)) {
      return fail("UNSUPPORTED_SHAPE_PROFILE", `Unsupported shape profile: ${value}`);
    }
    if (path.endsWith(".semanticPosition") && !SEMANTIC_POSITIONS.has(value)) {
      return fail("UNSUPPORTED_SEMANTIC_POSITION", `Unsupported semantic position: ${value}`);
    }
  }
  for (const path of patch.unset || []) {
    if (!GEOMETRY_PATCH_PATHS.has(path)) return fail("INVALID_PATCH_PATH", `Unknown patch path: ${path}`);
  }
  return null;
}

function validateComponentPatch(patch, { productPlan = null } = {}) {
  for (const mode of ["add", "remove"]) {
    for (const item of patch[mode] || []) {
      const componentTypeFromId = item.componentId ? componentTypeForId(item.componentId, productPlan) : "";
      const normalized = normalizeComponentType(item.componentType || item.type || componentTypeFromId);
      if (item.componentId && !componentTypeFromId) {
        return fail("UNKNOWN_COMPONENT", `Unknown component: ${item.componentId}`);
      }
      if (!COMPONENT_TYPES.has(normalized)) {
        return fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${item.componentType || item.type || item.componentId || "unknown"}`);
      }
      if (item.componentId && componentTypeFromId !== normalized) {
        return fail("COMPONENT_TYPE_MISMATCH", `Component ${item.componentId} is not a ${normalized}.`);
      }
    }
  }
  return null;
}

function safeCreateRevision(input) {
  try {
    return ok(createProductPlanRevisionFromPatches(input));
  } catch (error) {
    return errorFromException(error, "REVISION_CREATE_FAILED");
  }
}

function previewForPatches(baseProductPlan, patches) {
  const patchResult = applyWorkspacePatches(baseProductPlan, patches);
  if (patchResult.rejectedPatches.length > 0) {
    return fail("PATCH_REJECTED", "Patch preview rejected one or more patches.", {
      rejectedPatches: patchResult.rejectedPatches
    });
  }
  return ok({
    productPlan: patchResult.productPlan,
    validationPreview: validationPreviewForProductPlan(patchResult.productPlan)
  });
}

function validationForProductPlan(productPlan) {
  const draft = productPlanToDraft({
    productPlan,
    requestText: productPlan.userIntent || "Forge action validation"
  });
  const geometrySpec = createGeometrySpec({
    productPlan,
    spec: draft.spec,
    modules: draft.modules,
    riskReport: draft.riskReport
  });
  return validateGeometrySpec(geometrySpec);
}

function validationPreviewForProductPlan(productPlan) {
  const validation = validationForProductPlan(productPlan);
  return {
    status: actionValidationStatus(validation),
    blocked: !validation.canGenerateArtifacts,
    errors: validation.issues.filter((issue) => issue.level === "block"),
    warnings: validation.issues.filter((issue) => issue.level === "warn"),
    checks: validation.checks || []
  };
}

function actionValidationStatus(validation) {
  if (!validation.canGenerateArtifacts) return "blocked";
  if (validation.issues?.some((issue) => issue.level === "warn")) return "warning";
  return "passed";
}

function createProposal(plan, fields) {
  const now = new Date().toISOString();
  const proposal = {
    proposalId: makeId("proposal"),
    status: fields.status || "proposed",
    createdAt: now,
    updatedAt: now,
    source: clone(fields.source || { type: "forge_action" }),
    baseRevisionId: fields.baseRevisionId || "",
    summary: fields.summary || fields.assistantSummary || "",
    assistantSummary: fields.assistantSummary || fields.summary || "",
    patches: clone(fields.patches || []),
    expectedEffects: clone(fields.expectedEffects || []),
    expectedWarnings: clone(fields.expectedWarnings || []),
    validationPreview: clone(fields.validationPreview || {}),
    requiresConfirmation: fields.requiresConfirmation !== false,
    committedRevisionId: null
  };
  proposalStore(plan).push(proposal);
  persistProposal({
    plan,
    proposal,
    eventType: proposal.status === "staged" ? "proposal_staged" : "proposal_created",
    actor: proposal.source?.type === "structured_patch" ? "user" : "assistant"
  });
  return proposal;
}

function recordToolCalled(plan, tool, payload = {}) {
  appendWorkspaceEvent({
    plan,
    type: "tool_called",
    actor: "assistant",
    payload: {
      tool,
      ...payload
    }
  });
}

function recordToolFailed(plan, tool, error = {}) {
  appendWorkspaceEvent({
    plan,
    type: "tool_failed",
    actor: "system",
    payload: {
      tool,
      code: error.code || "TOOL_FAILED",
      message: error.message || "Forge tool failed."
    }
  });
}

function proposalStore(plan) {
  if (!plan.workspaceState) plan.workspaceState = { proposals: [] };
  if (!Array.isArray(plan.workspaceState.proposals)) plan.workspaceState.proposals = [];
  plan.proposals = plan.workspaceState.proposals;
  return plan.workspaceState.proposals;
}

function resolvePlan(workspaceId) {
  const id = String(workspaceId || "").trim();
  if (!id) return fail("UNKNOWN_WORKSPACE", "workspaceId is required.");
  const plan = getProductPlan(id);
  if (!plan) return fail("UNKNOWN_WORKSPACE", `Unknown workspace: ${id}`);
  proposalStore(plan);
  return ok({ plan });
}

function resolveProposal(plan, proposalId) {
  const proposal = proposalStore(plan).find((item) => item.proposalId === proposalId);
  if (!proposal) return fail("UNKNOWN_PROPOSAL", `Unknown proposal: ${proposalId}`);
  return ok({ proposal });
}

function findRevision(plan, revisionId) {
  return plan.revisions.find((item) => item.revisionId === revisionId)
    || (!revisionId ? currentRevision(plan) : null);
}

function componentSearchRow(descriptor, { workspaceId = "" } = {}) {
  const componentType = normalizeComponentType(descriptor.identity?.category || descriptor.category || descriptor.id);
  const constraints = descriptor.mechanicalConstraints || {};
  const packageReport = componentPackageReport(descriptor, { workspaceId });
  return {
    componentId: descriptor.id,
    componentType,
    displayName: descriptor.displayName || descriptor.identity?.displayName || descriptor.id,
    supported: COMPONENT_TYPES.has(componentType),
    assetQuality: descriptor.assetQuality,
    validationStatus: descriptor.validationStatus,
    mechanicalConstraints: {
      trustLevel: constraints.trustLevel || "unknown",
      productionReady: constraints.productionReady === true,
      requiresHumanValidation: constraints.requiresHumanValidation !== false,
      dimensionsMm: clone(constraints.dimensionsMm || descriptor.dimensionsMm || {}),
      mounting: {
        method: constraints.mounting?.method || descriptor.mechanicalProxy?.mountingMethod || "",
        holeCount: Number(constraints.mounting?.holeCount || descriptor.mountingHoles?.length || 0),
        bodyType: constraints.mounting?.bodyType || ""
      },
      interfaces: {
        connectorCount: Number(constraints.interfaces?.connectorCount || descriptor.connectors?.length || 0),
        connectorIds: clone(constraints.interfaces?.connectorIds || (descriptor.connectors || []).map((connector) => connector.id).filter(Boolean)),
        requiredExternalAccessConnectorIds: clone(constraints.interfaces?.requiredExternalAccessConnectorIds || [])
      },
      shellFeatures: {
        externalFeatureCount: Number(constraints.shellFeatures?.externalFeatureCount || descriptor.externalFeatures?.length || 0),
        externalFeatureIds: clone(constraints.shellFeatures?.externalFeatureIds || (descriptor.externalFeatures || []).map((feature) => feature.id).filter(Boolean)),
        maxInsertionClearanceMm: constraints.shellFeatures?.maxInsertionClearanceMm ?? null
      },
      clearances: {
        keepoutVolumeCount: Number(constraints.clearances?.keepoutVolumeCount || descriptor.keepouts?.length || 0),
        accessVolumeCount: Number(constraints.clearances?.accessVolumeCount || descriptor.accessVolumes?.length || 0)
      },
      sourceEvidence: {
        sourceConfidence: constraints.sourceEvidence?.sourceConfidence || constraints.trustLevel || "unknown",
        sourceType: descriptor.librarySource?.type || descriptor.sourceEvidence?.sourceType || "",
        workspaceDraft: clone(descriptor.librarySource?.workspaceDraft || null),
        workspaceDraftIntegrity: packageReport.sourceEvidence.workspaceDraftIntegrity,
        vendorAssetAvailable: constraints.sourceEvidence?.vendorAssetAvailable === true,
        proxyAssetAvailable: constraints.sourceEvidence?.proxyAssetAvailable === true,
        descriptorPath: descriptor.descriptorPath || constraints.descriptorPath || "",
        sourcesPath: descriptor.sourcesPath || constraints.sourcesPath || ""
      },
      warnings: clone(constraints.warnings || [])
    },
    risk: {
      requiresManualValidation: Boolean(descriptor.risk?.requiresManualValidation),
      severity: descriptor.risk?.severity || "none",
      reason: descriptor.risk?.reason || ""
    },
    descriptorPackage: {
      packageStatus: packageReport.packageStatus,
      readyForSelection: packageReport.readyForSelection,
      readyForLibraryPromotion: packageReport.readyForLibraryPromotion,
      readyForReviewableGeneration: packageReport.readyForReviewableGeneration,
      blockingIssueCount: packageReport.blockingIssues.length,
      reviewWarningCount: packageReport.reviewWarnings.length,
      sourcesFilePresent: packageReport.sourceEvidence.sourcesFilePresent,
      directGeometryMutationAllowed: false
    }
  };
}

function componentPackageReport(descriptor, { loaded = true, workspaceId = "" } = {}) {
  const componentType = normalizeComponentType(descriptor.identity?.category || descriptor.category || descriptor.id);
  const supported = COMPONENT_TYPES.has(componentType);
  const constraints = descriptor.mechanicalConstraints || {};
  const validation = descriptor.schemaValidation || {};
  const validationErrors = Array.isArray(validation.errors) ? validation.errors : [];
  const validationWarnings = Array.isArray(validation.warnings) ? validation.warnings : [];
  const mechanicalWarnings = Array.isArray(constraints.warnings) ? constraints.warnings : [];
  const blockingIssues = [
    ...validationErrors.map((message) => ({
      code: "descriptor_validation_error",
      message
    }))
  ];
  if (!supported) {
    blockingIssues.push({
      code: "unsupported_component_type",
      message: `Component type ${componentType || "unknown"} is not supported by the current generator.`
    });
  }
  if (descriptor.reviewStatus === "draft") {
    blockingIssues.push({
      code: "descriptor_review_status_draft",
      message: "Descriptor reviewStatus is draft; fill supported mechanical fields and mark it reviewable before promotion."
    });
  }
  blockingIssues.push(...descriptorPreviewDimensionBlockingIssues(descriptor));
  blockingIssues.push(...descriptorLocalPositionBlockingIssues(descriptor));

  const risk = {
    requiresManualValidation: Boolean(descriptor.risk?.requiresManualValidation),
    severity: descriptor.risk?.severity || "none",
    reason: descriptor.risk?.reason || ""
  };
  const reviewWarnings = [
    ...validationWarnings.map((message) => ({
      code: "descriptor_validation_warning",
      message
    })),
    ...mechanicalWarnings.map((message) => ({
      code: "mechanical_constraint_warning",
      message
    }))
  ];
  if (constraints.requiresHumanValidation !== false) {
    reviewWarnings.push({
      code: "human_validation_required",
      message: "Descriptor is reviewable proxy data and requires human validation before production use."
    });
  }
  if (risk.requiresManualValidation) {
    reviewWarnings.push({
      code: "manual_risk_review_required",
      message: risk.reason || "Component is a manual-review risk item."
    });
  }

  const readyForLibraryPromotion = supported && validation.valid === true && blockingIssues.length === 0;
  const readyForSelection = loaded && readyForLibraryPromotion;
  const packageStatus = blockingIssues.length > 0
    ? "blocked"
    : (constraints.productionReady === true && constraints.requiresHumanValidation === false
      ? "production_ready"
      : "reviewable");
  const workspaceDraftIntegrity = descriptor.librarySource?.workspaceDraft
    ? workspaceDraftIntegrityStatus({
      workspaceId,
      workspaceDraft: descriptor.librarySource.workspaceDraft
    })
    : null;

  return {
    componentId: descriptor.id,
    componentType,
    displayName: descriptor.displayName || descriptor.identity?.displayName || descriptor.id,
    packageStatus,
    supported,
    readyForSelection,
    readyForLibraryPromotion,
    readyForReviewableGeneration: readyForSelection,
    productionReady: constraints.productionReady === true,
    assetQuality: descriptor.assetQuality || "",
    validationStatus: descriptor.validationStatus || "",
    descriptorValidation: {
      valid: validation.valid === true,
      errors: clone(validationErrors),
      warnings: clone(validationWarnings)
    },
    sourceEvidence: {
      descriptorPath: descriptor.descriptorPath || "",
      sourcesPath: descriptor.sourcesPath || "",
      sourcesFilePresent: validationErrors.every((error) => !String(error).includes("companion source notes file is missing")),
      sourceType: descriptor.librarySource?.type || descriptor.sourceEvidence?.sourceType || "",
      workspaceDraft: clone(descriptor.librarySource?.workspaceDraft || null),
      workspaceDraftIntegrity,
      sourceConfidence: descriptor.sourceNotes?.confidence || constraints.sourceEvidence?.sourceConfidence || constraints.trustLevel || "unknown",
      summary: descriptor.sourceNotes?.summary || ""
    },
    mechanicalCoverage: {
      dimensionsPresent: hasPositiveDimensions(descriptor.dimensionsMm || constraints.dimensionsMm || {}),
      mountingMethod: constraints.mounting?.method || descriptor.mechanicalProxy?.mountingMethod || "",
      mountingHoleCount: Number(descriptor.mountingHoles?.length || constraints.mounting?.holeCount || 0),
      connectorCount: Number(descriptor.connectors?.length || constraints.interfaces?.connectorCount || 0),
      matingEndpointCount: (descriptor.connectors || []).reduce((count, connector) => count + (connector.mating || []).length, 0),
      externalFeatureCount: Number(descriptor.externalFeatures?.length || constraints.shellFeatures?.externalFeatureCount || 0),
      keepoutVolumeCount: Number(descriptor.keepouts?.length || constraints.clearances?.keepoutVolumeCount || 0),
      accessVolumeCount: Number(descriptor.accessVolumes?.length || constraints.clearances?.accessVolumeCount || 0),
      cableExitDirectionCount: Number(descriptor.cableExitDirections?.length || 0)
    },
    replacementPolicy: {
      canSelectSameType: readyForSelection,
      componentPreferencePath: supported ? `componentPreferences.${componentType}` : "",
      requiresProductPlanRevision: true,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false,
      newCategoryRequiresCodeSupport: !supported,
      loadedLibraryRequired: !loaded,
      readyAfterLibraryPromotion: readyForLibraryPromotion
    },
    blockingIssues,
    reviewWarnings,
    risk
  };
}

function productPlanForOptionalWorkspace(workspaceId = "") {
  if (!workspaceId) return createEmptyProductPlan();
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return createEmptyProductPlan();
  return productPlanWithWorkspaceLibrary(planResult.plan);
}

function productPlanWithWorkspaceLibrary(plan, baseProductPlan = null) {
  const base = clone(baseProductPlan || currentRevision(plan)?.productPlanSnapshot || plan?.workspaceState?.productPlan || createEmptyProductPlan());
  const workspaceLibrary = normalizeProductPlanComponentLibrary(plan?.workspaceState?.productPlan?.componentLibrary);
  const baseLibrary = normalizeProductPlanComponentLibrary(base.componentLibrary);
  const byId = new Map();
  for (const entry of baseLibrary.descriptors) byId.set(componentIdForDescriptorEntry(entry), entry);
  for (const entry of workspaceLibrary.descriptors) byId.set(componentIdForDescriptorEntry(entry), entry);
  base.componentLibrary = {
    version: "product_plan_component_library_v1",
    descriptors: [...byId.values()].filter((entry) => componentIdForDescriptorEntry(entry))
  };
  if (plan?.workspaceState?.productPlan && Object.hasOwn(plan.workspaceState.productPlan, "componentPreferences")) {
    base.componentPreferences = clone(plan.workspaceState.productPlan.componentPreferences || {});
  }
  return base;
}

function normalizeProductPlanComponentLibrary(componentLibrary = {}) {
  return {
    version: componentLibrary?.version || "product_plan_component_library_v1",
    descriptors: Array.isArray(componentLibrary?.descriptors)
      ? componentLibrary.descriptors.map((entry) => clone(entry)).filter(Boolean)
      : []
  };
}

function productPlanComponentLibraryStatus(componentLibrary = {}) {
  const library = normalizeProductPlanComponentLibrary(componentLibrary);
  const activeDescriptorCount = library.descriptors.filter((entry) => entry?.active !== false && entry?.status !== "retired").length;
  const retiredDescriptorCount = library.descriptors.filter((entry) => entry?.active === false || entry?.status === "retired").length;
  return {
    scope: "product_plan",
    descriptorCount: library.descriptors.length,
    activeDescriptorCount,
    retiredDescriptorCount
  };
}

function componentIdForDescriptorEntry(entry = {}) {
  return entry.componentId || entry.descriptor?.identity?.id || entry.descriptor?.id || entry.identity?.id || entry.id || "";
}

function componentPreferenceKeyForType(componentType = "") {
  const map = {
    core_board: "core_board",
    display: "display",
    usb_c: "usb_c",
    ambient_sensor: "ambient_sensor",
    button: "button",
    buzzer: "speaker",
    speaker: "speaker",
    camera: "camera",
    battery: "battery"
  };
  return map[componentType] || "";
}

function descriptorCategoryForComponentType(componentType = "") {
  const normalized = normalizeComponentType(componentType);
  const map = {
    usb_c: "interface",
    ambient_sensor: "sensor",
    buzzer: "speaker"
  };
  return map[normalized] || normalized;
}

function scaffoldDescriptorTemplate({
  draftId = "",
  componentType = "",
  displayName = "",
  reviewedDate = ""
} = {}) {
  return {
    schemaVersion: "component_descriptor_v2",
    identity: {
      id: draftId,
      displayName,
      category: componentType,
      legacyCategory: legacyCategoryForDescriptorCategory(componentType),
      manufacturer: "TODO manufacturer or module source",
      partNumber: "TODO part number"
    },
    versioning: {
      descriptorVersion: "0.0.1-draft",
      updated: reviewedDate,
      compatibility: [
        "reviewable_same_type_replacement_after_completion"
      ]
    },
    assetQuality: "procedural_proxy",
    validationStatus: "unverified_proxy",
    dimensionsMm: {
      width: 0,
      height: 0,
      depth: 0
    },
    coordinateSystem: {
      origin: "component_center",
      units: "mm",
      x: "width",
      y: "height",
      z: "depth",
      front: "+z"
    },
    visualProxy: {
      shape: visualProxyShapeForDescriptorCategory(componentType),
      materialHint: "draft_component",
      appearanceLayerVisible: true,
      componentLayerOpacity: 1
    },
    mechanicalProxy: {
      bodyType: mechanicalBodyTypeForDescriptorCategory(componentType),
      mountingMethod: "TODO mounting method"
    },
    mountingHoles: [],
    connectors: [],
    interfaces: [],
    externalFeatures: [],
    keepouts: [],
    accessVolumes: [],
    cableExitDirections: [],
    riskFlags: {
      requiresManualValidation: true,
      severity: "medium",
      warnings: [
        "Draft scaffold only. Fill dimensions, mounting, connectors, shell features, keepouts, access volumes, cable exits, and source evidence before promotion."
      ]
    },
    assetPaths: {
      proxyVisualGlb: null,
      proxyMechanicalStep: null,
      vendorGlb: null,
      vendorStep: null
    },
    sourceNotes: {
      summary: "TODO summarize the source measurements and what is still unverified.",
      sourcesFile: "sources.md",
      confidence: "draft_template"
    },
    trustLevel: "proxy_seed",
    reviewStatus: "draft",
    sourceEvidence: {
      sourceType: "workspace_descriptor_draft",
      sourceConfidence: "draft_template",
      measurementBasis: "TODO datasheet, caliper measurement, vendor CAD, or proxy assumption",
      lastReviewed: reviewedDate,
      references: [
        {
          kind: "local_source_note",
          path: "sources.md"
        }
      ]
    }
  };
}

function scaffoldSourcesTemplate({
  draftId = "",
  componentType = "",
  displayName = "",
  reviewedDate = ""
} = {}) {
  return [
    `# ${draftId} sources`,
    "",
    `Received date: ${reviewedDate}`,
    `Component type: ${normalizeComponentType(componentType)}`,
    `Display name: ${displayName}`,
    "Status: draft scaffold, not ready for ProductPlan selection or 3D generation.",
    "",
    "## Required Measurements",
    "",
    "- Overall body dimensions in mm: width, height, depth",
    "- Mounting method and mounting hole positions/diameters, if any",
    "- Connector ids, connector local positions, mating endpoints, and cable exit directions",
    "- Required shell openings or external access features",
    "- Keepout and access volumes needed for assembly/service",
    "- Manual-review risk flags such as battery, camera, heat, or moving structures",
    "",
    "## Source Evidence",
    "",
    "- Datasheet or vendor page:",
    "- Measurement basis:",
    "- Reviewer:",
    "- Notes:",
    "",
    "Promotion checklist: fill descriptor.json, keep this sources.md referenced by sourceEvidence.references, change reviewStatus from draft to reviewable, then run descriptor-drafts before descriptor-promote.",
    ""
  ].join("\n");
}

function descriptorAuthoringChecklist(componentType = "") {
  return [
    "Fill dimensionsMm.width/height/depth with positive millimeter values.",
    "Replace TODO mounting, connector, shell-feature, keepout, access-volume, and cable-exit fields with supported descriptor data.",
    "Keep sources.md as the companion source note and cite it in sourceEvidence.references.",
    "Set sourceEvidence.measurementBasis to the real measurement basis.",
    "Change reviewStatus from draft to reviewable only after the supported fields are filled.",
    `Run descriptor-drafts and promote only when readyForLibraryPromotion is true for ${normalizeComponentType(componentType)}.`
  ];
}

function referenceDescriptorForDraft({
  componentType = "",
  baseComponentId = "",
  productPlan = {}
} = {}) {
  const requestedBaseId = String(baseComponentId || "").trim();
  const normalizedType = normalizeComponentType(componentType);
  const descriptors = listSelectableComponentDescriptors(productPlan);
  const byId = requestedBaseId
    ? descriptors.find((descriptor) => descriptor.id === requestedBaseId)
    : null;
  const reference = byId || descriptors.find((descriptor) => normalizeComponentType(descriptor.identity?.category || descriptor.type || descriptor.category) === normalizedType);
  if (!reference) {
    return fail("REFERENCE_DESCRIPTOR_MISSING", `No supported reference descriptor is available for ${normalizedType || componentType || "unknown component type"}.`);
  }
  const referenceType = normalizeComponentType(reference.identity?.category || reference.type || reference.category || "");
  if (normalizedType && referenceType !== normalizedType) {
    return fail("REFERENCE_DESCRIPTOR_TYPE_MISMATCH", `Reference descriptor ${reference.id} is ${referenceType}, not ${normalizedType}.`);
  }
  return ok({ descriptor: reference });
}

function descriptorFromReferenceAndSpecs({
  draftId = "",
  currentDescriptor = {},
  referenceDescriptor = {},
  extracted = {},
  markReviewable = false,
  reviewedDate = ""
} = {}) {
  const descriptor = clone(referenceDescriptor);
  const category = currentDescriptor.identity?.category || referenceDescriptor.identity?.category || "";
  const displayName = extracted.displayName
    || currentDescriptor.identity?.displayName
    || titleFromDraftId(draftId);
  descriptor.schemaVersion = "component_descriptor_v2";
  descriptor.identity = {
    ...(descriptor.identity || {}),
    id: draftId,
    displayName,
    category,
    legacyCategory: currentDescriptor.identity?.legacyCategory || legacyCategoryForDescriptorCategory(category),
    manufacturer: extracted.manufacturer || currentDescriptor.identity?.manufacturer || descriptor.identity?.manufacturer || "user supplied source",
    partNumber: extracted.partNumber || currentDescriptor.identity?.partNumber || descriptor.identity?.partNumber || draftId
  };
  descriptor.versioning = {
    ...(descriptor.versioning || {}),
    descriptorVersion: markReviewable ? "0.1.0-reviewable-spec" : "0.0.2-spec-draft",
    updated: reviewedDate,
    compatibility: [
      "reviewable_same_type_replacement_after_spec_patch"
    ]
  };
  descriptor.dimensionsMm = extracted.dimensionsMm || currentDescriptor.dimensionsMm || descriptor.dimensionsMm || {};
  descriptor.mountingHoles = mountingHolesWithExtractedSpecs({
    mountingHoles: descriptor.mountingHoles || [],
    pitchMm: extracted.mountingHolePitchMm,
    diameterMm: extracted.mountingHoleDiameterMm,
    depthMm: Number(descriptor.dimensionsMm?.depth || 0),
    defaultDiameterMm: descriptor.mechanicalProxy?.defaultHoleDiameterMm
  });
  const connectorPatch = connectorsWithExtractedPositions({
    connectors: descriptor.connectors || [],
    connectorPositionSpecs: extracted.connectorPositionSpecs
  });
  descriptor.connectors = connectorPatch.connectors;
  if (connectorPatch.appliedIds.length > 0 && !extracted.fieldNames?.includes("connectorPositionLocalMm")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("connectorPositionLocalMm");
  }
  const connectorOrientationPatch = connectorsWithExtractedOrientations({
    connectors: descriptor.connectors || [],
    connectorOrientationSpecs: extracted.connectorOrientationSpecs
  });
  descriptor.connectors = connectorOrientationPatch.connectors;
  if (connectorOrientationPatch.appliedIds.length > 0 && !extracted.fieldNames?.includes("connectorOrientation")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("connectorOrientation");
  }
  const externalFeaturePatch = externalFeaturesWithExtractedSpecs({
    externalFeatures: descriptor.externalFeatures || [],
    openingSizeMm: extracted.openingSizeMm,
    externalFeaturePositionSpecs: extracted.externalFeaturePositionSpecs,
    depthMm: Number(descriptor.dimensionsMm?.depth || 0)
  });
  descriptor.externalFeatures = externalFeaturePatch.externalFeatures;
  if (externalFeaturePatch.appliedPositionIds.length > 0 && !extracted.fieldNames?.includes("externalFeaturePositionLocalMm")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("externalFeaturePositionLocalMm");
  }
  const keepoutPatch = volumesWithExtractedSpecs({
    volumes: descriptor.keepouts || [],
    volumeSpecs: extracted.keepoutVolumeSpecs
  });
  descriptor.keepouts = keepoutPatch.volumes;
  if (keepoutPatch.appliedIds.length > 0 && !extracted.fieldNames?.includes("keepoutVolumeSpec")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("keepoutVolumeSpec");
  }
  const accessVolumePatch = volumesWithExtractedSpecs({
    volumes: descriptor.accessVolumes || [],
    volumeSpecs: extracted.accessVolumeSpecs
  });
  descriptor.accessVolumes = accessVolumePatch.volumes;
  if (accessVolumePatch.appliedIds.length > 0 && !extracted.fieldNames?.includes("accessVolumeSpec")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("accessVolumeSpec");
  }
  const cableExitPatch = cableExitDirectionsWithExtractedSpecs({
    cableExitDirections: descriptor.cableExitDirections || [],
    cableExitDirectionSpecs: extracted.cableExitDirectionSpecs
  });
  descriptor.cableExitDirections = cableExitPatch.cableExitDirections;
  if (cableExitPatch.appliedConnectorIds.length > 0 && !extracted.fieldNames?.includes("cableExitDirection")) {
    extracted.fieldNames ||= [];
    extracted.fieldNames.push("cableExitDirection");
  }
  descriptor.sourceNotes = {
    ...(descriptor.sourceNotes || {}),
    summary: extracted.summary || `Workspace descriptor draft ${draftId} filled from explicit user-provided specs.`,
    sourcesFile: "sources.md",
    confidence: markReviewable ? "descriptor_reviewed" : "draft_template"
  };
  descriptor.assetQuality = "mechanical_proxy";
  descriptor.validationStatus = markReviewable ? "descriptor_reviewed" : "unverified_proxy";
  descriptor.trustLevel = markReviewable ? "descriptor_reviewed_proxy" : "proxy_seed";
  descriptor.reviewStatus = markReviewable ? "reviewable" : "draft";
  descriptor.sourceEvidence = {
    ...(descriptor.sourceEvidence || {}),
    sourceType: "workspace_descriptor_draft",
    sourceConfidence: descriptor.sourceNotes.confidence,
    measurementBasis: extracted.measurementBasis || "user_supplied_spec_text",
    lastReviewed: reviewedDate,
    references: [
      {
        kind: "local_source_note",
        path: "sources.md"
      }
    ]
  };
  descriptor.riskFlags = {
    ...(descriptor.riskFlags || {}),
    requiresManualValidation: true,
    severity: descriptor.riskFlags?.severity || "medium",
    warnings: [
      "Workspace draft was filled from explicit source text and remains reviewable proxy data, not a production-verified component package."
    ]
  };
  return descriptor;
}

function externalFeaturesWithExtractedSpecs({
  externalFeatures = [],
  openingSizeMm = [],
  externalFeaturePositionSpecs = [],
  depthMm = 0
} = {}) {
  const features = Array.isArray(externalFeatures) ? clone(externalFeatures) : [];
  let patched = features;
  if (Array.isArray(openingSizeMm) && openingSizeMm.length === 2) {
    const firstOpeningIndex = patched.findIndex((feature) => Array.isArray(feature.openingSizeMm));
    if (firstOpeningIndex >= 0) {
      patched[firstOpeningIndex] = {
        ...patched[firstOpeningIndex],
        openingSizeMm
      };
    } else {
      patched = [
        ...patched,
        {
          id: "draft_opening",
          type: "component_opening",
          face: "front",
          positionLocalMm: [0, 0, Number(depthMm || 0) / 2],
          openingSizeMm
        }
      ];
    }
  }
  const appliedPositionIds = [];
  for (const spec of externalFeaturePositionSpecs || []) {
    const id = String(spec?.id || "").trim();
    const positionLocalMm = spec?.positionLocalMm;
    if (!id || !Array.isArray(positionLocalMm) || positionLocalMm.length !== 3) continue;
    const index = patched.findIndex((feature) => feature.id === id || feature.type === id);
    if (index < 0) continue;
    patched[index] = {
      ...patched[index],
      positionLocalMm: positionLocalMm.map((value) => Number(value))
    };
    appliedPositionIds.push(patched[index].id || id);
  }
  return {
    externalFeatures: patched,
    appliedPositionIds
  };
}

function extractExternalFeaturePositionSpecs(text = "") {
  const specs = [];
  const chunks = String(text || "").split(/[;\n]+/);
  for (const chunk of chunks) {
    const parsed = parseExternalFeaturePositionChunk(chunk);
    if (parsed) specs.push(parsed);
  }
  return specs;
}

function parseExternalFeaturePositionChunk(chunk = "") {
  const text = String(chunk || "").trim();
  if (!text) return null;
  const labeled = text.match(/(?:external\s+feature|feature|opening|cutout|window|hole|开孔|窗口|孔位|外部特征)\s+([A-Za-z0-9_.-]+).{0,80}?(?:positionLocalMm|position|pos|位置|坐标)\s*[:：=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (labeled) return externalFeaturePositionSpecFromMatch(labeled);

  const reverse = text.match(/([A-Za-z0-9_.-]+)\s+(?:external\s+feature|feature|opening|cutout|window|hole|开孔|窗口|孔位|外部特征).{0,80}?(?:positionLocalMm|position|pos|位置|坐标)\s*[:：=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (reverse) return externalFeaturePositionSpecFromMatch(reverse);

  const axes = text.match(/(?:external\s+feature|feature|opening|cutout|window|hole|开孔|窗口|孔位|外部特征)\s+([A-Za-z0-9_.-]+).{0,80}?x\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?y\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?z\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (axes) return externalFeaturePositionSpecFromMatch(axes);
  return null;
}

function externalFeaturePositionSpecFromMatch(match = []) {
  const id = String(match[1] || "").trim();
  const positionLocalMm = [Number(match[2]), Number(match[3]), Number(match[4])];
  if (!id || positionLocalMm.some((value) => !Number.isFinite(value))) return null;
  return {
    id,
    positionLocalMm
  };
}

function volumesWithExtractedSpecs({
  volumes = [],
  volumeSpecs = []
} = {}) {
  const patched = Array.isArray(volumes) ? clone(volumes) : [];
  const appliedIds = [];
  for (const spec of volumeSpecs || []) {
    const id = String(spec?.id || "").trim();
    if (!id) continue;
    const index = patched.findIndex((volume) => volume.id === id || volume.type === id);
    if (index < 0) continue;
    const next = { ...patched[index] };
    if (Array.isArray(spec.sizeMm) && spec.sizeMm.length === 3) {
      next.sizeMm = spec.sizeMm.map((value) => Number(value));
    }
    if (Array.isArray(spec.positionLocalMm) && spec.positionLocalMm.length === 3) {
      next.positionLocalMm = spec.positionLocalMm.map((value) => Number(value));
    }
    patched[index] = next;
    appliedIds.push(next.id || id);
  }
  return { volumes: patched, appliedIds };
}

function mountingHolesWithExtractedSpecs({
  mountingHoles = [],
  pitchMm = null,
  diameterMm = null,
  depthMm = 0,
  defaultDiameterMm = 2.4
} = {}) {
  const holes = Array.isArray(mountingHoles) ? clone(mountingHoles) : [];
  const diameter = positiveNumberOrNull(diameterMm)
    || positiveNumberOrNull(defaultDiameterMm)
    || 2.4;
  if (Array.isArray(pitchMm) && pitchMm.length === 2 && pitchMm.every((value) => Number(value) > 0)) {
    const halfX = Number(pitchMm[0]) / 2;
    const halfY = Number(pitchMm[1]) / 2;
    const z = inferMountingHoleZ({ mountingHoles: holes, depthMm });
    return [
      { id: "mount_tl", positionLocalMm: [-halfX, halfY, z], diameterMm: diameter },
      { id: "mount_tr", positionLocalMm: [halfX, halfY, z], diameterMm: diameter },
      { id: "mount_bl", positionLocalMm: [-halfX, -halfY, z], diameterMm: diameter },
      { id: "mount_br", positionLocalMm: [halfX, -halfY, z], diameterMm: diameter }
    ];
  }
  if (positiveNumberOrNull(diameterMm) && holes.length > 0) {
    return holes.map((hole, index) => ({
      ...hole,
      id: hole.id || `mount_${index + 1}`,
      diameterMm: Number(diameterMm)
    }));
  }
  return holes;
}

function connectorsWithExtractedPositions({
  connectors = [],
  connectorPositionSpecs = []
} = {}) {
  const patched = Array.isArray(connectors) ? clone(connectors) : [];
  const appliedIds = [];
  for (const spec of connectorPositionSpecs || []) {
    const id = String(spec?.id || "").trim();
    const positionLocalMm = spec?.positionLocalMm;
    if (!id || !Array.isArray(positionLocalMm) || positionLocalMm.length !== 3) continue;
    const index = patched.findIndex((connector) => connector.id === id);
    if (index < 0) continue;
    patched[index] = {
      ...patched[index],
      positionLocalMm: positionLocalMm.map((value) => Number(value))
    };
    appliedIds.push(id);
  }
  return { connectors: patched, appliedIds };
}

function connectorsWithExtractedOrientations({
  connectors = [],
  connectorOrientationSpecs = []
} = {}) {
  const patched = Array.isArray(connectors) ? clone(connectors) : [];
  const appliedIds = [];
  for (const spec of connectorOrientationSpecs || []) {
    const id = String(spec?.id || "").trim();
    const orientation = normalizedDirectionToken(spec?.orientation);
    if (!id || !orientation) continue;
    const index = patched.findIndex((connector) => connector.id === id);
    if (index < 0) continue;
    patched[index] = {
      ...patched[index],
      orientation
    };
    appliedIds.push(id);
  }
  return { connectors: patched, appliedIds };
}

function cableExitDirectionsWithExtractedSpecs({
  cableExitDirections = [],
  cableExitDirectionSpecs = []
} = {}) {
  const patched = Array.isArray(cableExitDirections) ? clone(cableExitDirections) : [];
  const appliedConnectorIds = [];
  for (const spec of cableExitDirectionSpecs || []) {
    const connectorId = String(spec?.connectorId || "").trim();
    const direction = normalizedDirectionToken(spec?.direction);
    if (!connectorId || !direction) continue;
    const index = patched.findIndex((cableExit) => cableExit.connectorId === connectorId);
    if (index < 0) continue;
    patched[index] = {
      ...patched[index],
      direction
    };
    appliedConnectorIds.push(connectorId);
  }
  return { cableExitDirections: patched, appliedConnectorIds };
}

function inferMountingHoleZ({ mountingHoles = [], depthMm = 0 } = {}) {
  const firstZ = mountingHoles.find((hole) => Array.isArray(hole.positionLocalMm) && Number.isFinite(Number(hole.positionLocalMm[2])))?.positionLocalMm?.[2];
  if (Number.isFinite(Number(firstZ))) return Number(firstZ);
  const depth = Number(depthMm || 0);
  return depth > 0 ? -depth / 2 : 0;
}

function extractDescriptorSpecs(specsText = "") {
  const text = String(specsText || "");
  const dimensionsMm = parseThreeAxisMm(text, [
    /(?:dimensions?|body|size|overall)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i,
    /(?:width|w)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm?[,\s;]+(?:height|h)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm?[,\s;]+(?:depth|d|thickness)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm?/i
  ]);
  const openingSizeMm = parseTwoAxisMm(text, [
    /(?:opening|hole|cutout)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i,
    /(?:opening|hole|cutout)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm/i,
    /(?:开孔|孔位|孔径)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i,
    /(?:开孔|孔位|孔径)\s*[:：]?\s*(\d+(?:\.\d+)?)\s*mm/i
  ]);
  const mountingHolePitchMm = parseTwoAxisMm(text, [
    /(?:mounting\s+holes?|mount\s+holes?|screw\s+holes?|standoff\s+holes?).{0,80}?(?:pitch|spacing|center(?:-| )?to(?:-| )?center|c[- ]?c)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i,
    /(?:mounting\s+(?:pitch|spacing)|mounting\s+hole\s+pattern|hole\s+spacing)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i,
    /(?:安装孔距|安装孔位|螺丝孔距|固定孔距)\s*[:：=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i
  ]);
  const mountingHoleDiameterMm = parseOneAxisMm(text, [
    /(?:mounting\s+holes?|mount\s+holes?|screw\s+holes?|standoff\s+holes?).{0,80}?(?:diameter|dia\.?|ø|Ø|d)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm/i,
    /(?:diameter|dia\.?|ø|Ø)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*mm.{0,80}?(?:mounting\s+holes?|mount\s+holes?|screw\s+holes?|standoff\s+holes?)/i,
    /(?:安装孔|螺丝孔|固定孔).{0,40}?(?:孔径|直径|ø|Ø)\s*[:：=]?\s*(\d+(?:\.\d+)?)\s*mm/i,
    /(?:孔径|直径|ø|Ø)\s*[:：=]?\s*(\d+(?:\.\d+)?)\s*mm.{0,40}?(?:安装孔|螺丝孔|固定孔)/i
  ]);
  const connectorPositionSpecs = extractConnectorPositionSpecs(text);
  const connectorOrientationSpecs = extractConnectorOrientationSpecs(text);
  const externalFeaturePositionSpecs = extractExternalFeaturePositionSpecs(text);
  const keepoutVolumeSpecs = extractVolumeSpecs(text, {
    labelPattern: "keepout(?:\\s+volume)?|keepout\\s+zone|clearance\\s+keepout|避让区|避让空间"
  });
  const accessVolumeSpecs = extractVolumeSpecs(text, {
    labelPattern: "access(?:\\s+volume)?|service\\s+access|wire\\s+access|connector\\s+access|维修空间|接入空间|服务空间|走线空间"
  });
  const cableExitDirectionSpecs = extractCableExitDirectionSpecs(text);
  const extracted = {
    dimensionsMm,
    openingSizeMm,
    mountingHolePitchMm,
    mountingHoleDiameterMm,
    connectorPositionSpecs,
    connectorOrientationSpecs,
    externalFeaturePositionSpecs,
    keepoutVolumeSpecs,
    accessVolumeSpecs,
    cableExitDirectionSpecs,
    manufacturer: extractLabeledValue(text, ["manufacturer", "maker", "vendor", "厂商", "制造商"]),
    partNumber: extractLabeledValue(text, ["part number", "part no", "pn", "型号", "料号"]),
    displayName: extractLabeledValue(text, ["display name", "name", "名称"]),
    measurementBasis: extractLabeledValue(text, ["measurement basis", "basis", "测量依据", "来源依据"]),
    reviewable: /\breviewable\b/i.test(text) || /可审核|可提升|已审核|reviewed/i.test(text)
  };
  const fieldNames = [];
  for (const [field, value] of Object.entries(extracted)) {
    if (["fieldNames", "connectorPositionSpecs", "connectorOrientationSpecs", "externalFeaturePositionSpecs", "keepoutVolumeSpecs", "accessVolumeSpecs", "cableExitDirectionSpecs"].includes(field)) continue;
    if (Array.isArray(value) ? value.length > 0 : Boolean(value)) fieldNames.push(field);
  }
  return {
    ...extracted,
    fieldNames
  };
}

function extractVolumeSpecs(text = "", { labelPattern = "" } = {}) {
  const specsById = new Map();
  const chunks = String(text || "").split(/[;\n]+/);
  for (const chunk of chunks) {
    const parsed = parseVolumeSpecChunk(chunk, { labelPattern });
    if (!parsed) continue;
    const existing = specsById.get(parsed.id) || { id: parsed.id };
    specsById.set(parsed.id, {
      ...existing,
      ...parsed,
      sizeMm: parsed.sizeMm || existing.sizeMm,
      positionLocalMm: parsed.positionLocalMm || existing.positionLocalMm
    });
  }
  return [...specsById.values()].filter((spec) => spec.sizeMm || spec.positionLocalMm);
}

function parseVolumeSpecChunk(chunk = "", { labelPattern = "" } = {}) {
  const text = String(chunk || "").trim();
  if (!text || !labelPattern) return null;
  const idPattern = new RegExp(`(?:${labelPattern})\\s+([A-Za-z0-9_.-]+)`, "i");
  const idMatch = text.match(idPattern);
  if (!idMatch?.[1]) return null;
  const sizeMm = parseThreeAxisMm(text, [
    /(?:sizeMm|size|volume|clearance|尺寸|大小|空间)\s*[:：=]?\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*(?:mm)?\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm?/i
  ]);
  const positionLocalMm = parsePositionTriplet(text);
  return {
    id: idMatch[1].trim(),
    ...(sizeMm ? { sizeMm: [sizeMm.width, sizeMm.height, sizeMm.depth] } : {}),
    ...(positionLocalMm ? { positionLocalMm } : {})
  };
}

function extractConnectorPositionSpecs(text = "") {
  const specs = [];
  const chunks = String(text || "").split(/[;\n]+/);
  for (const chunk of chunks) {
    const parsed = parseConnectorPositionChunk(chunk);
    if (parsed) specs.push(parsed);
  }
  return specs;
}

function extractConnectorOrientationSpecs(text = "") {
  const specs = [];
  const chunks = String(text || "").split(/[;\n]+/);
  for (const chunk of chunks) {
    const parsed = parseConnectorOrientationChunk(chunk);
    if (parsed) specs.push(parsed);
  }
  return specs;
}

function extractCableExitDirectionSpecs(text = "") {
  const specs = [];
  const chunks = String(text || "").split(/[;\n]+/);
  for (const chunk of chunks) {
    const parsed = parseCableExitDirectionChunk(chunk);
    if (parsed) specs.push(parsed);
  }
  return specs;
}

function parsePositionTriplet(text = "") {
  const compact = String(text || "");
  const labeled = compact.match(/(?:positionLocalMm|position|pos|位置|坐标)\s*[:：=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (labeled) return [Number(labeled[1]), Number(labeled[2]), Number(labeled[3])];
  const axes = compact.match(/x\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?y\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?z\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (axes) return [Number(axes[1]), Number(axes[2]), Number(axes[3])];
  return null;
}

function parseConnectorOrientationChunk(chunk = "") {
  const text = String(chunk || "").trim();
  if (!text) return null;
  const labeled = text.match(/(?:connector|连接器|接口)\s+([A-Za-z0-9_.-]+).{0,80}?(?:orientation|facing|朝向)\s*[:：=]?\s*([A-Za-z0-9_+.-]+)/i);
  if (labeled) return connectorOrientationSpecFromMatch(labeled);

  const reverse = text.match(/([A-Za-z0-9_.-]+)\s+(?:connector|连接器|接口).{0,80}?(?:orientation|facing|朝向)\s*[:：=]?\s*([A-Za-z0-9_+.-]+)/i);
  if (reverse) return connectorOrientationSpecFromMatch(reverse);
  return null;
}

function connectorOrientationSpecFromMatch(match = []) {
  const id = String(match[1] || "").trim();
  const orientation = normalizedDirectionToken(match[2]);
  if (!id || !orientation) return null;
  return { id, orientation };
}

function parseCableExitDirectionChunk(chunk = "") {
  const text = String(chunk || "").trim();
  if (!text) return null;
  const labeled = text.match(/(?:cable\s+exit(?:\s+direction)?|cableExitDirection|wire\s+exit|线缆出口|出线方向|走线方向)\s+([A-Za-z0-9_.-]+).{0,80}?(?:direction|dir|方向)\s*[:：=]?\s*([A-Za-z0-9_+.-]+)/i);
  if (labeled) return cableExitDirectionSpecFromMatch(labeled);

  const compact = text.match(/(?:cable\s+exit(?:\s+direction)?|cableExitDirection|wire\s+exit|线缆出口|出线方向|走线方向)\s+([A-Za-z0-9_.-]+)\s+([A-Za-z0-9_+.-]+)/i);
  if (compact) return cableExitDirectionSpecFromMatch(compact);

  const reverse = text.match(/([A-Za-z0-9_.-]+)\s+(?:cable\s+exit(?:\s+direction)?|cableExitDirection|wire\s+exit|线缆出口|出线方向|走线方向).{0,80}?(?:direction|dir|方向)\s*[:：=]?\s*([A-Za-z0-9_+.-]+)/i);
  if (reverse) return cableExitDirectionSpecFromMatch(reverse);

  const reverseCompact = text.match(/([A-Za-z0-9_.-]+)\s+(?:cable\s+exit(?:\s+direction)?|cableExitDirection|wire\s+exit|线缆出口|出线方向|走线方向)\s+([A-Za-z0-9_+.-]+)/i);
  if (reverseCompact) return cableExitDirectionSpecFromMatch(reverseCompact);
  return null;
}

function cableExitDirectionSpecFromMatch(match = []) {
  const connectorId = String(match[1] || "").trim();
  const direction = normalizedDirectionToken(match[2]);
  if (!connectorId || !direction) return null;
  return { connectorId, direction };
}

function normalizedDirectionToken(value = "") {
  const token = String(value || "").trim();
  if (!/^[A-Za-z0-9_+.-]{1,48}$/.test(token)) return "";
  return token;
}

function parseConnectorPositionChunk(chunk = "") {
  const text = String(chunk || "").trim();
  if (!text) return null;
  const labeled = text.match(/(?:connector|连接器|接口)\s+([A-Za-z0-9_.-]+).{0,80}?(?:positionLocalMm|position|pos|位置|坐标)\s*[:：=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (labeled) return connectorPositionSpecFromMatch(labeled);

  const reverse = text.match(/([A-Za-z0-9_.-]+)\s+(?:connector|连接器|接口).{0,80}?(?:positionLocalMm|position|pos|位置|坐标)\s*[:：=]?\s*\[?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?\s*[,，x×\s]+\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (reverse) return connectorPositionSpecFromMatch(reverse);

  const axes = text.match(/(?:connector|连接器|接口)\s+([A-Za-z0-9_.-]+).{0,80}?x\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?y\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?.{0,30}?z\s*[:：=]?\s*(-?\d+(?:\.\d+)?)\s*(?:mm)?/i);
  if (axes) return connectorPositionSpecFromMatch(axes);
  return null;
}

function connectorPositionSpecFromMatch(match = []) {
  const id = String(match[1] || "").trim();
  const positionLocalMm = [Number(match[2]), Number(match[3]), Number(match[4])];
  if (!id || positionLocalMm.some((value) => !Number.isFinite(value))) return null;
  return { id, positionLocalMm };
}

function parseOneAxisMm(text = "", patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function parseThreeAxisMm(text = "", patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    return {
      width: Number(match[1]),
      height: Number(match[2]),
      depth: Number(match[3])
    };
  }
  return null;
}

function parseTwoAxisMm(text = "", patterns = []) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2] || match[1]);
    return [first, second];
  }
  return null;
}

function positiveNumberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function extractLabeledValue(text = "", labels = []) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:^|[;\\n,])\\s*${escaped}\\s*[:：=]\\s*([^;\\n,]+)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function appendSpecTextToSources({
  existingSourcesText = "",
  draftId = "",
  specsText = "",
  specsSourcePath = "",
  extracted = {},
  reviewedDate = ""
} = {}) {
  const base = String(existingSourcesText || "").trim() || `# ${draftId} sources`;
  const sourcePath = safeWorkspaceSourcePath(specsSourcePath);
  const extractedLines = extracted.fieldNames?.length
    ? extracted.fieldNames.map((field) => `- ${field}`)
    : ["- none"];
  return [
    base,
    "",
    `## Applied Spec Patch - ${reviewedDate}`,
    "",
    ...(sourcePath ? [`Source path: ${sourcePath}`, ""] : []),
    "Extracted fields:",
    ...extractedLines,
    "",
    "Raw source text:",
    "",
    "```text",
    String(specsText || "").trim(),
    "```",
    ""
  ].join("\n");
}

function safeWorkspaceSourcePath(value = "") {
  const normalized = String(value || "").trim().replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("://")) return "";
  const parts = normalized.split("/").filter(Boolean);
  if (!parts.length || parts.some((part) => part === "." || part === "..")) return "";
  return parts.join("/");
}

function legacyCategoryForDescriptorCategory(componentType = "") {
  const map = {
    display: "Display",
    core_board: "Core",
    interface: "Power",
    sensor: "Sensor",
    speaker: "Audio",
    camera: "Vision",
    battery: "Power",
    button: "Input"
  };
  return map[componentType] || "Component";
}

function visualProxyShapeForDescriptorCategory(componentType = "") {
  const map = {
    display: "screen",
    core_board: "pcb",
    interface: "connector_board",
    sensor: "sensor_block",
    speaker: "speaker_disc",
    camera: "camera_module",
    battery: "battery_pack",
    button: "button_cap"
  };
  return map[componentType] || "component_block";
}

function mechanicalBodyTypeForDescriptorCategory(componentType = "") {
  const map = {
    display: "panel_display",
    core_board: "pcb",
    interface: "connector_breakout",
    sensor: "sensor_module",
    speaker: "round_speaker",
    camera: "camera_module",
    battery: "battery_module",
    button: "panel_button"
  };
  return map[componentType] || "component_module";
}

function titleFromDraftId(draftId = "") {
  return String(draftId || "Draft Component")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listWorkspaceDraftIds({ workspaceId = "", draftId = "", limit = 20 } = {}) {
  const id = String(draftId || "").trim();
  if (id) {
    const safeId = safeDraftId(id);
    if (safeId !== id) return fail("INVALID_DRAFT_ID", `Invalid draftId: ${id}`);
    const packagePath = workspaceDraftPackagePath({ workspaceId, draftId: id });
    if (!existsSync(packagePath)) return fail("UNKNOWN_DESCRIPTOR_DRAFT", `Unknown workspace descriptor draft: ${id}`);
    return ok({ draftIds: [id] });
  }

  const draftsDir = join(projectWorkspacePath(workspaceId), "component-drafts");
  if (!existsSync(draftsDir)) return ok({ draftIds: [] });
  const resultLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const draftIds = readdirSync(draftsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => safeDraftId(name) === name)
    .sort()
    .slice(0, resultLimit);
  return ok({ draftIds });
}

function workspaceDraftReport({ workspaceId = "", draftId = "", productPlan = {} } = {}) {
  const packageResult = readWorkspaceDescriptorDraftPackage({ workspaceId, draftId });
  if (!packageResult.ok) {
    return {
      ok: false,
      draftId,
      error: packageResult.error
    };
  }
  const inspection = inspectComponentDescriptorDraft({
    descriptorJson: packageResult.descriptorJson,
    expectedId: draftId,
    sourcesText: packageResult.sourcesText
  });
  const promotion = workspaceDraftPromotionStatus({
    workspaceId,
    draftId,
    productPlan,
    componentId: inspection.componentId || ""
  });
  return {
    draftId,
    packagePath: packageResult.packagePath,
    descriptorPath: packageResult.descriptorPath,
    sourcesPath: packageResult.sourcesPath,
    descriptorFilePresent: packageResult.descriptorFilePresent,
    sourcesFilePresent: packageResult.sourcesFilePresent,
    packageIntegrity: {
      descriptorSha256: packageResult.descriptorSha256,
      sourcesSha256: packageResult.sourcesSha256,
      descriptorBytes: packageResult.descriptorBytes,
      sourcesBytes: packageResult.sourcesBytes
    },
    specPatch: latestWorkspaceDraftSpecPatch({
      workspaceId,
      draftId
    }),
    promotion,
    ...inspection
  };
}

function latestWorkspaceDraftSpecPatch({ workspaceId = "", draftId = "" } = {}) {
  const events = readWorkspaceEvents({ workspaceId });
  const event = [...events].reverse().find((item) => (
    item.type === "component_descriptor_draft_specs_applied"
      && item.payload?.draftId === draftId
  ));
  return compactSpecPatchEvent(event);
}

function compactSpecPatchEvent(event = null) {
  if (!event) {
    return {
      applied: false
    };
  }
  const payload = event.payload || {};
  return {
    applied: true,
    eventId: event.eventId || "",
    timestamp: event.timestamp || "",
    draftId: payload.draftId || "",
    componentId: payload.componentId || "",
    componentType: payload.componentType || "",
    baseComponentId: payload.baseComponentId || "",
    specsSourcePath: safeWorkspaceSourcePath(payload.specsSourcePath || ""),
    extractedFields: Array.isArray(payload.extractedFields) ? [...payload.extractedFields] : [],
    readyForLibraryPromotion: payload.readyForLibraryPromotion === true,
    blockingIssueCount: Number(payload.blockingIssueCount || 0),
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

function workspaceDraftPromotionStatus({
  workspaceId = "",
  draftId = "",
  productPlan = {},
  componentId = ""
} = {}) {
  const descriptors = Array.isArray(productPlan.componentLibrary?.descriptors)
    ? productPlan.componentLibrary.descriptors
    : [];
  const entry = descriptors.find((item) => (
    item?.source?.workspaceDraft?.draftId === draftId
      || componentIdForDescriptorEntry(item) === componentId
  ));
  if (!entry) {
    return {
      promoted: false,
      status: "not_promoted"
    };
  }
  return {
    promoted: true,
    componentId: componentIdForDescriptorEntry(entry),
    componentType: entry.componentType || entry.descriptor?.identity?.category || entry.descriptor?.type || "",
    status: entry.status || "",
    active: entry.active !== false && entry.status !== "retired",
    workspaceDraftIntegrity: workspaceDraftIntegrityStatus({
      workspaceId,
      workspaceDraft: entry.source?.workspaceDraft || null
    })
  };
}

function replacementAuditForPromotion({ previousEntry = null, replacedAt = "" } = {}) {
  if (!previousEntry) {
    return {
      replacedExisting: false,
      replacementCount: 0,
      directEditingAllowed: false
    };
  }
  return {
    replacedExisting: true,
    replacedAt,
    replacementCount: Number(previousEntry.replacement?.replacementCount || previousEntry.replacementHistory?.length || 0) + 1,
    previous: compactPromotedDescriptorEntry(previousEntry),
    directEditingAllowed: false
  };
}

function replacementHistoryForPromotion({ previousEntry = null, replacement = {} } = {}) {
  if (!previousEntry || replacement.replacedExisting !== true) return [];
  const history = Array.isArray(previousEntry.replacementHistory)
    ? clone(previousEntry.replacementHistory).slice(-9)
    : [];
  return [
    ...history,
    {
      replacedAt: replacement.replacedAt || "",
      previous: clone(replacement.previous || null),
      directEditingAllowed: false
    }
  ];
}

function compactPromotedDescriptorEntry(entry = {}) {
  const descriptor = entry.descriptor || {};
  const workspaceDraft = entry.source?.workspaceDraft || null;
  return {
    componentId: componentIdForDescriptorEntry(entry),
    componentType: entry.componentType || descriptor.identity?.category || descriptor.type || "",
    displayName: descriptor.identity?.displayName || descriptor.displayName || entry.componentId || "",
    descriptorVersion: descriptor.versioning?.descriptorVersion || descriptor.descriptorVersion || "",
    status: entry.status || "",
    active: entry.active !== false && entry.status !== "retired",
    promotedAt: entry.promotedAt || "",
    retiredAt: entry.retiredAt || "",
    sourceType: entry.source?.type || "",
    workspaceDraft: workspaceDraft ? workspaceDraftIntegritySnapshot(workspaceDraft) : null,
    directEditingAllowed: false
  };
}

function parseDescriptorDraftInput({ descriptor = null, descriptorJson = "" } = {}) {
  if (descriptor && typeof descriptor === "object" && !Array.isArray(descriptor)) {
    return { ok: true, descriptor: clone(descriptor) };
  }
  const jsonText = String(descriptorJson || "").trim();
  if (!jsonText) {
    return fail("INVALID_DESCRIPTOR_DRAFT", "descriptor or descriptorJson is required.");
  }
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fail("INVALID_DESCRIPTOR_DRAFT", "descriptorJson must parse to a JSON object.");
    }
    return { ok: true, descriptor: parsed };
  } catch (error) {
    return fail("INVALID_DESCRIPTOR_DRAFT", error instanceof Error ? error.message : "Invalid descriptorJson.");
  }
}

function knownConnectorIdsForDraft(rawDescriptor = {}) {
  const entries = listComponentDescriptors().map((descriptor) => [
    descriptor.id,
    new Set((descriptor.connectors || []).map((connector) => connector.id).filter(Boolean))
  ]);
  const draftId = rawDescriptor.identity?.id || rawDescriptor.id;
  if (draftId) {
    entries.push([
      draftId,
      new Set((rawDescriptor.connectors || []).map((connector) => connector.id).filter(Boolean))
    ]);
  }
  return new Map(entries);
}

function hasPositiveDimensions(dimensions = {}) {
  return Number(dimensions.width) > 0 && Number(dimensions.height) > 0 && Number(dimensions.depth) > 0;
}

function descriptorPreviewDimensionBlockingIssues(descriptor = {}) {
  const issues = [];
  const componentId = descriptor.id || descriptor.identity?.id || "descriptor";
  collectMinimumDimensionIssues({
    issues,
    componentId,
    source: "dimensionsMm",
    values: descriptor.dimensionsMm || {},
    fields: ["width", "height", "depth"]
  });
  for (const feature of descriptor.externalFeatures || []) {
    if (!Array.isArray(feature.openingSizeMm)) continue;
    collectMinimumDimensionIssues({
      issues,
      componentId,
      source: `externalFeatures.${feature.id || "feature"}.openingSizeMm`,
      values: feature.openingSizeMm,
      fields: ["width", "height"]
    });
    collectOpeningEnvelopeIssues({
      issues,
      componentId,
      feature,
      dimensions: descriptor.dimensionsMm || {}
    });
  }
  for (const [collectionName, items] of [
    ["keepouts", descriptor.keepouts || []],
    ["accessVolumes", descriptor.accessVolumes || []]
  ]) {
    for (const item of items) {
      if (!Array.isArray(item.sizeMm)) continue;
      collectMinimumDimensionIssues({
        issues,
        componentId,
        source: `${collectionName}.${item.id || "volume"}.sizeMm`,
        values: item.sizeMm,
        fields: ["width", "height", "depth"]
      });
    }
  }
  for (const hole of descriptor.mountingHoles || []) {
    collectMountingHoleEnvelopeIssues({
      issues,
      componentId,
      hole,
      dimensions: descriptor.dimensionsMm || {}
    });
  }
  return issues;
}

function collectOpeningEnvelopeIssues({
  issues,
  componentId = "descriptor",
  feature = {},
  dimensions = {}
} = {}) {
  const envelopeMax = Math.max(
    Number(dimensions.width || 0),
    Number(dimensions.height || 0),
    Number(dimensions.depth || 0)
  );
  if (!(envelopeMax > 0)) return;
  const maximumMm = envelopeMax + MAX_DESCRIPTOR_OPENING_OVERSIZE_MM;
  feature.openingSizeMm.forEach((value, index) => {
    const actual = Number(value);
    if (!Number.isFinite(actual) || actual <= maximumMm) return;
    issues.push({
      code: "descriptor_external_opening_exceeds_body_envelope",
      componentId,
      featureId: feature.id || "",
      source: `externalFeatures.${feature.id || "feature"}.openingSizeMm`,
      axis: index === 0 ? "width" : "height",
      actualMm: Number(actual.toFixed(3)),
      maximumMm: Number(maximumMm.toFixed(3)),
      envelopeMaxMm: Number(envelopeMax.toFixed(3)),
      allowedOversizeMm: MAX_DESCRIPTOR_OPENING_OVERSIZE_MM,
      message: `${componentId} ${feature.id || "external feature"} opening ${index === 0 ? "width" : "height"} exceeds the descriptor body envelope plus ${MAX_DESCRIPTOR_OPENING_OVERSIZE_MM} mm review allowance.`
    });
  });
}

function collectMountingHoleEnvelopeIssues({
  issues,
  componentId = "descriptor",
  hole = {},
  dimensions = {}
} = {}) {
  const planarMinMm = Math.min(
    Number(dimensions.width || 0),
    Number(dimensions.height || 0)
  );
  const diameterMm = Number(hole.diameterMm);
  if (!(planarMinMm > 0) || !Number.isFinite(diameterMm) || diameterMm <= planarMinMm) return;
  issues.push({
    code: "descriptor_mounting_hole_exceeds_body_envelope",
    componentId,
    holeId: hole.id || "",
    source: `mountingHoles.${hole.id || "mountingHole"}.diameterMm`,
    actualMm: Number(diameterMm.toFixed(3)),
    maximumMm: Number(planarMinMm.toFixed(3)),
    message: `${componentId} ${hole.id || "mounting hole"} diameter exceeds the descriptor body planar envelope.`
  });
}

function collectMinimumDimensionIssues({
  issues,
  componentId = "descriptor",
  source = "",
  values = {},
  fields = []
} = {}) {
  fields.forEach((field, index) => {
    const actual = Array.isArray(values) ? Number(values[index]) : Number(values[field]);
    if (!Number.isFinite(actual) || actual >= MIN_PREVIEW_SOLID_THICKNESS_MM) return;
    issues.push({
      code: "descriptor_preview_solid_dimension_too_thin",
      componentId,
      source,
      axis: field,
      actualMm: Number.isFinite(actual) ? Number(actual.toFixed(3)) : null,
      minimumMm: MIN_PREVIEW_SOLID_THICKNESS_MM,
      message: `${componentId} ${source}.${field} must be at least ${MIN_PREVIEW_SOLID_THICKNESS_MM} mm for reviewable non-zero-thickness preview geometry.`
    });
  });
}

function descriptorLocalPositionBlockingIssues(descriptor = {}) {
  const issues = [];
  const componentId = descriptor.id || descriptor.identity?.id || "descriptor";
  const dimensions = descriptor.dimensionsMm || {};
  const items = [
    ...((descriptor.connectors || []).map((item) => ({
      source: `connectors.${item.id || "connector"}.positionLocalMm`,
      id: item.id || "",
      kind: "connector",
      positionLocalMm: item.positionLocalMm
    }))),
    ...((descriptor.mountingHoles || []).map((item) => ({
      source: `mountingHoles.${item.id || "mountingHole"}.positionLocalMm`,
      id: item.id || "",
      kind: "mountingHole",
      positionLocalMm: item.positionLocalMm
    }))),
    ...((descriptor.externalFeatures || []).map((item) => ({
      source: `externalFeatures.${item.id || "feature"}.positionLocalMm`,
      id: item.id || "",
      kind: "externalFeature",
      positionLocalMm: item.positionLocalMm
    })))
  ];
  for (const item of items) {
    collectLocalPositionEnvelopeIssues({
      issues,
      componentId,
      dimensions,
      ...item
    });
  }
  return issues;
}

function collectLocalPositionEnvelopeIssues({
  issues,
  componentId = "descriptor",
  dimensions = {},
  source = "",
  id = "",
  kind = "",
  positionLocalMm = []
} = {}) {
  if (!Array.isArray(positionLocalMm) || positionLocalMm.length !== 3) return;
  const axisFields = [
    { axis: "x", dimension: "width", value: Number(positionLocalMm[0]) },
    { axis: "y", dimension: "height", value: Number(positionLocalMm[1]) },
    { axis: "z", dimension: "depth", value: Number(positionLocalMm[2]) }
  ];
  for (const field of axisFields) {
    const dimensionMm = Number(dimensions[field.dimension] || 0);
    if (!(dimensionMm > 0) || !Number.isFinite(field.value)) continue;
    const halfExtentMm = dimensionMm / 2;
    const maximumAbsMm = halfExtentMm + MAX_DESCRIPTOR_LOCAL_POSITION_OVERSHOOT_MM;
    const actualAbsMm = Math.abs(field.value);
    if (actualAbsMm <= maximumAbsMm) continue;
    issues.push({
      code: "descriptor_local_position_outside_body_envelope",
      componentId,
      itemId: id,
      itemKind: kind,
      source,
      axis: field.axis,
      actualMm: Number(field.value.toFixed(3)),
      actualAbsMm: Number(actualAbsMm.toFixed(3)),
      maximumAbsMm: Number(maximumAbsMm.toFixed(3)),
      halfExtentMm: Number(halfExtentMm.toFixed(3)),
      allowedOvershootMm: MAX_DESCRIPTOR_LOCAL_POSITION_OVERSHOOT_MM,
      message: `${componentId} ${source} ${field.axis} is outside the descriptor body envelope plus ${MAX_DESCRIPTOR_LOCAL_POSITION_OVERSHOOT_MM} mm review allowance.`
    });
  }
}

function componentTypeForId(componentId, productPlan = null) {
  const descriptor = productPlan
    ? getSelectableComponentDescriptor(componentId, productPlan)
    : listComponentDescriptors().find((item) => item.id === componentId);
  if (!descriptor) return "";
  return normalizeComponentType(descriptor.identity?.category || descriptor.type || descriptor.category || descriptor.id);
}

function normalizeComponentType(value) {
  const normalized = String(value || "").toLowerCase().replace(/[-\s]+/g, "_");
  const map = {
    board: "core_board",
    controller: "core_board",
    core: "core_board",
    core_board_esp32_s3: "core_board",
    buttons: "button",
    push_button: "button",
    push_buttons: "button",
    ambient: "ambient_sensor",
    sensor: "ambient_sensor",
    ambient_light_sensor: "ambient_sensor",
    interface: "usb_c",
    usb: "usb_c",
    usbc: "usb_c",
    usb_c_power: "usb_c",
    sound: "speaker",
    audio: "speaker"
  };
  return map[normalized] || normalized;
}

function componentSummaryForRevision(revision) {
  const selections = revision?.geometrySpec?.componentSelections;
  if (selections?.selectedComponentIds) {
    return selections.selectedComponentIds.map((componentId) => ({
      componentId,
      quantity: selections.componentQuantities?.[componentId] || 1
    }));
  }
  return (revision?.modules || []).map((module) => ({
    moduleId: module.id,
    name: module.name,
    status: module.status
  }));
}

function collectWarnings(revision) {
  return [
    ...(revision?.riskReport?.items || []).filter((item) => item.level === "warn" || item.level === "block"),
    ...(revision?.geometryValidation?.issues || []).filter((item) => item.level === "warn" || item.level === "block")
  ];
}

function artifactStatusForRevision(revision) {
  const artifacts = revision?.modelArtifacts?.artifacts || {};
  const artifactAudit = revision?.modelArtifacts?.generationEvidence?.artifactAudit || {};
  const artifactAuditPassed = artifactAudit.passed === true;
  const generated = revision?.modelArtifacts?.status === "generated";
  return {
    status: revision?.modelArtifacts?.status || revision?.generationStatus || "unknown",
    generated,
    trustedGenerated: generated && artifactAuditPassed,
    hasModelGlb: Boolean(artifacts.glb?.localPath || artifacts.glb?.url),
    hasShellStl: Boolean(artifacts.shellFront?.localPath || artifacts.shellBack?.localPath || artifacts.stl?.localPath),
    hasStep: Boolean(artifacts.step?.localPath || artifacts.step?.url),
    hasGenerationEvidenceReport: Boolean(artifacts.generationEvidenceReport?.localPath || artifacts.generationEvidenceReport?.url),
    artifactAuditStatus: artifactAudit.status || "unavailable",
    artifactAuditPassed,
    artifactAuditFindingCount: Array.isArray(artifactAudit.findings) ? artifactAudit.findings.length : 0
  };
}

function actionArtifactPaths(revision) {
  const paths = artifactPathsForRevision(revision);
  return {
    ...paths,
    modelGlb: paths.glb || null,
    shellFrontStl: paths.shellFront || null,
    shellBackStl: paths.shellBack || null
  };
}

function artifactMap(revision) {
  const artifacts = revision?.modelArtifacts?.artifacts || {};
  const map = {
    productPlan: artifacts.productPlan,
    geometrySpec: artifacts.geometrySpec,
    componentSelections: artifacts.componentSelections,
    componentDescriptors: artifacts.componentDescriptors,
    componentAssetManifest: artifacts.componentAssetManifest,
    generationEvidenceReport: artifacts.generationEvidenceReport,
    modelGlb: artifacts.glb,
    shellFrontStl: artifacts.shellFront,
    shellBackStl: artifacts.shellBack,
    validationReport: artifacts.validationReport,
    designSummary: artifacts.designSummary,
    cadqueryScript: artifacts.cadqueryScript,
    step: artifacts.step
  };
  return Object.fromEntries(
    Object.entries(map).map(([key, asset]) => [key, asset ? compactAsset(asset) : null])
  );
}

function compactAsset(asset) {
  return {
    assetId: asset.assetId || "",
    type: asset.type || "",
    localPath: asset.localPath || "",
    url: asset.url || "",
    caption: asset.caption || ""
  };
}

function expectedEffects(patches = []) {
  const effects = [];
  for (const patch of patches) {
    if (patch.type === "component_patch") {
      for (const item of patch.add || []) effects.push(`Add ${item.quantity || 1} ${item.componentType || item.componentId}`);
      for (const item of patch.remove || []) effects.push(`Remove ${item.componentType || item.componentId}`);
    }
    if (patch.type === "geometry_preference_patch") {
      for (const [path, value] of Object.entries(patch.set || {})) effects.push(`Set ${path} to ${value}`);
    }
    if (patch.type === "plan_patch") {
      for (const [path, value] of Object.entries(patch.set || {})) effects.push(`Set ${path} to ${value}`);
    }
  }
  if (effects.length) effects.push("Regenerate GLB/STL/STEP if committed");
  return effects;
}

function warningsFromValidation(validation = {}) {
  return (validation.warnings || []).map((warning) => warning.message || warning.text || warning.code || String(warning));
}

function summaryForPatches(patches = []) {
  const effects = expectedEffects(patches).filter((item) => !item.startsWith("Regenerate"));
  return effects.length ? effects.join("; ") : "No structured design change detected.";
}

function ok(payload = {}) {
  return { ok: true, ...payload };
}

function fail(code, message, extras = {}) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...extras
    }
  };
}

function errorFromException(error, fallbackCode) {
  const statusCode = Number(error?.statusCode || 400);
  const code = statusCode === 404 ? "NOT_FOUND" : fallbackCode;
  return fail(code, error instanceof Error ? error.message : "Forge action failed.", {
    statusCode,
    rejectedPatches: error?.rejectedPatches || undefined
  });
}
