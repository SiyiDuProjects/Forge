import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { API_CONTRACT, CONTRACT_VERSION, WORKBENCH_CHAIN } from "./src/contracts/workbench_contract.mjs";
import { createLogger, durationMs } from "./src/core/observability.mjs";
import { registerAsset } from "./src/core/assets.mjs";
import { buildContextPack } from "./src/core/context_pack_builder.mjs";
import { loadChatSession } from "./src/core/chat_session_store.mjs";
import {
  getRevisionArtifacts,
  getWorkspaceSummary
} from "./src/core/forge_actions.mjs";
import { confirmForgeChatTool, resolveChatRuntime, runForgeChatTurn } from "./src/core/forge_query_engine.mjs";
import { createGenerationJob, getGenerationJob } from "./src/core/jobs.mjs";
import { createDraft, createDeviceConfig, listCatalogModules, submitReview } from "./src/core/pipeline.mjs";
import { addProductPlanTurn } from "./src/core/product_plan.mjs";
import { runProductConversationTurn } from "./src/core/product_conversation.mjs";
import { listProjectWorkspaces, readProjectWorkspacePlan, readRevisionLedger } from "./src/core/project_workspace.mjs";
import { createProductPlanForRuntime } from "./src/core/runtime_plan_creation.mjs";
import { getRuntimeStatus } from "./src/core/runtime_status.mjs";
import { executeForgeToolWithPolicy } from "./src/core/tool_executor.mjs";
import { listToolMetadata } from "./src/core/tool_registry.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const threeDir = fileURLToPath(new URL("./node_modules/three/", import.meta.url));
const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || "127.0.0.1";
const defaultChatModelProvider = process.env.FORGE_CHAT_MODEL_PROVIDER || "mock";
const defaultChatRuntimeProvider = process.env.FORGE_CHAT_RUNTIME_PROVIDER || defaultChatModelProvider;
const logger = createLogger({ service: "forge-hardware-workbench" });

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".svg": "image/svg+xml"
};

const server = createServer(async (request, response) => {
  const startedAt = Date.now();
  let pathname = request.url || "/";
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    pathname = url.pathname;

    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }

    if (url.pathname.startsWith("/vendor/three/")) {
      await serveThreeVendor(response, url.pathname);
      return;
    }

    await serveStatic(response, url.pathname);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    logger.error("request_failed", {
      method: request.method,
      path: pathname,
      status: statusCode,
      message: error instanceof Error ? error.message : "Unknown server error"
    });
    sendJson(response, statusCode, {
      error: {
        code: statusCode === 400 ? "bad_request" : "internal_error",
        message: error instanceof Error ? error.message : "Unknown server error"
      }
    });
  } finally {
    logger.info("http_request", {
      method: request.method,
      path: pathname,
      status: response.statusCode,
      duration_ms: durationMs(startedAt)
    });
  }
});

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "forge-hardware-workbench",
      contractVersion: CONTRACT_VERSION,
      chain: WORKBENCH_CHAIN,
      api: API_CONTRACT
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/modules") {
    sendJson(response, 200, {
      modules: listCatalogModules()
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/runtime/status") {
    const runtime = runtimeForRequest({
      runtimeProvider: url.searchParams.get("runtimeProvider") || "",
      modelProvider: url.searchParams.get("modelProvider") || ""
    });
    sendJson(response, 200, await getRuntimeStatus({
      workspaceId: url.searchParams.get("workspaceId") || "",
      runtimeProvider: runtime.runtimeProvider,
      modelProvider: runtime.modelProvider,
      defaultRuntimeProvider: defaultChatRuntimeProvider,
      defaultModelProvider: defaultChatModelProvider
    }));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/workspaces") {
    const limit = Number(url.searchParams.get("limit") || 12);
    sendJson(response, 200, {
      ok: true,
      workspaces: listProjectWorkspaces({ limit })
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/conversations/turn/stream") {
    const body = await readJsonBody(request);
    const runtime = runtimeForRequest(body);
    await sendProductConversationStream(request, response, {
      workspaceId: body.workspaceId || "",
      sessionId: body.sessionId || "session_default",
      userMessage: body.userMessage || body.message || "",
      language: body.language || "zh",
      modelProvider: runtime.modelProvider,
      runtimeProvider: runtime.runtimeProvider,
      mode: body.mode || "normal",
      confirmation: body.confirmation || null
    });
    return;
  }

  const workspacePlanMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/plan$/);
  if (request.method === "GET" && workspacePlanMatch) {
    const productPlan = readProjectWorkspacePlan({ workspaceId: workspacePlanMatch[1] });
    if (!productPlan) {
      sendJson(response, 404, {
        ok: false,
        error: {
          code: "WORKSPACE_NOT_FOUND",
          message: "Workspace ProductPlan was not found."
        }
      });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      workspaceId: workspacePlanMatch[1],
      productPlan
    });
    return;
  }

  const workspaceSummaryMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/summary$/);
  if (request.method === "GET" && workspaceSummaryMatch) {
    sendActionJson(response, getWorkspaceSummary({
      workspaceId: workspaceSummaryMatch[1]
    }));
    return;
  }

  const workspaceArtifactsMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/artifacts\/([^/]+)$/);
  if (request.method === "GET" && workspaceArtifactsMatch) {
    sendActionJson(response, getRevisionArtifacts({
      workspaceId: workspaceArtifactsMatch[1],
      revisionId: workspaceArtifactsMatch[2]
    }));
    return;
  }

  const workspaceRevisionLedgerMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/revision-ledger$/);
  if (request.method === "GET" && workspaceRevisionLedgerMatch) {
    const revisionLedger = readRevisionLedger({ workspaceId: workspaceRevisionLedgerMatch[1] });
    if (!revisionLedger) {
      sendJson(response, 404, {
        ok: false,
        error: {
          code: "REVISION_LEDGER_NOT_FOUND",
          message: "Workspace revision ledger was not found."
        }
      });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      workspaceId: workspaceRevisionLedgerMatch[1],
      revisionLedger
    });
    return;
  }

  const workspaceContextPackMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/context-pack$/);
  if (request.method === "GET" && workspaceContextPackMatch) {
    sendActionJson(response, buildContextPack({
      workspaceId: workspaceContextPackMatch[1]
    }));
    return;
  }

  const workspaceToolsMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/tools$/);
  if (request.method === "GET" && workspaceToolsMatch) {
    sendActionJson(response, {
      ok: true,
      workspaceId: workspaceToolsMatch[1],
      tools: listToolMetadata()
    });
    return;
  }

  const workspaceChatTurnStreamMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/chat\/turn\/stream$/);
  if (request.method === "POST" && workspaceChatTurnStreamMatch) {
    const body = await readJsonBody(request);
    const runtime = runtimeForRequest(body);
    await sendChatTurnStream(request, response, {
      workspaceId: workspaceChatTurnStreamMatch[1],
      sessionId: body.sessionId || "session_default",
      userMessage: body.userMessage || body.message || "",
      modelProvider: runtime.modelProvider,
      runtimeProvider: runtime.runtimeProvider,
      mode: body.mode || "normal",
      confirmation: body.confirmation || null
    });
    return;
  }

  const workspaceChatTurnMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/chat\/turn$/);
  if (request.method === "POST" && workspaceChatTurnMatch) {
    const body = await readJsonBody(request);
    const runtime = runtimeForRequest(body);
    sendActionJson(response, await runForgeChatTurn({
      workspaceId: workspaceChatTurnMatch[1],
      sessionId: body.sessionId || "session_default",
      userMessage: body.userMessage || body.message || "",
      modelProvider: runtime.modelProvider,
      runtimeProvider: runtime.runtimeProvider,
      mode: body.mode || "normal",
      confirmation: body.confirmation || null
    }));
    return;
  }

  const workspaceChatSessionMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/chat\/([^/]+)$/);
  if (request.method === "GET" && workspaceChatSessionMatch) {
    sendActionJson(response, loadChatSession({
      workspaceId: workspaceChatSessionMatch[1],
      sessionId: workspaceChatSessionMatch[2],
      limit: Number(url.searchParams.get("limit") || 0)
    }));
    return;
  }

  const workspaceChatConfirmMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/chat\/confirm$/);
  if (request.method === "POST" && workspaceChatConfirmMatch) {
    const body = await readJsonBody(request);
    sendActionJson(response, await confirmForgeChatTool({
      workspaceId: workspaceChatConfirmMatch[1],
      confirmationId: body.confirmationId || "",
      sessionId: body.sessionId || "session_default",
      approved: Boolean(body.approved)
    }));
    return;
  }

  const workspaceComponentSearchMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/search$/);
  if (request.method === "POST" && workspaceComponentSearchMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentSearchMatch[1],
      toolName: "searchComponentLibrary",
      input: {
        query: body.query || "",
        componentType: body.componentType || "",
        limit: body.limit || 10
      }
    });
    return;
  }

  const workspaceComponentDraftPackageMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/draft-package$/);
  if (request.method === "POST" && workspaceComponentDraftPackageMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentDraftPackageMatch[1],
      toolName: "inspectComponentDescriptorDraft",
      input: {
        descriptor: body.descriptor || null,
        descriptorJson: body.descriptorJson || "",
        expectedId: body.expectedId || "",
        sourcesText: body.sourcesText || ""
      }
    });
    return;
  }

  const workspaceComponentDraftsMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/drafts$/);
  if (request.method === "POST" && workspaceComponentDraftsMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentDraftsMatch[1],
      toolName: "inspectWorkspaceComponentDescriptorDrafts",
      input: {
        draftId: body.draftId || "",
        limit: body.limit || 20
      }
    });
    return;
  }

  const workspaceComponentDraftScaffoldMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/drafts\/scaffold$/);
  if (request.method === "POST" && workspaceComponentDraftScaffoldMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentDraftScaffoldMatch[1],
      toolName: "scaffoldWorkspaceComponentDescriptorDraft",
      input: {
        draftId: body.draftId || "",
        componentType: body.componentType || "",
        displayName: body.displayName || "",
        overwrite: Boolean(body.overwrite)
      },
      mode: "confirmed",
      userMessage: "scaffold workspace descriptor draft"
    });
    return;
  }

  const workspaceComponentDraftPromoteMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/drafts\/([^/]+)\/promote$/);
  if (request.method === "POST" && workspaceComponentDraftPromoteMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentDraftPromoteMatch[1],
      toolName: "promoteWorkspaceComponentDescriptorDraft",
      input: {
        draftId: decodeURIComponent(workspaceComponentDraftPromoteMatch[2]),
        replaceExisting: Boolean(body.replaceExisting)
      },
      mode: "confirmed",
      userMessage: "promote workspace descriptor draft"
    });
    return;
  }

  const workspaceComponentDraftSpecsMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/drafts\/([^/]+)\/specs$/);
  if (request.method === "POST" && workspaceComponentDraftSpecsMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentDraftSpecsMatch[1],
      toolName: "applyWorkspaceDescriptorDraftSpecs",
      input: {
        draftId: decodeURIComponent(workspaceComponentDraftSpecsMatch[2]),
        specsText: body.specsText || "",
        specsSourcePath: body.specsSourcePath || "",
        baseComponentId: body.baseComponentId || "",
        markReviewable: Boolean(body.markReviewable)
      },
      mode: "confirmed",
      userMessage: "apply workspace descriptor draft specs"
    });
    return;
  }

  const workspaceComponentPromoteDraftMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/promote-draft$/);
  if (request.method === "POST" && workspaceComponentPromoteDraftMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentPromoteDraftMatch[1],
      toolName: "promoteComponentDescriptorDraft",
      input: {
        descriptor: body.descriptor || null,
        descriptorJson: body.descriptorJson || "",
        expectedId: body.expectedId || "",
        sourcesText: body.sourcesText || "",
        replaceExisting: Boolean(body.replaceExisting)
      },
      mode: "confirmed",
      userMessage: "promote descriptor draft"
    });
    return;
  }

  const workspaceComponentRetireMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/([^/]+)\/retire$/);
  if (request.method === "POST" && workspaceComponentRetireMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentRetireMatch[1],
      toolName: "retirePromotedComponentDescriptor",
      input: {
        componentId: decodeURIComponent(workspaceComponentRetireMatch[2]),
        reason: body.reason || "",
        clearPreference: body.clearPreference !== false
      },
      mode: "confirmed",
      userMessage: body.reason || "retire promoted descriptor"
    });
    return;
  }

  const workspaceComponentSelectMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/([^/]+)\/select$/);
  if (request.method === "POST" && workspaceComponentSelectMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentSelectMatch[1],
      toolName: "selectComponentDescriptor",
      input: {
        componentId: decodeURIComponent(workspaceComponentSelectMatch[2]),
        quantity: body.quantity || 1,
        message: body.message || ""
      },
      mode: "confirmed",
      userMessage: body.message || "select component descriptor"
    });
    return;
  }

  const workspaceComponentPackageMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/components\/([^/]+)\/package$/);
  if (request.method === "POST" && workspaceComponentPackageMatch) {
    await sendToolActionJson(response, {
      workspaceId: workspaceComponentPackageMatch[1],
      toolName: "inspectComponentPackage",
      input: {
        componentId: decodeURIComponent(workspaceComponentPackageMatch[2])
      }
    });
    return;
  }

  const workspaceProposalMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/proposals$/);
  if (request.method === "POST" && workspaceProposalMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceProposalMatch[1],
      toolName: Array.isArray(body.patches) ? "stageDesignPatch" : "proposeDesignChange",
      input: Array.isArray(body.patches)
        ? {
        patches: body.patches,
        summary: body.summary || ""
      }
        : {
        message: body.message || ""
      },
      userMessage: body.message || body.summary || "stage or propose workspace change"
    });
    return;
  }

  const workspaceProposalCommitMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/proposals\/([^/]+)\/commit$/);
  if (request.method === "POST" && workspaceProposalCommitMatch) {
    await sendToolActionJson(response, {
      workspaceId: workspaceProposalCommitMatch[1],
      toolName: "commitStagedChange",
      input: {
        proposalId: workspaceProposalCommitMatch[2]
      },
      mode: "confirmed",
      userMessage: "confirm commit staged change"
    });
    return;
  }

  const workspaceProposalRejectMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/proposals\/([^/]+)\/reject$/);
  if (request.method === "POST" && workspaceProposalRejectMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceProposalRejectMatch[1],
      toolName: "rejectStagedChange",
      input: {
        proposalId: workspaceProposalRejectMatch[2],
        reason: body.reason || ""
      },
      userMessage: body.reason || "reject staged change"
    });
    return;
  }

  const workspacePatchApplyMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/patches\/apply$/);
  if (request.method === "POST" && workspacePatchApplyMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspacePatchApplyMatch[1],
      toolName: "applyDesignPatch",
      input: {
        message: body.message || "",
        patches: body.patches || []
      },
      mode: "confirmed",
      userMessage: body.message || "apply design patch"
    });
    return;
  }

  const workspaceRegenerateMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/revisions\/regenerate$/);
  if (request.method === "POST" && workspaceRegenerateMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceRegenerateMatch[1],
      toolName: "regenerateRevision",
      input: {
        revisionId: body.revisionId || "",
        reason: body.reason || "manual_regeneration"
      },
      mode: "confirmed",
      userMessage: body.reason || "generate model artifacts"
    });
    return;
  }

  const workspaceRevisionRevertMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/revisions\/([^/]+)\/revert$/);
  if (request.method === "POST" && workspaceRevisionRevertMatch) {
    await sendToolActionJson(response, {
      workspaceId: workspaceRevisionRevertMatch[1],
      toolName: "revertRevision",
      input: {
        revisionId: workspaceRevisionRevertMatch[2]
      },
      mode: "confirmed",
      userMessage: "revert revision"
    });
    return;
  }

  const workspaceValidateMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)\/validate$/);
  if (request.method === "POST" && workspaceValidateMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: workspaceValidateMatch[1],
      toolName: "validateDesign",
      input: {
        proposalId: body.proposalId || "",
        patches: Array.isArray(body.patches) ? body.patches : null,
        mode: body.mode || "current_or_proposal"
      },
      userMessage: "validate design"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/plans/stream") {
    const body = await readJsonBody(request);
    const runtime = runtimeForRequest(body);
    await sendPlanCreateStream(request, response, {
      message: body.message,
      initialMessage: body.initialMessage,
      assets: body.assets || [],
      language: body.language,
      runtime
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/plans") {
    const body = await readJsonBody(request);
    const runtime = runtimeForRequest(body);
    const result = await createProductPlanForRuntime({
      message: body.message,
      initialMessage: body.initialMessage,
      assets: body.assets || [],
      language: body.language,
      runtime
    });
    if (result?.ok === false) {
      sendActionJson(response, result);
      return;
    }
    sendJson(response, 200, result);
    return;
  }

  const planTurnMatch = url.pathname.match(/^\/api\/plans\/([^/]+)\/turns$/);
  if (request.method === "POST" && planTurnMatch) {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/plans/:planId/turns");
      return;
    }
    sendJson(response, 200, addProductPlanTurn({
      planId: planTurnMatch[1],
      message: body.message,
      assetIds: body.assetIds || [],
      assets: body.assets || [],
      overrides: body.overrides || {}
    }));
    return;
  }

  const planRevertMatch = url.pathname.match(/^\/api\/plans\/([^/]+)\/revert$/);
  if (request.method === "POST" && planRevertMatch) {
    const body = await readJsonBody(request);
    await sendToolActionJson(response, {
      workspaceId: planRevertMatch[1],
      toolName: "revertRevision",
      input: {
        revisionId: body.revisionId
      },
      mode: "confirmed",
      userMessage: "revert revision"
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/assets/register") {
    const body = await readJsonBody(request);
    sendJson(response, 200, {
      asset: registerAsset(body)
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/jobs") {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/jobs");
      return;
    }
    sendJson(response, 200, {
      job: createGenerationJob({
        planId: body.planId,
        revisionId: body.revisionId,
        capability: body.capability,
        provider: body.provider,
        input: body.input || {}
      })
    });
    return;
  }

  const jobMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);
  if (request.method === "GET" && jobMatch) {
    const job = getGenerationJob(jobMatch[1]);
    sendJson(response, job ? 200 : 404, job ? { job } : {
      error: {
        code: "not_found",
        message: `Unknown job ${jobMatch[1]}`
      }
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/model/generate") {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/model/generate");
      return;
    }
    const job = createGenerationJob({
      planId: body.planId,
      revisionId: body.revisionId,
      capability: "model_generation",
      input: {
        spec: body.spec,
        modules: body.modules || [],
        riskReport: body.riskReport || {},
        generateArtifacts: body.generateArtifacts !== false
      }
    });
    sendJson(response, 200, {
      job,
      modelPreview: job.output?.modelPreview,
      geometrySpec: job.output?.geometrySpec,
      modelArtifacts: job.output?.modelArtifacts,
      geometryValidation: job.output?.geometryValidation
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/geometry/generate") {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/geometry/generate");
      return;
    }
    const job = createGenerationJob({
      planId: body.planId,
      revisionId: body.revisionId,
      capability: "model_generation",
      input: {
        spec: body.spec,
        modules: body.modules || [],
        riskReport: body.riskReport || {},
        generateArtifacts: body.generateArtifacts !== false
      }
    });
    sendJson(response, 200, {
      job,
      geometrySpec: job.output?.geometrySpec,
      modelArtifacts: job.output?.modelArtifacts,
      geometryValidation: job.output?.geometryValidation
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/layout/electronics") {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/layout/electronics");
      return;
    }
    const job = createGenerationJob({
      planId: body.planId,
      revisionId: body.revisionId,
      capability: "electronics_layout",
      input: {
        spec: body.spec,
        modules: body.modules || [],
        modelJob: body.modelJob,
        modelPreview: body.modelPreview
      }
    });
    sendJson(response, 200, {
      job,
      electronicsLayout: job.output?.electronicsLayout
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/quote/estimate") {
    const body = await readJsonBody(request);
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/quote/estimate");
      return;
    }
    const job = createGenerationJob({
      planId: body.planId,
      revisionId: body.revisionId,
      capability: "quote_estimate",
      input: {
        draft: body.draft,
        spec: body.spec,
        modules: body.modules || [],
        riskReport: body.riskReport,
        quote: body.quote
      }
    });
    sendJson(response, 200, {
      job,
      quoteEstimate: job.output?.quoteEstimate
    });
    return;
  }

  if (request.method === "POST" && ["/api/pipeline/draft", "/api/spec/generate"].includes(url.pathname)) {
    const body = await readJsonBody(request);
    sendJson(response, 200, createDraft({
      requestText: body.request || body.requestText || "",
      overrides: body.overrides || {}
    }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/device-config/generate") {
    const body = await readJsonBody(request);
    sendJson(response, 200, createDeviceConfig({
      spec: body.spec,
      behaviorText: body.behaviorText || ""
    }));
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/review/submit") {
    const body = await readJsonBody(request);
    if (body.planId) {
      await sendToolActionJson(response, {
        workspaceId: body.planId,
        toolName: "submitReviewPacket",
        input: {
          revisionId: body.revisionId || "",
          contactInfo: body.contactInfo || {}
        },
        mode: "confirmed",
        userMessage: "submit review packet"
      });
      return;
    }
    if (!internalRouteAllowed(request, body)) {
      sendInternalOnlyJson(response, "/api/review/submit without planId");
      return;
    }
    sendJson(response, 200, await submitReview({
      draft: body.draft,
      behaviorConfig: body.behaviorConfig
    }));
    return;
  }

  sendJson(response, 404, {
    error: {
      code: "not_found",
      message: `No route for ${request.method} ${url.pathname}`
    }
  });
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedPath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = join(rootDir, normalizedPath);

  if (!absolutePath.startsWith(rootDir)) {
    sendJson(response, 403, {
      error: {
        code: "forbidden",
        message: "Path escapes project root"
      }
    });
    return;
  }

  try {
    const content = await readFile(absolutePath);
    const contentType = mimeTypes[extname(absolutePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store"
    });
    response.end(content);
  } catch {
    sendJson(response, 404, {
      error: {
        code: "asset_not_found",
        message: `Missing asset ${pathname}`
      }
    });
  }
}

async function serveThreeVendor(response, pathname) {
  const requested = pathname.replace(/^\/vendor\/three\//, "");
  const relativePath = requested.startsWith("addons/")
    ? requested.replace(/^addons\//, "examples/jsm/")
    : `build/${requested}`;
  const normalizedPath = normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = join(threeDir, normalizedPath);

  if (!absolutePath.startsWith(threeDir)) {
    sendJson(response, 403, {
      error: {
        code: "forbidden",
        message: "Path escapes Three vendor root"
      }
    });
    return;
  }

  try {
    const content = await readFile(absolutePath);
    const contentType = mimeTypes[extname(absolutePath)] || "application/octet-stream";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store"
    });
    response.end(content);
  } catch {
    sendJson(response, 404, {
      error: {
        code: "asset_not_found",
        message: `Missing vendor asset ${pathname}`
      }
    });
  }
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

function runtimeForRequest(body = {}) {
  const explicitRuntime = body.runtime || body.runtimeProvider || "";
  const explicitModel = body.modelProvider || "";
  return resolveChatRuntime({
    runtimeProvider: explicitRuntime || (explicitModel ? "" : defaultChatRuntimeProvider),
    modelProvider: explicitModel || defaultChatModelProvider
  });
}

async function sendChatTurnStream(request, response, options = {}) {
  const abortController = streamAbortController(request, response);
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });
  writeSse(response, "trace", {
    type: "stream_started",
    at: new Date().toISOString(),
    workspaceId: options.workspaceId || "",
    sessionId: options.sessionId || "session_default",
    runtimeProvider: options.runtimeProvider || "",
    modelProvider: options.modelProvider || ""
  });
  try {
    const result = await runForgeChatTurn({
      ...options,
      abortSignal: abortController.signal,
      onTraceEvent: (event) => writeSse(response, "trace", event)
    });
    writeSse(response, result?.ok ? "final" : "error", result);
  } catch (error) {
    writeSse(response, "error", {
      ok: false,
      error: {
        code: "CHAT_STREAM_FAILED",
        message: error instanceof Error ? error.message : "Chat stream failed."
      }
    });
  } finally {
    if (!response.writableEnded && !response.destroyed) response.end();
  }
}

async function sendProductConversationStream(request, response, options = {}) {
  const abortController = streamAbortController(request, response);
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });
  writeSse(response, "trace", {
    type: "stream_started",
    at: new Date().toISOString(),
    workspaceId: options.workspaceId || "",
    sessionId: options.sessionId || "session_default",
    runtimeProvider: options.runtimeProvider || "",
    modelProvider: options.modelProvider || "",
    conversationOnly: true
  });
  try {
    const result = await runProductConversationTurn({
      ...options,
      abortSignal: abortController.signal,
      onTraceEvent: (event) => writeSse(response, "trace", event)
    });
    writeSse(response, result?.ok ? "final" : "error", result);
  } catch (error) {
    writeSse(response, "error", {
      ok: false,
      error: {
        code: "CONVERSATION_STREAM_FAILED",
        message: error instanceof Error ? error.message : "Conversation stream failed."
      }
    });
  } finally {
    if (!response.writableEnded && !response.destroyed) response.end();
  }
}

async function sendPlanCreateStream(request, response, options = {}) {
  const abortController = streamAbortController(request, response);
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });
  writeSse(response, "trace", {
    type: "stream_started",
    at: new Date().toISOString(),
    runtimeProvider: options.runtime?.runtimeProvider || "",
    modelProvider: options.runtime?.modelProvider || ""
  });
  try {
    const result = await createProductPlanForRuntime({
      ...options,
      abortSignal: abortController.signal,
      onTraceEvent: (event) => writeSse(response, "trace", event)
    });
    writeSse(response, result?.ok === false ? "error" : "final", result);
  } catch (error) {
    writeSse(response, "error", {
      ok: false,
      error: {
        code: "PLAN_STREAM_FAILED",
        message: error instanceof Error ? error.message : "Plan stream failed."
      }
    });
  } finally {
    if (!response.writableEnded && !response.destroyed) response.end();
  }
}

function writeSse(response, event, data = {}) {
  if (response.writableEnded || response.destroyed) return;
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function streamAbortController(request, response) {
  const controller = new AbortController();
  const abort = () => {
    if (!response.writableEnded) controller.abort();
  };
  request.on("aborted", abort);
  response.on("close", abort);
  return controller;
}

async function sendToolActionJson(response, {
  workspaceId = "",
  toolName = "",
  input = {},
  userMessage = "",
  mode = "normal"
} = {}) {
  const execution = await executeForgeToolWithPolicy({
    workspaceId,
    toolCall: {
      name: toolName,
      input: {
        workspaceId,
        ...(input || {})
      }
    },
    userMessage,
    mode,
    confirmation: mode === "confirmed" ? { approved: true } : null
  });
  sendActionJson(response, execution.result || {
    ok: false,
    error: {
      code: "TOOL_EXECUTION_FAILED",
      message: "Forge tool execution did not return a result."
    }
  });
}

function internalRouteAllowed(request, body = {}) {
  return process.env.FORGE_ENABLE_INTERNAL_API_MUTATIONS === "1"
    || body.internal === true
    || request.headers["x-forge-internal"] === "true";
}

function sendInternalOnlyJson(response, route) {
  sendJson(response, 403, {
    ok: false,
    error: {
      code: "INTERNAL_ROUTE_ONLY",
      message: `${route} is an internal/test-only mutation route. Use Forge workspace tools or set x-forge-internal=true in a trusted test harness.`
    }
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendActionJson(response, result) {
  const status = result?.ok
    ? 200
    : result?.error?.statusCode === 404 || result?.error?.code?.startsWith("UNKNOWN_") || result?.error?.code === "NOT_FOUND"
      ? 404
      : 400;
  sendJson(response, status, result);
}

server.listen(port, host, () => {
  console.log(`Forge running at http://${host}:${port}`);
});
