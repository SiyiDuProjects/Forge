import assert from "node:assert/strict";
import { test } from "node:test";
import { API_CONTRACT } from "../src/contracts/workbench_contract.mjs";
import { loadChatSession } from "../src/core/chat_session_store.mjs";
import { buildContextPack } from "../src/core/context_pack_builder.mjs";
import { runForgeChatTurn, confirmForgeChatTool } from "../src/core/forge_query_engine.mjs";
import { checkToolPermission } from "../src/core/permission_gate.mjs";
import { openAIResponsesUrl } from "../src/core/model_adapters.mjs";
import { createProductPlan, getProductPlan } from "../src/core/product_plan.mjs";
import { exportToolsForModel } from "../src/core/tool_schema_exporter.mjs";
import { readWorkspaceEvents } from "../src/core/project_workspace.mjs";
import { getToolMetadata, listToolMetadata } from "../src/core/tool_registry.mjs";

function createChatPlan() {
  return createProductPlan({
    initialMessage: "Small woodgrain desktop display for photos and weather, 3.5 inch, USB-C powered.",
    language: "en"
  }).productPlan;
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
  assert.deepEqual(result.toolCalls.map((call) => call.name), ["searchComponentLibrary", "applyDesignPatch"]);
  assert.equal(result.toolResults.every((item) => item.ok), true);
  assert.equal(getProductPlan(plan.planId).revisions.length, initialRevisionCount + 1);
  assert.equal(getProductPlan(plan.planId).currentRevisionId, result.revision.revisionId);
  assert.ok(result.artifactPaths.glb || result.artifactPaths.modelGlb);

  const session = loadChatSession({ workspaceId: plan.planId, sessionId: "test_direct" });
  assert.equal(session.ok, true);
  assert.ok(session.messages.some((message) => message.role === "user" && /buttons/.test(message.content)));
  assert.ok(session.messages.some((message) => message.role === "assistant"));

  const events = readWorkspaceEvents({ workspaceId: plan.planId });
  assert.ok(events.some((event) => event.type === "model_request"));
  assert.ok(events.some((event) => event.type === "tool_call" && event.payload.toolName === "applyDesignPatch"));
  assert.ok(events.some((event) => event.type === "chat_turn_completed"));
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
});

test("Tool schema exporter and API contract expose chat runtime surfaces", () => {
  const exported = exportToolsForModel({ tools: listToolMetadata() });
  assert.equal(exported.ok, true);
  assert.ok(exported.tools.some((tool) => tool.name === "applyDesignPatch" && tool.requiresConfirmation));
  assert.ok(exported.tools.some((tool) => tool.name === "proposeDesignChange" && tool.createsProposal));

  const paths = API_CONTRACT.map((route) => route.path);
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/turn"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/:sessionId"));
  assert.ok(paths.includes("/api/workspaces/:workspaceId/chat/confirm"));
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

test("OpenAI adapter normalizes relay base URLs", () => {
  assert.equal(openAIResponsesUrl("https://gaid.studio"), "https://gaid.studio/v1/responses");
  assert.equal(openAIResponsesUrl("https://gaid.studio/v1"), "https://gaid.studio/v1/responses");
});
