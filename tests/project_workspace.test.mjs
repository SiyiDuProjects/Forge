import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
import { buildContextPack } from "../src/core/context_pack_builder.mjs";
import { buildPromptSections } from "../src/core/prompt_sections.mjs";
import {
  applyWorkspaceDescriptorDraftSpecs,
  applyDesignPatch,
  commitStagedChange,
  getRevisionArtifacts,
  promoteComponentDescriptorDraft,
  regenerateRevision,
  retirePromotedComponentDescriptor,
  scaffoldWorkspaceComponentDescriptorDraft,
  stageDesignPatch,
  validateDesign
} from "../src/core/forge_actions.mjs";
import { createProductPlan, getProductPlan, hydrateProductPlanFromWorkspace } from "../src/core/product_plan.mjs";
import {
  detectGuardViolations,
  guardedEventCount,
  snapshotGuardedFiles
} from "../src/core/guarded_files.mjs";
import {
  appendWorkspaceEvent,
  ensureProjectWorkspace,
  listProjectWorkspaces,
  projectWorkspacePath,
  readProjectWorkspacePlan,
  readRevisionLedger,
  readRuntimePlan,
  readRuntimeBinding,
  readWorkspaceEvents
} from "../src/core/project_workspace.mjs";
import { withWorkspaceWriteLock } from "../src/core/tool_executor.mjs";
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
const BUTTON_DESCRIPTOR = fileURLToPath(new URL("../src/core/component_assets/button_6mm/descriptor.json", import.meta.url));
const BUTTON_SOURCES = fileURLToPath(new URL("../src/core/component_assets/button_6mm/sources.md", import.meta.url));

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
  assert.equal(manifest.revisionLedgerPath, "revision_ledger.json");
  assert.equal(manifest.eventsPath, "events.jsonl");
  assert.equal(runtimePlan.planId, plan.planId);
  assert.equal(productPlan.productType, "desktop_display");
  assert.ok(existsSync(`${workspacePath}/revision_ledger.json`));
  const ledger = readRevisionLedger({ workspaceId: plan.planId });
  assert.equal(ledger.version, "forge_revision_ledger_v0");
  assert.equal(ledger.sourceOfTruth.productPlan, "product_plan.json");
  assert.equal(ledger.derivedOutputs.geometrySpec, "revisions/<revisionId>/geometry-spec.json");
  assert.equal(ledger.directEditingAllowed, false);
  assert.equal(ledger.revisions[0].revisionId, plan.currentRevisionId);
  assert.equal(ledger.revisions[0].artifactManifest.derivedOutputs.some((item) => item.key === "geometrySpec"), true);
  assert.ok(existsSync(`${workspacePath}/AGENTS.md`));
  assert.ok(existsSync(`${workspacePath}/CURRENT_STATE.md`));
  assert.ok(existsSync(`${workspacePath}/WORK_INDEX.md`));
  assert.ok(existsSync(`${workspacePath}/FORGE_TOOLS.md`));
  assert.ok(existsSync(`${workspacePath}/DECISIONS.md`));
  assert.ok(existsSync(`${workspacePath}/skills/hardware-workflow.md`));
  assert.ok(existsSync(`${workspacePath}/skills/3d-generation.md`));
  assert.match(agents, /forge-tool/);
  assert.match(agents, /Guarded Files/);
  assert.match(agents, /revision_ledger\.json/);
  assert.match(agents, /component-drafts\/\*\/descriptor\.json/);
  assert.match(agents, /source-specs\.md/);
  assert.match(tools, /search-component/);
  assert.match(tools, /generate --reason/);
  assert.match(tools, /review --name/);
  assert.match(tools, /Forge action: `submitReviewPacket`/);
  assert.ok(events.some((event) => event.type === "workspace_created"));
  assert.ok(events.some((event) => event.type === "revision_created"));
  assert.ok(events.some((event) => event.type === "user_message"));
});

test("workspace listing restores persisted ProductPlan projects", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "forge-workspaces-"));
  const plan = createWorkspacePlan();
  ensureProjectWorkspace({ plan, rootDir });
  const listed = listProjectWorkspaces({ limit: 12, rootDir });
  const restored = listed.find((workspace) => workspace.workspaceId === plan.planId);
  const restoredPlan = readProjectWorkspacePlan({ workspaceId: plan.planId, rootDir });

  assert.ok(restored);
  assert.equal(restored.title, plan.workspaceState.title);
  assert.equal(restored.currentRevisionId, plan.currentRevisionId);
  assert.equal(restored.productPlan.planId, plan.planId);
  assert.equal(restoredPlan.planId, plan.planId);
});

test("workspace listing skips unreadable ProductPlan files", () => {
  const rootDir = mkdtempSync(join(tmpdir(), "forge-workspaces-"));
  const plan = createWorkspacePlan();
  ensureProjectWorkspace({ plan, rootDir });
  const brokenWorkspaceId = "plan-broken-runtime-json";
  const brokenWorkspacePath = projectWorkspacePath(brokenWorkspaceId, { rootDir });
  mkdirSync(brokenWorkspacePath, { recursive: true });
  writeFileSync(`${brokenWorkspacePath}/project_manifest.json`, JSON.stringify({
    version: "forge_project_workspace_v1",
    projectId: brokenWorkspaceId,
    workspaceId: brokenWorkspaceId,
    title: "Broken workspace",
    runtimePlanPath: "runtime_plan.json",
    createdAt: "2999-01-01T00:00:00.000Z",
    updatedAt: "2999-01-01T00:00:00.000Z"
  }, null, 2));
  writeFileSync(`${brokenWorkspacePath}/runtime_plan.json`, "{\"planId\":");

  const listed = listProjectWorkspaces({ limit: 1, rootDir });

  assert.equal(listed.length, 1);
  assert.equal(listed[0].workspaceId, plan.planId);
  assert.equal(listed[0].productPlan.planId, plan.planId);
  assert.equal(readProjectWorkspacePlan({ workspaceId: brokenWorkspaceId, rootDir }), null);
});

test("runtime binding migrates legacy codexThreadId fields without rewriting them", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const manifest = readJson(`${workspacePath}/project_manifest.json`);
  manifest.codexThreadId = "legacy-thread";
  writeFileSync(`${workspacePath}/project_manifest.json`, JSON.stringify(manifest, null, 2));
  const runtimePlan = readJson(`${workspacePath}/runtime_plan.json`);
  runtimePlan.workspaceState.codexThreadId = "legacy-thread";
  writeFileSync(`${workspacePath}/runtime_plan.json`, JSON.stringify(runtimePlan, null, 2));

  const binding = readRuntimeBinding({ workspaceId: plan.planId });
  assert.equal(binding.provider, "codex");
  assert.equal(binding.bindingId, "legacy-thread");
  assert.equal(binding.migratedFrom, "codexThreadId");

  ensureProjectWorkspace({ plan });
  const migratedManifest = readJson(`${workspacePath}/project_manifest.json`);
  const migratedPlan = readJson(`${workspacePath}/runtime_plan.json`);
  assert.equal(migratedManifest.codexThreadId, undefined);
  assert.equal(migratedManifest.runtimeBinding.bindingId, "legacy-thread");
  assert.equal(migratedPlan.workspaceState.codexThreadId, undefined);
});

test("forge-tool restores a project workspace in a separate process", async () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);

  const summary = runForgeTool(["summary"], workspacePath);
  assert.equal(summary.status, 0, summary.stderr);
  assert.equal(summary.json.ok, true);
  assert.equal(summary.json.workspaceId, plan.planId);
  assert.equal(summary.json.currentRevisionId, plan.currentRevisionId);

  const search = runForgeTool(["search-component", "--query", "button", "--componentType", "button", "--limit", "2"], workspacePath);
  assert.equal(search.status, 0, search.stderr);
  assert.equal(search.json.ok, true);
  assert.ok(search.json.results.some((item) => item.componentType === "button"));

  const packageReport = runForgeTool(["component-package", "--componentId", "button_6mm"], workspacePath);
  assert.equal(packageReport.status, 0, packageReport.stderr);
  assert.equal(packageReport.json.ok, true);
  assert.equal(packageReport.json.componentId, "button_6mm");
  assert.equal(packageReport.json.packageStatus, "reviewable");
  assert.equal(packageReport.json.readyForSelection, true);
  assert.equal(packageReport.json.replacementPolicy.directGeometryMutationAllowed, false);

  const descriptorDraft = runForgeTool([
    "descriptor-draft",
    "--descriptor-file",
    BUTTON_DESCRIPTOR,
    "--sources-file",
    BUTTON_SOURCES,
    "--expected-id",
    "button_6mm"
  ], workspacePath);
  assert.equal(descriptorDraft.status, 0, descriptorDraft.stderr);
  assert.equal(descriptorDraft.json.ok, true);
  assert.equal(descriptorDraft.json.draft, true);
  assert.equal(descriptorDraft.json.readyForLibraryPromotion, true);
  assert.equal(descriptorDraft.json.readyForSelection, false);
  assert.equal(descriptorDraft.json.replacementPolicy.loadedLibraryRequired, true);
  assert.equal(descriptorDraft.json.libraryStatus.loadedComponentExists, true);

  const scaffold = runForgeTool([
    "descriptor-scaffold",
    "--draft-id",
    "button_scaffold_cli",
    "--component-type",
    "button",
    "--display-name",
    "CLI Scaffold Button"
  ], workspacePath);
  assert.equal(scaffold.status, 0, scaffold.stderr);
  assert.equal(scaffold.json.ok, true);
  assert.equal(scaffold.json.scaffolded, true);
  assert.equal(scaffold.json.draftId, "button_scaffold_cli");
  assert.equal(scaffold.json.packagePath, "component-drafts/button_scaffold_cli");
  assert.equal(scaffold.json.readyForLibraryPromotion, false);
  assert.equal(scaffold.json.directGeometryMutationAllowed, false);
  assert.ok(existsSync(join(workspacePath, "component-drafts", "button_scaffold_cli", "descriptor.json")));
  assert.ok(existsSync(join(workspacePath, "component-drafts", "button_scaffold_cli", "sources.md")));

  const scaffoldedDraft = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_scaffold_cli"
  ], workspacePath);
  assert.equal(scaffoldedDraft.status, 0, scaffoldedDraft.stderr);
  assert.equal(scaffoldedDraft.json.ok, true);
  assert.equal(scaffoldedDraft.json.readyForPromotionCount, 0);
  assert.equal(scaffoldedDraft.json.drafts[0].readyForLibraryPromotion, false);
  assert.ok(scaffoldedDraft.json.drafts[0].blockingIssues.some((issue) => issue.code === "descriptor_review_status_draft"));
  const promoteScaffold = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_scaffold_cli"
  ], workspacePath);
  assert.equal(promoteScaffold.status, 1);
  assert.equal(promoteScaffold.json.ok, false);
  assert.equal(promoteScaffold.json.error.code, "DESCRIPTOR_DRAFT_NOT_PROMOTABLE");
  const outsideSpecsPath = join(mkdtempSync(join(tmpdir(), "forge-outside-specs-")), "button-specs.md");
  writeFileSync(outsideSpecsPath, "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; reviewable");
  const outsideSpecsPatch = runForgeTool([
    "descriptor-specs",
    "--draft-id",
    "button_scaffold_cli",
    "--specs-file",
    outsideSpecsPath
  ], workspacePath);
  assert.equal(outsideSpecsPatch.status, 1);
  assert.equal(outsideSpecsPatch.json.ok, false);
  assert.match(outsideSpecsPatch.json.error.message, /inside the Forge project workspace/);

  const thinScaffold = runForgeTool([
    "descriptor-scaffold",
    "--draft-id",
    "button_too_thin_cli",
    "--component-type",
    "button",
    "--display-name",
    "Too Thin CLI Button"
  ], workspacePath);
  assert.equal(thinScaffold.status, 0, thinScaffold.stderr);
  assert.equal(thinScaffold.json.ok, true);
  const thinSpecsPath = join(workspacePath, "component-drafts", "button_too_thin_cli", "source-specs.md");
  writeFileSync(thinSpecsPath, "dimensions 10 x 10 x 0.5 mm; opening 8 x 8 mm; manufacturer Forge Test; part number BTN-TOO-THIN; measurement basis caliper measurement; reviewable");
  const thinSpecsPatch = runForgeTool([
    "descriptor-specs",
    "--draft-id",
    "button_too_thin_cli",
    "--specs-file",
    "component-drafts/button_too_thin_cli/source-specs.md"
  ], workspacePath);
  assert.equal(thinSpecsPatch.status, 0, thinSpecsPatch.stderr);
  assert.equal(thinSpecsPatch.json.ok, true);
  assert.equal(thinSpecsPatch.json.specsApplied, true);
  assert.equal(thinSpecsPatch.json.readyForLibraryPromotion, false);
  assert.ok(thinSpecsPatch.json.blockingIssues.some((issue) => (
    issue.code === "descriptor_preview_solid_dimension_too_thin"
      && issue.source === "dimensionsMm"
      && issue.axis === "depth"
      && issue.actualMm === 0.5
  )));
  const thinPromote = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_too_thin_cli"
  ], workspacePath);
  assert.equal(thinPromote.status, 1);
  assert.equal(thinPromote.json.ok, false);
  assert.equal(thinPromote.json.error.code, "DESCRIPTOR_DRAFT_NOT_PROMOTABLE");
  assert.ok(thinPromote.json.error.draftReport.blockingIssues.some((issue) => issue.code === "descriptor_preview_solid_dimension_too_thin"));

  const oversizedOpeningScaffold = runForgeTool([
    "descriptor-scaffold",
    "--draft-id",
    "button_oversized_opening_cli",
    "--component-type",
    "button",
    "--display-name",
    "Oversized Opening CLI Button"
  ], workspacePath);
  assert.equal(oversizedOpeningScaffold.status, 0, oversizedOpeningScaffold.stderr);
  assert.equal(oversizedOpeningScaffold.json.ok, true);
  const oversizedOpeningSpecsPath = join(workspacePath, "component-drafts", "button_oversized_opening_cli", "source-specs.md");
  writeFileSync(oversizedOpeningSpecsPath, "dimensions 10 x 10 x 6 mm; opening 40 x 40 mm; manufacturer Forge Test; part number BTN-OVERSIZED-OPENING; measurement basis caliper measurement; reviewable");
  const oversizedOpeningSpecsPatch = runForgeTool([
    "descriptor-specs",
    "--draft-id",
    "button_oversized_opening_cli",
    "--specs-file",
    "component-drafts/button_oversized_opening_cli/source-specs.md"
  ], workspacePath);
  assert.equal(oversizedOpeningSpecsPatch.status, 0, oversizedOpeningSpecsPatch.stderr);
  assert.equal(oversizedOpeningSpecsPatch.json.ok, true);
  assert.equal(oversizedOpeningSpecsPatch.json.specsApplied, true);
  assert.equal(oversizedOpeningSpecsPatch.json.readyForLibraryPromotion, false);
  assert.ok(oversizedOpeningSpecsPatch.json.blockingIssues.some((issue) => (
    issue.code === "descriptor_external_opening_exceeds_body_envelope"
      && issue.source === "externalFeatures.button_hole.openingSizeMm"
      && issue.actualMm === 40
      && issue.maximumMm === 18
  )));
  const oversizedOpeningPromote = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_oversized_opening_cli"
  ], workspacePath);
  assert.equal(oversizedOpeningPromote.status, 1);
  assert.equal(oversizedOpeningPromote.json.ok, false);
  assert.equal(oversizedOpeningPromote.json.error.code, "DESCRIPTOR_DRAFT_NOT_PROMOTABLE");
  assert.ok(oversizedOpeningPromote.json.error.draftReport.blockingIssues.some((issue) => issue.code === "descriptor_external_opening_exceeds_body_envelope"));

  const scaffoldSpecsPath = join(workspacePath, "component-drafts", "button_scaffold_cli", "source-specs.md");
  const rawSpecSentinel = "RAW_LOCAL_SPEC_SENTINEL_9F6C2E_CONTEXT_BOUNDARY";
  writeFileSync(scaffoldSpecsPath, [
    "dimensions 10 x 10 x 6 mm",
    "opening 8 x 8 mm",
    "manufacturer Forge Test",
    "part number BTN-8MM-CLI-SPECS",
    "measurement basis caliper measurement",
    "reviewable",
    `internal local-only memo ${rawSpecSentinel}`
  ].join("; "));
  assert.equal(readFileSync(scaffoldSpecsPath, "utf8").includes(rawSpecSentinel), true);

  const specsPatch = runForgeTool([
    "descriptor-specs",
    "--draft-id",
    "button_scaffold_cli",
    "--specs-file",
    "component-drafts/button_scaffold_cli/source-specs.md"
  ], workspacePath);
  assert.equal(specsPatch.status, 0, specsPatch.stderr);
  assert.equal(specsPatch.json.ok, true);
  assert.equal(specsPatch.json.specsApplied, true);
  assert.equal(specsPatch.json.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.equal(specsPatch.json.readyForLibraryPromotion, true);
  assert.ok(specsPatch.json.extractedFields.includes("dimensionsMm"));
  assert.ok(specsPatch.json.extractedFields.includes("openingSizeMm"));
  assert.match(readFileSync(join(workspacePath, "component-drafts", "button_scaffold_cli", "sources.md"), "utf8"), /Source path: component-drafts\/button_scaffold_cli\/source-specs\.md/);
  assert.equal(readFileSync(join(workspacePath, "component-drafts", "button_scaffold_cli", "sources.md"), "utf8").includes(rawSpecSentinel), true);

  const patchedScaffoldDraft = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_scaffold_cli"
  ], workspacePath);
  assert.equal(patchedScaffoldDraft.status, 0, patchedScaffoldDraft.stderr);
  assert.equal(patchedScaffoldDraft.json.ok, true);
  assert.equal(patchedScaffoldDraft.json.readyForPromotionCount, 1);
  assert.equal(patchedScaffoldDraft.json.drafts[0].readyForLibraryPromotion, true);
  assert.equal(patchedScaffoldDraft.json.drafts[0].specPatch.applied, true);
  assert.equal(patchedScaffoldDraft.json.drafts[0].specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.ok(patchedScaffoldDraft.json.drafts[0].specPatch.extractedFields.includes("dimensionsMm"));

  const promotePatchedScaffold = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_scaffold_cli"
  ], workspacePath);
  assert.equal(promotePatchedScaffold.status, 0, promotePatchedScaffold.stderr);
  assert.equal(promotePatchedScaffold.json.ok, true);
  assert.equal(promotePatchedScaffold.json.promoted, true);
  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const patchedContextPack = buildContextPack({ workspaceId: plan.planId });
  const patchedContextDescriptor = patchedContextPack.currentProductPlanSummary.componentLibrary.descriptors.find((item) => item.componentId === "button_scaffold_cli");
  assert.equal(patchedContextDescriptor.workspaceDraft.specPatch.applied, true);
  assert.equal(patchedContextDescriptor.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.ok(patchedContextDescriptor.workspaceDraft.specPatch.extractedFields.includes("openingSizeMm"));
  assert.ok(patchedContextPack.exclusions.includes("raw descriptor source/spec text"));
  assert.equal(JSON.stringify(patchedContextPack).includes(rawSpecSentinel), false);
  const patchedContextPrompt = buildPromptSections({
    contextPack: patchedContextPack,
    userMessage: "Summarize the descriptor draft source boundary."
  });
  assert.equal(patchedContextPrompt.ok, true);
  assert.equal(patchedContextPrompt.systemPrompt.includes(rawSpecSentinel), false);
  const patchedLedger = readRevisionLedger({ workspaceId: plan.planId });
  const patchedLedgerDescriptor = patchedLedger.componentLibrary.descriptors.find((item) => item.componentId === "button_scaffold_cli");
  assert.equal(patchedLedgerDescriptor.workspaceDraft.specPatch.applied, true);
  assert.equal(patchedLedgerDescriptor.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.equal(JSON.stringify(patchedLedger).includes(rawSpecSentinel), false);

  const selectedPatchedScaffold = runForgeTool([
    "descriptor-select",
    "--componentId",
    "button_scaffold_cli",
    "--quantity",
    "1",
    "--message",
    "Use the spec-file patched scaffold button."
  ], workspacePath);
  assert.equal(selectedPatchedScaffold.status, 0, selectedPatchedScaffold.stderr);
  assert.equal(selectedPatchedScaffold.json.ok, true);
  assert.equal(selectedPatchedScaffold.json.selected, true);
  assert.equal(selectedPatchedScaffold.json.componentId, "button_scaffold_cli");
  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const selectedPatchedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === selectedPatchedScaffold.json.newRevisionId);
  assert.equal(selectedPatchedRevision.productPlanSnapshot.componentPreferences.button, "button_scaffold_cli");
  assert.equal(selectedPatchedRevision.modelArtifacts.status, "pending_confirmation");

  const generatedPatchedScaffold = runForgeTool([
    "generate",
    "--revisionId",
    selectedPatchedScaffold.json.newRevisionId,
    "--reason",
    "generate spec-file descriptor origin evidence"
  ], workspacePath);
  assert.equal(generatedPatchedScaffold.status, 0, generatedPatchedScaffold.stderr);
  assert.equal(generatedPatchedScaffold.json.ok, true);
  assert.equal(generatedPatchedScaffold.json.regenerated, true);
  assert.equal(generatedPatchedScaffold.json.sourceRevisionId, selectedPatchedScaffold.json.newRevisionId);
  assert.ok(generatedPatchedScaffold.json.artifactPaths.modelGlb);
  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const patchedGeneratedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === generatedPatchedScaffold.json.revisionId);
  assert.equal(patchedGeneratedRevision.modelArtifacts.status, "generated");
  const patchedOrigin = patchedGeneratedRevision.modelArtifacts.generationEvidence.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_scaffold_cli");
  assert.equal(patchedOrigin.workspaceDraft.specPatch.applied, true);
  assert.equal(patchedOrigin.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.ok(patchedOrigin.workspaceDraft.specPatch.extractedFields.includes("dimensionsMm"));

  const patchedArtifacts = runForgeTool([
    "artifacts",
    "--revisionId",
    generatedPatchedScaffold.json.revisionId
  ], workspacePath);
  assert.equal(patchedArtifacts.status, 0, patchedArtifacts.stderr);
  assert.equal(patchedArtifacts.json.ok, true);
  assert.equal(patchedArtifacts.json.artifactStatus.generated, true);
  assert.equal(patchedArtifacts.json.artifactStatus.trustedGenerated, true);
  assert.equal(patchedArtifacts.json.artifactStatus.artifactAuditStatus, "passed");
  assert.equal(patchedArtifacts.json.artifactStatus.hasGenerationEvidenceReport, true);
  assert.ok(patchedArtifacts.json.artifacts.generationEvidenceReport.localPath);
  const patchedEvidenceReport = JSON.parse(await readFile(patchedArtifacts.json.artifacts.generationEvidenceReport.localPath, "utf8"));
  const patchedEvidenceOrigin = patchedEvidenceReport.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_scaffold_cli");
  assert.equal(patchedEvidenceOrigin.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.equal(JSON.stringify(patchedEvidenceReport).includes(rawSpecSentinel), false);
  patchedEvidenceOrigin.rawSpecText = rawSpecSentinel;
  patchedEvidenceOrigin.workspaceDraft.rawSpecText = rawSpecSentinel;
  patchedEvidenceOrigin.workspaceDraft.specPatch.rawSpecText = rawSpecSentinel;
  patchedEvidenceOrigin.replacement.rawSpecText = rawSpecSentinel;
  writeFileSync(
    patchedArtifacts.json.artifacts.generationEvidenceReport.localPath,
    `${JSON.stringify(patchedEvidenceReport, null, 2)}\n`
  );
  assert.equal(
    readFileSync(patchedArtifacts.json.artifacts.generationEvidenceReport.localPath, "utf8").includes(rawSpecSentinel),
    true
  );
  const patchedGeneratedContextPack = buildContextPack({ workspaceId: plan.planId });
  const patchedGeneratedOrigin = patchedGeneratedContextPack.generationEvidenceSummary.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_scaffold_cli");
  assert.equal(patchedGeneratedOrigin.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_scaffold_cli/source-specs.md");
  assert.equal(patchedGeneratedOrigin.rawSpecText, undefined);
  assert.equal(patchedGeneratedOrigin.workspaceDraft.rawSpecText, undefined);
  assert.equal(patchedGeneratedOrigin.workspaceDraft.specPatch.rawSpecText, undefined);
  assert.equal(patchedGeneratedOrigin.replacement.rawSpecText, undefined);
  assert.equal(JSON.stringify(patchedGeneratedContextPack).includes(rawSpecSentinel), false);
  const patchedGeneratedPrompt = buildPromptSections({
    contextPack: patchedGeneratedContextPack,
    userMessage: "What safe metadata proves this generated model used the workspace spec-file descriptor?"
  });
  assert.equal(patchedGeneratedPrompt.ok, true);
  assert.match(patchedGeneratedPrompt.systemPrompt, /raw descriptor source\/spec text/);
  assert.equal(patchedGeneratedPrompt.systemPrompt.includes(rawSpecSentinel), false);

  const draftDir = join(workspacePath, "component-drafts", "button_8mm_cli");
  mkdirSync(draftDir, { recursive: true });
  const promotedDescriptor = readJson(BUTTON_DESCRIPTOR);
  promotedDescriptor.identity.id = "button_8mm_cli";
  promotedDescriptor.identity.displayName = "8 mm CLI Button";
  promotedDescriptor.identity.partNumber = "BTN-8MM-CLI";
  promotedDescriptor.versioning.descriptorVersion = "0.1.0";
  promotedDescriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  promotedDescriptor.externalFeatures[0].openingSizeMm = [8, 8];
  promotedDescriptor.sourceNotes.summary = "CLI-promoted ProductPlan descriptor draft.";
  const promotedDescriptorPath = join(draftDir, "descriptor.json");
  const promotedSourcesPath = join(draftDir, "sources.md");
  writeFileSync(promotedDescriptorPath, JSON.stringify(promotedDescriptor, null, 2));
  writeFileSync(promotedSourcesPath, [
    "# button_8mm_cli sources",
    "Received date: 2026-06-06",
    "Context: CLI promoted descriptor draft.",
    "Status: reviewable proxy, not production verified."
  ].join("\n"));

  const workspaceDrafts = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_8mm_cli"
  ], workspacePath);
  assert.equal(workspaceDrafts.status, 0, workspaceDrafts.stderr);
  assert.equal(workspaceDrafts.json.ok, true);
  assert.equal(workspaceDrafts.json.draftCount, 1);
  assert.equal(workspaceDrafts.json.readyForPromotionCount, 1);
  assert.equal(workspaceDrafts.json.drafts[0].draftId, "button_8mm_cli");
  assert.equal(workspaceDrafts.json.drafts[0].readyForLibraryPromotion, true);
  assert.equal(workspaceDrafts.json.drafts[0].packagePath, "component-drafts/button_8mm_cli");
  assert.equal(workspaceDrafts.json.drafts[0].packageIntegrity.descriptorSha256.length, 64);
  assert.equal(workspaceDrafts.json.drafts[0].packageIntegrity.sourcesSha256.length, 64);
  assert.equal(workspaceDrafts.json.drafts[0].promotion.promoted, false);
  assert.equal(workspaceDrafts.json.drafts[0].promotion.status, "not_promoted");

  const promote = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_8mm_cli"
  ], workspacePath);
  assert.equal(promote.status, 0, promote.stderr);
  assert.equal(promote.json.ok, true);
  assert.equal(promote.json.promoted, true);
  assert.equal(promote.json.draftId, "button_8mm_cli");
  assert.equal(promote.json.componentId, "button_8mm_cli");
  assert.equal(promote.json.readyForSelection, true);
  assert.equal(promote.json.packagePath, "component-drafts/button_8mm_cli");

  const selectPromoted = runForgeTool([
    "descriptor-select",
    "--componentId",
    "button_8mm_cli",
    "--quantity",
    "1",
    "--message",
    "Use CLI promoted button."
  ], workspacePath);
  assert.equal(selectPromoted.status, 0, selectPromoted.stderr);
  assert.equal(selectPromoted.json.ok, true);
  assert.equal(selectPromoted.json.selected, true);
  assert.equal(selectPromoted.json.componentId, "button_8mm_cli");
  assert.equal(selectPromoted.json.componentPreferencePath, "componentPreferences.button");
  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const selectedCliRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === selectPromoted.json.newRevisionId);
  assert.equal(selectedCliRevision.productPlanSnapshot.componentPreferences.button, "button_8mm_cli");
  assert.equal(selectedCliRevision.modelArtifacts.status, "pending_confirmation");

  const promotedWorkspaceDrafts = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_8mm_cli"
  ], workspacePath);
  assert.equal(promotedWorkspaceDrafts.status, 0, promotedWorkspaceDrafts.stderr);
  assert.equal(promotedWorkspaceDrafts.json.ok, true);
  assert.equal(promotedWorkspaceDrafts.json.drafts[0].promotion.promoted, true);
  assert.equal(promotedWorkspaceDrafts.json.drafts[0].promotion.componentId, "button_8mm_cli");
  assert.equal(promotedWorkspaceDrafts.json.drafts[0].promotion.workspaceDraftIntegrity.status, "matched");

  const promotedSearch = runForgeTool(["search-component", "--query", "cli", "--componentType", "button", "--limit", "5"], workspacePath);
  assert.equal(promotedSearch.status, 0, promotedSearch.stderr);
  assert.equal(promotedSearch.json.ok, true);
  const promotedSearchRow = promotedSearch.json.results.find((item) => item.componentId === "button_8mm_cli");
  assert.ok(promotedSearchRow);
  assert.equal(promotedSearchRow.mechanicalConstraints.sourceEvidence.workspaceDraftIntegrity.status, "matched");

  const promotedPackage = runForgeTool(["component-package", "--componentId", "button_8mm_cli"], workspacePath);
  assert.equal(promotedPackage.status, 0, promotedPackage.stderr);
  assert.equal(promotedPackage.json.ok, true);
  assert.equal(promotedPackage.json.sourceEvidence.sourceType, "workspace_descriptor_draft");
  assert.equal(promotedPackage.json.sourceEvidence.workspaceDraft.packagePath, "component-drafts/button_8mm_cli");
  assert.equal(promotedPackage.json.sourceEvidence.workspaceDraft.descriptorSha256.length, 64);
  assert.equal(promotedPackage.json.sourceEvidence.workspaceDraft.sourcesSha256.length, 64);
  assert.equal(promotedPackage.json.sourceEvidence.workspaceDraftIntegrity.status, "matched");

  const contextPack = buildContextPack({ workspaceId: plan.planId });
  assert.equal(contextPack.ok, true);
  assert.ok(contextPack.currentProductPlanSummary.componentLibrary.promotedComponentIds.includes("button_8mm_cli"));
  const contextDescriptor = contextPack.currentProductPlanSummary.componentLibrary.descriptors.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(contextDescriptor.sourceType, "workspace_descriptor_draft");
  assert.equal(contextDescriptor.workspaceDraft.packagePath, "component-drafts/button_8mm_cli");
  assert.equal(contextDescriptor.workspaceDraft.descriptorSha256.length, 64);
  assert.equal(contextDescriptor.workspaceDraft.integrityStatus.status, "matched");
  assert.equal(contextPack.currentProductPlanSummary.componentLibrary.directEditingAllowed, false);

  const ledger = readRevisionLedger({ workspaceId: plan.planId });
  assert.ok(ledger.componentLibrary.descriptorIds.includes("button_8mm_cli"));
  const ledgerDescriptor = ledger.componentLibrary.descriptors.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(ledgerDescriptor.sourceType, "workspace_descriptor_draft");
  assert.equal(ledgerDescriptor.workspaceDraft.descriptorPath, "component-drafts/button_8mm_cli/descriptor.json");
  assert.equal(ledgerDescriptor.workspaceDraft.sourcesSha256.length, 64);
  assert.equal(ledgerDescriptor.workspaceDraft.integrityStatus.status, "matched");
  assert.equal(ledger.componentLibrary.directEditingAllowed, false);
  assert.ok(readWorkspaceEvents({ workspaceId: plan.planId }).some((event) => (
    event.type === "component_descriptor_promoted"
      && event.payload.componentId === "button_8mm_cli"
  )));

  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const selectedPromoted = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Use the workspace draft CLI button.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", componentId: "button_8mm_cli", quantity: 1 }]
      }
    ]
  });
  assert.equal(selectedPromoted.ok, true);
  const generatedPromoted = regenerateRevision({
    workspaceId: plan.planId,
    revisionId: selectedPromoted.newRevisionId,
    reason: "generate workspace draft descriptor origin evidence"
  });
  assert.equal(generatedPromoted.ok, true);
  const generatedPromotedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === generatedPromoted.revisionId);
  const promotedOrigin = generatedPromotedRevision.modelArtifacts.generationEvidence.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(promotedOrigin.sourceType, "workspace_descriptor_draft");
  assert.equal(promotedOrigin.workspaceDraft.sourcesPath, "component-drafts/button_8mm_cli/sources.md");
  assert.equal(promotedOrigin.workspaceDraft.descriptorSha256.length, 64);
  const generatedOriginSourcesSha256 = promotedOrigin.workspaceDraft.sourcesSha256;
  const generatedOriginContextPack = buildContextPack({ workspaceId: plan.planId });
  const contextOrigin = generatedOriginContextPack.generationEvidenceSummary.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(contextOrigin.workspaceDraft.packagePath, "component-drafts/button_8mm_cli");
  assert.equal(contextOrigin.workspaceDraft.sourcesSha256.length, 64);

  writeFileSync(promotedSourcesPath, [
    "# button_8mm_cli sources",
    "Received date: 2026-06-06",
    "Context: CLI promoted descriptor draft.",
    "Status: reviewable proxy, not production verified.",
    "Revision note: local workspace draft sources changed after promotion."
  ].join("\n"));
  const driftWorkspaceDrafts = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_8mm_cli"
  ], workspacePath);
  assert.equal(driftWorkspaceDrafts.status, 0, driftWorkspaceDrafts.stderr);
  assert.equal(driftWorkspaceDrafts.json.ok, true);
  const driftPromotion = driftWorkspaceDrafts.json.drafts[0].promotion;
  assert.equal(driftPromotion.promoted, true);
  assert.equal(driftPromotion.workspaceDraftIntegrity.status, "changed");
  assert.ok(driftPromotion.workspaceDraftIntegrity.changedFields.includes("sourcesSha256"));
  const driftPackage = runForgeTool(["component-package", "--componentId", "button_8mm_cli"], workspacePath);
  assert.equal(driftPackage.status, 0, driftPackage.stderr);
  assert.equal(driftPackage.json.ok, true);
  assert.equal(driftPackage.json.sourceEvidence.workspaceDraftIntegrity.status, "changed");
  const driftCurrentSourcesSha256 = driftPackage.json.sourceEvidence.workspaceDraftIntegrity.current.sourcesSha256;
  assert.notEqual(
    driftCurrentSourcesSha256,
    driftPackage.json.sourceEvidence.workspaceDraftIntegrity.promoted.sourcesSha256
  );
  const driftContextPack = buildContextPack({ workspaceId: plan.planId });
  const driftContextDescriptor = driftContextPack.currentProductPlanSummary.componentLibrary.descriptors.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(driftContextDescriptor.workspaceDraft.integrityStatus.status, "changed");
  assert.equal(promotedOrigin.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);

  const replacePromote = runForgeTool([
    "descriptor-promote",
    "--draft-id",
    "button_8mm_cli",
    "--replace-existing"
  ], workspacePath);
  assert.equal(replacePromote.status, 0, replacePromote.stderr);
  assert.equal(replacePromote.json.ok, true);
  assert.equal(replacePromote.json.promoted, true);
  assert.equal(replacePromote.json.componentId, "button_8mm_cli");
  assert.equal(replacePromote.json.replacement.replacedExisting, true);
  assert.equal(replacePromote.json.replacement.replacementCount, 1);
  assert.equal(replacePromote.json.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);

  const replacedWorkspaceDrafts = runForgeTool([
    "descriptor-drafts",
    "--draft-id",
    "button_8mm_cli"
  ], workspacePath);
  assert.equal(replacedWorkspaceDrafts.status, 0, replacedWorkspaceDrafts.stderr);
  assert.equal(replacedWorkspaceDrafts.json.ok, true);
  assert.equal(replacedWorkspaceDrafts.json.drafts[0].promotion.workspaceDraftIntegrity.status, "matched");
  assert.equal(replacedWorkspaceDrafts.json.drafts[0].promotion.workspaceDraftIntegrity.promoted.sourcesSha256, driftCurrentSourcesSha256);
  const replacedPackage = runForgeTool(["component-package", "--componentId", "button_8mm_cli"], workspacePath);
  assert.equal(replacedPackage.status, 0, replacedPackage.stderr);
  assert.equal(replacedPackage.json.ok, true);
  assert.equal(replacedPackage.json.sourceEvidence.workspaceDraftIntegrity.status, "matched");
  assert.equal(replacedPackage.json.sourceEvidence.workspaceDraft.sourcesSha256, driftCurrentSourcesSha256);
  const replacedContextPack = buildContextPack({ workspaceId: plan.planId });
  const replacedContextDescriptor = replacedContextPack.currentProductPlanSummary.componentLibrary.descriptors.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(replacedContextDescriptor.replacement.replacedExisting, true);
  assert.equal(replacedContextDescriptor.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);
  assert.equal(replacedContextDescriptor.replacementHistory.length, 1);
  const replacedLedger = readRevisionLedger({ workspaceId: plan.planId });
  const replacedLedgerDescriptor = replacedLedger.componentLibrary.descriptors.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(replacedLedgerDescriptor.replacement.replacedExisting, true);
  assert.equal(replacedLedgerDescriptor.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);
  const replacementEvent = readWorkspaceEvents({ workspaceId: plan.planId })
    .findLast((event) => event.type === "component_descriptor_promoted");
  assert.equal(replacementEvent.type, "component_descriptor_promoted");
  assert.equal(replacementEvent.payload.replacement.replacedExisting, true);
  assert.equal(replacementEvent.payload.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);

  hydrateProductPlanFromWorkspace({ planId: plan.planId, force: true });
  const selectedReplacedPromoted = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Use the re-promoted workspace draft CLI button.",
    patches: [
      {
        type: "component_patch",
        add: [{ componentType: "button", componentId: "button_8mm_cli", quantity: 1 }]
      }
    ]
  });
  assert.equal(selectedReplacedPromoted.ok, true);
  const generatedReplacedPromoted = regenerateRevision({
    workspaceId: plan.planId,
    revisionId: selectedReplacedPromoted.newRevisionId,
    reason: "generate replaced workspace draft descriptor evidence"
  });
  assert.equal(generatedReplacedPromoted.ok, true);
  const generatedReplacedRevision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === generatedReplacedPromoted.revisionId);
  const replacedOrigin = generatedReplacedRevision.modelArtifacts.generationEvidence.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(replacedOrigin.workspaceDraft.sourcesSha256, driftCurrentSourcesSha256);
  assert.notEqual(replacedOrigin.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);
  assert.equal(replacedOrigin.replacement.replacedExisting, true);
  assert.equal(replacedOrigin.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);
  assert.equal(replacedOrigin.replacementHistory.length, 1);
  const replacedOriginContextPack = buildContextPack({ workspaceId: plan.planId });
  const replacedContextOrigin = replacedOriginContextPack.generationEvidenceSummary.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_cli");
  assert.equal(replacedContextOrigin.replacement.previous.workspaceDraft.sourcesSha256, generatedOriginSourcesSha256);

  const retire = runForgeTool([
    "descriptor-retire",
    "--componentId",
    "button_8mm_cli",
    "--reason",
    "source superseded"
  ], workspacePath);
  assert.equal(retire.status, 0, retire.stderr);
  assert.equal(retire.json.ok, true);
  assert.equal(retire.json.retired, true);
  assert.equal(retire.json.componentId, "button_8mm_cli");
  assert.equal(retire.json.libraryStatus.retiredDescriptorCount, 1);

  const retiredSearch = runForgeTool(["search-component", "--query", "cli", "--componentType", "button", "--limit", "5"], workspacePath);
  assert.equal(retiredSearch.status, 0, retiredSearch.stderr);
  assert.equal(retiredSearch.json.ok, true);
  assert.equal(retiredSearch.json.results.some((item) => item.componentId === "button_8mm_cli"), false);

  const retiredContextPack = buildContextPack({ workspaceId: plan.planId });
  assert.equal(retiredContextPack.ok, true);
  assert.ok(retiredContextPack.currentProductPlanSummary.componentLibrary.promotedComponentIds.includes("button_8mm_cli"));
  assert.ok(retiredContextPack.currentProductPlanSummary.componentLibrary.retiredComponentIds.includes("button_8mm_cli"));
  assert.equal(retiredContextPack.currentProductPlanSummary.componentLibrary.activeComponentIds.includes("button_8mm_cli"), false);

  const retiredLedger = readRevisionLedger({ workspaceId: plan.planId });
  assert.ok(retiredLedger.componentLibrary.descriptorIds.includes("button_8mm_cli"));
  assert.ok(retiredLedger.componentLibrary.retiredDescriptorIds.includes("button_8mm_cli"));
  assert.equal(retiredLedger.componentLibrary.activeDescriptorIds.includes("button_8mm_cli"), false);
  assert.equal(retiredLedger.eventSummary.latestEventType, "component_descriptor_retired");

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
  const beforeApplyRevisionCount = readJson(`${workspacePath}/runtime_plan.json`).revisions.length;
  const apply = runForgeTool(["apply", "--message", "Make the shell graphite.", "--patches", patches], workspacePath);
  assert.equal(apply.status, 0, apply.stderr);
  assert.equal(apply.json.ok, true);
  assert.equal(apply.json.applied, true);

  const runtimePlan = readJson(`${workspacePath}/runtime_plan.json`);
  assert.equal(runtimePlan.revisions.length, beforeApplyRevisionCount + 1);
  assert.equal(runtimePlan.workspaceState.productPlan.constraints.finish, "graphite");

  const review = runForgeTool(["review", "--name", "Internal Tester", "--email", "tester@example.com"], workspacePath);
  assert.equal(review.status, 0, review.stderr);
  assert.equal(review.json.ok, true);
  assert.equal(review.json.submitted, true);
  assert.ok(review.json.reviewId);
  assert.equal(existsSync(`${workspacePath}/review/review_request.json`), true);
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

test("guarded file detector catches direct workspace descriptor package writes", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  const draftDir = join(workspacePath, "component-drafts", "button_direct_guard");
  mkdirSync(draftDir, { recursive: true });
  writeFileSync(join(draftDir, "descriptor.json"), JSON.stringify({ tampered: true }, null, 2));
  writeFileSync(join(draftDir, "sources.md"), "direct source rewrite");
  writeFileSync(join(draftDir, "source-specs.md"), "raw source notes are not guarded canonical descriptor state");

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.deepEqual(violations.map((item) => item.path), [
    "component-drafts/button_direct_guard/descriptor.json",
    "component-drafts/button_direct_guard/sources.md"
  ]);
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

test("guarded file detector allows descriptor draft scaffold and spec patch action writes", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const beforeScaffold = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeScaffoldEventCount = guardedEventCount({ workspaceId: plan.planId });

  const scaffold = scaffoldWorkspaceComponentDescriptorDraft({
    workspaceId: plan.planId,
    draftId: "button_guard_scaffold",
    componentType: "button",
    displayName: "Guard Scaffold Button"
  });
  assert.equal(scaffold.ok, true);
  assert.deepEqual(detectGuardViolations({
    workspaceId: plan.planId,
    before: beforeScaffold,
    beforeEventCount: beforeScaffoldEventCount
  }), []);

  writeFileSync(
    join(workspacePath, "component-drafts", "button_guard_scaffold", "source-specs.md"),
    "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; manufacturer Guard Test; part number BTN-GUARD-SPECS; measurement basis caliper measurement; reviewable"
  );
  const beforeSpecs = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeSpecsEventCount = guardedEventCount({ workspaceId: plan.planId });
  const specs = applyWorkspaceDescriptorDraftSpecs({
    workspaceId: plan.planId,
    draftId: "button_guard_scaffold",
    specsText: "dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; manufacturer Guard Test; part number BTN-GUARD-SPECS; measurement basis caliper measurement; reviewable",
    specsSourcePath: "component-drafts/button_guard_scaffold/source-specs.md"
  });
  assert.equal(specs.ok, true);
  assert.equal(specs.readyForLibraryPromotion, true);
  assert.deepEqual(detectGuardViolations({
    workspaceId: plan.planId,
    before: beforeSpecs,
    beforeEventCount: beforeSpecsEventCount
  }), []);
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

test("guarded file detector allows descriptor promotion root-state writes", () => {
  const plan = createWorkspacePlan();
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });
  const descriptor = readJson(BUTTON_DESCRIPTOR);
  descriptor.identity.id = "button_guard_promoted";
  descriptor.identity.displayName = "Guard Promoted Button";
  descriptor.identity.partNumber = "BTN-GUARD-PROMOTED";
  descriptor.versioning.descriptorVersion = "0.1.0";

  const result = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor,
    expectedId: "button_guard_promoted",
    sourcesText: [
      "# button_guard_promoted sources",
      "Received date: 2026-06-06",
      "Context: guard test promoted descriptor.",
      "Status: reviewable proxy, not production verified."
    ].join("\n")
  });
  assert.equal(result.ok, true);

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.deepEqual(violations, []);
});

test("guarded file detector allows descriptor retirement root-state writes", () => {
  const plan = createWorkspacePlan();
  const descriptor = readJson(BUTTON_DESCRIPTOR);
  descriptor.identity.id = "button_guard_retired";
  descriptor.identity.displayName = "Guard Retired Button";
  descriptor.identity.partNumber = "BTN-GUARD-RETIRED";
  descriptor.versioning.descriptorVersion = "0.1.0";

  const promoted = promoteComponentDescriptorDraft({
    workspaceId: plan.planId,
    descriptor,
    expectedId: "button_guard_retired",
    sourcesText: [
      "# button_guard_retired sources",
      "Received date: 2026-06-06",
      "Context: guard test retired descriptor.",
      "Status: reviewable proxy, not production verified."
    ].join("\n")
  });
  assert.equal(promoted.ok, true);

  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });
  const retired = retirePromotedComponentDescriptor({
    workspaceId: plan.planId,
    componentId: "button_guard_retired",
    reason: "guard test retirement"
  });
  assert.equal(retired.ok, true);

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.deepEqual(violations, []);
});

test("guarded file detector allows only event-payload-specific proposal paths", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  writeFileSync(`${workspacePath}/proposals/proposal-unauthorized.json`, JSON.stringify({ tampered: true }, null, 2));
  appendWorkspaceEvent({
    workspaceId: plan.planId,
    type: "proposal_created",
    actor: "assistant",
    payload: { proposalId: "proposal-authorized" }
  });

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "proposals/proposal-unauthorized.json");
});

test("guarded file detector allows only event-payload-specific revision paths", () => {
  const plan = createWorkspacePlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const before = snapshotGuardedFiles({ workspaceId: plan.planId });
  const beforeEventCount = guardedEventCount({ workspaceId: plan.planId });

  mkdirSync(`${workspacePath}/revisions/rev_unauthorized`, { recursive: true });
  writeFileSync(`${workspacePath}/revisions/rev_unauthorized/product_plan.json`, JSON.stringify({ tampered: true }, null, 2));
  appendWorkspaceEvent({
    workspaceId: plan.planId,
    type: "revision_created",
    actor: "system",
    payload: { revisionId: "rev_authorized" }
  });

  const violations = detectGuardViolations({
    workspaceId: plan.planId,
    before,
    beforeEventCount
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "revisions/rev_unauthorized/product_plan.json");
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
  const stagedLedger = readRevisionLedger({ workspaceId: plan.planId });
  assert.equal(stagedLedger.proposals.some((proposal) => (
    proposal.proposalId === staged.proposalId
      && proposal.status === "staged"
      && proposal.decision === "pending"
  )), true);

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
  const committedLedger = readRevisionLedger({ workspaceId: plan.planId });
  const committedLedgerProposal = committedLedger.proposals.find((proposal) => proposal.proposalId === staged.proposalId);
  assert.equal(committedLedgerProposal.decision, "accepted");
  assert.equal(committedLedgerProposal.committedRevisionId, committed.newRevisionId);
  assert.ok(committedLedger.acceptedChanges.some((change) => (
    change.proposalId === staged.proposalId
      && change.revisionId === committed.newRevisionId
      && change.decision === "accepted"
  )));
  const committedRevisionRecord = committedLedger.revisions.find((revision) => revision.revisionId === committed.newRevisionId);
  assert.equal(committedRevisionRecord.diff.toRevisionId, committed.newRevisionId);
  assert.equal(committedRevisionRecord.artifactManifest.generated, false);
  assert.equal(committedRevisionRecord.rollbackTarget.action, "revertRevision");

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
    assert.equal(existsSync(`${workspacePath}/revisions/${committed.newRevisionId}/artifacts/${fileName}`), false, fileName);
  }

  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.ok(events.some((event) => event.type === "proposal_staged" && event.payload.proposalId === staged.proposalId));
  assert.ok(events.some((event) => event.type === "proposal_committed" && event.payload.proposalId === staged.proposalId));
  assert.equal(events.some((event) => event.type === "artifacts_generated" && event.payload.revisionId === committed.newRevisionId), false);

  const generated = regenerateRevision({
    workspaceId: plan.planId,
    revisionId: committed.newRevisionId,
    reason: "confirmed_model_generation"
  });
  assert.equal(generated.ok, true);
  assert.ok(generated.artifactPaths.modelGlb);
  const generatedLedger = readRevisionLedger({ workspaceId: plan.planId });
  const generatedRecord = generatedLedger.revisions.find((revision) => revision.revisionId === generated.revisionId);
  assert.equal(generatedRecord.artifactManifest.generated, true);
  assert.equal(generatedRecord.artifactManifest.trustedGenerated, true);
  assert.equal(generatedRecord.artifactManifest.generatedArtifacts.some((artifact) => (
    artifact.key === "glb"
      && artifact.relativePath === `revisions/${generated.revisionId}/artifacts/model.glb`
      && artifact.sha256.length === 64
      && artifact.directEditingAllowed === false
  )), true);
  const artifacts = getRevisionArtifacts({
    workspaceId: plan.planId,
    revisionId: generated.revisionId
  });
  assert.equal(artifacts.ok, true);
  assert.ok(artifacts.artifacts.generationEvidenceReport.localPath);
  assert.equal((await readFile(artifacts.artifacts.modelGlb.localPath)).slice(0, 4).toString("utf8"), "glTF");
});

test("ContextPack summarizes project folder state without raw artifact bytes", () => {
  const plan = createWorkspacePlan();
  const applied = applyDesignPatch({
    workspaceId: plan.planId,
    message: "Move USB-C to the back-left and create a revision.",
    patches: [
      {
        type: "geometry_preference_patch",
        set: { "placements.usb_c.semanticPosition": "back_left" }
      }
    ]
  });
  assert.equal(applied.ok, true);
  const generated = regenerateRevision({
    workspaceId: plan.planId,
    revisionId: applied.newRevisionId,
    reason: "confirmed_model_generation"
  });
  assert.equal(generated.ok, true);

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
  assert.equal(contextPack.generationEvidenceSummary.available, true);
  assert.equal(contextPack.currentRevisionSummary.generationEvidence?.artifactAudit?.status, "passed");
  assert.equal(contextPack.currentRevisionSummary.generationEvidence?.artifactAudit?.passed, true);
  assert.equal(contextPack.currentRevisionSummary.generationEvidence?.artifactAudit?.diagnostics.glb.thinMeshPrimitiveCount, 0);
  assert.equal(contextPack.currentRevisionSummary.generationEvidence?.artifactAudit?.diagnostics.stl.degenerateFacetCount, 0);
  assert.equal(contextPack.currentRevisionSummary.generationEvidence?.artifactAudit?.diagnostics.step.directEditingBoundaryPresent, true);
  assert.equal(contextPack.revisionLedgerSummary.currentRevisionId, generated.revisionId);
  assert.equal(contextPack.revisionLedgerSummary.rollbackSupported, true);
  assert.equal(contextPack.revisionLedgerSummary.directEditingAllowed, false);
  assert.equal(contextPack.generationEvidenceSummary.status, "generated");
  assert.equal(contextPack.generationEvidenceSummary.sourceOfTruth.generatedFromRawChat, false);
  assert.equal(contextPack.generationEvidenceSummary.generatedArtifactsPresent, true);
  assert.equal(contextPack.generationEvidenceSummary.descriptorEvidence.mechanicalConstraintCoverage.proxyComponentCount >= 3, true);
  assert.equal(contextPack.generationEvidenceSummary.layoutEvidence.coverage.placementCount >= 3, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactIntegrity.glb.sha256.length, 64);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.status, "passed");
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.passed, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.glb.passed, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.glb.diagnostics.thinMeshPrimitiveCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.stl.diagnostics.geometry.degenerateFacetCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.stl.diagnostics.geometry.thinAxisCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.shellFront.diagnostics.geometry.thinAxisCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.shellBack.diagnostics.geometry.thinAxisCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.step.diagnostics.format.hasComponentAssetManifest, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.checks.step.diagnostics.metadata.directEditingBoundaryPresent, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.diagnostics.glb.thinMeshPrimitiveCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.diagnostics.stl.thinAxisCount, 0);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.diagnostics.step.shellDimensionsPositive, true);
  assert.equal(contextPack.generationEvidenceSummary.artifactAudit.findingCount, 0);
  assert.ok(contextPack.exclusions.includes("raw GLB/STL/STEP bytes"));
  assert.equal(JSON.stringify(contextPack).includes("glTF"), false);
  const prompt = buildPromptSections({
    contextPack,
    userMessage: "What evidence proves the 3D model was generated from this revision?"
  });
  assert.equal(prompt.ok, true);
  assert.match(prompt.systemPrompt, /generationEvidenceSummary/);
  assert.match(prompt.systemPrompt, /source chain, validation, descriptor\/layout coverage, post-write artifact audit, and file integrity/);
  assert.match(prompt.systemPrompt, /generationEvidenceReport/);
  assert.doesNotMatch(prompt.systemPrompt, /glTF/);
});

test("Tool Protocol metadata covers existing Forge actions and safety flags", () => {
  const names = toolNames();
  for (const expectedName of [
    "getWorkspaceSummary",
    "searchComponentLibrary",
    "inspectComponentPackage",
    "inspectComponentDescriptorDraft",
    "inspectWorkspaceComponentDescriptorDrafts",
    "scaffoldWorkspaceComponentDescriptorDraft",
    "applyWorkspaceDescriptorDraftSpecs",
    "promoteComponentDescriptorDraft",
    "promoteWorkspaceComponentDescriptorDraft",
    "selectComponentDescriptor",
    "retirePromotedComponentDescriptor",
    "proposeDesignChange",
    "stageDesignPatch",
    "commitStagedChange",
    "applyDesignPatch",
    "regenerateRevision",
    "validateDesign",
    "revertRevision",
    "getRevisionArtifacts",
    "rejectStagedChange",
    "submitReviewPacket"
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

  const draftScanner = getToolMetadata("inspectWorkspaceComponentDescriptorDrafts");
  assert.equal(draftScanner.behavior.readOnly, true);
  assert.equal(draftScanner.permission.requiresConfirmation, false);
  const draftScaffold = getToolMetadata("scaffoldWorkspaceComponentDescriptorDraft");
  assert.equal(draftScaffold.permission.requiresConfirmation, true);
  assert.equal(draftScaffold.behavior.writesWorkspaceDraft, true);
  assert.equal(draftScaffold.behavior.mutatesComponentLibrary, false);
  const draftSpecs = getToolMetadata("applyWorkspaceDescriptorDraftSpecs");
  assert.equal(draftSpecs.permission.requiresConfirmation, true);
  assert.equal(draftSpecs.behavior.writesWorkspaceDraft, true);
  assert.equal(draftSpecs.behavior.mutatesComponentLibrary, false);
  assert.equal(draftSpecs.behavior.createsRevision, false);
  assert.ok(draftSpecs.inputSchema.properties.specsSourcePath);
  assert.ok(draftSpecs.outputSchema.properties.specsSourcePath);
  const descriptorSelect = getToolMetadata("selectComponentDescriptor");
  assert.equal(descriptorSelect.permission.requiresConfirmation, true);
  assert.equal(descriptorSelect.behavior.createsRevision, true);
  assert.equal(descriptorSelect.behavior.writesArtifacts, false);
  assert.ok(getToolMetadata("promoteComponentDescriptorDraft").outputSchema.properties.replacement);
  assert.ok(getToolMetadata("promoteWorkspaceComponentDescriptorDraft").outputSchema.properties.replacement);

  const artifactsTool = getToolMetadata("getRevisionArtifacts");
  assert.equal(artifactsTool.behavior.readOnly, true);
  assert.ok(artifactsTool.outputSchema.properties.artifacts.properties.generationEvidenceReport);
  assert.ok(artifactsTool.outputSchema.properties.artifactPaths.properties.generationEvidenceReport);
  assert.ok(artifactsTool.outputSchema.properties.artifactStatus.properties.hasGenerationEvidenceReport);
  assert.ok(artifactsTool.outputSchema.properties.artifactStatus.properties.trustedGenerated);
  assert.ok(artifactsTool.outputSchema.properties.artifactStatus.properties.artifactAuditStatus);
  assert.ok(artifactsTool.outputSchema.properties.artifactStatus.properties.artifactAuditPassed);
  assert.ok(artifactsTool.outputSchema.properties.artifactStatus.properties.artifactAuditFindingCount);

  for (const name of ["scaffoldWorkspaceComponentDescriptorDraft", "applyWorkspaceDescriptorDraftSpecs", "promoteComponentDescriptorDraft", "promoteWorkspaceComponentDescriptorDraft", "selectComponentDescriptor", "retirePromotedComponentDescriptor", "commitStagedChange", "applyDesignPatch", "regenerateRevision", "revertRevision", "submitReviewPacket"]) {
    const metadata = getToolMetadata(name);
    assert.equal(metadata.permission.requiresConfirmation, true, name);
    assert.equal(metadata.concurrency.safeToRunInParallel, false, name);
    assert.equal(metadata.concurrency.lock, "workspace-write", name);
    assert.ok(metadata.disallowedTargets.includes("GLB mutation"), name);
  }

  const writeTools = listToolMetadata().filter((tool) => tool.behavior.createsRevision || tool.behavior.mutatesCurrentState);
  assert.ok(writeTools.every((tool) => tool.concurrency.safeToRunInParallel === false));
});

test("workspace-write lock serializes writes per workspace without blocking reads or other workspaces", async () => {
  const writeMetadata = getToolMetadata("applyDesignPatch");
  const readMetadata = getToolMetadata("getWorkspaceSummary");
  const order = [];
  let releaseFirst;
  let firstStartedResolve;
  const firstStarted = new Promise((resolve) => {
    firstStartedResolve = resolve;
  });
  const first = withWorkspaceWriteLock({
    workspaceId: "workspace-a",
    toolMetadata: writeMetadata
  }, async () => {
    order.push("first-start");
    firstStartedResolve();
    await new Promise((resolve) => {
      releaseFirst = resolve;
    });
    order.push("first-end");
  });
  await firstStarted;

  const second = withWorkspaceWriteLock({
    workspaceId: "workspace-a",
    toolMetadata: writeMetadata
  }, async () => {
    order.push("second");
  });
  const read = withWorkspaceWriteLock({
    workspaceId: "workspace-a",
    toolMetadata: readMetadata
  }, async () => {
    order.push("read");
  });
  const otherWorkspace = withWorkspaceWriteLock({
    workspaceId: "workspace-b",
    toolMetadata: writeMetadata
  }, async () => {
    order.push("other-workspace");
  });

  await Promise.all([read, otherWorkspace]);
  assert.deepEqual(order, ["first-start", "read", "other-workspace"]);
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(order, ["first-start", "read", "other-workspace", "first-end", "second"]);
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
