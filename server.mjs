import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { API_CONTRACT, CONTRACT_VERSION, WORKBENCH_CHAIN } from "./src/contracts/workbench_contract.mjs";
import { createLogger, durationMs } from "./src/core/observability.mjs";
import { registerAsset } from "./src/core/assets.mjs";
import { createGenerationJob, getGenerationJob } from "./src/core/jobs.mjs";
import { createDraft, createDeviceConfig, listCatalogModules, submitReview } from "./src/core/pipeline.mjs";
import { addProductPlanTurn, createProductPlan, getProductPlan, submitProductPlanReview } from "./src/core/product_plan.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const threeDir = fileURLToPath(new URL("./node_modules/three/", import.meta.url));
const port = Number(process.env.PORT || 8765);
const host = process.env.HOST || "127.0.0.1";
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

  if (request.method === "POST" && url.pathname === "/api/plans") {
    const body = await readJsonBody(request);
    sendJson(response, 200, createProductPlan({
      message: body.message,
      initialMessage: body.initialMessage,
      assets: body.assets || [],
      language: body.language
    }));
    return;
  }

  const planTurnMatch = url.pathname.match(/^\/api\/plans\/([^/]+)\/turns$/);
  if (request.method === "POST" && planTurnMatch) {
    const body = await readJsonBody(request);
    sendJson(response, 200, addProductPlanTurn({
      planId: planTurnMatch[1],
      message: body.message,
      assetIds: body.assetIds || [],
      assets: body.assets || [],
      overrides: body.overrides || {}
    }));
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
      const plan = getProductPlan(body.planId);
      if (!plan) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message: `Unknown ProductPlan ${body.planId}`
          }
        });
        return;
      }
      sendJson(response, 200, await submitProductPlanReview({
        planId: body.planId,
        revisionId: body.revisionId,
        contactInfo: body.contactInfo || {}
      }));
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

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

server.listen(port, host, () => {
  console.log(`Forge running at http://${host}:${port}`);
});
