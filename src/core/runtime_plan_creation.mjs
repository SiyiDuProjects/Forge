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
  codexFactory = null
} = {}) {
  const result = createProductPlan({
    message,
    initialMessage,
    assets,
    language
  });
  result.runtimeProvider = runtime.runtimeProvider;
  result.modelProvider = runtime.modelProvider;

  if (runtime.runtimeProvider !== "codex") {
    return result;
  }

  const thread = await ensureCodexProjectThread({
    workspaceId: result.productPlan.planId,
    rootDir,
    codexFactory
  });
  if (!thread.ok) return thread;

  let codexThreadId = thread.codexThreadId;
  if (!codexThreadId) {
    const initialized = await runCodexProductTurn({
      thread: thread.thread,
      workspaceId: result.productPlan.planId,
      rootDir,
      prompt: codexInitializationPrompt({
        result,
        userMessage: initialMessage || message || ""
      })
    });
    if (!initialized.ok) return initialized;
    codexThreadId = initialized.codexThreadId;
  }

  if (!codexThreadId) {
    return {
      ok: false,
      error: {
        code: "CODEX_THREAD_ID_MISSING",
        message: "Codex initialized a thread but did not expose a thread id."
      }
    };
  }

  result.codexThreadId = codexThreadId;
  result.productPlan.workspaceState = {
    ...(result.productPlan.workspaceState || {}),
    codexThreadId
  };
  persistProjectPlan({ plan: result.productPlan, rootDir });
  return result;
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
