import {
  appendWorkspaceEvent,
  defaultProjectWorkspaceRoot,
  projectWorkspacePath,
  readProjectManifest,
  updateProjectManifest
} from "./project_workspace.mjs";
import {
  detectGuardViolations,
  guardedEventCount,
  snapshotGuardedFiles
} from "./guarded_files.mjs";

export const CODEX_RUNTIME_VERSION = "forge_codex_runtime_v1";
export const CODEX_SDK_PACKAGE = "@openai/codex-sdk";

export async function ensureCodexProjectThread({
  workspaceId,
  rootDir = defaultProjectWorkspaceRoot(),
  workspacePath = "",
  codexFactory = null
} = {}) {
  if (!workspaceId) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_WORKSPACE",
        message: "workspaceId is required before creating a Codex thread."
      }
    };
  }

  const manifest = readProjectManifest({ workspaceId, rootDir }) || {};
  const existingThreadId = manifest.codexThreadId || "";
  const threadOptions = codexThreadOptions({
    workspacePath: workspacePath || projectWorkspacePath(workspaceId, { rootDir })
  });
  const client = await createCodexClient({ codexFactory });
  if (!client.ok) return client;

  try {
    if (existingThreadId && typeof client.codex.resumeThread === "function") {
      return {
        ok: true,
        codexThreadId: existingThreadId,
        thread: client.codex.resumeThread(existingThreadId, threadOptions),
        created: false
      };
    }
    if (typeof client.codex.startThread !== "function") {
      return {
        ok: false,
        error: {
          code: "CODEX_START_THREAD_UNAVAILABLE",
          message: "The Codex SDK client does not expose startThread()."
        }
      };
    }
    const thread = client.codex.startThread(threadOptions);
    const codexThreadId = codexThreadIdFrom(thread);
    if (codexThreadId) {
      persistCodexThreadId({ workspaceId, rootDir, codexThreadId });
    }
    return {
      ok: true,
      codexThreadId,
      thread,
      created: true,
      codexThreadPending: !codexThreadId
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "CODEX_THREAD_FAILED",
        message: `Codex thread setup failed: ${error instanceof Error ? error.message : "unknown error"}.`
      }
    };
  }
}

export async function runCodexProductTurn({
  thread,
  prompt = "",
  workspaceId = "",
  rootDir = defaultProjectWorkspaceRoot(),
  outputSchema = codexOutputSchema(),
  onCodexEvent = null
} = {}) {
  if (!thread || (typeof thread.run !== "function" && typeof thread.runStreamed !== "function")) {
    return {
      ok: false,
      error: {
        code: "CODEX_THREAD_RUN_UNAVAILABLE",
        message: "Codex thread does not expose run() or runStreamed()."
      }
    };
  }
  try {
    const before = workspaceId ? snapshotGuardedFiles({ workspaceId, rootDir }) : null;
    const beforeEventCount = workspaceId ? guardedEventCount({ workspaceId, rootDir }) : 0;
    const result = typeof thread.runStreamed === "function"
      ? await runCodexThreadStreamed({ thread, prompt, outputSchema, onCodexEvent })
      : await runCodexThreadBuffered({ thread, prompt, outputSchema, onCodexEvent });
    const guardViolations = workspaceId
      ? detectGuardViolations({ workspaceId, rootDir, before, beforeEventCount })
      : [];
    if (guardViolations.length > 0) {
      return {
        ok: false,
        error: {
          code: "GUARD_VIOLATION",
          message: guardViolations.map((item) => item.message).join("; ")
        },
        guardViolations
      };
    }
    return {
      ok: true,
      result,
      text: codexResultText(result),
      codexThreadId: persistCodexThreadId({
        workspaceId,
        rootDir,
        codexThreadId: codexThreadIdFrom(thread) || codexThreadIdFrom(result)
      })?.codexThreadId || codexThreadIdFrom(thread) || codexThreadIdFrom(result)
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "CODEX_THREAD_RUN_FAILED",
        message: `Codex thread run failed: ${error instanceof Error ? error.message : "unknown error"}.`
      }
    };
  }
}

async function runCodexThreadBuffered({
  thread,
  prompt = "",
  outputSchema = null,
  onCodexEvent = null
} = {}) {
  emitCodexEvent(onCodexEvent, {
    type: "codex_turn_started",
    sdkEventType: "buffered.run"
  });
  const result = await thread.run(prompt, outputSchema ? { outputSchema } : {});
  emitCodexEvent(onCodexEvent, {
    type: "codex_turn_completed",
    sdkEventType: "buffered.run",
    codexThreadId: codexThreadIdFrom(thread) || codexThreadIdFrom(result),
    itemCount: Array.isArray(result?.items) ? result.items.length : 0,
    usage: summarizeCodexUsage(result?.usage)
  });
  return result;
}

async function runCodexThreadStreamed({
  thread,
  prompt = "",
  outputSchema = null,
  onCodexEvent = null
} = {}) {
  const streamed = await thread.runStreamed(prompt, outputSchema ? { outputSchema } : {});
  const turn = {
    items: [],
    finalResponse: "",
    usage: null
  };
  let turnFailure = null;
  for await (const event of streamed.events || []) {
    emitCodexEvent(onCodexEvent, codexTraceEventFromSdk(event));
    if (event?.type === "item.completed") {
      if (event.item?.type === "agent_message") {
        turn.finalResponse = event.item.text || "";
      }
      if (event.item) turn.items.push(event.item);
    } else if (event?.type === "turn.completed") {
      turn.usage = event.usage || null;
    } else if (event?.type === "turn.failed") {
      turnFailure = event.error || { message: "Codex turn failed." };
      break;
    } else if (event?.type === "error") {
      turnFailure = { message: event.message || "Codex stream failed." };
      break;
    }
  }
  if (turnFailure) {
    throw new Error(turnFailure.message || "Codex turn failed.");
  }
  return turn;
}

function emitCodexEvent(onCodexEvent, event = {}) {
  if (typeof onCodexEvent !== "function" || !event?.type) return;
  try {
    onCodexEvent(event);
  } catch {
    // Trace observers must never change Codex execution.
  }
}

function codexTraceEventFromSdk(event = {}) {
  const sdkEventType = event?.type || "";
  if (sdkEventType === "thread.started") {
    return {
      type: "codex_thread_started",
      sdkEventType,
      codexThreadId: event.thread_id || ""
    };
  }
  if (sdkEventType === "turn.started") {
    return {
      type: "codex_turn_started",
      sdkEventType
    };
  }
  if (sdkEventType === "turn.completed") {
    return {
      type: "codex_turn_completed",
      sdkEventType,
      usage: summarizeCodexUsage(event.usage)
    };
  }
  if (sdkEventType === "turn.failed") {
    return {
      type: "codex_turn_failed",
      sdkEventType,
      error: event.error || null
    };
  }
  if (sdkEventType === "error") {
    return {
      type: "codex_turn_failed",
      sdkEventType,
      error: {
        message: event.message || "Codex stream failed."
      }
    };
  }
  if (["item.started", "item.updated", "item.completed"].includes(sdkEventType)) {
    const item = event.item || {};
    return {
      type: `codex_${sdkEventType.replace(".", "_")}`,
      sdkEventType,
      itemId: item.id || "",
      itemType: item.type || "",
      itemStatus: codexItemStatus(item, sdkEventType),
      summary: summarizeCodexItem(item)
    };
  }
  return {
    type: "codex_sdk_event",
    sdkEventType
  };
}

function codexItemStatus(item = {}, sdkEventType = "") {
  if (item.status) return item.status;
  if (sdkEventType.endsWith(".started")) return "in_progress";
  if (sdkEventType.endsWith(".completed")) return "completed";
  return "";
}

function summarizeCodexItem(item = {}) {
  if (!item || typeof item !== "object") return {};
  if (item.type === "command_execution") {
    return {
      command: compactTraceText(item.command || "", 160),
      status: item.status || "",
      exitCode: item.exit_code
    };
  }
  if (item.type === "file_change") {
    return {
      status: item.status || "",
      changeCount: Array.isArray(item.changes) ? item.changes.length : 0,
      paths: (item.changes || []).map((change) => `${change.kind || "update"}:${change.path || ""}`).slice(0, 4)
    };
  }
  if (item.type === "mcp_tool_call") {
    return {
      server: item.server || "",
      tool: item.tool || "",
      status: item.status || ""
    };
  }
  if (item.type === "agent_message") {
    return {
      textLength: String(item.text || "").length
    };
  }
  if (item.type === "reasoning") {
    return {
      textLength: String(item.text || "").length
    };
  }
  if (item.type === "web_search") {
    return {
      query: compactTraceText(item.query || "", 160)
    };
  }
  if (item.type === "todo_list") {
    const items = Array.isArray(item.items) ? item.items : [];
    return {
      itemCount: items.length,
      completedCount: items.filter((todo) => todo.completed).length
    };
  }
  if (item.type === "error") {
    return {
      message: compactTraceText(item.message || "", 220)
    };
  }
  return {};
}

function summarizeCodexUsage(usage = null) {
  if (!usage || typeof usage !== "object") return null;
  return {
    inputTokens: usage.input_tokens,
    cachedInputTokens: usage.cached_input_tokens,
    outputTokens: usage.output_tokens,
    reasoningOutputTokens: usage.reasoning_output_tokens
  };
}

function compactTraceText(value = "", limit = 160) {
  const text = redactTraceText(String(value || "").replace(/\s+/g, " ").trim());
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 3))}...`;
}

function redactTraceText(value = "") {
  return String(value || "")
    .replace(/\b(api[_-]?key|token|secret|password)=\S+/gi, "$1=<redacted>")
    .replace(/\b(api[_-]?key|token|secret|password):\S+/gi, "$1:<redacted>")
    .replace(/(--(?:api-key|token|secret|password)\s+)\S+/gi, "$1<redacted>");
}

export function buildCodexProductPrompt({
  forgePrompt = "",
  toolResults = [],
  userMessage = ""
} = {}) {
  return [
    "You are the Codex runtime for Forge hardware product tasks.",
    "You are running inside one Forge project workspace. Read AGENTS.md, WORK_INDEX.md, CURRENT_STATE.md, DECISIONS.md, FORGE_TOOLS.md, and skills/ when needed.",
    "You may plan and decide, but Forge project state must only change through forge-tool commands or exported Forge tool intents.",
    "Prefer calling forge-tool commands from FORGE_TOOLS.md for project-changing work.",
    "Do not directly write raw GeometrySpec, GLB, STL, STEP, mesh data, supplier orders, payments, or manufacturing actions.",
    "Return exactly one JSON object. Do not wrap it in prose unless you are unable to comply.",
    "JSON shape:",
    JSON.stringify({
      assistantMessage: "short message for the user when no tool is needed, or after tool results",
      toolCalls: [
        {
          name: "applyDesignPatch",
          inputJson: "{\"workspaceId\":\"plan-id\",\"message\":\"user request\",\"patches\":[]}"
        }
      ]
    }, null, 2),
    "Use toolCalls only for available Forge tools from the prompt. Put the tool input as a JSON string in inputJson.",
    "If you need no tool, return an empty toolCalls array.",
    "If you used forge-tool yourself, summarize the result and return an empty toolCalls array.",
    "If tool results are present, summarize them and do not repeat a tool call unless another step is needed.",
    "",
    "## Forge Prompt",
    forgePrompt || "",
    "",
    "## Tool Results From Previous Iteration",
    JSON.stringify(toolResults.map((item) => item.summary || item.result || item), null, 2),
    "",
    "## Current User Message",
    String(userMessage || "")
  ].join("\n");
}

export function codexThreadOptions({ workspacePath = "" } = {}) {
  return {
    workingDirectory: workspacePath,
    skipGitRepoCheck: true,
    sandboxMode: "workspace-write"
  };
}

export function codexOutputSchema() {
  return {
    type: "object",
    properties: {
      assistantMessage: { type: "string" },
      toolCalls: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            inputJson: { type: "string" }
          },
          required: ["name", "inputJson"],
          additionalProperties: false
        }
      }
    },
    required: ["assistantMessage", "toolCalls"],
    additionalProperties: false
  };
}

export function parseCodexToolIntent(text = "") {
  const parsed = parseCodexJson(text);
  if (!parsed || typeof parsed !== "object") {
    return {
      ok: true,
      finalMessage: String(text || "").trim(),
      toolCalls: []
    };
  }
  const rawCalls = Array.isArray(parsed.toolCalls)
    ? parsed.toolCalls
    : Array.isArray(parsed.tools)
      ? parsed.tools
      : Array.isArray(parsed.actions)
        ? parsed.actions
        : [];
  const toolCalls = rawCalls
    .map((call) => ({
      toolCallId: call.toolCallId || call.id || "",
      name: call.name || call.toolName || call.action || "",
      input: parseCodexToolInput(call)
    }))
    .filter((call) => call.name);
  const finalMessage = parsed.assistantMessage
    || parsed.finalMessage
    || parsed.message
    || (toolCalls.length ? "" : String(text || "").trim());
  return {
    ok: true,
    finalMessage: String(finalMessage || ""),
    toolCalls
  };
}

function parseCodexToolInput(call = {}) {
  const objectInput = call.input || call.arguments || call.args;
  if (objectInput && typeof objectInput === "object" && !Array.isArray(objectInput)) {
    return objectInput;
  }
  const raw = call.inputJson || call.argumentsJson || call.argsJson || (typeof objectInput === "string" ? objectInput : "");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function codexResultText(result) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  return result.final_response
    || result.finalResponse
    || result.final_response_text
    || result.finalResponseText
    || result.output_text
    || result.outputText
    || result.text
    || result.message
    || "";
}

export function codexThreadIdFrom(value) {
  if (!value || typeof value !== "object") return "";
  return value.threadId
    || value.thread_id
    || value.id
    || value.metadata?.threadId
    || value.metadata?.thread_id
    || "";
}

export function persistCodexThreadId({
  workspaceId = "",
  rootDir = defaultProjectWorkspaceRoot(),
  codexThreadId = ""
} = {}) {
  if (!workspaceId || !codexThreadId) return null;
  const manifest = readProjectManifest({ workspaceId, rootDir }) || {};
  if (manifest.codexThreadId === codexThreadId) return manifest;
  const updated = updateProjectManifest({
    workspaceId,
    rootDir,
    patch: { codexThreadId }
  });
  appendWorkspaceEvent({
    workspaceId,
    rootDir,
    type: "codex_thread_created",
    actor: "system",
    payload: {
      codexThreadId,
      runtimeVersion: CODEX_RUNTIME_VERSION
    }
  });
  return updated;
}

async function createCodexClient({ codexFactory = null } = {}) {
  try {
    if (codexFactory) {
      const codex = await codexFactory();
      return { ok: true, codex };
    }
    const sdk = await import(CODEX_SDK_PACKAGE);
    const CodexClass = sdk.Codex || sdk.default?.Codex || sdk.default;
    if (typeof CodexClass !== "function") {
      return {
        ok: false,
        error: {
          code: "CODEX_SDK_EXPORT_MISSING",
          message: `${CODEX_SDK_PACKAGE} did not export Codex.`
        }
      };
    }
    return { ok: true, codex: new CodexClass() };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "CODEX_SDK_UNAVAILABLE",
        message: `${CODEX_SDK_PACKAGE} is required when runtimeProvider/modelProvider is codex. Install it with npm install ${CODEX_SDK_PACKAGE}. ${error instanceof Error ? error.message : ""}`.trim()
      }
    };
  }
}

function parseCodexJson(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  for (const candidate of jsonCandidates(raw)) {
    try {
      return JSON.parse(candidate);
    } catch {}
  }
  return null;
}

function jsonCandidates(text) {
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  return [...new Set(candidates.filter(Boolean))];
}
