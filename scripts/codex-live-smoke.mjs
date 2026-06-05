#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const shouldRun = Boolean(args.run || process.env.FORGE_LIVE_CODEX_SMOKE === "1");

if (!shouldRun) {
  writeJson({
    ok: true,
    skipped: true,
    message: "Live Codex smoke is opt-in. Run `npm run smoke:codex-live` or set FORGE_LIVE_CODEX_SMOKE=1."
  });
  process.exit(0);
}

const workspaceRoot = resolve(
  args.workspaceRoot
  || process.env.FORGE_SMOKE_WORKSPACE_ROOT
  || join(tmpdir(), `forge-codex-live-smoke-${Date.now()}`)
);
process.env.FORGE_WORKSPACE_ROOT = workspaceRoot;
mkdirSync(workspaceRoot, { recursive: true });

try {
  const { createProductPlan, getProductPlan } = await import("../src/core/product_plan.mjs");
  const { runForgeChatTurn } = await import("../src/core/forge_query_engine.mjs");
  const { projectWorkspacePath, readWorkspaceEvents } = await import("../src/core/project_workspace.mjs");

  const initial = createProductPlan({
    initialMessage: "我想做一个带 3.5 寸屏幕的小桌面闹钟，USB-C 供电，3D 打印外壳。",
    language: "zh"
  });
  const workspaceId = initial.productPlan.planId;
  const sessionId = "live_codex_smoke";
  const messages = [
    "加两个按钮，放在右侧，再加一个蜂鸣器。",
    "生成 3D 模型。",
    "把 USB-C 移到后面左侧。",
    "回退到上一个版本。"
  ];
  const turns = [];

  for (const message of messages) {
    const turn = await runForgeChatTurn({
      workspaceId,
      sessionId,
      userMessage: message,
      runtimeProvider: "codex",
      maxToolCalls: 8
    });
    const compact = compactTurn(message, turn);
    turns.push(compact);
    if (!turn.ok) {
      throw smokeError("CHAT_TURN_FAILED", turn.error?.message || "Codex chat turn failed.", {
        workspaceId,
        turns
      });
    }
    const failedModel = turn.modelResponses?.find((response) => response.ok === false);
    if (failedModel) {
      throw smokeError(failedModel.errorCode || "CODEX_MODEL_FAILED", failedModel.errorMessage || "Codex model response failed.", {
        workspaceId,
        turns
      });
    }
    if (turn.pendingConfirmation) {
      throw smokeError("PENDING_CONFIRMATION", "Live smoke received a pending confirmation; use more explicit demo wording or inspect the returned confirmation.", {
        workspaceId,
        turns,
        pendingConfirmation: turn.pendingConfirmation
      });
    }
  }

  const plan = getProductPlan(workspaceId);
  const events = readWorkspaceEvents({ workspaceId });
  const checks = {
    hasCodexThread: turns.some((turn) => Boolean(turn.codexThreadId)),
    hasButtonUpdate: Number(plan?.workspaceState?.productPlan?.requirements?.buttons || 0) >= 2,
    hasBuzzerOrSpeaker: Boolean(plan?.workspaceState?.productPlan?.requirements?.buzzer || plan?.workspaceState?.productPlan?.requirements?.speaker),
    hasGeneratedArtifacts: (plan?.revisions || []).some((revision) => (
      revision.modelArtifacts?.status === "generated"
      && Boolean(revision.modelArtifacts?.artifacts?.glb?.localPath)
      && Boolean(revision.modelArtifacts?.artifacts?.stl?.localPath)
      && Boolean(revision.modelArtifacts?.artifacts?.step?.localPath)
    )),
    hasUsbBackLeftRevision: (plan?.revisions || []).some((revision) => (
      revision.productPlanSnapshot?.geometryPreferences?.placements?.usb_c?.semanticPosition === "back_left"
    )),
    hasRevertEvent: events.some((event) => event.type === "revision_reverted")
  };
  const failedChecks = Object.entries(checks)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (failedChecks.length > 0) {
    throw smokeError("SMOKE_CHECK_FAILED", `Live Codex smoke did not satisfy: ${failedChecks.join(", ")}`, {
      workspaceId,
      workspacePath: projectWorkspacePath(workspaceId),
      turns,
      checks
    });
  }

  writeJson({
    ok: true,
    skipped: false,
    workspaceId,
    workspaceRoot,
    workspacePath: projectWorkspacePath(workspaceId),
    turns,
    checks
  });
} catch (error) {
  writeJson({
    ok: false,
    error: {
      code: error.code || "CODEX_LIVE_SMOKE_FAILED",
      message: error instanceof Error ? error.message : "Live Codex smoke failed."
    },
    details: error.details || null
  });
  process.exitCode = 1;
}

function compactTurn(message, turn) {
  return {
    message,
    ok: Boolean(turn?.ok),
    runtimeProvider: turn?.runtimeProvider || "",
    modelProvider: turn?.modelProvider || "",
    codexThreadId: turn?.codexThreadId || "",
    assistantMessage: String(turn?.assistantMessage || "").slice(0, 500),
    toolCalls: (turn?.toolCalls || []).map((call) => call.name),
    toolResults: (turn?.toolResults || []).map((result) => ({
      ok: Boolean(result.ok),
      summary: result.summary || null
    })),
    pendingConfirmationId: turn?.pendingConfirmation?.confirmationId || "",
    currentRevisionId: turn?.productPlan?.currentRevisionId || "",
    modelResponses: (turn?.modelResponses || []).map((response) => ({
      ok: Boolean(response.ok),
      toolCallCount: response.toolCallCount || 0,
      errorCode: response.errorCode || ""
    }))
  };
}

function smokeError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--run") {
      options.run = true;
      continue;
    }
    if (token === "--workspace-root") {
      options.workspaceRoot = argv[index + 1] || "";
      index += 1;
    }
  }
  return options;
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
