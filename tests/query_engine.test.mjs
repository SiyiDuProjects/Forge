import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
import { loadChatSession } from "../src/core/chat_session_store.mjs";
import { buildContextPack } from "../src/core/context_pack_builder.mjs";
import { ensureCodexProjectThread, parseCodexToolIntent, runCodexProductTurn } from "../src/core/codex_runtime.mjs";
import { scaffoldWorkspaceComponentDescriptorDraft } from "../src/core/forge_actions.mjs";
import { runForgeChatTurn, confirmForgeChatTool, resolveChatRuntime } from "../src/core/forge_query_engine.mjs";
import { checkToolPermission } from "../src/core/permission_gate.mjs";
import { CodexModelAdapter, openAIResponsesUrl } from "../src/core/model_adapters.mjs";
import { createProductPlan, getProductPlan } from "../src/core/product_plan.mjs";
import { createProductPlanForRuntime } from "../src/core/runtime_plan_creation.mjs";
import { getRuntimeStatus } from "../src/core/runtime_status.mjs";
import { exportToolsForModel } from "../src/core/tool_schema_exporter.mjs";
import { projectWorkspacePath, readProjectManifest, readRuntimeBinding, readWorkspaceEvents, updateRuntimeBinding } from "../src/core/project_workspace.mjs";
import { getToolMetadata, listToolMetadata } from "../src/core/tool_registry.mjs";

function createChatPlan() {
  return createProductPlan({
    initialMessage: "Small woodgrain desktop display for photos and weather, 3.5 inch, USB-C powered.",
    language: "en"
  }).productPlan;
}

const FORGE_TOOL = fileURLToPath(new URL("../scripts/forge-tool.mjs", import.meta.url));
const BUTTON_DESCRIPTOR = fileURLToPath(new URL("../src/core/component_assets/button_6mm/descriptor.json", import.meta.url));

function runForgeToolForCodex(cwd, args) {
  const result = spawnSync(process.execPath, [FORGE_TOOL, ...args], {
    cwd,
    encoding: "utf8"
  });
  let json = null;
  try {
    json = JSON.parse(result.stdout || "{}");
  } catch {
    json = {
      ok: false,
      error: {
        code: "INVALID_FORGE_TOOL_JSON",
        message: result.stdout || result.stderr || "forge-tool did not return JSON"
      }
    };
  }
  if (result.status !== 0 || json?.ok === false) {
    throw new Error(json?.error?.message || result.stderr || `forge-tool failed: ${args.join(" ")}`);
  }
  return json;
}

function readRuntimePlan(workspacePath) {
  return JSON.parse(readFileSync(`${workspacePath}/runtime_plan.json`, "utf8"));
}

function writeWorkspaceButtonDraft(plan, draftId = "button_8mm_chat") {
  const workspacePath = projectWorkspacePath(plan.planId);
  const draftDir = join(workspacePath, "component-drafts", draftId);
  mkdirSync(draftDir, { recursive: true });
  const descriptor = JSON.parse(readFileSync(BUTTON_DESCRIPTOR, "utf8"));
  descriptor.identity.id = draftId;
  descriptor.identity.displayName = "8 mm Chat Button";
  descriptor.identity.partNumber = "BTN-8MM-CHAT";
  descriptor.versioning.descriptorVersion = "0.1.0";
  descriptor.dimensionsMm = { width: 10, height: 10, depth: 6 };
  descriptor.externalFeatures[0].openingSizeMm = [8, 8];
  descriptor.sourceNotes.summary = "Chat-promoted ProductPlan descriptor draft.";
  descriptor.sourceNotes.confidence = "descriptor_reviewed";
  writeFileSync(join(draftDir, "descriptor.json"), JSON.stringify(descriptor, null, 2));
  writeFileSync(join(draftDir, "sources.md"), [
    `# ${draftId} sources`,
    "Received date: 2026-06-07",
    "Context: QueryEngine workspace descriptor draft chat test.",
    "Status: reviewable proxy, not production verified."
  ].join("\n"));
}

test("QueryEngine runs a direct model tool loop through Forge actions", async () => {
  const plan = createChatPlan();
  const initialRevisionCount = plan.revisions.length;

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_direct",
    userMessage: "Add two buttons on the right side.",
    modelProvider: "mock"
  });

  assert.equal(result.ok, true);
  assert.equal(result.pendingConfirmation, null);
  assert.ok(result.assistantMessage.includes(result.revision.revisionId));
  assert.match(result.assistantMessage, /explicit confirmation/);
  assert.doesNotMatch(result.assistantMessage, /updated the 3D model\/shell artifact state/);
  assert.deepEqual(result.toolCalls.map((call) => call.name), ["searchComponentLibrary", "applyDesignPatch"]);
  assert.equal(result.toolResults.every((item) => item.ok), true);
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount + 1);
  assert.equal(getProductPlan(plan.planId).currentRevisionId, result.revision.revisionId);
  assert.equal(result.artifactPaths.modelGlb, null);
  const createdRevision = getProductPlan(plan.planId).revisions.find((revision) => revision.revisionId === result.revision.revisionId);
  assert.equal(createdRevision.modelArtifacts.status, "pending_confirmation");

  const session = loadChatSession({ workspaceId: plan.planId, sessionId: "test_direct" });
  assert.equal(session.ok, true);
  assert.ok(session.messages.some((message) => message.role === "user" && /buttons/.test(message.content)));
  assert.ok(session.messages.some((message) => message.role === "assistant"));
  assert.ok(session.recentEvents.some((event) => event.type === "model_request"));
  assert.ok(session.recentEvents.some((event) => event.type === "chat_turn_completed"));

  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.ok(events.some((event) => event.type === "model_request"));
  assert.ok(events.some((event) => event.type === "tool_call" && event.payload.toolName === "applyDesignPatch"));
  assert.ok(events.some((event) => event.type === "chat_turn_completed"));
});

test("QueryEngine emits live trace events for model and tool progress", async () => {
  const plan = createChatPlan();
  const traceEvents = [];

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_trace_events",
    userMessage: "Add two buttons on the right side.",
    modelProvider: "mock",
    onTraceEvent: (event) => traceEvents.push(event)
  });

  assert.equal(result.ok, true);
  const types = traceEvents.map((event) => event.type);
  assert.ok(types.includes("chat_turn_started"));
  assert.ok(types.includes("user_message"));
  assert.ok(types.includes("context_pack_built"));
  assert.ok(types.includes("model_request"));
  assert.ok(types.includes("model_response"));
  assert.ok(types.includes("tool_call_selected"));
  assert.ok(types.includes("tool_execution_started"));
  assert.ok(types.includes("tool_result"));
  assert.ok(types.includes("assistant_message"));
  assert.ok(types.includes("chat_turn_completed"));
  assert.equal(
    traceEvents.find((event) => event.type === "tool_result" && event.summary?.newRevisionId)?.summary?.newRevisionId,
    result.revision.revisionId
  );
  assert.equal(traceEvents.at(-1).type, "chat_turn_completed");
});

test("QueryEngine turns finish changes into ProductPlan revisions", async () => {
  const plan = createChatPlan();
  const initialRevisionCount = plan.revisions.length;

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_finish_patch",
    userMessage: "Make the shell finish graphite grey and keep USB-C power.",
    modelProvider: "mock"
  });

  const updated = getProductPlan(plan.planId);
  assert.equal(result.ok, true);
  assert.deepEqual(result.toolCalls.map((call) => call.name), ["applyDesignPatch"]);
  assert.equal(updated.revisions.length, initialRevisionCount + 1);
  assert.equal(updated.revisions.at(-1).productPlanSnapshot.constraints.finish, "graphite");
  assert.equal(updated.currentRevisionId, result.revision.revisionId);
});

test("QueryEngine selects explicit ComponentDescriptor ids through a narrow descriptor-selection action", async () => {
  const plan = createChatPlan();

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_select",
    userMessage: "Use button_6mm quantity 1.",
    modelProvider: "mock"
  });

  assert.equal(result.ok, true);
  assert.equal(result.pendingConfirmation, null);
  assert.deepEqual(result.toolCalls.map((call) => call.name), ["selectComponentDescriptor"]);
  assert.equal(result.toolResults.every((item) => item.ok), true);
  assert.ok(result.assistantMessage.includes("button_6mm"));
  assert.ok(result.assistantMessage.includes(result.revision.revisionId));
  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === result.revision.revisionId);
  assert.equal(revision.productPlanSnapshot.componentPreferences.button, "button_6mm");
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
  assert.equal(result.artifactPaths.modelGlb, null);
});

test("QueryEngine inspects and promotes explicit workspace descriptor drafts before selection", async () => {
  const plan = createChatPlan();
  writeWorkspaceButtonDraft(plan, "button_8mm_chat");

  const inspection = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_draft_chat",
    userMessage: "Check descriptor draft button_8mm_chat.",
    modelProvider: "mock"
  });

  assert.equal(inspection.ok, true);
  assert.equal(inspection.pendingConfirmation, null);
  assert.deepEqual(inspection.toolCalls.map((call) => call.name), ["inspectWorkspaceComponentDescriptorDrafts"]);
  assert.equal(inspection.toolResults[0].result.readyForPromotionCount, 1);
  assert.equal(inspection.toolResults[0].result.drafts[0].readyForLibraryPromotion, true);
  assert.ok(inspection.assistantMessage.includes("button_8mm_chat"));
  assert.equal(inspection.revision, null);
  assert.equal(inspection.artifactPaths.modelGlb || null, null);

  const promoted = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_draft_chat",
    userMessage: "Promote descriptor draft button_8mm_chat.",
    modelProvider: "mock"
  });

  assert.equal(promoted.ok, true);
  assert.equal(promoted.pendingConfirmation, null);
  assert.deepEqual(promoted.toolCalls.map((call) => call.name), ["promoteWorkspaceComponentDescriptorDraft"]);
  assert.equal(promoted.toolResults[0].result.promoted, true);
  assert.equal(promoted.toolResults[0].result.componentId, "button_8mm_chat");
  assert.equal(promoted.toolResults[0].result.readyForSelection, true);
  assert.ok(promoted.assistantMessage.includes("button_8mm_chat"));
  assert.equal(promoted.revision, null);
  assert.equal(promoted.artifactPaths.modelGlb || null, null);

  const selected = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_draft_chat",
    userMessage: "Use button_8mm_chat quantity 1.",
    modelProvider: "mock"
  });

  assert.equal(selected.ok, true);
  assert.equal(selected.pendingConfirmation, null);
  assert.deepEqual(selected.toolCalls.map((call) => call.name), ["selectComponentDescriptor"]);
  assert.equal(selected.toolResults[0].result.selected, true);
  assert.equal(selected.toolResults[0].result.componentId, "button_8mm_chat");
  const revision = getProductPlan(plan.planId).revisions.find((item) => item.revisionId === selected.revision.revisionId);
  assert.equal(revision.productPlanSnapshot.componentPreferences.button, "button_8mm_chat");
  assert.ok(revision.productPlanSnapshot.componentLibrary.descriptors.some((entry) => entry.componentId === "button_8mm_chat"));
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
  assert.equal(selected.artifactPaths.modelGlb, null);
});

test("QueryEngine applies explicit specs to a workspace descriptor draft without generating artifacts", async () => {
  const plan = createChatPlan();
  const scaffold = scaffoldWorkspaceComponentDescriptorDraft({
    workspaceId: plan.planId,
    draftId: "button_8mm_specs_chat",
    componentType: "button",
    displayName: "8 mm Specs Chat Button"
  });
  assert.equal(scaffold.ok, true);
  assert.equal(scaffold.readyForLibraryPromotion, false);

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_specs_chat",
    userMessage: "Apply specs to descriptor draft button_8mm_specs_chat: dimensions 10 x 10 x 6 mm; opening 8 x 8 mm; manufacturer Forge Test; part number BTN-8MM-SPECS; measurement basis caliper measurement; reviewable.",
    modelProvider: "mock"
  });

  assert.equal(result.ok, true);
  assert.equal(result.pendingConfirmation, null);
  assert.deepEqual(result.toolCalls.map((call) => call.name), ["applyWorkspaceDescriptorDraftSpecs"]);
  assert.equal(result.toolResults[0].result.specsApplied, true);
  assert.equal(result.toolResults[0].result.draftId, "button_8mm_specs_chat");
  assert.equal(result.toolResults[0].result.readyForLibraryPromotion, true);
  assert.ok(result.toolResults[0].result.extractedFields.includes("dimensionsMm"));
  assert.ok(result.toolResults[0].result.extractedFields.includes("openingSizeMm"));
  assert.equal(result.toolResults[0].result.specPatch.applied, true);
  assert.ok(result.toolResults[0].result.specPatch.extractedFields.includes("dimensionsMm"));
  assert.ok(result.assistantMessage.includes("button_8mm_specs_chat"));
  assert.equal(result.revision, null);
  assert.equal(result.artifactPaths.modelGlb || null, null);

  const promoted = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_descriptor_specs_chat",
    userMessage: "Promote descriptor draft button_8mm_specs_chat.",
    modelProvider: "mock"
  });
  assert.equal(promoted.ok, true);
  assert.equal(promoted.pendingConfirmation, null);
  assert.equal(promoted.toolResults[0].result.promoted, true);
  assert.equal(promoted.toolResults[0].result.componentId, "button_8mm_specs_chat");
  assert.equal(promoted.revision, null);
  assert.equal(promoted.artifactPaths.modelGlb || null, null);
});

test("QueryEngine keeps exploratory design questions as proposals", async () => {
  const plan = createChatPlan();
  const initialRevisionCount = plan.revisions.length;

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_proposal",
    userMessage: "Would cat ears look too childish?",
    modelProvider: "mock"
  });

  assert.equal(result.ok, true);
  assert.equal(result.revision, null);
  assert.equal(result.proposal.status, "proposed");
  assert.equal(result.toolCalls[0].name, "proposeDesignChange");
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount);
  assert.equal(getProductPlan(plan.planId).workspaceState.proposals.at(-1).proposalId, result.proposal.proposalId);
});

test("QueryEngine commits an open proposal only after explicit confirmation wording", async () => {
  const plan = createChatPlan();
  const proposalTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_commit",
    userMessage: "What if we add two buttons on the right side?",
    modelProvider: "mock"
  });
  assert.equal(proposalTurn.ok, true);
  assert.ok(proposalTurn.proposal.proposalId);
  const afterProposalRevisionCount = getProductPlan(plan.planId).revisions.length;

  const commitTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_commit",
    userMessage: "Yes, apply it.",
    modelProvider: "mock"
  });

  assert.equal(commitTurn.ok, true);
  assert.equal(commitTurn.toolCalls[0].name, "commitStagedChange");
  assert.equal(commitTurn.revision.revisionId, getProductPlan(plan.planId).currentRevisionId);
  assert.equal(getProductPlan(plan.planId).revisions.length, afterProposalRevisionCount + 1);
  assert.equal(getProductPlan(plan.planId).workspaceState.proposals.at(-1).status, "committed");
});

test("Permission gate turns ambiguous mutations into confirmations and confirm endpoint executes them", async () => {
  const plan = createChatPlan();
  const initialRevisionCount = plan.revisions.length;

  const pendingTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_confirm",
    userMessage: "Maybe move USB-C to back-left?",
    modelProvider: "mock"
  });

  assert.equal(pendingTurn.ok, true);
  assert.equal(pendingTurn.pendingConfirmation.status, "pending");
  assert.equal(pendingTurn.toolCalls[0].permission.decision, "confirm");
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount);
  const pendingSession = loadChatSession({ workspaceId: plan.planId, sessionId: "test_confirm" });
  assert.equal(pendingSession.pendingConfirmation.confirmationId, pendingTurn.pendingConfirmation.confirmationId);
  assert.equal(pendingSession.pendingConfirmation.status, "pending");
  assert.ok(pendingSession.recentEvents.some((event) => event.type === "confirmation_required"));

  const confirmed = await confirmForgeChatTool({
    workspaceId: plan.planId,
    sessionId: "test_confirm",
    confirmationId: pendingTurn.pendingConfirmation.confirmationId,
    approved: true
  });

  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.pendingConfirmation, null);
  assert.equal(confirmed.revision.revisionId, getProductPlan(plan.planId).currentRevisionId);
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount + 1);
  const resolvedSession = loadChatSession({ workspaceId: plan.planId, sessionId: "test_confirm" });
  assert.equal(resolvedSession.pendingConfirmation, null);
});

test("Permission gate denies raw geometry or artifact mutation targets", () => {
  const denied = checkToolPermission({
    toolName: "applyDesignPatch",
    toolMetadata: getToolMetadata("applyDesignPatch"),
    userMessage: "Apply this mesh edit.",
    toolInput: {
      workspaceId: "plan-test",
      rawMesh: { vertices: [] },
      patches: []
    }
  });

  assert.equal(denied.decision, "deny");
  assert.equal(denied.error.code, "RAW_MUTATION_TARGET");

  const allowedSafetyText = checkToolPermission({
    toolName: "applyDesignPatch",
    toolMetadata: getToolMetadata("applyDesignPatch"),
    userMessage: "把 USB-C 移到后面左侧。",
    toolInput: {
      workspaceId: "plan-test",
      message: "把 USB-C 移到后面左侧；不要直接修改 geometry-spec.json。",
      patches: [
        {
          type: "geometry_preference_patch",
          set: { "placements.usb_c.semanticPosition": "back_left" }
        }
      ]
    }
  });

  assert.notEqual(allowedSafetyText.error?.code, "RAW_MUTATION_TARGET");
  assert.equal(allowedSafetyText.decision, "allow");
});

test("QueryEngine feeds denied tool calls back to the model for correction", async () => {
  const plan = createChatPlan();
  let callCount = 0;
  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_denied_tool_repair",
    userMessage: "把 USB-C 移到后面左侧。",
    modelAdapterFactory: () => ({
      async runTurn({ toolResults = [] } = {}) {
        callCount += 1;
        if (callCount === 1) {
          return {
            ok: true,
            finalMessage: "",
            toolCalls: [
              {
                name: "applyDesignPatch",
                input: {
                  workspaceId: plan.planId,
                  rawGeometrySpec: { placements: { usb_c: "back_left" } },
                  patches: []
                }
              }
            ]
          };
        }
        if (callCount === 2) {
          assert.equal(toolResults.at(-1)?.summary?.code, "RAW_MUTATION_TARGET");
          return {
            ok: true,
            finalMessage: "",
            toolCalls: [
              {
                name: "proposeDesignChange",
                input: {
                  workspaceId: plan.planId,
                  message: "把 USB-C 移到后面左侧。"
                }
              }
            ]
          };
        }
        return {
          ok: true,
          finalMessage: "已改用 proposal，不直接写 GeometrySpec。",
          toolCalls: []
        };
      }
    })
  });

  assert.equal(result.ok, true);
  assert.equal(callCount, 3);
  assert.equal(result.toolResults[0].ok, false);
  assert.equal(result.toolResults[0].summary.code, "RAW_MUTATION_TARGET");
  assert.equal(result.toolResults[1].ok, true);
  assert.equal(result.proposal.status, "proposed");
  assert.equal(result.proposal.patches.some((patch) => (
    patch.type === "geometry_preference_patch"
    && patch.set?.["placements.usb_c.semanticPosition"] === "back_left"
  )), true);
  assert.equal(result.assistantMessage, "已改用 proposal，不直接写 GeometrySpec。");
});

test("Tool schema exporter and API contract expose chat runtime surfaces", () => {
  const exported = exportToolsForModel({ tools: listToolMetadata() });
  assert.equal(exported.ok, true);
  assert.ok(exported.tools.some((tool) => tool.name === "inspectComponentPackage" && tool.readOnly));
  assert.ok(exported.tools.some((tool) => tool.name === "inspectComponentDescriptorDraft" && tool.readOnly));
  assert.ok(exported.tools.some((tool) => tool.name === "inspectWorkspaceComponentDescriptorDrafts" && tool.readOnly));
  assert.ok(exported.tools.some((tool) => tool.name === "scaffoldWorkspaceComponentDescriptorDraft" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "applyWorkspaceDescriptorDraftSpecs" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "promoteComponentDescriptorDraft" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "promoteWorkspaceComponentDescriptorDraft" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "selectComponentDescriptor" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "retirePromotedComponentDescriptor" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "applyDesignPatch" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "proposeDesignChange" && tool.createsProposal));

  const paths = API_CONTRACT.map((route) => route.path);
  assert.ok(paths.includes("/api/runtime/status"));
  assert.ok(paths.includes("/api/plans/stream"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/turn/stream"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/turn"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/:sessionId"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/confirm"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/drafts"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/drafts/scaffold"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/drafts/:draftId/specs"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/drafts/:draftId/promote"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/:componentId/select"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/components/:componentId/retire"));
});

test("runtime selection keeps Codex, Forge QueryEngine, mock, and OpenAI roles distinct", () => {
  assert.deepEqual(resolveChatRuntime({ runtimeProvider: "codex", modelProvider: "mock" }), {
    runtimeProvider: "codex",
    modelProvider: "codex",
    requestedRuntimeProvider: "codex"
  });
  assert.deepEqual(resolveChatRuntime({ runtimeProvider: "forge-query-engine", modelProvider: "openai" }), {
    runtimeProvider: "forge-query-engine",
    modelProvider: "openai",
    requestedRuntimeProvider: "forge-query-engine"
  });
  assert.deepEqual(resolveChatRuntime({ runtimeProvider: "forge-query-engine", modelProvider: "forge-query-engine" }), {
    runtimeProvider: "forge-query-engine",
    modelProvider: "mock",
    requestedRuntimeProvider: "forge-query-engine"
  });
  assert.deepEqual(resolveChatRuntime({ modelProvider: "openai" }), {
    runtimeProvider: "forge-query-engine",
    modelProvider: "openai",
    requestedRuntimeProvider: "openai"
  });
  assert.deepEqual(resolveChatRuntime({ runtimeProvider: "mock", modelProvider: "codex" }), {
    runtimeProvider: "mock",
    modelProvider: "mock",
    requestedRuntimeProvider: "mock"
  });
});

test("runtime status preflight reports Codex SDK and project thread state", async () => {
  const plan = createChatPlan();
  updateRuntimeBinding({
    workspaceId: plan.planId,
    provider: "codex",
    status: "ready",
    bindingId: "thread-runtime-status"
  });

  const ready = await getRuntimeStatus({
    workspaceId: plan.planId,
    runtimeProvider: "codex",
    modelProvider: "codex",
    sdkImporter: async () => ({ Codex: class Codex {} })
  });

  assert.equal(ready.ok, true);
  assert.equal(ready.runtimes.mock.ready, true);
  assert.equal(ready.runtimes["forge-query-engine"].ready, true);
  assert.equal(ready.runtimes.codex.available, true);
  assert.equal(ready.runtimes.codex.threadState, "ready");
  assert.equal(ready.runtimes.codex.bindingId, "thread-runtime-status");
  assert.equal(ready.runtimes.codex.runtimeBinding.bindingId, "thread-runtime-status");

  const missing = await getRuntimeStatus({
    runtimeProvider: "codex",
    modelProvider: "codex",
    sdkImporter: async () => {
      throw new Error("not installed");
    }
  });

  assert.equal(missing.runtimes.codex.available, false);
  assert.equal(missing.runtimes.codex.state, "missing_sdk");
  assert.match(missing.runtimes.codex.message, /not installed/);
  assert.equal(missing.runtimes.codex.threadState, "no_workspace");
});

test("ContextPack remains compact and excludes raw generated artifact bytes", async () => {
  const plan = createChatPlan();
  await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_context",
    userMessage: "Add two buttons on the right side.",
    modelProvider: "mock"
  });
  const contextPack = buildContextPack({ workspaceId: plan.planId });
  assert.equal(contextPack.ok, true);
  assert.ok(contextPack.exclusions.includes("raw GLB/STL/STEP bytes"));
  assert.equal(typeof contextPack.generationEvidenceSummary.available, "boolean");
  assert.equal(typeof contextPack.generationEvidenceSummary.artifactAudit?.available, "boolean");
  assert.ok(contextPack.artifactSummary.every((artifact) => typeof artifact.bytes === "number"));
  assert.equal(JSON.stringify(contextPack).includes("glTF"), false);
});

test("QueryEngine default stays on local Forge tools even if OpenAI env is configured", async () => {
  const previousProvider = process.env.FORGE_MODEL_PROVIDER;
  const previousChatProvider = process.env.FORGE_CHAT_MODEL_PROVIDER;
  process.env.FORGE_MODEL_PROVIDER = "openai";
  delete process.env.FORGE_CHAT_MODEL_PROVIDER;
  try {
    const plan = createChatPlan();
    const result = await runForgeChatTurn({
      workspaceId: plan.planId,
      sessionId: "test_default_provider",
      userMessage: "Add two buttons on the right side."
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.toolCalls.map((call) => call.name), ["searchComponentLibrary", "applyDesignPatch"]);
    assert.equal(result.toolResults.every((item) => item.ok), true);
  } finally {
    if (previousProvider === undefined) delete process.env.FORGE_MODEL_PROVIDER;
    else process.env.FORGE_MODEL_PROVIDER = previousProvider;
    if (previousChatProvider === undefined) delete process.env.FORGE_CHAT_MODEL_PROVIDER;
    else process.env.FORGE_CHAT_MODEL_PROVIDER = previousChatProvider;
  }
});

test("Codex runtime creates and reuses one thread for a Forge project", async () => {
  const plan = createChatPlan();
  const initialRevisionCount = plan.revisions.length;
  let startCount = 0;
  let resumeCount = 0;
  let runCount = 0;
  const startOptions = [];
  const resumeOptions = [];
  const codexFactory = async () => ({
    startThread(options) {
      startCount += 1;
      startOptions.push(options);
      return fakeCodexThread(`codex-thread-${startCount}`);
    },
    resumeThread(threadId, options) {
      resumeCount += 1;
      resumeOptions.push(options);
      return fakeCodexThread(threadId);
    }
  });

  function fakeCodexThread(id) {
    return {
      id,
      async run() {
        runCount += 1;
        if (runCount === 1) {
          return {
            final_response: JSON.stringify({
              toolCalls: [
                {
                  name: "applyDesignPatch",
                  input: {
                    message: "Make the shell graphite.",
                    patches: [
                      {
                        type: "plan_patch",
                        set: {
                          "constraints.finish": "graphite"
                        }
                      }
                    ]
                  }
                }
              ]
            })
          };
        }
        return {
          final_response: JSON.stringify({
            assistantMessage: "Updated through the Codex runtime.",
            toolCalls: []
          })
        };
      }
    };
  }

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_runtime",
    userMessage: "Make the shell graphite.",
    runtimeProvider: "codex",
    codexFactory
  });

  assert.equal(result.ok, true);
  assert.equal(result.runtimeBinding.bindingId, "codex-thread-1");
  assert.equal(result.bindingId, "codex-thread-1");
  assert.equal(startCount, 1);
  assert.equal(resumeCount, 1);
  assert.equal(startOptions[0].workingDirectory, projectWorkspacePath(plan.planId));
  assert.equal(startOptions[0].skipGitRepoCheck, true);
  assert.equal(startOptions[0].sandboxMode, "workspace-write");
  assert.equal(resumeOptions[0].workingDirectory, projectWorkspacePath(plan.planId));
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount + 1);
  assert.equal(getProductPlan(plan.planId).revisions.at(-1).productPlanSnapshot.constraints.finish, "graphite");
  const manifest = readProjectManifest({ workspaceId: plan.planId });
  assert.equal(manifest.runtimeBinding.bindingId, "codex-thread-1");
  assert.equal(manifest.codexThreadId, undefined);
  assert.ok(result.modelResponses.every((response) => response.bindingId === "codex-thread-1"));
});

test("Codex runtime streams SDK progress into Forge trace events", async () => {
  const plan = createChatPlan();
  const traceEvents = [];
  const codexFactory = async () => ({
    startThread() {
      return fakeStreamedCodexThread("stream-thread");
    },
    resumeThread(threadId) {
      return fakeStreamedCodexThread(threadId);
    }
  });

  function fakeStreamedCodexThread(id) {
    return {
      id,
      async runStreamed() {
        return {
          events: (async function* events() {
            yield { type: "thread.started", thread_id: id };
            yield { type: "turn.started" };
            yield {
              type: "item.started",
              item: {
                id: "cmd_1",
                type: "command_execution",
                command: "node scripts/forge-tool.mjs apply --message streamed",
                aggregated_output: "this full command output should not be exposed",
                status: "in_progress"
              }
            };
            yield {
              type: "item.completed",
              item: {
                id: "cmd_1",
                type: "command_execution",
                command: "node scripts/forge-tool.mjs apply --message streamed",
                aggregated_output: "this full command output should not be exposed",
                exit_code: 0,
                status: "completed"
              }
            };
            yield {
              type: "item.updated",
              item: {
                id: "todo_1",
                type: "todo_list",
                items: [
                  { text: "Inspect Forge project context", completed: true },
                  { text: "Return tool intent", completed: false }
                ]
              }
            };
            yield {
              type: "item.completed",
              item: {
                id: "reasoning_1",
                type: "reasoning",
                text: "The project can be inspected without changing ProductPlan state."
              }
            };
            yield {
              type: "item.completed",
              item: {
                id: "msg_1",
                type: "agent_message",
                text: JSON.stringify({
                  assistantMessage: "Streamed Codex turn completed.",
                  toolCalls: []
                })
              }
            };
            yield {
              type: "turn.completed",
              usage: {
                input_tokens: 100,
                cached_input_tokens: 10,
                output_tokens: 20,
                reasoning_output_tokens: 5
              }
            };
          })()
        };
      }
    };
  }

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_stream_trace",
    userMessage: "Just inspect the current project.",
    runtimeProvider: "codex",
    codexFactory,
    onTraceEvent: (event) => traceEvents.push(event)
  });

  assert.equal(result.ok, true);
  assert.equal(result.bindingId, "stream-thread");
  assert.match(result.assistantMessage, /Streamed Codex/);
  assert.ok(traceEvents.some((event) => event.type === "codex_thread_started" && event.codexThreadId === "stream-thread"));
  assert.ok(traceEvents.some((event) => event.type === "codex_turn_started"));
  assert.ok(traceEvents.some((event) => event.type === "codex_turn_completed" && event.usage?.inputTokens === 100));
  const commandTrace = traceEvents.find((event) => event.type === "codex_item_completed" && event.itemType === "command_execution");
  assert.equal(commandTrace.summary.command, "node scripts/forge-tool.mjs apply --message streamed");
  assert.equal(commandTrace.summary.aggregated_output, undefined);
  assert.equal(commandTrace.item.command, "node scripts/forge-tool.mjs apply --message streamed");
  assert.equal(commandTrace.item.aggregated_output, undefined);
  const todoTrace = traceEvents.find((event) => event.type === "codex_item_updated" && event.itemType === "todo_list");
  assert.equal(todoTrace.item.items.length, 2);
  assert.equal(todoTrace.item.items[0].text, "Inspect Forge project context");
  const reasoningTrace = traceEvents.find((event) => event.type === "codex_item_completed" && event.itemType === "reasoning");
  assert.match(reasoningTrace.item.text, /without changing ProductPlan state/);
  const restoredSession = loadChatSession({
    workspaceId: plan.planId,
    sessionId: "test_codex_stream_trace",
    limit: 80
  });
  const restoredCodexItem = restoredSession.recentEvents.find((event) => event.type === "codex_item_completed" && event.payload?.itemType === "reasoning");
  assert.match(restoredCodexItem.payload.item.text, /without changing ProductPlan state/);
});

test("Codex runtime forwards abort signals to streamed SDK turns", async () => {
  const controller = new AbortController();
  let observedSignal = null;
  const thread = {
    id: "signal-thread",
    async runStreamed(_prompt, options = {}) {
      observedSignal = options.signal;
      return {
        events: (async function* events() {
          yield {
            type: "item.completed",
            item: {
              id: "msg_1",
              type: "agent_message",
              text: JSON.stringify({
                assistantMessage: "Signal observed.",
                toolCalls: []
              })
            }
          };
          yield {
            type: "turn.completed",
            usage: {
              input_tokens: 1,
              cached_input_tokens: 0,
              output_tokens: 1,
              reasoning_output_tokens: 0
            }
          };
        })()
      };
    }
  };

  const result = await runCodexProductTurn({
    thread,
    prompt: "hello",
    signal: controller.signal
  });

  assert.equal(result.ok, true);
  assert.equal(observedSignal, controller.signal);
  assert.match(result.text, /Signal observed/);
});

test("Codex runtime reports guarded direct file writes instead of accepting them", async () => {
  const plan = createChatPlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const codexFactory = async () => ({
    startThread() {
      return {
        id: "guard-thread",
        async run() {
          writeFileSync(`${workspacePath}/product_plan.json`, JSON.stringify({ tampered: true }, null, 2));
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "I changed ProductPlan directly.",
              toolCalls: []
            })
          };
        }
      };
    },
    resumeThread(threadId) {
      return {
        id: threadId,
        async run() {
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Resumed.",
              toolCalls: []
            })
          };
        }
      };
    }
  });

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_guarded_write",
    userMessage: "Directly rewrite the product plan file.",
    runtimeProvider: "codex",
    codexFactory
  });

  assert.equal(result.ok, true);
  assert.match(result.assistantMessage, /Guarded file changed/);
  assert.equal(result.modelResponses[0].ok, false);
  assert.equal(result.modelResponses[0].errorCode, "GUARD_VIOLATION");
});

test("Codex runtime reports guarded direct workspace descriptor draft package writes", async () => {
  const plan = createChatPlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const codexFactory = async () => ({
    startThread() {
      return {
        id: "draft-guard-thread",
        async run() {
          const draftDir = join(workspacePath, "component-drafts", "button_direct_codex_guard");
          mkdirSync(draftDir, { recursive: true });
          writeFileSync(join(draftDir, "descriptor.json"), JSON.stringify({ tampered: true }, null, 2));
          writeFileSync(join(draftDir, "sources.md"), "direct canonical source rewrite");
          writeFileSync(join(draftDir, "source-specs.md"), "raw source note remains allowed");
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "I directly changed a descriptor draft package.",
              toolCalls: []
            })
          };
        }
      };
    },
    resumeThread(threadId) {
      return {
        id: threadId,
        async run() {
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Resumed.",
              toolCalls: []
            })
          };
        }
      };
    }
  });

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_guarded_draft_write",
    userMessage: "Directly rewrite the workspace descriptor draft package.",
    runtimeProvider: "codex",
    codexFactory
  });

  assert.equal(result.ok, true);
  assert.match(result.assistantMessage, /component-drafts\/button_direct_codex_guard\/descriptor\.json/);
  assert.match(result.assistantMessage, /component-drafts\/button_direct_codex_guard\/sources\.md/);
  assert.doesNotMatch(result.assistantMessage, /source-specs\.md/);
  assert.equal(result.modelResponses[0].ok, false);
  assert.equal(result.modelResponses[0].errorCode, "GUARD_VIOLATION");
});

test("Codex runtime demo can drive idea, modification, generation, USB move, and revert through forge-tool", async () => {
  const plan = createProductPlan({
    initialMessage: "我想做一个带 3.5 寸屏幕的小桌面闹钟。",
    language: "zh"
  }).productPlan;
  const workspacePath = projectWorkspacePath(plan.planId);
  const initialRevisionId = plan.currentRevisionId;
  let revisionBeforeUsbMove = "";
  const observedToolCommands = [];
  const codexFactory = async () => ({
    startThread(options) {
      return fakeForgeToolCodexThread("forge-tool-demo-thread", options);
    },
    resumeThread(threadId, options) {
      return fakeForgeToolCodexThread(threadId, options);
    }
  });

  function fakeForgeToolCodexThread(id, options) {
    return {
      id,
      async run(prompt) {
        const cwd = options.workingDirectory;
        const currentMessage = String(prompt || "").split("## Current User Message").pop() || "";
        const tool = (args) => {
          observedToolCommands.push(args.join(" "));
          return runForgeToolForCodex(cwd, args);
        };
        if (currentMessage.includes("加两个按钮") || currentMessage.includes("蜂鸣器")) {
          const search = tool(["search-component", "--query", "button", "--componentType", "button", "--limit", "5"]);
          const patches = JSON.stringify([
            {
              type: "component_patch",
              add: [
                { componentType: "button", componentId: "button_6mm", quantity: 2 },
                { componentType: "speaker", componentId: "speaker_20mm", quantity: 1 }
              ]
            },
            {
              type: "plan_patch",
              set: {
                "requirements.buzzer": true
              }
            },
            {
              type: "geometry_preference_patch",
              set: {
                "placements.buttons.semanticPosition": "right_side",
                "placements.speaker.semanticPosition": "back_right"
              }
            }
          ]);
          const applied = tool(["apply", "--message", "Add right-side buttons and a buzzer/speaker alert module.", "--patches", patches]);
          return codexJson(`已调用 forge-tool 搜索 ${search.results.length} 个按钮组件，并创建版本 ${applied.newRevisionId}。`);
        }
        if (currentMessage.includes("生成 3D 模型")) {
          const validation = tool(["validate"]);
          const generated = tool(["generate", "--reason", "user_confirmed_model_generation"]);
          return codexJson(`已先 validate=${validation.status}，再生成 3D 模型版本 ${generated.revisionId}。`);
        }
        if (currentMessage.includes("回退")) {
          const reverted = tool(["revert", "--revisionId", revisionBeforeUsbMove]);
          return codexJson(`已回退到 ${reverted.currentRevisionId}。`);
        }
        if (currentMessage.includes("USB-C") || currentMessage.includes("后面左侧")) {
          revisionBeforeUsbMove = readRuntimePlan(cwd).currentRevisionId;
          const patches = JSON.stringify([
            {
              type: "geometry_preference_patch",
              set: {
                "placements.usb_c.semanticPosition": "back_left"
              }
            }
          ]);
          const applied = tool(["apply", "--message", "Move USB-C to the rear-left side.", "--patches", patches]);
          return codexJson(`已通过 forge-tool 移动 USB-C，创建版本 ${applied.newRevisionId}。`);
        }
        return codexJson("我会先读取项目状态再决定下一步。");
      }
    };
  }

  const addTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_forge_tool_demo",
    userMessage: "加两个按钮，放在右侧，再加一个蜂鸣器。",
    runtimeProvider: "codex",
    codexFactory
  });
  assert.equal(addTurn.ok, true);
  assert.equal(addTurn.bindingId, "forge-tool-demo-thread");
  assert.equal(addTurn.toolCalls.length, 0);
  assert.match(addTurn.assistantMessage, /forge-tool/);
  assert.equal(addTurn.productPlan.workspaceState.productPlan.requirements.buttons, 2);
  assert.equal(addTurn.productPlan.workspaceState.productPlan.requirements.buzzer, true);
  assert.equal(addTurn.productPlan.workspaceState.productPlan.geometryPreferences.placements.buttons.semanticPosition, "right_side");

  const generateTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_forge_tool_demo",
    userMessage: "生成 3D 模型。",
    runtimeProvider: "codex",
    codexFactory
  });
  assert.equal(generateTurn.ok, true);
  assert.equal(generateTurn.toolCalls.length, 0);
  assert.ok(generateTurn.productPlan.currentRevisionId);
  const generatedRevision = generateTurn.productPlan.revisions.find((revision) => revision.revisionId === generateTurn.productPlan.currentRevisionId);
  assert.equal(generatedRevision.modelArtifacts.status, "generated");
  assert.ok(generatedRevision.modelArtifacts.artifacts.glb.localPath);
  assert.ok(generatedRevision.modelArtifacts.artifacts.stl.localPath);
  assert.ok(generatedRevision.modelArtifacts.artifacts.step.localPath);

  const usbTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_forge_tool_demo",
    userMessage: "把 USB-C 移到后面左侧。",
    runtimeProvider: "codex",
    codexFactory
  });
  assert.equal(usbTurn.ok, true);
  assert.notEqual(usbTurn.productPlan.currentRevisionId, revisionBeforeUsbMove);
  assert.equal(usbTurn.productPlan.workspaceState.productPlan.geometryPreferences.placements.usb_c.semanticPosition, "back_left");

  const revertTurn = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_forge_tool_demo",
    userMessage: "回退到上一个版本。",
    runtimeProvider: "codex",
    codexFactory
  });
  assert.equal(revertTurn.ok, true);
  assert.equal(revertTurn.productPlan.currentRevisionId, revisionBeforeUsbMove);
  assert.notEqual(revertTurn.productPlan.currentRevisionId, initialRevisionId);
  assert.ok(observedToolCommands.some((command) => command.startsWith("search-component")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("validate")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("generate")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("revert")));
  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.ok(events.some((event) => event.type === "revision_reverted"));
  assert.ok(events.some((event) => event.type === "validation_completed"));
});

test("Codex runtime can onboard a workspace spec-file descriptor through forge-tool", async () => {
  const plan = createChatPlan();
  const workspacePath = projectWorkspacePath(plan.planId);
  const observedToolCommands = [];
  const codexFactory = async () => ({
    startThread(options) {
      return fakeSpecFileCodexThread("spec-file-thread", options);
    },
    resumeThread(threadId, options) {
      return fakeSpecFileCodexThread(threadId, options);
    }
  });

  function fakeSpecFileCodexThread(id, options) {
    return {
      id,
      async run() {
        const cwd = options.workingDirectory;
        const draftId = "button_8mm_codex_specs";
        const specPath = `component-drafts/${draftId}/source-specs.md`;
        const tool = (args) => {
          observedToolCommands.push(args.join(" "));
          return runForgeToolForCodex(cwd, args);
        };
        tool([
          "descriptor-scaffold",
          "--draft-id",
          draftId,
          "--component-type",
          "button",
          "--display-name",
          "Codex Spec File Button"
        ]);
        writeFileSync(join(cwd, specPath), [
          "dimensions 10 x 10 x 6 mm",
          "opening 8 x 8 mm",
          "connector signal position 0, -4, -2 mm",
          "connector signal orientation -y",
          "feature button_hole position 1, 0, 3 mm",
          "keepout button_travel_keepout size 12 x 12 x 9 mm position 0, 0, 6 mm",
          "access volume button_wire_access size 12 x 9 x 7 mm position 0, -9, -2 mm",
          "cable exit signal direction -y_to_core_board",
          "manufacturer Forge Codex Test",
          "part number BTN-8MM-CODEX-SPECS",
          "measurement basis caliper measurement",
          "reviewable"
        ].join("; "));
        const specs = tool([
          "descriptor-specs",
          "--draft-id",
          draftId,
          "--specs-file",
          specPath
        ]);
        const promoted = tool([
          "descriptor-promote",
          "--draft-id",
          draftId
        ]);
        const selected = tool([
          "descriptor-select",
          "--componentId",
          draftId,
          "--quantity",
          "1",
          "--message",
          "Use Codex spec-file button."
        ]);
        const generated = tool([
          "generate",
          "--revisionId",
          selected.newRevisionId,
          "--reason",
          "codex_confirmed_spec_file_generation"
        ]);
        const artifacts = tool([
          "artifacts",
          "--revisionId",
          generated.revisionId
        ]);
        return codexJson(`已通过 forge-tool 从规格文件 ${specs.specsSourcePath} 导入 ${promoted.componentId}，选择后生成版本 ${generated.revisionId}，trusted=${artifacts.artifactStatus.trustedGenerated}。`);
      }
    };
  }

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_spec_file_descriptor",
    userMessage: "用规格文件添加一个 8mm 按钮零件，并生成 3D 模型。",
    runtimeProvider: "codex",
    codexFactory
  });

  assert.equal(result.ok, true);
  assert.equal(result.bindingId, "spec-file-thread");
  assert.equal(result.toolCalls.length, 0);
  assert.match(result.assistantMessage, /规格文件/);
  assert.ok(observedToolCommands.some((command) => command.includes("descriptor-specs --draft-id button_8mm_codex_specs --specs-file component-drafts/button_8mm_codex_specs/source-specs.md")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("descriptor-promote --draft-id button_8mm_codex_specs")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("descriptor-select --componentId button_8mm_codex_specs")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("generate --revisionId")));
  assert.ok(observedToolCommands.some((command) => command.startsWith("artifacts --revisionId")));
  const updated = getProductPlan(plan.planId);
  const generatedRevision = updated.revisions.find((revision) => revision.revisionId === updated.currentRevisionId);
  assert.equal(generatedRevision.modelArtifacts.status, "generated");
  assert.ok(generatedRevision.modelArtifacts.artifacts.glb.localPath);
  const generatedDescriptor = generatedRevision.geometrySpec.componentDescriptors.find((item) => item.id === "button_8mm_codex_specs");
  assert.deepEqual(generatedDescriptor.connectors.find((connector) => connector.id === "signal").positionLocalMm, [0, -4, -2]);
  assert.equal(generatedDescriptor.connectors.find((connector) => connector.id === "signal").orientation, "-y");
  assert.deepEqual(generatedDescriptor.externalFeatures.find((feature) => feature.id === "button_hole").positionLocalMm, [1, 0, 3]);
  assert.deepEqual(generatedDescriptor.keepouts.find((keepout) => keepout.id === "button_travel_keepout").sizeMm, [12, 12, 9]);
  assert.deepEqual(generatedDescriptor.accessVolumes.find((access) => access.id === "button_wire_access").sizeMm, [12, 9, 7]);
  assert.equal(generatedDescriptor.cableExitDirections.find((exit) => exit.connectorId === "signal").direction, "-y_to_core_board");
  const origin = generatedRevision.modelArtifacts.generationEvidence.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_codex_specs");
  assert.equal(origin.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_8mm_codex_specs/source-specs.md");
  assert.ok(origin.workspaceDraft.specPatch.extractedFields.includes("connectorOrientation"));
  assert.ok(origin.workspaceDraft.specPatch.extractedFields.includes("accessVolumeSpec"));
  assert.ok(origin.workspaceDraft.specPatch.extractedFields.includes("cableExitDirection"));
  const evidenceReport = JSON.parse(readFileSync(generatedRevision.modelArtifacts.artifacts.generationEvidenceReport.localPath, "utf8"));
  const evidenceOrigin = evidenceReport.descriptorEvidence.componentOrigins.find((item) => item.componentId === "button_8mm_codex_specs");
  assert.equal(evidenceOrigin.workspaceDraft.specPatch.specsSourcePath, "component-drafts/button_8mm_codex_specs/source-specs.md");
  assert.ok(evidenceOrigin.workspaceDraft.specPatch.extractedFields.includes("externalFeaturePositionLocalMm"));
  assert.ok(readWorkspaceEvents({ workspaceId: plan.planId }).some((event) => (
    event.type === "component_descriptor_draft_specs_applied"
      && event.payload?.draftId === "button_8mm_codex_specs"
      && event.payload?.specsSourcePath === "component-drafts/button_8mm_codex_specs/source-specs.md"
  )));
});

test("Codex runtime keeps project threads isolated", async () => {
  const first = createChatPlan();
  const second = createChatPlan();
  let index = 0;
  const codexFactory = async () => ({
    startThread() {
      index += 1;
      return { id: `thread-${index}`, async run() { return { final_response: "{}" }; } };
    },
    resumeThread(threadId) {
      return { id: threadId, async run() { return { final_response: "{}" }; } };
    }
  });

  const firstThread = await ensureCodexProjectThread({
    workspaceId: first.planId,
    codexFactory
  });
  const secondThread = await ensureCodexProjectThread({
    workspaceId: second.planId,
    codexFactory
  });
  const firstAgain = await ensureCodexProjectThread({
    workspaceId: first.planId,
    codexFactory
  });

  assert.equal(firstThread.ok, true);
  assert.equal(secondThread.ok, true);
  assert.equal(firstThread.bindingId, "thread-1");
  assert.equal(secondThread.bindingId, "thread-2");
  assert.equal(firstAgain.bindingId, "thread-1");
  assert.notEqual(readRuntimeBinding({ workspaceId: first.planId }).bindingId, readRuntimeBinding({ workspaceId: second.planId }).bindingId);
});

function codexJson(assistantMessage) {
  return {
    finalResponse: JSON.stringify({
      assistantMessage,
      toolCalls: []
    })
  };
}

test("Codex runtime persists delayed SDK thread id after first run", async () => {
  const plan = createChatPlan();
  let threadId = "";
  const codexFactory = async () => ({
    startThread() {
      return {
        get id() {
          return threadId;
        },
        async run() {
          threadId = "delayed-thread-id";
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Project thread initialized after run.",
              toolCalls: []
            })
          };
        }
      };
    },
    resumeThread(id) {
      return {
        id,
        async run() {
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Resumed.",
              toolCalls: []
            })
          };
        }
      };
    }
  });

  const result = await runForgeChatTurn({
    workspaceId: plan.planId,
    sessionId: "test_codex_delayed_thread_id",
    userMessage: "Just discuss the current plan.",
    runtimeProvider: "codex",
    codexFactory
  });

  assert.equal(result.ok, true);
  assert.equal(result.bindingId, "delayed-thread-id");
  assert.equal(readRuntimeBinding({ workspaceId: plan.planId }).bindingId, "delayed-thread-id");
});

test("Codex runtime plan creation initializes and persists a delayed project thread id", async () => {
  let threadId = "";
  let runCount = 0;
  const prompts = [];
  const startOptions = [];
  const codexFactory = async () => ({
    startThread(options) {
      startOptions.push(options);
      return {
        get id() {
          return threadId;
        },
        async run(prompt) {
          runCount += 1;
          prompts.push(prompt);
          threadId = "created-plan-thread";
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Project thread initialized.",
              toolCalls: []
            })
          };
        }
      };
    },
    resumeThread(id) {
      return {
        id,
        async run() {
          return {
            finalResponse: JSON.stringify({
              assistantMessage: "Resumed.",
              toolCalls: []
            })
          };
        }
      };
    }
  });
  const traceEvents = [];

  const result = await createProductPlanForRuntime({
    initialMessage: "我想做一个带 3.5 寸屏幕的小桌面闹钟。",
    language: "zh",
    runtime: {
      runtimeProvider: "codex",
      modelProvider: "codex"
    },
    codexFactory,
    onTraceEvent: (event) => traceEvents.push(event)
  });

  assert.equal(result.runtimeBinding.bindingId, "created-plan-thread");
  assert.equal(result.productPlan.workspaceState.codexThreadId, undefined);
  assert.equal(readRuntimeBinding({ workspaceId: result.productPlan.planId }).bindingId, "created-plan-thread");
  assert.equal(runCount, 1);
  assert.equal(startOptions[0].workingDirectory, projectWorkspacePath(result.productPlan.planId));
  assert.match(prompts[0], /Initialize this Codex thread/);
  assert.match(prompts[0], /Do not call tools/);
  assert.match(prompts[0], /小桌面闹钟/);
  assert.ok(traceEvents.some((event) => event.type === "plan_create_started"));
  assert.ok(traceEvents.some((event) => event.type === "product_plan_created"));
  assert.ok(traceEvents.some((event) => event.type === "codex_thread_requested"));
  assert.ok(traceEvents.some((event) => event.type === "codex_thread_ready" && event.bindingId === "created-plan-thread"));
});

test("Codex-backed plan creation records failed runtime binding on initialization failure", async () => {
  const result = await createProductPlanForRuntime({
    initialMessage: "我想做一个带 3.5 寸屏幕的小桌面闹钟。",
    language: "zh",
    runtime: {
      runtimeProvider: "codex",
      modelProvider: "codex"
    },
    codexFactory: async () => {
      throw new Error("codex unavailable");
    }
  });

  assert.equal(result.ok, false);
  assert.ok(result.workspaceId);
  assert.equal(result.runtimeBinding.status, "failed");
  assert.equal(result.runtimeBinding.provider, "codex");
  assert.match(result.runtimeBinding.error.message, /codex unavailable/);
  assert.equal(readRuntimeBinding({ workspaceId: result.workspaceId }).status, "failed");
});

test("Codex tool intent parser accepts fenced JSON and plain messages", () => {
  const parsed = parseCodexToolIntent(`Result:\n\`\`\`json\n{"assistantMessage":"ok","toolCalls":[{"name":"validateDesign","input":{"mode":"current_or_proposal"}}]}\n\`\`\``);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.finalMessage, "ok");
  assert.equal(parsed.toolCalls[0].name, "validateDesign");

  const inputJson = parseCodexToolIntent(JSON.stringify({
    assistantMessage: "apply",
    toolCalls: [
      {
        name: "applyDesignPatch",
        inputJson: JSON.stringify({
          message: "Make the shell graphite.",
          patches: [
            {
              type: "plan_patch",
              set: {
                "constraints.finish": "graphite"
              }
            }
          ]
        })
      }
    ]
  }));
  assert.equal(inputJson.toolCalls[0].input.message, "Make the shell graphite.");
  assert.equal(inputJson.toolCalls[0].input.patches[0].set["constraints.finish"], "graphite");

  const plain = parseCodexToolIntent("Ask one more question before changing the plan.");
  assert.equal(plain.finalMessage, "Ask one more question before changing the plan.");
  assert.deepEqual(plain.toolCalls, []);
});

test("Codex adapter reports missing SDK without fabricating a plan response", async () => {
  const plan = createChatPlan();
  const adapter = new CodexModelAdapter({
    workspaceId: plan.planId,
    codexFactory: async () => {
      throw new Error("module not installed");
    }
  });
  const result = await adapter.runTurn({
    prompt: "prompt",
    userMessage: "hello"
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "CODEX_SDK_UNAVAILABLE");
  assert.match(result.error.message, /@openai\/codex-sdk/);
});

test("OpenAI adapter normalizes relay base URLs", () => {
  assert.equal(openAIResponsesUrl("https://gaid.studio"), "https://gaid.studio/v1/responses");
  assert.equal(openAIResponsesUrl("https://gaid.studio/v1"), "https://gaid.studio/v1/responses");
});
