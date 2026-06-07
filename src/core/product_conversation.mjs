import { runForgeChatTurn, resolveChatRuntime } from "./forge_query_engine.mjs";
import {
  defaultProjectWorkspaceRoot,
  ensureConversationWorkspace
} from "./project_workspace.mjs";

export const PRODUCT_CONVERSATION_VERSION = "forge_product_conversation_v1";

export async function runProductConversationTurn({
  workspaceId = "",
  userMessage = "",
  sessionId = "session_default",
  language = "zh",
  modelProvider = "",
  runtimeProvider = "",
  mode = "normal",
  confirmation = null,
  rootDir = defaultProjectWorkspaceRoot(),
  codexFactory = null,
  modelAdapterFactory = undefined,
  onTraceEvent = null,
  abortSignal = null
} = {}) {
  const text = String(userMessage || "").trim();
  if (!text) return fail("EMPTY_MESSAGE", "userMessage is required.");
  const workspace = ensureConversationWorkspace({
    workspaceId,
    language,
    rootDir
  });
  const runtime = resolveChatRuntime({ runtimeProvider, modelProvider });
  if (runtime.runtimeProvider !== "codex") {
    return fail(
      "CODEX_RUNTIME_REQUIRED",
      "Conversation turns must be handled by the Codex runtime. Forge only provides tools, state, and guardrails."
    );
  }

  return runForgeChatTurn({
    workspaceId: workspace.workspaceId,
    sessionId,
    userMessage: text,
    modelProvider: runtime.modelProvider,
    runtimeProvider: runtime.runtimeProvider,
    mode,
    confirmation,
    rootDir,
    codexFactory,
    modelAdapterFactory,
    onTraceEvent,
    abortSignal
  });
}

function fail(code, message) {
  return {
    ok: false,
    error: { code, message }
  };
}
