import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
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
  validateActionPatches,
  validateDesign
} from "../src/core/forge_actions.mjs";
import { createProductPlan, getProductPlan } from "../src/core/product_plan.mjs";

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
  assert.ok(Array.isArray(summary.components));

  const buttons = searchComponentLibrary({ query: "button", componentType: "button" });
  assert.equal(buttons.ok, true);
  assert.ok(buttons.results.some((item) => item.componentId === "button_6mm" && item.supported));
  assert.equal(buttons.results.find((item) => item.componentId === "button_6mm").risk.requiresManualValidation, false);

  const camera = searchComponentLibrary({ componentType: "camera" });
  assert.equal(camera.ok, true);
  assert.equal(camera.results.find((item) => item.componentId === "camera_module_basic").risk.requiresManualValidation, true);

  const battery = searchComponentLibrary({ componentType: "battery" });
  assert.equal(battery.ok, true);
  assert.ok(battery.results.some((item) => item.risk.requiresManualValidation));
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
  assert.equal((await readFile(artifacts.artifacts.modelGlb.localPath)).slice(0, 4).toString("utf8"), "glTF");

  const reverted = revertRevision({
    workspaceId: plan.planId,
    revisionId: firstRevisionId
  });
  assert.equal(reverted.ok, true);
  assert.equal(reverted.currentRevisionId, firstRevisionId);
  assert.equal(getProductPlan(plan.planId).currentRevisionId, firstRevisionId);
  assert.equal(getProductPlan(plan.planId).conversation.length, conversationLength);
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
    "POST /api/workspaces/:workspaceId/components/search",
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
