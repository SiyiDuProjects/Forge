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
  outputSchema = codexOutputSchema()
} = {}) {
  if (!thread || typeof thread.run !== "function") {
    return {
      ok: false,
      error: {
        code: "CODEX_THREAD_RUN_UNAVAILABLE",
        message: "Codex thread does not expose run()."
      }
    };
  }
  try {
    const before = workspaceId ? snapshotGuardedFiles({ workspaceId, rootDir }) : null;
    const beforeEventCount = workspaceId ? guardedEventCount({ workspaceId, rootDir }) : 0;
    const result = await thread.run(prompt, outputSchema ? { outputSchema } : {});
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
