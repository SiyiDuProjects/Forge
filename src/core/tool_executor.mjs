import {
  applyWorkspaceDescriptorDraftSpecs,
  applyDesignPatch,
  commitStagedChange,
  getRevisionArtifacts,
  getWorkspaceSummary,
  inspectComponentDescriptorDraft,
  inspectComponentPackage,
  inspectWorkspaceComponentDescriptorDrafts,
  promoteComponentDescriptorDraft,
  promoteWorkspaceComponentDescriptorDraft,
  proposeDesignChange,
  regenerateRevision,
  rejectStagedChange,
  retirePromotedComponentDescriptor,
  revertRevision,
  scaffoldWorkspaceComponentDescriptorDraft,
  searchComponentLibrary,
  selectComponentDescriptor,
  stageDesignPatch,
  submitReviewPacket,
  validateDesign
} from "./forge_actions.mjs";
import { appendWorkspaceEvent } from "./project_workspace.mjs";
import { checkToolPermission } from "./permission_gate.mjs";
import { getToolMetadata } from "./tool_registry.mjs";
import { clone } from "./workspace_state.mjs";

const ACTIONS = {
  getWorkspaceSummary,
  searchComponentLibrary,
  applyWorkspaceDescriptorDraftSpecs,
  inspectComponentDescriptorDraft,
  inspectWorkspaceComponentDescriptorDrafts,
  inspectComponentPackage,
  scaffoldWorkspaceComponentDescriptorDraft,
  selectComponentDescriptor,
  promoteComponentDescriptorDraft,
  promoteWorkspaceComponentDescriptorDraft,
  retirePromotedComponentDescriptor,
  proposeDesignChange,
  stageDesignPatch,
  commitStagedChange,
  applyDesignPatch,
  regenerateRevision,
  validateDesign,
  revertRevision,
  getRevisionArtifacts,
  rejectStagedChange,
  submitReviewPacket
};

const workspaceWriteLocks = new Map();

export async function executeForgeTool({
  workspaceId,
  sessionId = "session_default",
  turnId = "",
  toolCall,
  toolMetadata = getToolMetadata(toolCall?.name),
  rootDir
} = {}) {
  const normalizedCall = normalizeToolCall(toolCall);
  const metadata = toolMetadata || getToolMetadata(normalizedCall.name);
  const resolvedWorkspaceId = normalizedCall.input.workspaceId || workspaceId;
  return withWorkspaceWriteLock({
    workspaceId: resolvedWorkspaceId,
    toolMetadata: metadata
  }, () => executeForgeToolUnlocked({
    workspaceId,
    sessionId,
    turnId,
    toolCall: normalizedCall,
    toolMetadata: metadata,
    rootDir
  }));
}

export async function executeForgeToolWithPolicy({
  workspaceId,
  sessionId = "session_default",
  turnId = "",
  toolCall,
  toolMetadata = getToolMetadata(toolCall?.name),
  rootDir,
  userMessage = "",
  mode = "normal",
  confirmation = null
} = {}) {
  const normalizedCall = normalizeToolCall(toolCall);
  const metadata = toolMetadata || getToolMetadata(normalizedCall.name);
  const permission = checkToolPermission({
    toolName: normalizedCall.name,
    toolInput: normalizedCall.input,
    toolMetadata: metadata,
    userMessage,
    mode,
    confirmation
  });
  if (!permission.allowed) {
    const error = permission.error || {
      code: permission.requiresConfirmation ? "CONFIRMATION_REQUIRED" : "PERMISSION_DENIED",
      message: permission.reason || "This Forge tool call is not allowed without confirmation."
    };
    return {
      ok: false,
      toolCall: normalizedCall,
      permission: clone(permission),
      result: failResult(error.code, error.message),
      events: []
    };
  }
  const execution = await executeForgeTool({
    workspaceId,
    sessionId,
    turnId,
    toolCall: normalizedCall,
    toolMetadata: metadata,
    rootDir
  });
  return {
    ...execution,
    permission: clone(permission)
  };
}

export async function withWorkspaceWriteLock({
  workspaceId = "",
  toolMetadata = null
} = {}, operation = async () => null) {
  if (toolMetadata?.concurrency?.lock !== "workspace-write") {
    return operation();
  }
  const key = String(workspaceId || "unknown_workspace");
  const previous = workspaceWriteLocks.get(key) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const queued = previous.catch(() => {}).then(() => current);
  workspaceWriteLocks.set(key, queued);
  await previous.catch(() => {});
  try {
    return await operation();
  } finally {
    release();
    if (workspaceWriteLocks.get(key) === queued) {
      workspaceWriteLocks.delete(key);
    }
  }
}

async function executeForgeToolUnlocked({
  workspaceId,
  sessionId = "session_default",
  turnId = "",
  toolCall,
  toolMetadata = getToolMetadata(toolCall?.name),
  rootDir
} = {}) {
  const startedAt = Date.now();
  const normalizedCall = normalizeToolCall(toolCall);
  const callEvent = appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "tool_call",
    actor: "assistant",
    payload: {
      sessionId,
      turnId,
      toolCallId: normalizedCall.toolCallId,
      toolName: normalizedCall.name,
      inputSummary: summarizeInput(normalizedCall.input)
    }
  });

  try {
    const validation = validateToolInput({ toolMetadata, input: normalizedCall.input });
    if (!validation.ok) {
      const failed = failResult(validation.error.code, validation.error.message);
      const failedEvent = appendToolFailedEvent({
        workspaceId,
        rootDir,
        sessionId,
        turnId,
        toolCall: normalizedCall,
        error: failed.error,
        startedAt
      });
      return { ok: false, toolCall: normalizedCall, result: failed, events: [callEvent, failedEvent] };
    }
    const action = ACTIONS[normalizedCall.name];
    if (!action) {
      const failed = failResult("UNKNOWN_TOOL", `Unknown Forge action: ${normalizedCall.name}`);
      const failedEvent = appendToolFailedEvent({
        workspaceId,
        rootDir,
        sessionId,
        turnId,
        toolCall: normalizedCall,
        error: failed.error,
        startedAt
      });
      return { ok: false, toolCall: normalizedCall, result: failed, events: [callEvent, failedEvent] };
    }
    const result = await action({
      ...normalizedCall.input,
      workspaceId: normalizedCall.input.workspaceId || workspaceId
    });
    const eventType = result?.ok ? "tool_result" : "tool_failed";
    const resultEvent = appendWorkspaceEvent({
      workspaceId,
      rootDir,
      type: eventType,
      actor: "system",
      payload: {
        sessionId,
        turnId,
        toolCallId: normalizedCall.toolCallId,
        toolName: normalizedCall.name,
        ok: Boolean(result?.ok),
        durationMs: Date.now() - startedAt,
        resultSummary: summarizeToolResult(result)
      }
    });
    return {
      ok: Boolean(result?.ok),
      toolCall: normalizedCall,
      result: clone(result),
      events: [callEvent, resultEvent],
      summary: summarizeToolResult(result)
    };
  } catch (error) {
    const failed = failResult("TOOL_EXECUTION_ERROR", error instanceof Error ? error.message : "Tool execution failed.");
    const failedEvent = appendToolFailedEvent({
      workspaceId,
      rootDir,
      sessionId,
      turnId,
      toolCall: normalizedCall,
      error: failed.error,
      startedAt
    });
    return { ok: false, toolCall: normalizedCall, result: failed, events: [callEvent, failedEvent] };
  }
}

export function normalizeToolCall(toolCall = {}) {
  return {
    toolCallId: toolCall.toolCallId || toolCall.id || `toolcall-${Math.random().toString(36).slice(2, 10)}`,
    name: toolCall.name || toolCall.toolName || "",
    input: clone(toolCall.input || toolCall.arguments || {})
  };
}

export function summarizeToolResult(result = {}) {
  if (!result?.ok) {
    return {
      ok: false,
      code: result?.error?.code || "ERROR",
      message: result?.error?.message || ""
    };
  }
  return {
    ok: true,
    proposalId: result.proposalId || "",
    proposalStatus: result.status || "",
    newRevisionId: result.newRevisionId || result.revisionId || result.currentRevisionId || "",
    committed: Boolean(result.committed),
    applied: Boolean(result.applied),
    specsApplied: Boolean(result.specsApplied),
    selected: Boolean(result.selected),
    promoted: Boolean(result.promoted),
    draftInspection: Array.isArray(result.drafts),
    draftId: result.draftId || result.drafts?.[0]?.draftId || "",
    componentId: result.componentId || "",
    componentType: result.componentType || "",
    draftCount: Number(result.draftCount || 0),
    readyForPromotionCount: Number(result.readyForPromotionCount || 0),
    readyForLibraryPromotion: Boolean(result.readyForLibraryPromotion || result.drafts?.[0]?.readyForLibraryPromotion),
    extractedFields: clone(result.extractedFields || []),
    regenerated: Boolean(result.regenerated),
    reverted: Boolean(result.reverted),
    validationStatus: result.validationReport?.status || result.geometryValidation?.status || result.status || "",
    warningCount: Array.isArray(result.warnings)
      ? result.warnings.length
      : Array.isArray(result.validationReport?.issues)
        ? result.validationReport.issues.filter((issue) => issue.level === "warn" || issue.level === "block").length
        : 0,
    artifactPaths: clone(result.artifactPaths || {})
  };
}

function validateToolInput({ toolMetadata, input }) {
  if (!toolMetadata) {
    return failResult("UNKNOWN_TOOL", "Tool metadata is missing.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return failResult("INVALID_TOOL_INPUT", "Tool input must be an object.");
  }
  const required = toolMetadata.inputSchema?.required || [];
  for (const field of required) {
    if (input[field] === undefined || input[field] === null || input[field] === "") {
      return failResult("MISSING_TOOL_INPUT", `Missing required tool input: ${field}`);
    }
  }
  const properties = toolMetadata.inputSchema?.properties || {};
  for (const [field, schema] of Object.entries(properties)) {
    if (input[field] === undefined || input[field] === null) continue;
    const expected = schema?.type;
    if (expected === "array" && !Array.isArray(input[field])) {
      return failResult("INVALID_TOOL_INPUT", `${field} must be an array.`);
    }
    if (expected && expected !== "array" && typeof input[field] !== expected) {
      return failResult("INVALID_TOOL_INPUT", `${field} must be a ${expected}.`);
    }
  }
  return { ok: true };
}

function appendToolFailedEvent({
  workspaceId,
  rootDir,
  sessionId,
  turnId,
  toolCall,
  error,
  startedAt
} = {}) {
  return appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "tool_failed",
    actor: "system",
    payload: {
      sessionId,
      turnId,
      toolCallId: toolCall.toolCallId,
      toolName: toolCall.name,
      ok: false,
      durationMs: Date.now() - startedAt,
      error: clone(error || {})
    }
  });
}

function summarizeInput(input = {}) {
  return Object.fromEntries(
    Object.entries(input || {}).map(([key, value]) => {
      if (Array.isArray(value)) return [key, `${value.length} item(s)`];
      if (value && typeof value === "object") return [key, "object"];
      return [key, value];
    })
  );
}

function failResult(code, message) {
  return {
    ok: false,
    error: { code, message }
  };
}
