import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync
} from "node:fs";
import { join } from "node:path";
import {
  appendWorkspaceEvent,
  defaultProjectWorkspaceRoot,
  projectWorkspacePath
} from "./project_workspace.mjs";
import { makeId } from "./utils.mjs";
import { clone } from "./workspace_state.mjs";

export const CHAT_SESSION_STORE_VERSION = "forge_chat_session_store_v1";

export function appendChatMessage({
  workspaceId,
  sessionId = "session_default",
  role,
  content = "",
  linkedRevisionId = "",
  linkedProposalId = "",
  toolName = "",
  toolCallId = "",
  metadata = {},
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const entry = {
    type: "message",
    messageId: makeId("msg"),
    sessionId: safeSessionId(sessionId),
    workspaceId,
    role,
    content: String(content || ""),
    linkedRevisionId,
    linkedProposalId,
    toolName,
    toolCallId,
    metadata: clone(metadata || {}),
    createdAt: new Date().toISOString()
  };
  appendChatSessionEntry({ workspaceId, sessionId, entry, rootDir });
  return entry;
}

export function appendChatSessionEntry({
  workspaceId,
  sessionId = "session_default",
  entry,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!workspaceId) throw new Error("appendChatSessionEntry requires workspaceId.");
  if (!entry?.type) throw new Error("appendChatSessionEntry requires entry.type.");
  const filePath = chatSessionPath({ workspaceId, sessionId, rootDir });
  mkdirSync(join(projectWorkspacePath(workspaceId, { rootDir }), "chat_sessions"), { recursive: true });
  appendFileSync(filePath, `${JSON.stringify({ ...entry, version: CHAT_SESSION_STORE_VERSION })}\n`);
  return { ...entry, version: CHAT_SESSION_STORE_VERSION };
}

export function loadChatSession({
  workspaceId,
  sessionId = "session_default",
  limit = 0,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!workspaceId) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_WORKSPACE",
        message: "workspaceId is required."
      }
    };
  }
  const filePath = chatSessionPath({ workspaceId, sessionId, rootDir });
  const entries = existsSync(filePath)
    ? readFileSync(filePath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
    : [];
  const sliced = limit > 0 ? entries.slice(-limit) : entries;
  return {
    ok: true,
    workspaceId,
    sessionId: safeSessionId(sessionId),
    entries: sliced,
    messages: sliced.filter((entry) => entry.type === "message")
  };
}

export function createPendingConfirmation({
  workspaceId,
  sessionId = "session_default",
  turnId = "",
  userMessage = "",
  toolCall,
  permission = {},
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  if (!workspaceId) throw new Error("createPendingConfirmation requires workspaceId.");
  if (!toolCall?.name) throw new Error("createPendingConfirmation requires a toolCall.");
  const confirmationId = makeId("confirm");
  const pending = {
    confirmationId,
    workspaceId,
    sessionId: safeSessionId(sessionId),
    turnId,
    status: "pending",
    userMessage: String(userMessage || ""),
    toolCall: clone(toolCall),
    permission: clone(permission || {}),
    createdAt: new Date().toISOString(),
    resolvedAt: ""
  };
  const all = readPendingConfirmations({ workspaceId, rootDir });
  all[confirmationId] = pending;
  writePendingConfirmations({ workspaceId, confirmations: all, rootDir });
  appendChatSessionEntry({
    workspaceId,
    sessionId,
    rootDir,
    entry: {
      type: "confirmation_required",
      confirmationId,
      toolCallId: toolCall.toolCallId || "",
      toolName: toolCall.name,
      reason: permission.reason || "",
      createdAt: pending.createdAt
    }
  });
  const event = appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "confirmation_required",
    actor: "assistant",
    payload: {
      confirmationId,
      sessionId: safeSessionId(sessionId),
      turnId,
      toolName: toolCall.name,
      toolCallId: toolCall.toolCallId || "",
      reason: permission.reason || ""
    }
  });
  return { pendingConfirmation: pending, event };
}

export function getPendingConfirmation({
  workspaceId,
  confirmationId,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const all = readPendingConfirmations({ workspaceId, rootDir });
  return all[confirmationId] || null;
}

export function resolvePendingConfirmation({
  workspaceId,
  confirmationId,
  approved = false,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const all = readPendingConfirmations({ workspaceId, rootDir });
  const pending = all[confirmationId];
  if (!pending) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_CONFIRMATION",
        message: `Unknown confirmation: ${confirmationId}`
      }
    };
  }
  if (pending.status !== "pending") {
    return {
      ok: false,
      error: {
        code: "CONFIRMATION_ALREADY_RESOLVED",
        message: `Confirmation ${confirmationId} is ${pending.status}.`
      }
    };
  }
  pending.status = approved ? "approved" : "rejected";
  pending.resolvedAt = new Date().toISOString();
  all[confirmationId] = pending;
  writePendingConfirmations({ workspaceId, confirmations: all, rootDir });
  appendChatSessionEntry({
    workspaceId,
    sessionId: pending.sessionId,
    rootDir,
    entry: {
      type: "confirmation_resolved",
      confirmationId,
      approved: Boolean(approved),
      toolCallId: pending.toolCall?.toolCallId || "",
      toolName: pending.toolCall?.name || "",
      createdAt: pending.resolvedAt
    }
  });
  const event = appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "confirmation_resolved",
    actor: "user",
    payload: {
      confirmationId,
      sessionId: pending.sessionId,
      approved: Boolean(approved),
      toolName: pending.toolCall?.name || "",
      toolCallId: pending.toolCall?.toolCallId || ""
    }
  });
  return { ok: true, pendingConfirmation: pending, event };
}

export function chatSessionPath({
  workspaceId,
  sessionId = "session_default",
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  return join(
    projectWorkspacePath(workspaceId, { rootDir }),
    "chat_sessions",
    `${safeSessionId(sessionId)}.jsonl`
  );
}

function pendingConfirmationsPath({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  return join(projectWorkspacePath(workspaceId, { rootDir }), "chat_sessions", "pending_confirmations.json");
}

function readPendingConfirmations({ workspaceId, rootDir = defaultProjectWorkspaceRoot() } = {}) {
  const filePath = pendingConfirmationsPath({ workspaceId, rootDir });
  if (!existsSync(filePath)) return {};
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writePendingConfirmations({
  workspaceId,
  confirmations,
  rootDir = defaultProjectWorkspaceRoot()
} = {}) {
  const filePath = pendingConfirmationsPath({ workspaceId, rootDir });
  mkdirSync(join(projectWorkspacePath(workspaceId, { rootDir }), "chat_sessions"), { recursive: true });
  writeFileSync(filePath, JSON.stringify(confirmations || {}, null, 2));
}

function safeSessionId(value) {
  return String(value || "session_default").replace(/[^a-zA-Z0-9._-]/g, "_");
}
