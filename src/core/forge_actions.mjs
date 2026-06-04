import { listComponentDescriptors } from "./component_library.mjs";
import { createGeometrySpec, validateGeometrySpec } from "./geometry_generation.mjs";
import {
  artifactPathsForRevision,
  createProductPlanRevisionFromPatches,
  currentRevision,
  getProductPlan,
  regenerateProductPlanRevision,
  revertProductPlanRevision
} from "./product_plan.mjs";
import { processUserTurn } from "./sparker_orchestrator.mjs";
import { makeId } from "./utils.mjs";
import { applyWorkspacePatches, clone, createEmptyProductPlan, productPlanToDraft } from "./workspace_state.mjs";

const PATCH_TYPES = new Set(["plan_patch", "component_patch", "geometry_preference_patch"]);
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
const COMPONENT_ID_TO_TYPE = {
  display_3_5_tft: "display",
  display_5_tft: "display",
  display_7_tft: "display",
  core_board_esp32_s3: "core_board",
  usb_c_breakout: "usb_c",
  ambient_sensor_basic: "ambient_sensor",
  speaker_20mm: "speaker",
  camera_module_basic: "camera",
  battery_lipo_2000: "battery",
  battery_18650_holder: "battery",
  button_6mm: "button"
};
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
  "constraints.priority"
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

export function searchComponentLibrary({ query = "", componentType = "", limit = 10 } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const requestedType = normalizeComponentType(componentType);
  if (requestedType && !COMPONENT_TYPES.has(requestedType)) {
    return fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${componentType}`);
  }

  const descriptors = listComponentDescriptors()
    .map((descriptor) => componentSearchRow(descriptor))
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

export function proposeDesignChange({ workspaceId, message = "" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const baseRevision = currentRevision(plan);
  const baseProductPlan = baseRevision?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  const sparkerResult = processUserTurn({
    workspaceState: plan.workspaceState,
    currentProductPlan: baseProductPlan,
    currentConversation: plan.conversation || [],
    userMessage: message
  });
  const validationResult = validateActionPatches(sparkerResult.appliedPatches);
  if (!validationResult.ok) return validationResult;
  const preview = previewForPatches(baseProductPlan, validationResult.patches);
  if (!preview.ok) return preview;
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
  const validationResult = validateActionPatches(patches);
  if (!validationResult.ok) return validationResult;
  const baseRevision = currentRevision(plan);
  const baseProductPlan = baseRevision?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  const preview = previewForPatches(baseProductPlan, validationResult.patches);
  if (!preview.ok) return preview;
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
  if (proposal.status === "rejected" || proposal.status === "expired") {
    return fail("PROPOSAL_NOT_COMMITTABLE", `Proposal ${proposalId} is ${proposal.status}.`);
  }
  if (proposal.status === "committed") {
    return fail("PROPOSAL_ALREADY_COMMITTED", `Proposal ${proposalId} is already committed.`);
  }
  if (proposal.validationPreview?.blocked) {
    return fail("VALIDATION_BLOCKED", `Proposal ${proposalId} is blocked by validation.`);
  }

  const result = safeCreateRevision({
    planId: plan.planId,
    patches: proposal.patches,
    summary: proposal.summary || proposal.assistantSummary || `Commit ${proposal.proposalId}`,
    source: "commit_staged_change",
    generateArtifacts: true
  });
  if (!result.ok) return result;

  proposal.status = "committed";
  proposal.committedRevisionId = result.revision.revisionId;
  proposal.committedAt = new Date().toISOString();
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
  const validationResult = validateActionPatches(patches);
  if (!validationResult.ok) return validationResult;
  const result = safeCreateRevision({
    planId: planResult.plan.planId,
    patches: validationResult.patches,
    summary: String(message || summaryForPatches(validationResult.patches)),
    source: "apply_design_patch",
    generateArtifacts: true
  });
  if (!result.ok) return result;
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
    return errorFromException(error, "REGENERATION_FAILED");
  }
}

export function validateDesign({ workspaceId, proposalId = "", patches = null, mode = "current_or_proposal" } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  const { plan } = planResult;
  const baseRevision = currentRevision(plan);
  const baseProductPlan = baseRevision?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  let planToValidate = baseProductPlan;
  let source = mode;

  if (proposalId) {
    const proposalResult = resolveProposal(plan, proposalId);
    if (!proposalResult.ok) return proposalResult;
    const preview = previewForPatches(baseProductPlan, proposalResult.proposal.patches);
    if (!preview.ok) return preview;
    planToValidate = preview.productPlan;
    source = "proposal";
  } else if (Array.isArray(patches)) {
    const validationResult = validateActionPatches(patches);
    if (!validationResult.ok) return validationResult;
    const preview = previewForPatches(baseProductPlan, validationResult.patches);
    if (!preview.ok) return preview;
    planToValidate = preview.productPlan;
    source = "patches";
  }

  const validation = validationForProductPlan(planToValidate);
  return ok({
    source,
    status: actionValidationStatus(validation),
    errors: validation.issues.filter((issue) => issue.level === "block"),
    warnings: validation.issues.filter((issue) => issue.level === "warn"),
    blocked: !validation.canGenerateArtifacts,
    geometryValidation: validation
  });
}

export function revertRevision({ workspaceId, revisionId } = {}) {
  const planResult = resolvePlan(workspaceId);
  if (!planResult.ok) return planResult;
  try {
    const result = revertProductPlanRevision({
      planId: planResult.plan.planId,
      revisionId
    });
    return ok({
      reverted: true,
      currentRevisionId: result.revision.revisionId,
      artifactPaths: actionArtifactPaths(result.revision),
      summary: `Reverted to ${result.revision.revisionId}.`
    });
  } catch (error) {
    return errorFromException(error, "REVERT_FAILED");
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
  if (proposal.status === "committed") {
    return fail("PROPOSAL_ALREADY_COMMITTED", `Proposal ${proposalId} is already committed.`);
  }
  proposal.status = "rejected";
  proposal.rejectedAt = new Date().toISOString();
  proposal.rejectionReason = String(reason || "rejected_by_user");
  return ok({
    rejected: true,
    proposalId: proposal.proposalId,
    status: proposal.status
  });
}

export function validateActionPatches(patches = []) {
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
      const error = validateComponentPatch(patch);
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

function validateComponentPatch(patch) {
  for (const mode of ["add", "remove"]) {
    for (const item of patch[mode] || []) {
      const normalized = normalizeComponentType(item.componentType || item.type || COMPONENT_ID_TO_TYPE[item.componentId]);
      if (item.componentId && !COMPONENT_ID_TO_TYPE[item.componentId]) {
        return fail("UNKNOWN_COMPONENT", `Unknown component: ${item.componentId}`);
      }
      if (!COMPONENT_TYPES.has(normalized)) {
        return fail("UNSUPPORTED_COMPONENT_TYPE", `Unsupported component type: ${item.componentType || item.type || item.componentId || "unknown"}`);
      }
      if (item.componentId && COMPONENT_ID_TO_TYPE[item.componentId] !== normalized) {
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
  return proposal;
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

function componentSearchRow(descriptor) {
  const componentType = normalizeComponentType(descriptor.identity?.category || descriptor.category || descriptor.id);
  return {
    componentId: descriptor.id,
    componentType,
    displayName: descriptor.displayName || descriptor.identity?.displayName || descriptor.id,
    supported: COMPONENT_TYPES.has(componentType),
    assetQuality: descriptor.assetQuality,
    validationStatus: descriptor.validationStatus,
    risk: {
      requiresManualValidation: Boolean(descriptor.risk?.requiresManualValidation),
      severity: descriptor.risk?.severity || "none",
      reason: descriptor.risk?.reason || ""
    }
  };
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
  return {
    status: revision?.modelArtifacts?.status || revision?.generationStatus || "unknown",
    generated: revision?.modelArtifacts?.status === "generated",
    hasModelGlb: Boolean(artifacts.glb?.localPath || artifacts.glb?.url),
    hasShellStl: Boolean(artifacts.shellFront?.localPath || artifacts.shellBack?.localPath || artifacts.stl?.localPath),
    hasStep: Boolean(artifacts.step?.localPath || artifacts.step?.url)
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
