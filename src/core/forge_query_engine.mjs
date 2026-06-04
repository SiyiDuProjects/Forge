import { buildContextPack } from "./context_pack_builder.mjs";
import { appendChatMessage, createPendingConfirmation, getPendingConfirmation, loadChatSession, resolvePendingConfirmation } from "./chat_session_store.mjs";
import { createModelAdapter } from "./model_adapters.mjs";
import { checkToolPermission } from "./permission_gate.mjs";
import { buildPromptSections } from "./prompt_sections.mjs";
import { appendWorkspaceEvent, defaultProjectWorkspaceRoot, persistProjectPlan } from "./project_workspace.mjs";
import { getProductPlan } from "./product_plan.mjs";
import { executeForgeTool, summarizeToolResult } from "./tool_executor.mjs";
import { exportToolsForModel } from "./tool_schema_exporter.mjs";
import { getToolMetadata, listToolMetadata } from "./tool_registry.mjs";
import { makeId } from "./utils.mjs";
import { clone } from "./workspace_state.mjs";

export const FORGE_QUERY_ENGINE_VERSION = "forge_query_engine_v1";

export async function runForgeChatTurn({
  workspaceId,
  userMessage,
  sessionId = "session_default",
  modelProvider = process.env.FORGE_MODEL_PROVIDER || "mock",
  mode = "normal",
  confirmation = null,
  maxToolCalls = 5,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const text = String(userMessage || "").trim();
  if (!workspaceId) return fail("UNKNOWN_WORKSPACE", "workspaceId is required.");
  if (!text) return fail("EMPTY_MESSAGE", "userMessage is required.");

  const turnId = makeId("chatturn");
  const eventsAppended = [];
  const toolCalls = [];
  const toolResults = [];
  const modelResponses = [];
  const startedEvent = appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "chat_turn_started",
    actor: "system",
    payload: { turnId, sessionId, modelProvider, mode }
  });
  eventsAppended.push(startedEvent);

  const userChatMessage = appendChatMessage({
    workspaceId,
    sessionId,
    role: "user",
    content: text,
    metadata: { turnId },
    rootDir
  });
  appendPlanConversationTurn({ workspaceId, role: "user", text, turnId: userChatMessage.messageId, rootDir });
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "user_message",
    actor: "user",
    payload: {
      turnId,
      sessionId,
      messageId: userChatMessage.messageId,
      text
    }
  }));

  const contextPack = buildContextPack({ workspaceId, rootDir });
  if (!contextPack.ok) return fail(contextPack.error?.code || "CONTEXT_PACK_FAILED", contextPack.error?.message || "Could not build ContextPack.", { eventsAppended });
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "context_pack_built",
    actor: "system",
    payload: {
      turnId,
      sessionId,
      currentRevisionId: contextPack.projectSummary?.currentRevisionId || "",
      openProposalCount: contextPack.openProposals?.length || 0,
      allowedToolCount: contextPack.allowedTools?.length || 0
    }
  }));

  const session = loadChatSession({ workspaceId, sessionId, limit: 24, rootDir });
  const exported = exportToolsForModel({
    tools: listToolMetadata(),
    provider: modelProvider === "openai" ? "openai" : "generic"
  });
  const prompt = buildPromptSections({
    contextPack,
    recentMessages: session.messages || [],
    tools: exported.tools,
    userMessage: text
  });
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "model_request",
    actor: "system",
    payload: {
      turnId,
      sessionId,
      modelProvider,
      toolCount: exported.tools.length,
      promptSectionCount: prompt.sections.length
    }
  }));

  const adapter = createModelAdapter({ provider: modelProvider });
  let assistantMessage = "";
  let pendingConfirmation = null;
  let loopToolResults = [];
  let currentContextPack = contextPack;

  for (let iteration = 0; iteration <= maxToolCalls; iteration += 1) {
    const modelResult = await adapter.runTurn({
      prompt: prompt.systemPrompt,
      tools: exported.tools,
      userMessage: text,
      contextPack: currentContextPack,
      toolResults: loopToolResults,
      messages: session.messages || []
    });
    modelResponses.push(modelResult);
    eventsAppended.push(appendWorkspaceEvent({
      workspaceId,
      rootDir,
      type: "model_response",
      actor: "assistant",
      payload: {
        turnId,
        sessionId,
        ok: Boolean(modelResult?.ok),
        toolCallCount: modelResult?.toolCalls?.length || 0,
        hasFinalMessage: Boolean(modelResult?.finalMessage),
        responseId: modelResult?.rawResponseId || ""
      }
    }));

    if (!modelResult?.ok) {
      assistantMessage = modelResult?.error?.message || "The model adapter failed.";
      break;
    }

    if (Array.isArray(modelResult.toolCalls) && modelResult.toolCalls.length > 0) {
      for (const rawToolCall of modelResult.toolCalls) {
        if (toolCalls.length >= maxToolCalls) {
          assistantMessage = "I stopped before executing more tools because this chat turn reached the Forge V1 tool-call limit.";
          break;
        }
        const toolCall = {
          toolCallId: rawToolCall.toolCallId || rawToolCall.id || makeId("toolcall"),
          name: rawToolCall.name,
          input: {
            ...(rawToolCall.input || {}),
            workspaceId: rawToolCall.input?.workspaceId || workspaceId
          }
        };
        const metadata = getToolMetadata(toolCall.name);
        const permission = checkToolPermission({
          toolName: toolCall.name,
          toolInput: toolCall.input,
          toolMetadata: metadata,
          userMessage: text,
          mode,
          confirmation
        });
        toolCalls.push({
          ...toolCall,
          permission: clone(permission)
        });

        if (permission.decision === "deny") {
          const result = {
            ok: false,
            error: permission.error
          };
          toolResults.push({ ok: false, toolCall, result, summary: summarizeToolResult(result) });
          eventsAppended.push(appendWorkspaceEvent({
            workspaceId,
            rootDir,
            type: "tool_failed",
            actor: "system",
            payload: {
              turnId,
              sessionId,
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.name,
              error: permission.error
            }
          }));
          assistantMessage = permission.reason;
          break;
        }

        if (permission.decision === "confirm") {
          const pending = createPendingConfirmation({
            workspaceId,
            sessionId,
            turnId,
            userMessage: text,
            toolCall,
            permission,
            rootDir
          });
          pendingConfirmation = pending.pendingConfirmation;
          eventsAppended.push(pending.event);
          assistantMessage = confirmationMessageFor(toolCall, permission, text);
          break;
        }

        const execution = await executeForgeTool({
          workspaceId,
          sessionId,
          turnId,
          toolCall,
          toolMetadata: metadata,
          rootDir
        });
        toolResults.push(execution);
        eventsAppended.push(...(execution.events || []));
      }

      if (assistantMessage || pendingConfirmation) break;
      loopToolResults = toolResults.slice();
      currentContextPack = buildContextPack({ workspaceId, rootDir });
      continue;
    }

    assistantMessage = modelResult.finalMessage || "Forge did not need to run a tool for this message.";
    break;
  }

  if (!assistantMessage) {
    assistantMessage = "Forge completed the chat turn without additional tool calls.";
  }

  const assistantChatMessage = appendChatMessage({
    workspaceId,
    sessionId,
    role: "assistant",
    content: assistantMessage,
    linkedRevisionId: revisionFromResults(toolResults)?.revisionId || "",
    linkedProposalId: proposalFromResults(toolResults)?.proposalId || "",
    metadata: {
      turnId,
      pendingConfirmationId: pendingConfirmation?.confirmationId || "",
      toolCallCount: toolCalls.length
    },
    rootDir
  });
  appendPlanConversationTurn({ workspaceId, role: "assistant", text: assistantMessage, turnId: assistantChatMessage.messageId, rootDir });
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "assistant_message",
    actor: "assistant",
    payload: {
      turnId,
      sessionId,
      messageId: assistantChatMessage.messageId,
      text: assistantMessage,
      pendingConfirmationId: pendingConfirmation?.confirmationId || ""
    }
  }));
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "chat_turn_completed",
    actor: "system",
    payload: {
      turnId,
      sessionId,
      toolCallCount: toolCalls.length,
      toolResultCount: toolResults.length,
      pendingConfirmationId: pendingConfirmation?.confirmationId || ""
    }
  }));

  const finalSession = loadChatSession({ workspaceId, sessionId, limit: 80, rootDir });
  return {
    ok: true,
    version: FORGE_QUERY_ENGINE_VERSION,
    workspaceId,
    sessionId,
    turnId,
    assistantMessage,
    messages: finalSession.messages || [],
    toolCalls,
    toolResults: toolResults.map((item) => ({
      ok: Boolean(item.ok),
      toolCall: item.toolCall,
      result: item.result,
      summary: item.summary
    })),
    proposal: proposalFromResults(toolResults),
    revision: revisionFromResults(toolResults),
    validationWarnings: validationWarningsFromResults(toolResults),
    artifactPaths: artifactPathsFromResults(toolResults),
    pendingConfirmation,
    eventsAppended,
    productPlan: clone(getProductPlan(workspaceId) || null),
    modelResponses: modelResponses.map((response) => ({
      ok: Boolean(response?.ok),
      toolCallCount: response?.toolCalls?.length || 0,
      hasFinalMessage: Boolean(response?.finalMessage)
    }))
  };
}

export async function confirmForgeChatTool({
  workspaceId,
  confirmationId,
  approved = false,
  sessionId = "session_default",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!workspaceId) return fail("UNKNOWN_WORKSPACE", "workspaceId is required.");
  const pending = getPendingConfirmation({ workspaceId, confirmationId, rootDir });
  if (!pending) return fail("UNKNOWN_CONFIRMATION", `Unknown confirmation: ${confirmationId}`);
  const resolved = resolvePendingConfirmation({ workspaceId, confirmationId, approved, rootDir });
  if (!resolved.ok) return resolved;
  const eventsAppended = [resolved.event].filter(Boolean);

  if (!approved) {
    const text = localizedFor(pending.userMessage, "我没有执行这个修改；暂存确认已取消。", "I did not execute that change; the pending confirmation was cancelled.");
    const message = appendChatMessage({
      workspaceId,
      sessionId: pending.sessionId || sessionId,
      role: "assistant",
      content: text,
      metadata: { confirmationId },
      rootDir
    });
    appendPlanConversationTurn({ workspaceId, role: "assistant", text, turnId: message.messageId, rootDir });
    eventsAppended.push(appendWorkspaceEvent({
      workspaceId,
      rootDir,
      type: "assistant_message",
      actor: "assistant",
      payload: {
        confirmationId,
        sessionId: pending.sessionId || sessionId,
        messageId: message.messageId,
        text
      }
    }));
    return {
      ok: true,
      workspaceId,
      sessionId: pending.sessionId || sessionId,
      assistantMessage: text,
      toolCalls: [],
      toolResults: [],
      pendingConfirmation: null,
      eventsAppended,
      productPlan: clone(getProductPlan(workspaceId) || null)
    };
  }

  const toolCall = pending.toolCall;
  const metadata = getToolMetadata(toolCall.name);
  const execution = await executeForgeTool({
    workspaceId,
    sessionId: pending.sessionId || sessionId,
    turnId: pending.turnId || "",
    toolCall,
    toolMetadata: metadata,
    rootDir
  });
  eventsAppended.push(...(execution.events || []));
  const assistantMessage = execution.ok
    ? confirmedMessageForExecution(execution, pending.userMessage)
    : localizedFor(
      pending.userMessage,
      `确认后的工具执行失败：${execution.result?.error?.message || "未知错误"}`,
      `The confirmed tool execution failed: ${execution.result?.error?.message || "unknown error"}`
    );
  const assistantChatMessage = appendChatMessage({
    workspaceId,
    sessionId: pending.sessionId || sessionId,
    role: "assistant",
    content: assistantMessage,
    linkedRevisionId: revisionFromResults([execution])?.revisionId || "",
    linkedProposalId: proposalFromResults([execution])?.proposalId || "",
    metadata: { confirmationId, toolCallId: toolCall.toolCallId },
    rootDir
  });
  appendPlanConversationTurn({ workspaceId, role: "assistant", text: assistantMessage, turnId: assistantChatMessage.messageId, rootDir });
  eventsAppended.push(appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "assistant_message",
    actor: "assistant",
    payload: {
      confirmationId,
      sessionId: pending.sessionId || sessionId,
      messageId: assistantChatMessage.messageId,
      text: assistantMessage
    }
  }));
  const finalSession = loadChatSession({ workspaceId, sessionId: pending.sessionId || sessionId, limit: 80, rootDir });
  return {
    ok: true,
    workspaceId,
    sessionId: pending.sessionId || sessionId,
    assistantMessage,
    messages: finalSession.messages || [],
    toolCalls: [{ ...toolCall, permission: { decision: "allow", reason: "approved confirmation" } }],
    toolResults: [{
      ok: execution.ok,
      toolCall: execution.toolCall,
      result: execution.result,
      summary: execution.summary
    }],
    proposal: proposalFromResults([execution]),
    revision: revisionFromResults([execution]),
    validationWarnings: validationWarningsFromResults([execution]),
    artifactPaths: artifactPathsFromResults([execution]),
    pendingConfirmation: null,
    eventsAppended,
    productPlan: clone(getProductPlan(workspaceId) || null)
  };
}

function appendPlanConversationTurn({ workspaceId, role, text, turnId, rootDir } = {}) {
  const plan = getProductPlan(workspaceId);
  if (!plan) return;
  if (!Array.isArray(plan.conversation)) plan.conversation = [];
  plan.conversation.push({
    turnId,
    role,
    text,
    assetIds: [],
    createdAt: new Date().toISOString()
  });
  plan.updatedAt = new Date().toISOString();
  persistProjectPlan({ plan, rootDir });
}

function proposalFromResults(toolResults = []) {
  for (const item of toolResults) {
    const result = item.result || {};
    if (result.proposalId) {
      return {
        proposalId: result.proposalId,
        status: result.status || "",
        patches: clone(result.patches || []),
        expectedWarnings: clone(result.expectedWarnings || []),
        validationPreview: clone(result.validationPreview || null),
        requiresConfirmation: Boolean(result.requiresConfirmation)
      };
    }
  }
  return null;
}

function revisionFromResults(toolResults = []) {
  for (const item of toolResults) {
    const result = item.result || {};
    const revisionId = result.newRevisionId || result.revisionId || result.currentRevisionId || "";
    if (revisionId && (result.applied || result.committed || result.regenerated || result.reverted)) {
      return {
        revisionId,
        diff: clone(result.diff || {}),
        artifactPaths: clone(result.artifactPaths || {}),
        validationReport: clone(result.validationReport || null)
      };
    }
  }
  return null;
}

function validationWarningsFromResults(toolResults = []) {
  const warnings = [];
  for (const item of toolResults) {
    const result = item.result || {};
    for (const issue of result.warnings || []) warnings.push(issue);
    for (const issue of result.validationReport?.issues || []) {
      if (issue.level === "warn" || issue.level === "block") warnings.push(issue);
    }
    for (const issue of result.geometryValidation?.issues || []) {
      if (issue.level === "warn" || issue.level === "block") warnings.push(issue);
    }
  }
  return warnings;
}

function artifactPathsFromResults(toolResults = []) {
  return Object.assign({}, ...toolResults.map((item) => item.result?.artifactPaths || {}));
}

function confirmationMessageFor(toolCall, permission, userMessage = "") {
  return localizedFor(
    userMessage,
    `这个操作会改变当前 Forge 项目：${toolCall.name}。${permission.reason || "需要确认后才能执行。"}`,
    `This operation will change the current Forge project: ${toolCall.name}. ${permission.reason || "It requires confirmation before execution."}`
  );
}

function confirmedMessageForExecution(execution, userMessage = "") {
  const summary = execution.summary || {};
  if (summary.applied) {
    return localizedFor(userMessage, `已确认执行，创建新版本 ${summary.newRevisionId}。`, `Confirmed and created revision ${summary.newRevisionId}.`);
  }
  if (summary.committed) {
    return localizedFor(userMessage, `已确认提交方案，创建新版本 ${summary.newRevisionId}。`, `Confirmed and committed the proposal as revision ${summary.newRevisionId}.`);
  }
  if (summary.regenerated) {
    return localizedFor(userMessage, `已确认重新生成，当前版本 ${summary.newRevisionId || ""} 已更新。`, `Confirmed regeneration; revision ${summary.newRevisionId || ""} has been updated.`);
  }
  if (summary.reverted) {
    return localizedFor(userMessage, `已确认切回版本 ${summary.newRevisionId || ""}。`, `Confirmed revert to revision ${summary.newRevisionId || ""}.`);
  }
  return localizedFor(userMessage, "已确认执行该 Forge 操作。", "Confirmed and executed the Forge action.");
}

function localizedFor(raw, zh, en) {
  return /[\u4e00-\u9fff]/.test(String(raw || "")) ? zh : en;
}

function fail(code, message, extra = {}) {
  return {
    ok: false,
    error: { code, message },
    ...extra
  };
}
