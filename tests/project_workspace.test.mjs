import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
import { buildContextPack } from "../src/core/context_pack_builder.mjs";
import {
  applyDesignPatch,
  commitStagedChange,
  getRevisionArtifacts,
  stageDesignPatch,
  validateDesign
} from "../src/core/forge_actions.mjs";
import { createProductPlan, getProductPlan } from "../src/core/product_plan.mjs";
import {
  detectGuardViolations,
  guardedEventCount,
  snapshotGuardedFiles
} from "../src/core/guarded_files.mjs";
import {
  appendWorkspaceEvent,
  projectWorkspacePath,
  readRuntimePlan,
  readWorkspaceEvents
} from "../src/core/project_workspace.mjs";
import {
  getToolMetadata,
  listToolMetadata,
  toolNames
} from "../src/core/tool_registry.mjs";

function createWorkspacePlan() {
  return createProductPlan({
    initialMessage: "Small woodgrain desktop display for photos and weather, 3.5 inch, USB-C powered.",
    language: "en"
  }).productPlan;
}

const FORGE_TOOL = fileURLToPath(new URL("../scripts/forge-tool.mjs", import.meta.url));

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function runForgeTool(args, cwd) {
  const result = spawnSync(process.execPath, [FORGE_TOOL, ...args], {
    cwd,
    encoding: "utf8"
  });
  let json = null;
  try {
    json = JSON.parse(result.stdout || "{}");
  } catch {
    json = { ok: false, stdout: result.stdout, stderr: result.stderr };
  }
  return { ...result, json };
}

test("ProductPlan creation writes a durable Forge project folder", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const manifest = readJson(`${workspacePath}/project_manifest.json`);
  const runtimePlan = readRuntimePlan({ workspaceId: plan.planId });
  const productPlan = readJson(`${workspacePath}/product_plan.json`);
  const agents = readFileSync(`${workspacePath}/AGENTS.md`, "utf8");
  const tools = readFileSync(`${workspacePath}/FORGE_TOOLS.md`, "utf8");
  const events = readWorkspaceEvents({ workspaceId: plan.planId });

  assert.equal(manifest.version, "forge_project_workspace_v1");
  assert.equal(manifest.workspaceId, plan.planId);
  assert.equal(manifest.currentRevisionId, plan.currentRevisionId);
  assert.equal(manifest.currentProductPlanPath, "product_plan.json");
  assert.equal(manifest.runtimePlanPath, "runtime_plan.json");
  assert.equal(manifest.eventsPath, "events.jsonl");
  assert.equal(runtimePlan.planId, plan.planId);
  assert.equal(productPlan.productType, "desktop_display");
  assert.ok(existsSync(`${workspacePath}/AGENTS.md`));
  assert.ok(existsSync(`${workspacePath}/CURRENT_STATE.md`));
  assert.ok(existsSync(`${workspacePath}/WORK_INDEX.md`));
  assert.ok(existsSync(`${workspacePath}/FORGE_TOOLS.md`));
  assert.ok(existsSync(`${workspacePath}/DECISIONS.md`));
  assert.ok(existsSync(`${workspacePath}/skills/hardware-workflow.md`));
  assert.ok(existsSync(`${workspacePath}/skills/3d-generation.md`));
  assert.match(agents, /forge-tool/);
  assert.match(agents, /Guarded Files/);
  assert.match(tools, /search-component/);
  assert.match(tools, /generate --reason/);
  assert.match(tools, /review --name/);
  assert.ok(events.some((event) => event.type === "workspace_created"));
  assert.ok(events.some((event) => event.type === "revision_created"));
  assert.ok(events.some((event) => event.type === "user_message"));
});

test("forge-tool restores a project workspace in a separate process", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const beforeRevisionCount = readJson(`${workspacePath}/runtime_plan.json`).revisions.length;

  const summary = runForgeTool(["summary"], workspacePath);
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(summary.json.ok, true);
  assert.equal(summary.json.workspaceId, plan.planId);
  assert.equal(summary.json.currentRevisionId, plan.currentRevisionId);

  const search = runForgeTool(["search-component", "--query", "button", "--componentType", "button", "--limit", "2"], workspacePath);
  assert.equal(search.status, 0, search.stderr);
  assert.equal(search.json.ok, true);
  assert.ok(search.json.results.some((item) => item.componentType === "button"));

  const propose = runForgeTool(["propose", "--message", "What if we add two right-side buttons?"], workspacePath);
  assert.equal(propose.status, 0, propose.stderr);
  assert.equal(propose.json.ok, true);
  assert.ok(propose.json.proposalId);
  assert.ok(existsSync(`${workspacePath}/proposals/${propose.json.proposalId}.json`));

  const patches = JSON.stringify([
    {
      type: "plan_patch",
      set: {
        "constraints.finish": "graphite"
      }
    }
  ]);
  const apply = runForgeTool(["apply", "--message", "Make the shell graphite.", "--patches", patches], workspacePath);
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(apply.json.ok, true);
  assert.equal(apply.json.applied, true);

  const runtimePlan = readJson(`${workspacePath}/runtime_plan.json`);
  assert.equal(runtimePlan.revisions.length, beforeRevisionCount + 1);
  assert.equal(runtimePlan.workspaceState.productPlan.constraints.finish, "graphite");
});

test("guarded file detector catches direct source-of-truth writes", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  writeFileSync(`${workspacePath}/product_plan.json`, JSON.stringify({ tampered: true }, null, 2));

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "product_plan.json");
});

test("guarded file detector allows Forge action event writes", () => {
  const plan = createWorkspacePlan();
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  const validation = validateDesign({ workspaceId: plan.planId });
  assert.equal(validation.ok, true);

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.deepEqual(violations, []);
});

test("guarded file detector does not let validation events authorize direct ProductPlan writes", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  writeFileSync(`${workspacePath}/product_plan.json`, JSON.stringify({ tampered: true }, null, 2));
  appendWorkspaceEvent({
    workspaceId: plan.planId,
    type: "validation_completed",
    actor: "system",
    payload: { status: "passed" }
  });

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "product_plan.json");
});

test("guarded file detector allows legitimate revision writes from Forge actions", () => {
  const plan = createWorkspacePlan();
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  const result = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Make the shell graphite.",
    patches: [
      {
        type: "plan_patch",
        set: {
          "constraints.finish": "graphite"
        }
      }
    ]
  });
  assert.equal(result.ok, true);

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.deepEqual(violations, []);
});

test("events.jsonl is append-only for validation events", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const eventsPath = `${workspacePath}/events.jsonl`;
  const before = readFileSync(eventsPath, "utf8");
  const beforeSize = statSync(eventsPath).size;

  const validation = validateDesign({ workspaceId: plan.planId });
  assert.equal(validation.ok, true);

  const after = readFileSync(eventsPath, "utf8");
  assert.ok(after.startsWith(before));
  assert.ok(statSync(eventsPath).size > beforeSize);
  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.equal(events.at(-1).type, "validation_completed");
});

test("proposals and committed revisions persist without overwriting old revisions", async () => {
  const plan = createWorkspacePlan();
  const firstRevisionId = plan.currentRevisionId;
  const workspacePath = projectWorkspacePath(plan.planId);

  const staged = stageDesignPatch({
    workspaceId: plan.planId,
    summary: "Add two right-side buttons.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", componentId: "button_6mm", quantity: 2 }]
      },
      {
        type: "geometry_preference_patch",
        set: { "placements.buttons.semanticPosition": "right_side" }
      }
    ]
  });
  assert.equal(staged.ok, true);
  const stagedProposal = readJson(`${workspacePath}/proposals/${staged.proposalId}.json`);
  assert.equal(stagedProposal.status, "staged");
  assert.equal(stagedProposal.patches.length, 2);

  const committed = commitStagedChange({
    workspaceId: plan.planId,
    proposalId: staged.proposalId
  });
  assert.equal(committed.ok, true);
  assert.notEqual(committed.newRevisionId, firstRevisionId);
  assert.ok(existsSync(`${workspacePath}/revisions/${firstRevisionId}/revision_manifest.json`));
  assert.ok(existsSync(`${workspacePath}/revisions/${committed.newRevisionId}/revision_manifest.json`));

  const committedProposal = readJson(`${workspacePath}/proposals/${staged.proposalId}.json`);
  assert.equal(committedProposal.status, "committed");
  assert.equal(committedProposal.committedRevisionId, committed.newRevisionId);

  for (const fileName of [
    "product_plan.json",
    "geometry-spec.json",
    "component_selections.json",
    "component_descriptors.json",
    "component_asset_manifest.json",
    "validation_report.json",
    "design_summary.md",
    "generation_inputs.json"
  ]) {
    assert.ok(existsSync(`${workspacePath}/revisions/${committed.newRevisionId}/${fileName}`), fileName);
  }
  for (const fileName of [
    "model.glb",
    "model.stl",
    "shell_front.stl",
    "shell_back.stl",
    "model.step"
  ]) {
    assert.ok(existsSync(`${workspacePath}/revisions/${committed.newRevisionId}/artifacts/${fileName}`), fileName);
  }

  const artifacts = getRevisionArtifacts({
    workspaceId: plan.planId,
    revisionId: committed.newRevisionId
  });
  assert.equal(artifacts.ok, true);
  assert.equal((await readFile(`${workspacePath}/revisions/${committed.newRevisionId}/artifacts/model.glb`)).slice(0, 4).toString("utf8"), "glTF");
  assert.equal((await readFile(artifacts.artifacts.modelGlb.localPath)).slice(0, 4).toString("utf8"), "glTF");

  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.ok(events.some((event) => event.type === "proposal_staged" && event.payload.proposalId === staged.proposalId));
  assert.ok(events.some((event) => event.type === "proposal_committed" && event.payload.proposalId === staged.proposalId));
  assert.ok(events.some((event) => event.type === "artifacts_generated" && event.payload.revisionId === committed.newRevisionId));
});

test("ContextPack summarizes project folder state without raw artifact bytes", () => {
  const plan = createWorkspacePlan();
  const applied = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Move USB-C to the back-left and generate a revision.",
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "placements.usb_c.semanticPosition": "back_left" }
      }
    ]
  });
  assert.equal(applied.ok, true);

  const openProposal = stageDesignPatch({
    workspaceId: plan.planId,
    summary: "Try a cat-ear photo frame shape.",
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "enclosure.shapeProfile": "cat_ear_photo_frame" }
      }
    ]
  });
  assert.equal(openProposal.ok, true);

  const contextPack = buildContextPack({ workspaceId: plan.planId });
  assert.equal(contextPack.ok, true);
  assert.equal(contextPack.projectSummary.currentRevisionId, getProductPlan(plan.planId).currentRevisionId);
  assert.equal(contextPack.currentProductPlanSummary.productType, "desktop_display");
  assert.ok(contextPack.openProposals.some((proposal) => proposal.proposalId === openProposal.proposalId));
  assert.ok(contextPack.allowedTools.some((tool) => tool.name === "commitStagedChange" && tool.requiresConfirmation));
  assert.ok(contextPack.artifactSummary.some((artifact) => artifact.relativePath === "artifacts/model.glb"));
  assert.ok(contextPack.exclusions.includes("raw GLB/STL/STEP bytes"));
  assert.equal(JSON.stringify(contextPack).includes("glTF"), false);
});

test("Tool Protocol metadata covers existing Forge actions and safety flags", () => {
  const names = toolNames();
  for (const expectedName of [
    "getWorkspaceSummary",
    "searchComponentLibrary",
    "proposeDesignChange",
    "stageDesignPatch",
    "commitStagedChange",
    "applyDesignPatch",
    "regenerateRevision",
    "validateDesign",
    "revertRevision",
    "getRevisionArtifacts",
    "rejectStagedChange"
  ]) {
    assert.ok(names.includes(expectedName), expectedName);
  }

  const summary = getToolMetadata("getWorkspaceSummary");
  assert.equal(summary.behavior.readOnly, true);
  assert.equal(summary.concurrency.safeToRunInParallel, true);
  assert.equal(summary.permission.requiresConfirmation, false);
  assert.equal(summary.sideEffects.length, 0);

  const validate = getToolMetadata("validateDesign");
  assert.equal(validate.behavior.readOnly, true);
  assert.equal(validate.permission.requiresConfirmation, false);
  assert.ok(validate.sideEffects.some((effect) => effect.includes("validation_completed")));

  for (const name of ["commitStagedChange", "applyDesignPatch", "regenerateRevision", "revertRevision"]) {
    const metadata = getToolMetadata(name);
    assert.equal(metadata.permission.requiresConfirmation, true, name);
    assert.equal(metadata.concurrency.safeToRunInParallel, false, name);
    assert.equal(metadata.concurrency.lock, "workspace-write", name);
    assert.ok(metadata.disallowedTargets.includes("GLB mutation"), name);
  }

  const writeTools = listToolMetadata().filter((tool) => tool.behavior.createsRevision || tool.behavior.mutatesCurrentState);
  assert.ok(writeTools.every((tool) => tool.concurrency.safeToRunInParallel === false));
});

test("API contract advertises project context and tool metadata routes", () => {
  for (const route of [
    "GET /api/workspaces/:workspaceId/context-pack",
    "GET /api/workspaces/:workspaceId/tools"
  ]) {
    const [method, path] = route.split(" ");
    assert.ok(API_CONTRACT.some((item) => item.method === method && item.path === path), route);
  }
});
