#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const shouldRun = Boolean(args.run || process.env.FORGE_LIVE_CODEX_SMOKE === "1");
const externalAck = Boolean(
  args.ackExternalCodex
  || process.env.FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK === "send_project_context_to_codex"
);

if (!shouldRun) {
  writeJson({
    ok: true,
    skipped: true,
    message: "Live Codex smoke is opt-in and sends the smoke project context through Codex SDK. To run: FORGE_LIVE_CODEX_SMOKE=1 FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex npm run smoke:codex-live"
  });
  process.exit(0);
}

if (!externalAck) {
  writeJson({
    ok: false,
    skipped: true,
    error: {
      code: "LIVE_CODEX_EXTERNAL_ACK_REQUIRED",
      message: "Live Codex smoke sends Forge project context through Codex SDK. Set FORGE_LIVE_CODEX_SMOKE_EXTERNAL_ACK=send_project_context_to_codex or pass --ack-external-codex to acknowledge this before running."
    }
  });
  process.exit(2);
}

const workspaceRoot = resolve(
  args.workspaceRoot
  || process.env.FORGE_SMOKE_WORKSPACE_ROOT
  || join(tmpdir(), `forge-codex-live-smoke-${Date.now()}`)
);
process.env.FORGE_WORKSPACE_ROOT = workspaceRoot;
mkdirSync(workspaceRoot, { recursive: true });

try {
  const { commitStagedChange } = await import("../src/core/forge_actions.mjs");
  const { getProductPlan } = await import("../src/core/product_plan.mjs");
  const { createProductPlanForRuntime } = await import("../src/core/runtime_plan_creation.mjs");
  const { confirmForgeChatTool, runForgeChatTurn } = await import("../src/core/forge_query_engine.mjs");
  const { projectWorkspacePath, readWorkspaceEvents } = await import("../src/core/project_workspace.mjs");

  const initial = await createProductPlanForRuntime({
    initialMessage: "我想做一个带 3.5 寸屏幕的小桌面闹钟，USB-C 供电，3D 打印外壳。",
    language: "zh",
    runtime: {
      runtimeProvider: "codex",
      modelProvider: "codex"
    }
  });
  if (initial?.ok === false) {
    throw smokeError(initial.error?.code || "PLAN_CREATION_FAILED", initial.error?.message || "Codex-backed ProductPlan creation failed.", {
      initial
    });
  }
  const workspaceId = initial.productPlan.planId;
  const sessionId = "live_codex_smoke";
  const messages = [
    "加两个按钮，放在右侧，再加一个蜂鸣器。请用 Forge 工具创建 proposal；如果信息足够可以直接应用为 pending revision，不要生成 3D。",
    "生成 3D 模型。我明确确认当前 revision 可以生成 GLB/STL/STEP artifacts，请先 validate 再 generate。",
    "把 USB-C 移到后面左侧。请用 Forge 工具创建 proposal；如果信息足够可以直接应用为 pending revision，不要直接改 geometry-spec.json。",
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
      const confirmed = await confirmForgeChatTool({
        workspaceId,
        sessionId,
        confirmationId: turn.pendingConfirmation.confirmationId,
        approved: true
      });
      turns.push({
        ...compactTurn(`确认：${message}`, confirmed),
        confirmationId: turn.pendingConfirmation.confirmationId
      });
      if (!confirmed.ok) {
        throw smokeError("CONFIRMATION_FAILED", confirmed.error?.message || "Live smoke confirmation failed.", {
          workspaceId,
          turns,
          pendingConfirmation: turn.pendingConfirmation
        });
      }
    }
    const proposalId = proposalIdFromTurn(turn);
    if (proposalId) {
      const committed = commitStagedChange({
        workspaceId,
        proposalId
      });
      turns.push(compactForgeAction(
        `确认并提交 proposal：${proposalId}`,
        "commitStagedChange",
        committed,
        getProductPlan(workspaceId)?.currentRevisionId || ""
      ));
      if (!committed.ok) {
        throw smokeError("PROPOSAL_COMMIT_FAILED", committed.error?.message || `Could not commit proposal ${proposalId}.`, {
          workspaceId,
          turns
        });
      }
    }
  }

  const plan = getProductPlan(workspaceId);
  const events = readWorkspaceEvents({ workspaceId });
  const checks = {
    hasRuntimeBinding: turns.some((turn) => Boolean(turn.bindingId || turn.runtimeBinding?.bindingId)),
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
    runtimeBinding: turn?.runtimeBinding || null,
    bindingId: turn?.bindingId || turn?.runtimeBinding?.bindingId || "",
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

function compactForgeAction(message, toolName, result, currentRevisionId = "") {
  return {
    message,
    ok: Boolean(result?.ok),
    runtimeProvider: "forge-confirmation",
    modelProvider: "",
    runtimeBinding: null,
    bindingId: "",
    assistantMessage: result?.ok ? `${toolName} ok` : (result?.error?.message || `${toolName} failed`),
    toolCalls: [toolName],
    toolResults: [
      {
        ok: Boolean(result?.ok),
        summary: {
          ok: Boolean(result?.ok),
          proposalId: result?.proposalId || "",
          proposalStatus: result?.status || "",
          newRevisionId: result?.newRevisionId || result?.revisionId || result?.currentRevisionId || "",
          committed: Boolean(result?.committed),
          applied: Boolean(result?.applied),
          regenerated: Boolean(result?.regenerated),
          reverted: Boolean(result?.reverted),
          validationStatus: result?.validationReport?.status || "",
          warningCount: Array.isArray(result?.validationReport?.issues)
            ? result.validationReport.issues.filter((issue) => issue.level === "warn" || issue.level === "block").length
            : 0,
          artifactPaths: result?.artifactPaths || {}
        }
      }
    ],
    pendingConfirmationId: "",
    currentRevisionId,
    modelResponses: []
  };
}

function proposalIdFromTurn(turn) {
  const direct = turn?.proposal?.proposalId || "";
  if (direct && ["proposed", "staged"].includes(turn?.proposal?.status || "")) return direct;
  for (const result of turn?.toolResults || []) {
    const summary = result.summary || {};
    if (summary.proposalId && ["proposed", "staged"].includes(summary.proposalStatus || "")) {
      return summary.proposalId;
    }
  }
  return "";
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
      continue;
    }
    if (token === "--ack-external-codex") {
      options.ackExternalCodex = true;
    }
  }
  return options;
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}
