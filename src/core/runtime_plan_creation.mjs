import { ensureCodexProjectThread, runCodexProductTurn } from "./codex_runtime.mjs";
import { createProductPlan } from "./product_plan.mjs";
import { defaultProjectWorkspaceRoot, updateRuntimeBinding } from "./project_workspace.mjs";

export async function createProductPlanForRuntime({
  message = "",
  initialMessage = "",
  assets = [],
  language = "zh",
  runtime = { runtimeProvider: "mock", modelProvider: "mock" },
  rootDir = defaultProjectWorkspaceRoot(),
  codexFactory = null,
  onTraceEvent = null,
  abortSignal = null
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
    return {
      ...thread,
      workspaceId: result.productPlan.planId,
      runtimeBinding: markRuntimeInitializationFailed({
        workspaceId: result.productPlan.planId,
        rootDir,
        error: thread.error || {}
      })
    };
  }

  let runtimeBinding = thread.runtimeBinding || null;
  let bindingId = thread.bindingId || runtimeBinding?.bindingId || "";
  if (!bindingId) {
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
      }),
      onCodexEvent: (event) => emitPlanTraceEvent(onTraceEvent, event),
      signal: abortSignal
    });
    if (!initialized.ok) {
      emitPlanTraceEvent(onTraceEvent, {
        type: "plan_create_failed",
        error: initialized.error || null
      });
      return {
        ...initialized,
        workspaceId: result.productPlan.planId,
        runtimeBinding: markRuntimeInitializationFailed({
          workspaceId: result.productPlan.planId,
          rootDir,
          error: initialized.error || {}
        })
      };
    }
    runtimeBinding = initialized.runtimeBinding || null;
    bindingId = initialized.bindingId || runtimeBinding?.bindingId || "";
  }

  if (!bindingId) {
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
    missing.workspaceId = result.productPlan.planId;
    missing.runtimeBinding = markRuntimeInitializationFailed({
      workspaceId: result.productPlan.planId,
      rootDir,
      error: missing.error
    });
    return missing;
  }

  result.runtimeBinding = runtimeBinding || {
    provider: "codex",
    status: "ready",
    bindingId
  };
  emitPlanTraceEvent(onTraceEvent, {
    type: "codex_thread_ready",
    workspaceId: result.productPlan.planId,
    runtimeBinding: result.runtimeBinding,
    bindingId
  });
  return result;
}

function markRuntimeInitializationFailed({
  workspaceId,
  rootDir = defaultProjectWorkspaceRoot(),
  error = {}
} = {}) {
  return updateRuntimeBinding({
    workspaceId,
    rootDir,
    provider: "codex",
    status: "failed",
    error: {
      code: error.code || "CODEX_RUNTIME_INITIALIZATION_FAILED",
      message: error.message || "Codex runtime initialization failed."
    },
    providerState: {
      failureAt: new Date().toISOString()
    }
  });
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
