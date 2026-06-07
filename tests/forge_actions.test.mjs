import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
import {
  applyDesignPatch,
  commitStagedChange,
  getRevisionArtifacts,
  getWorkspaceSummary,
  inspectComponentDescriptorDraft,
  inspectComponentPackage,
  promoteComponentDescriptorDraft,
  proposeDesignChange,
  regenerateRevision,
  rejectStagedChange,
  retirePromotedComponentDescriptor,
  revertRevision,
  searchComponentLibrary,
  selectComponentDescriptor,
  stageDesignPatch,
  validateActionPatches,
  validateDesign
} from "../src/core/forge_actions.mjs";
import { listComponentDescriptors } from "../src/core/component_library.mjs";
import { createProductPlan, getProductPlan } from "../src/core/product_plan.mjs";
import { readRevisionLedger } from "../src/core/project_workspace.mjs";

function createActionPlan() {
  return createProductPlan({
    initialMessage: "Small woodgrain desktop display for photos and weather, 3.5 inch, USB-C powered.",
    language: "en"
  }).productPlan;
}

test("Forge actions expose compact workspace summary and component search", () => {
  const plan = createActionPlan();

  const summary = getWorkspaceSummary({ workspaceId: plan.planId });
  assert.equal(summary.ok, true);
  assert.equal(summary.workspaceId, plan.planId);
  assert.equal(summary.currentRevisionId, plan.currentRevisionId);
  assert.equal(summary.productType, "desktop_display");
  assert.equal(summary.directEditingAllowed, false);
  assert.equal(summary.artifactStatus.generated, false);
  assert.equal(summary.artifactStatus.trustedGenerated, false);
  assert.equal(summary.artifactStatus.artifactAuditStatus, "unavailable");
  assert.ok(Array.isArray(summary.components));

  const buttons = searchComponentLibrary({ query: "button", componentType: "button" });
  assert.equal(buttons.ok, true);
  assert.ok(buttons.results.some((item) => item.componentId === "button_6mm" && item.supported));
  const button = buttons.results.find((item) => item.componentId === "button_6mm");
  assert.equal(button.risk.requiresManualValidation, false);
  assert.equal(button.mechanicalConstraints.trustLevel, "proxy_seed");
  assert.equal(button.mechanicalConstraints.productionReady, false);
  assert.equal(button.mechanicalConstraints.requiresHumanValidation, true);
  assert.deepEqual(button.mechanicalConstraints.dimensionsMm, { width: 8, height: 8, depth: 5 });
  assert.equal(button.mechanicalConstraints.mounting.method, "panel_button");
  assert.equal(button.mechanicalConstraints.interfaces.connectorCount, 1);
  assert.ok(button.mechanicalConstraints.interfaces.connectorIds.includes("signal"));
  assert.equal(button.mechanicalConstraints.shellFeatures.externalFeatureCount, 1);
  assert.ok(button.mechanicalConstraints.shellFeatures.externalFeatureIds.includes("button_hole"));
  assert.equal(button.mechanicalConstraints.clearances.accessVolumeCount, 1);
  assert.equal(button.mechanicalConstraints.sourceEvidence.sourceConfidence, "proxy_seed");
  assert.equal(button.mechanicalConstraints.sourceEvidence.vendorAssetAvailable, false);
  assert.equal(button.mechanicalConstraints.sourceEvidence.proxyAssetAvailable, false);
  assert.match(button.mechanicalConstraints.sourceEvidence.descriptorPath, /src\/core\/component_assets\/button_6mm\/descriptor\.json/);
  assert.match(button.mechanicalConstraints.sourceEvidence.sourcesPath, /src\/core\/component_assets\/button_6mm\/sources\.md/);
  assert.ok(button.mechanicalConstraints.warnings.includes("proxy_dimensions_require_human_review"));
  assert.ok(button.mechanicalConstraints.warnings.includes("procedural_mechanical_proxy_only"));
  assert.equal(button.descriptorPackage.packageStatus, "reviewable");
  assert.equal(button.descriptorPackage.readyForSelection, true);
  assert.equal(button.descriptorPackage.readyForReviewableGeneration, true);
  assert.equal(button.descriptorPackage.sourcesFilePresent, true);
  assert.equal(button.descriptorPackage.directGeometryMutationAllowed, false);

  const buttonPackage = inspectComponentPackage({ componentId: "button_6mm" });
  assert.equal(buttonPackage.ok, true);
  assert.equal(buttonPackage.componentId, "button_6mm");
  assert.equal(buttonPackage.componentType, "button");
  assert.equal(buttonPackage.packageStatus, "reviewable");
  assert.equal(buttonPackage.readyForSelection, true);
  assert.equal(buttonPackage.readyForReviewableGeneration, true);
  assert.equal(buttonPackage.productionReady, false);
  assert.equal(buttonPackage.descriptorValidation.valid, true);
  assert.equal(buttonPackage.sourceEvidence.sourcesFilePresent, true);
  assert.match(buttonPackage.sourceEvidence.descriptorPath, /src\/core\/component_assets\/button_6mm\/descriptor\.json/);
  assert.match(buttonPackage.sourceEvidence.sourcesPath, /src\/core\/component_assets\/button_6mm\/sources\.md/);
  assert.equal(buttonPackage.mechanicalCoverage.dimensionsPresent, true);
  assert.equal(buttonPackage.mechanicalCoverage.connectorCount, 1);
  assert.equal(buttonPackage.mechanicalCoverage.accessVolumeCount, 1);
  assert.equal(buttonPackage.replacementPolicy.canSelectSameType, true);
  assert.equal(buttonPackage.replacementPolicy.componentPreferencePath, "componentPreferences.button");
  assert.equal(buttonPackage.replacementPolicy.requiresProductPlanRevision, true);
  assert.equal(buttonPackage.replacementPolicy.directGeometryMutationAllowed, false);
  assert.equal(buttonPackage.replacementPolicy.rawArtifactMutationAllowed, false);
  assert.equal(buttonPackage.blockingIssues.length, 0);
  assert.ok(buttonPackage.reviewWarnings.some((warning) => warning.code === "human_validation_required"));

  const missingPackage = inspectComponentPackage({ componentId: "magic_component" });
  assert.equal(missingPackage.ok, false);
  assert.equal(missingPackage.error.code, "UNKNOWN_COMPONENT");

  const camera = searchComponentLibrary({ componentType: "camera" });
  assert.equal(camera.ok, true);
  const cameraModule = camera.results.find((item) => item.componentId === "camera_module_basic");
  assert.equal(cameraModule.risk.requiresManualValidation, true);
  assert.equal(cameraModule.mechanicalConstraints.requiresHumanValidation, true);
  assert.equal(cameraModule.mechanicalConstraints.mounting.method, "front_window_review");
  assert.ok(cameraModule.mechanicalConstraints.shellFeatures.externalFeatureIds.includes("camera_window"));
  assert.ok(cameraModule.mechanicalConstraints.clearances.keepoutVolumeCount >= 1);
  assert.ok(cameraModule.mechanicalConstraints.clearances.accessVolumeCount >= 1);

  const battery = searchComponentLibrary({ componentType: "battery" });
  assert.equal(battery.ok, true);
  assert.ok(battery.results.some((item) => item.risk.requiresManualValidation));
});

test("descriptor draft inspection gates new parts before library selection", () => {
  const seed = listComponentDescriptors().find((item) => item.id === "button_6mm");
  const draftDescriptor = JSON.parse(JSON.stringify(seed));
  draftDescriptor.identity.id = "button_8mm_review";
  draftDescriptor.identity.displayName = "8 mm Review Button Draft";
  draftDescriptor.identity.partNumber = "BTN-8MM-REVIEW";
  draftDescriptor.versioning.descriptorVersion = "0.1.0";
  draftDescriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  draftDescriptor.externalFeatures[0].openingSizeMm = [8, 8];
  draftDescriptor.sourceNotes.summary = "Reviewable draft package for an 8 mm button.";
  draftDescriptor.sourceNotes.confidence = "descriptor_reviewed";

  const draft = inspectComponentDescriptorDraft({
    descriptor: draftDescriptor,
    expectedId: "button_8mm_review",
    sourcesText: [
      "# button_8mm_review sources",
      "Received date: 2026-06-06",
      "Context: reviewable ComponentDescriptor draft.",
      "Status: draft, not production verified."
    ].join("\n")
  });
  assert.equal(draft.ok, true);
  assert.equal(draft.draft, true);
  assert.equal(draft.componentId, "button_8mm_review");
  assert.equal(draft.componentType, "button");
  assert.equal(draft.packageStatus, "reviewable");
  assert.equal(draft.descriptorValidation.valid, true);
  assert.equal(draft.readyForLibraryPromotion, true);
  assert.equal(draft.readyForSelection, false);
  assert.equal(draft.readyForReviewableGeneration, false);
  assert.equal(draft.replacementPolicy.canSelectSameType, false);
  assert.equal(draft.replacementPolicy.loadedLibraryRequired, true);
  assert.equal(draft.replacementPolicy.readyAfterLibraryPromotion, true);
  assert.equal(draft.replacementPolicy.directGeometryMutationAllowed, false);
  assert.equal(draft.replacementPolicy.rawArtifactMutationAllowed, false);
  assert.equal(draft.libraryStatus.canPromoteToLibrary, true);
  assert.match(draft.libraryStatus.targetDirectory, /src\/core\/component_assets\/button_8mm_review\//);

  const missingSources = inspectComponentDescriptorDraft({
    descriptor: draftDescriptor,
    expectedId: "button_8mm_review"
  });
  assert.equal(missingSources.ok, true);
  assert.equal(missingSources.descriptorValidation.valid, false);
  assert.equal(missingSources.readyForLibraryPromotion, false);
  assert.equal(missingSources.readyForSelection, false);
  assert.ok(missingSources.blockingIssues.some((issue) => issue.message.includes("companion source notes file is missing")));
});

test("descriptor draft inspection blocks local positions outside body envelope", () => {
  const plan = createActionPlan();
  const seed = listComponentDescriptors().find((item) => item.id === "button_6mm");
  const draftDescriptor = JSON.parse(JSON.stringify(seed));
  draftDescriptor.identity.id = "button_bad_position";
  draftDescriptor.identity.displayName = "Bad Position Button Draft";
  draftDescriptor.identity.partNumber = "BTN-BAD-POSITION";
  draftDescriptor.versioning.descriptorVersion = "0.1.0";
  draftDescriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  draftDescriptor.connectors[0].positionLocalMm = [100, 0, 0];
  draftDescriptor.sourceNotes.summary = "Draft with an impossible connector local position.";
  draftDescriptor.sourceNotes.confidence = "descriptor_reviewed";

  const sourcesText = [
    "# button_bad_position sources",
    "Received date: 2026-06-07",
    "Context: local position envelope regression.",
    "Status: reviewable proxy, not production verified."
  ].join("\n");
  const draft = inspectComponentDescriptorDraft({
    descriptor: draftDescriptor,
    expectedId: "button_bad_position",
    sourcesText
  });
  assert.equal(draft.ok, true);
  assert.equal(draft.descriptorValidation.valid, true);
  assert.equal(draft.readyForLibraryPromotion, false);
  assert.ok(draft.blockingIssues.some((issue) => (
    issue.code === "descriptor_local_position_outside_body_envelope"
      && issue.source === "connectors.signal.positionLocalMm"
      && issue.axis === "x"
      && issue.actualMm === 100
  )));

  const promoted = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor: draftDescriptor,
    expectedId: "button_bad_position",
    sourcesText
  });
  assert.equal(promoted.ok, false);
  assert.equal(promoted.error.code, "DESCRIPTOR_DRAFT_NOT_PROMOTABLE");
  assert.ok(promoted.error.draftReport.blockingIssues.some((issue) => issue.code === "descriptor_local_position_outside_body_envelope"));
});

test("descriptor draft inspection blocks oversized mounting holes", () => {
  const plan = createActionPlan();
  const seed = listComponentDescriptors().find((item) => item.id === "core_board_esp32_s3");
  const draftDescriptor = JSON.parse(JSON.stringify(seed));
  draftDescriptor.identity.id = "core_board_bad_mounting_hole";
  draftDescriptor.identity.displayName = "Bad Mounting Hole Core Board";
  draftDescriptor.identity.partNumber = "CORE-BAD-HOLE";
  draftDescriptor.versioning.descriptorVersion = "0.1.0";
  draftDescriptor.mountingHoles[0].diameterMm = 40;
  draftDescriptor.sourceNotes.summary = "Draft with an impossible mounting hole diameter.";
  draftDescriptor.sourceNotes.confidence = "descriptor_reviewed";

  const sourcesText = [
    "# core_board_bad_mounting_hole sources",
    "Received date: 2026-06-07",
    "Context: mounting hole envelope regression.",
    "Status: reviewable proxy, not production verified."
  ].join("\n");
  const draft = inspectComponentDescriptorDraft({
    descriptor: draftDescriptor,
    expectedId: "core_board_bad_mounting_hole",
    sourcesText
  });
  assert.equal(draft.ok, true);
  assert.equal(draft.descriptorValidation.valid, true);
  assert.equal(draft.readyForLibraryPromotion, false);
  assert.ok(draft.blockingIssues.some((issue) => (
    issue.code === "descriptor_mounting_hole_exceeds_body_envelope"
      && issue.source === "mountingHoles.mount_tl.diameterMm"
      && issue.actualMm === 40
      && issue.maximumMm === 30
  )));

  const promoted = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor: draftDescriptor,
    expectedId: "core_board_bad_mounting_hole",
    sourcesText
  });
  assert.equal(promoted.ok, false);
  assert.equal(promoted.error.code, "DESCRIPTOR_DRAFT_NOT_PROMOTABLE");
  assert.ok(promoted.error.draftReport.blockingIssues.some((issue) => issue.code === "descriptor_mounting_hole_exceeds_body_envelope"));
});

test("descriptor draft promotion makes a same-type part selectable through ProductPlan", () => {
  const plan = createActionPlan();
  const seed = listComponentDescriptors().find((item) => item.id === "button_6mm");
  const draftDescriptor = JSON.parse(JSON.stringify(seed));
  draftDescriptor.identity.id = "button_8mm_promoted";
  draftDescriptor.identity.displayName = "8 mm Promoted Button";
  draftDescriptor.identity.partNumber = "BTN-8MM-PROMOTED";
  draftDescriptor.versioning.descriptorVersion = "0.1.0";
  draftDescriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  draftDescriptor.externalFeatures[0].openingSizeMm = [8, 8];
  draftDescriptor.sourceNotes.summary = "Promoted reviewable 8 mm button descriptor.";

  const sourcesText = [
    "# button_8mm_promoted sources",
    "Received date: 2026-06-06",
    "Context: promoted ProductPlan ComponentDescriptor draft.",
    "Status: reviewable proxy, not production verified."
  ].join("\n");
  const promoted = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor: draftDescriptor,
    expectedId: "button_8mm_promoted",
    sourcesText
  });
  assert.equal(promoted.ok, true);
  assert.equal(promoted.promoted, true);
  assert.equal(promoted.componentId, "button_8mm_promoted");
  assert.equal(promoted.readyForSelection, true);
  assert.equal(promoted.readyForReviewableGeneration, true);
  assert.equal(promoted.replacementPolicy.directGeometryMutationAllowed, false);
  assert.equal(promoted.libraryStatus.scope, "product_plan");

  const promotedSearch = searchComponentLibrary({
    workspaceId: plan.planId,
    query: "promoted",
    componentType: "button"
  });
  assert.equal(promotedSearch.ok, true);
  assert.ok(promotedSearch.results.some((item) => item.componentId === "button_8mm_promoted"));

  const packageReport = inspectComponentPackage({
    workspaceId: plan.planId,
    componentId: "button_8mm_promoted"
  });
  assert.equal(packageReport.ok, true);
  assert.equal(packageReport.readyForSelection, true);
  assert.equal(packageReport.replacementPolicy.componentPreferencePath, "componentPreferences.button");

  const selected = selectComponentDescriptor({
    workspaceId: plan.planId,
    message: "Use the promoted 8 mm button.",
    componentId: "button_8mm_promoted",
    quantity: 1
  });
  assert.equal(selected.ok, true);
  assert.equal(selected.selected, true);
  assert.equal(selected.componentPreferencePath, "componentPreferences.button");
  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === selected.newRevisionId);
  assert.equal(revision.productPlanSnapshot.componentPreferences.button, "button_8mm_promoted");
  assert.ok(revision.productPlanSnapshot.componentLibrary.descriptors.some((entry) => entry.componentId === "button_8mm_promoted"));
  assert.ok(revision.geometrySpec.componentSelections.selectedComponentIds.includes("button_8mm_promoted"));
  assert.ok(revision.geometrySpec.componentDescriptors.some((descriptor) => descriptor.id === "button_8mm_promoted"));
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");

  const generated = regenerateRevision({
    workspaceId: plan.planId,
    revisionId: selected.newRevisionId,
    reason: "generate promoted descriptor artifact test"
  });
  assert.equal(generated.ok, true);
  assert.equal(generated.validationReport.status, "passed_with_warnings");
  assert.ok(generated.artifactPaths.modelGlb);
  const generatedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === generated.revisionId);
  assert.equal(generatedRevision.modelArtifacts.status, "generated");
  assert.ok(generatedRevision.geometrySpec.componentSelections.selectedComponentIds.includes("button_8mm_promoted"));
  assert.ok(generatedRevision.modelArtifacts.generationEvidence.descriptorEvidence.selectedComponentIds.includes("button_8mm_promoted"));
});

test("retiring a promoted descriptor preserves history and excludes it from future selection", () => {
  const plan = createActionPlan();
  const seed = listComponentDescriptors().find((item) => item.id === "button_6mm");
  const draftDescriptor = JSON.parse(JSON.stringify(seed));
  draftDescriptor.identity.id = "button_8mm_retire";
  draftDescriptor.identity.displayName = "8 mm Retired Button";
  draftDescriptor.identity.partNumber = "BTN-8MM-RETIRE";
  draftDescriptor.versioning.descriptorVersion = "0.1.0";
  draftDescriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  draftDescriptor.externalFeatures[0].openingSizeMm = [8, 8];
  draftDescriptor.sourceNotes.summary = "Promoted button descriptor that will be retired.";

  const promoted = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor: draftDescriptor,
    expectedId: "button_8mm_retire",
    sourcesText: [
      "# button_8mm_retire sources",
      "Received date: 2026-06-06",
      "Context: retired ProductPlan ComponentDescriptor test.",
      "Status: reviewable proxy, not production verified."
    ].join("\n")
  });
  assert.equal(promoted.ok, true);
  assert.equal(promoted.readyForSelection, true);

  const selected = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Use the 8 mm button before retirement.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", componentId: "button_8mm_retire", quantity: 1 }]
      }
    ]
  });
  assert.equal(selected.ok, true);
  const historicalRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === selected.newRevisionId);
  assert.equal(historicalRevision.productPlanSnapshot.componentPreferences.button, "button_8mm_retire");
  assert.ok(historicalRevision.geometrySpec.componentSelections.selectedComponentIds.includes("button_8mm_retire"));

  const retired = retirePromotedComponentDescriptor({
    workspaceId: plan.planId,
    componentId: "button_8mm_retire",
    reason: "source superseded",
    clearPreference: true
  });
  assert.equal(retired.ok, true);
  assert.equal(retired.retired, true);
  assert.equal(retired.componentType, "button");
  assert.equal(retired.clearedComponentPreference, true);
  assert.equal(retired.libraryStatus.activeDescriptorCount, 0);
  assert.equal(retired.libraryStatus.retiredDescriptorCount, 1);

  const currentPlan = getProductPlan(plan.planId);
  const retiredEntry = currentPlan.workspaceState.productPlan.componentLibrary.descriptors.find((entry) => entry.componentId === "button_8mm_retire");
  assert.equal(retiredEntry.status, "retired");
  assert.equal(retiredEntry.active, false);
  assert.equal(retiredEntry.retirementReason, "source superseded");
  assert.equal(currentPlan.workspaceState.productPlan.componentPreferences.button, undefined);

  const retiredSearch = searchComponentLibrary({
    workspaceId: plan.planId,
    query: "retire",
    componentType: "button"
  });
  assert.equal(retiredSearch.ok, true);
  assert.equal(retiredSearch.results.some((item) => item.componentId === "button_8mm_retire"), false);

  const rejected = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Try to use the retired 8 mm button.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", componentId: "button_8mm_retire", quantity: 1 }]
      }
    ]
  });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.error.code, "UNKNOWN_COMPONENT");

  const fallback = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Keep one button without specifying a retired descriptor.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", quantity: 1 }]
      }
    ]
  });
  assert.equal(fallback.ok, true);
  const fallbackRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === fallback.newRevisionId);
  assert.equal(fallbackRevision.productPlanSnapshot.componentPreferences.button, undefined);
  assert.ok(fallbackRevision.geometrySpec.componentSelections.selectedComponentIds.includes("button_6mm"));
  assert.equal(fallbackRevision.geometrySpec.componentSelections.selectedComponentIds.includes("button_8mm_retire"), false);
  assert.ok(historicalRevision.productPlanSnapshot.componentLibrary.descriptors.some((entry) => entry.componentId === "button_8mm_retire"));
  assert.ok(historicalRevision.geometrySpec.componentDescriptors.some((descriptor) => descriptor.id === "button_8mm_retire"));

  const ledger = readRevisionLedger({ workspaceId: plan.planId });
  assert.ok(ledger.componentLibrary.retiredDescriptorIds.includes("button_8mm_retire"));
  assert.equal(ledger.eventSummary.latestEventType, "revision_created");
});

test("proposal flow stages design changes without revisions, then commits pending revisions", () => {
  const plan = createActionPlan();
  const initialRevisionCount = plan.revisions.length;

  const proposal = proposeDesignChange({
    workspaceId: plan.planId,
    message: "What if we add two buttons on the right side?"
  });
  assert.equal(proposal.ok, true);
  assert.equal(proposal.status, "proposed");
  assert.equal(proposal.requiresConfirmation, true);
  assert.ok(proposal.patches.some((patch) => patch.type === "component_patch"));
  assert.ok(proposal.patches.some((patch) => patch.type === "geometry_preference_patch"));
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount);
  assert.equal(getProductPlan(plan.planId).workspaceState.proposals.length, 1);

  const proposalValidation = validateDesign({
    workspaceId: plan.planId,
    proposalId: proposal.proposalId
  });
  assert.equal(proposalValidation.ok, true);
  assert.equal(proposalValidation.blocked, false);

  const committed = commitStagedChange({
    workspaceId: plan.planId,
    proposalId: proposal.proposalId
  });
  assert.equal(committed.ok, true);
  assert.equal(committed.committed, true);
  assert.ok(committed.newRevisionId);
  assert.equal(committed.artifactPaths.modelGlb, null);
  assert.equal(committed.artifactPaths.shellFrontStl, null);
  assert.equal(committed.artifactPaths.shellBackStl, null);
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount + 1);
  const committedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === committed.newRevisionId);
  assert.equal(committedRevision.modelArtifacts.status, "pending_confirmation");
  assert.equal(getProductPlan(plan.planId).workspaceState.proposals[0].status, "committed");
  assert.equal(getProductPlan(plan.planId).workspaceState.proposals[0].committedRevisionId, committed.newRevisionId);
});

test("proposed Chinese USB-C rear-left placement commits as a legal geometry preference", () => {
  const plan = createActionPlan();
  const proposed = proposeDesignChange({
    workspaceId: plan.planId,
    message: "把 USB-C 移到后面左侧。请创建 proposal，不直接修改 geometry-spec.json。"
  });

  assert.equal(proposed.ok, true);
  assert.ok(proposed.patches.some((patch) => (
    patch.type === "geometry_preference_patch"
    && patch.set?.["placements.usb_c.semanticPosition"] === "back_left"
  )));

  const committed = commitStagedChange({
    workspaceId: plan.planId,
    proposalId: proposed.proposalId
  });

  assert.equal(committed.ok, true);
  assert.equal(committed.artifactPaths.modelGlb, null);
  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === committed.newRevisionId);
  assert.equal(revision.productPlanSnapshot.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
});

test("staged proposals can be rejected and rejected proposals cannot commit", () => {
  const plan = createActionPlan();
  const staged = stageDesignPatch({
    workspaceId: plan.planId,
    summary: "Add a review-risk battery.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "battery", componentId: "battery_lipo_2000", quantity: 1 }]
      }
    ]
  });
  assert.equal(staged.ok, true);
  assert.equal(staged.status, "staged");
  assert.equal(staged.canCommit, true);
  assert.equal(getProductPlan(plan.planId).revisions.length, 1);

  const rejected = rejectStagedChange({
    workspaceId: plan.planId,
    proposalId: staged.proposalId,
    reason: "Keep USB-C desktop power for now."
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejected.status, "rejected");
  const rejectedLedger = readRevisionLedger({ workspaceId: plan.planId });
  const rejectedLedgerProposal = rejectedLedger.proposals.find((proposal) => proposal.proposalId === staged.proposalId);
  assert.equal(rejectedLedgerProposal.decision, "rejected");
  assert.equal(rejectedLedgerProposal.rejectionReason, "Keep USB-C desktop power for now.");
  assert.ok(rejectedLedger.rejectedChanges.some((change) => (
    change.proposalId === staged.proposalId
      && change.decision === "rejected"
      && change.type === "component_patch"
  )));

  const commitRejected = commitStagedChange({
    workspaceId: plan.planId,
    proposalId: staged.proposalId
  });
  assert.equal(commitRejected.ok, false);
  assert.equal(commitRejected.error.code, "PROPOSAL_NOT_COMMITTABLE");
  assert.equal(getProductPlan(plan.planId).revisions.length, 1);
});

test("applyDesignPatch creates revisions while invalid patches fail safely", () => {
  const plan = createActionPlan();
  const startingRevisionCount = plan.revisions.length;

  for (const badPatch of [
    { type: "raw_mesh_patch", set: { vertices: [] } },
    { type: "geometry_preference_patch", set: { "placements.magicPart.position": "front" } },
    { type: "component_patch", add: [{ componentId: "magic_component" }] },
    { type: "component_patch", add: [{ componentType: "laser" }] },
    { type: "geometry_preference_patch", set: { "placements.usb_c.semanticPosition": "under_screen_diagonal" } },
    { type: "geometry_preference_patch", set: { "enclosure.shapeProfile": "freeform_mesh" } }
  ]) {
    const result = applyDesignPatch({
      workspaceId: plan.planId,
      message: "Invalid patch should fail safely.",
      patches: [badPatch]
    });
    assert.equal(result.ok, false);
    assert.equal(getProductPlan(plan.planId).revisions.length, startingRevisionCount);
  }

  const valid = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Add two right-side buttons and move USB-C to the back-left.",
    patches: [
      {
        type: "component_patch",
        add: [
          { componentType: "button", componentId: "button_6mm", quantity: 2 },
          { componentType: "button", componentId: "button_6mm", quantity: 2 }
        ]
      },
      {
        type: "geometry_preference_patch",
        set: {
          "placements.buttons.semanticPosition": "right_side",
          "placements.usb_c.semanticPosition": "back_left"
        }
      }
    ]
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.applied, true);
  assert.ok(valid.newRevisionId);
  assert.equal(valid.artifactPaths.modelGlb, null);

  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === valid.newRevisionId);
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
  assert.equal(revision.productPlanSnapshot.requirements.buttons, 2);
  assert.equal(revision.geometrySpec.componentSelections.selectedComponentIds.filter((id) => id === "button_6mm").length, 1);
  assert.equal(revision.productPlanSnapshot.geometryPreferences.placements.usb_c.semanticPosition, "back_left");

  const removeMissing = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Remove battery even if it is not present.",
    patches: [
      {
        type: "component_patch",
        remove: [{ componentType: "battery", componentId: "battery_lipo_2000" }]
      }
    ]
  });
  assert.equal(removeMissing.ok, true);
  const removeRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === removeMissing.newRevisionId);
  assert.equal(removeRevision.productPlanSnapshot.requirements.battery, false);
});

test("component patches can select same-type descriptor variants", () => {
  const plan = createActionPlan();
  const result = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Use the review-only 18650 holder descriptor for the battery module.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentId: "battery_18650_holder", quantity: 1 }]
      }
    ]
  });

  assert.equal(result.ok, true);
  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === result.newRevisionId);
  assert.equal(revision.productPlanSnapshot.requirements.battery, true);
  assert.equal(revision.productPlanSnapshot.componentPreferences.battery, "battery_18650_holder");
  assert.ok(revision.geometrySpec.componentSelections.selectedComponentIds.includes("battery_18650_holder"));
  assert.equal(revision.geometrySpec.componentSelections.selectedComponentIds.includes("battery_lipo_2000"), false);
  assert.ok(revision.geometrySpec.routes.some((route) => (
    route.id === "route.battery_to_core_board"
    && route.from.componentId === "battery_18650_holder"
    && route.from.connectorId === "power_leads"
  )));
});

test("validateDesign covers current state, staged proposals, and explicit patch sets", () => {
  const plan = createActionPlan();
  const current = validateDesign({ workspaceId: plan.planId });
  assert.equal(current.ok, true);
  assert.equal(current.blocked, false);
  assert.ok(["passed", "warning"].includes(current.status));

  const stagedBattery = stageDesignPatch({
    workspaceId: plan.planId,
    summary: "Add a battery for review.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "battery", componentId: "battery_lipo_2000" }]
      }
    ]
  });
  const proposalValidation = validateDesign({
    workspaceId: plan.planId,
    proposalId: stagedBattery.proposalId
  });
  assert.equal(proposalValidation.ok, true);
  assert.equal(proposalValidation.status, "warning");
  assert.equal(proposalValidation.blocked, false);
  assert.ok(proposalValidation.warnings.some((item) => item.code === "human_review_required"));

  const explicitPatchValidation = validateDesign({
    workspaceId: plan.planId,
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "enclosure.shapeProfile": "cat_ear_photo_frame" }
      }
    ]
  });
  assert.equal(explicitPatchValidation.ok, true);
  assert.equal(explicitPatchValidation.blocked, false);
});

test("regenerate, artifact retrieval, and revert remain controlled actions", async () => {
  const plan = createActionPlan();
  const firstRevisionId = plan.currentRevisionId;
  const applied = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Make this a cat-ear photo frame and generate artifacts.",
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "enclosure.shapeProfile": "cat_ear_photo_frame" }
      }
    ]
  });
  assert.equal(applied.ok, true);
  assert.equal(applied.artifactPaths.modelGlb, null);
  const conversationLength = getProductPlan(plan.planId).conversation.length;

  const regenerated = regenerateRevision({
    workspaceId: plan.planId,
    reason: "component descriptor changed"
  });
  assert.equal(regenerated.ok, true);
  assert.equal(regenerated.regenerated, true);
  assert.notEqual(regenerated.revisionId, applied.newRevisionId);
  assert.ok(regenerated.artifactPaths.modelGlb);

  const artifacts = getRevisionArtifacts({
    workspaceId: plan.planId,
    revisionId: regenerated.revisionId
  });
  assert.equal(artifacts.ok, true);
  for (const key of [
    "productPlan",
    "geometrySpec",
    "componentSelections",
    "componentDescriptors",
    "componentAssetManifest",
    "generationEvidenceReport",
    "modelGlb",
    "shellFrontStl",
    "shellBackStl",
    "validationReport",
    "designSummary"
  ]) {
    assert.ok(artifacts.artifacts[key], key);
    assert.ok(artifacts.artifactPaths[key], key);
  }
  assert.equal(artifacts.directEditingAllowed, false);
  assert.equal(artifacts.artifactStatus.hasGenerationEvidenceReport, true);
  assert.equal(artifacts.artifactStatus.generated, true);
  assert.equal(artifacts.artifactStatus.trustedGenerated, true);
  assert.equal(artifacts.artifactStatus.artifactAuditStatus, "passed");
  assert.equal(artifacts.artifactStatus.artifactAuditPassed, true);
  assert.equal(artifacts.artifactStatus.artifactAuditFindingCount, 0);
  assert.equal(artifacts.artifacts.generationEvidenceReport.type, "generation_evidence_report");
  assert.match(await readFile(artifacts.artifacts.generationEvidenceReport.localPath, "utf8"), /generation_evidence_report_v1/);
  assert.equal((await readFile(artifacts.artifacts.modelGlb.localPath)).slice(0, 4).toString("utf8"), "glTF");

  const reverted = revertRevision({
    workspaceId: plan.planId,
    revisionId: firstRevisionId
  });
  assert.equal(reverted.ok, true);
  assert.equal(reverted.currentRevisionId, firstRevisionId);
  assert.equal(getProductPlan(plan.planId).currentRevisionId, firstRevisionId);
  assert.equal(getProductPlan(plan.planId).conversation.length, conversationLength);
  const revertedLedger = readRevisionLedger({ workspaceId: plan.planId });
  assert.equal(revertedLedger.currentRevisionId, firstRevisionId);
  assert.equal(revertedLedger.rollback.history.at(-1).toRevisionId, firstRevisionId);
  assert.equal(revertedLedger.rollback.supported, true);
});

test("action contract does not expose direct mesh or arbitrary file editing", () => {
  const plan = createActionPlan();
  assert.equal(getWorkspaceSummary({ workspaceId: plan.planId }).directEditingAllowed, false);

  const rawMesh = validateActionPatches([
    {
      type: "geometry_preference_patch",
      set: { "rawMesh.vertices": [] }
    }
  ]);
  assert.equal(rawMesh.ok, false);
  assert.equal(rawMesh.error.code, "INVALID_PATCH_PATH");

  const fileMutation = validateActionPatches([
    {
      type: "plan_patch",
      set: { "files./tmp/model.glb": "overwrite" }
    }
  ]);
  assert.equal(fileMutation.ok, false);
  assert.equal(fileMutation.error.code, "INVALID_PATCH_PATH");

  const valid = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Move USB-C to the back-left.",
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "placements.usb_c.semanticPosition": "back_left" }
      }
    ]
  });
  const artifacts = getRevisionArtifacts({
    workspaceId: plan.planId,
    revisionId: valid.newRevisionId
  });
  assert.equal(artifacts.directEditingAllowed, false);
  assert.equal(Object.hasOwn(artifacts.artifacts, "rawMesh"), false);
  assert.equal(Object.hasOwn(artifacts.artifacts, "arbitraryFileMutation"), false);
});

test("API contract advertises Forge action routes", () => {
  for (const route of [
    "GET /api/workspaces/:workspaceId/summary",
    "GET /api/workspaces/:workspaceId/artifacts/:revisionId",
    "GET /api/workspaces/:workspaceId/revision-ledger",
    "POST /api/workspaces/:workspaceId/components/search",
    "POST /api/workspaces/:workspaceId/components/:componentId/package",
    "POST /api/workspaces/:workspaceId/components/draft-package",
    "POST /api/workspaces/:workspaceId/components/drafts",
    "POST /api/workspaces/:workspaceId/components/drafts/scaffold",
    "POST /api/workspaces/:workspaceId/components/drafts/:draftId/promote",
    "POST /api/workspaces/:workspaceId/components/promote-draft",
    "POST /api/workspaces/:workspaceId/components/:componentId/select",
    "POST /api/workspaces/:workspaceId/components/:componentId/retire",
    "POST /api/workspaces/:workspaceId/proposals",
    "POST /api/workspaces/:workspaceId/proposals/:proposalId/commit",
    "POST /api/workspaces/:workspaceId/proposals/:proposalId/reject",
    "POST /api/workspaces/:workspaceId/patches/apply",
    "POST /api/workspaces/:workspaceId/revisions/regenerate",
    "POST /api/workspaces/:workspaceId/revisions/:revisionId/revert",
    "POST /api/workspaces/:workspaceId/validate"
  ]) {
    const [method, path] = route.split(" ");
    assert.ok(API_CONTRACT.some((item) => item.method === method && item.path === path), route);
  }
});
