import { ensureCodexProjectThread, runCodexProductTurn } from "./codex_runtime.mjs";
import { createProductPlan } from "./product_plan.mjs";
import { defaultProjectWorkspaceRoot, persistProjectPlan } from "./project_workspace.mjs";

export async function createProductPlanForRuntime({
  message = "",
  initialMessage = "",
  assets = [],
  language = "zh",
  runtime = { runtimeProvider: "mock", modelProvider: "mock" },
  rootDir = defaultProjectWorkspaceRoot(),
  codexFactory = null,
  onTraceEvent = null
} = {}) {
  const text = initialMessage || message || "";
  emitPlanTraceEvent(onTraceEvent, {
    type: "plan_create_started",
    runtimeProvider: runtime.runtimeProvider,
    modelProvider: runtime.modelProvider,
    text
  });
  const result = createProductPlan({
    message,
    initialMessage,
    assets,
    language
  });
  result.runtimeProvider = runtime.runtimeProvider;
  result.modelProvider = runtime.modelProvider;
  emitPlanTraceEvent(onTraceEvent, {
    type: "product_plan_created",
    runtimeProvider: runtime.runtimeProvider,
    modelProvider: runtime.modelProvider,
    planId: result.productPlan?.planId || "",
    revisionId: result.revision?.revisionId || "",
    modelStatus: result.revision?.modelArtifacts?.status || ""
  });

  if (runtime.runtimeProvider !== "codex") {
    return result;
  }

  emitPlanTraceEvent(onTraceEvent, {
    type: "codex_thread_requested",
    workspaceId: result.productPlan.planId
  });
  const thread = await ensureCodexProjectThread({
    workspaceId: result.productPlan.planId,
    rootDir,
    codexFactory
  });
  if (!thread.ok) {
    emitPlanTraceEvent(onTraceEvent, {
      type: "plan_create_failed",
      error: thread.error || null
    });
    return thread;
  }

  let codexThreadId = thread.codexThreadId;
  if (!codexThreadId) {
    emitPlanTraceEvent(onTraceEvent, {
      type: "codex_thread_initializing",
      workspaceId: result.productPlan.planId
    });
    const initialized = await runCodexProductTurn({
      thread: thread.thread,
      workspaceId: result.productPlan.planId,
      rootDir,
      prompt: codexInitializationPrompt({
        result,
        userMessage: text
      })
    });
    if (!initialized.ok) {
      emitPlanTraceEvent(onTraceEvent, {
        type: "plan_create_failed",
        error: initialized.error || null
      });
      return initialized;
    }
    codexThreadId = initialized.codexThreadId;
  }

  if (!codexThreadId) {
    const missing = {
      ok: false,
      error: {
        code: "CODEX_THREAD_ID_MISSING",
        message: "Codex initialized a thread but did not expose a thread id."
      }
    };
    emitPlanTraceEvent(onTraceEvent, {
      type: "plan_create_failed",
      error: missing.error
    });
    return missing;
  }

  result.codexThreadId = codexThreadId;
  result.productPlan.workspaceState = {
    ...(result.productPlan.workspaceState || {}),
    codexThreadId
  };
  persistProjectPlan({ plan: result.productPlan, rootDir });
  emitPlanTraceEvent(onTraceEvent, {
    type: "codex_thread_ready",
    workspaceId: result.productPlan.planId,
    codexThreadId
  });
  return result;
}

function emitPlanTraceEvent(onTraceEvent, event = {}) {
  if (typeof onTraceEvent !== "function") return;
  try {
    onTraceEvent({
      at: new Date().toISOString(),
      ...event
    });
  } catch {
    // Trace observers must never change ProductPlan creation.
  }
}

export function codexInitializationPrompt({ result, userMessage = "" } = {}) {
  const plan = result?.productPlan || {};
  const revision = result?.revision || {};
  return [
    "Initialize this Codex thread for one Forge hardware product project.",
    "This is a product-task runtime thread, not a Forge source-code editing task.",
    "Do not call tools or request file/model mutations in this initialization turn.",
    "Return exactly this JSON shape with an empty toolCalls array:",
    "{\"assistantMessage\":\"Project thread initialized.\",\"toolCalls\":[]}",
    "",
    "Forge project summary:",
    JSON.stringify({
      planId: plan.planId || "",
      title: plan.workspaceState?.title || revision.requestText || "",
      currentRevisionId: plan.currentRevisionId || "",
      userMessage
    }, null, 2)
  ].join("\n");
}
