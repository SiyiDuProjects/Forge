export const CONTRACT_VERSION = "2026-06-04";

export const WORKBENCH_CHAIN = [
  "parse_request",
  "build_scope",
  "match_bom",
  "run_guardrails",
  "estimate_quote",
  "build_geometry_spec",
  "draft_model_preview",
  "generate_model_artifacts",
  "validate_geometry",
  "draft_electronics_layout",
  "draft_firmware",
  "draft_dfm_packet"
];

export const RISK_STATUS = {
  READY: "ready_for_engineer_review",
  BLOCKED: "blocked_until_scope_change"
};

export const PRODUCT_PLAN_STATUS = {
  STANDARD_SUPPORTED: "standard_supported",
  MANUAL_EXPANSION_DRAFT: "manual_expansion_draft",
  SUBMITTED_FOR_REVIEW: "submitted_for_review"
};

export const JOB_CAPABILITY = {
  MODEL_GENERATION: "model_generation",
  ELECTRONICS_LAYOUT: "electronics_layout",
  QUOTE_ESTIMATE: "quote_estimate",
  REVIEW_PACKET: "review_packet",
  AI_CHAT_RESERVED: "ai_chat_reserved"
};

export const JOB_PROVIDER = {
  INTERNAL_RULES: "internal_rules",
  PROVIDER_ADAPTER: "provider_adapter",
  MANUAL_PLACEHOLDER: "manual_placeholder"
};

export const JOB_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  NEEDS_INPUT: "needs_input",
  CANCELLED: "cancelled"
};

export const ASSET_TYPES = [
  "text",
  "image",
  "reference_url",
  "geometry_spec",
  "model_preview",
  "glb",
  "stl",
  "step",
  "cad_placeholder",
  "cadquery_script",
  "validation_report",
  "render"
];

export const ASSET_SOURCES = ["user", "generated", "provider"];

export const REVIEW_STATUS = {
  QUEUED: "queued_for_human_review"
};

export const SUPPORTED_LANGUAGES = ["zh", "en"];

export const API_CONTRACT = [
  {
    method: "GET",
    path: "/api/health",
    response: ["ok", "service", "contractVersion", "chain"]
  },
  {
    method: "GET",
    path: "/api/modules",
    response: ["modules"]
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/summary",
    response: ["ok", "workspaceId", "currentRevisionId", "requirements", "artifactStatus", "directEditingAllowed"]
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/artifacts/:revisionId",
    response: ["ok", "revisionId", "artifacts", "artifactPaths", "directEditingAllowed"]
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/context-pack",
    response: ["ok", "workspaceId", "projectSummary", "currentProductPlanSummary", "currentRevisionSummary", "allowedTools", "artifactSummary"]
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/tools",
    response: ["ok", "workspaceId", "tools"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/chat/turn",
    body: ["sessionId", "userMessage", "runtime", "modelProvider", "runtimeProvider", "mode", "confirmation"],
    response: ["ok", "runtimeProvider", "modelProvider", "assistantMessage", "messages", "toolCalls", "toolResults", "proposal", "revision", "pendingConfirmation", "productPlan", "codexThreadId"]
  },
  {
    method: "GET",
    path: "/api/workspaces/:workspaceId/chat/:sessionId",
    response: ["ok", "workspaceId", "sessionId", "entries", "messages"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/chat/confirm",
    body: ["sessionId", "confirmationId", "approved"],
    response: ["ok", "assistantMessage", "toolCalls", "toolResults", "revision", "pendingConfirmation", "productPlan"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/components/search",
    body: ["query", "componentType", "limit"],
    response: ["ok", "results"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/proposals",
    body: ["message", "patches", "summary"],
    response: ["ok", "proposalId", "status", "patches", "validationPreview"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/proposals/:proposalId/commit",
    response: ["ok", "committed", "newRevisionId", "diff", "validationReport", "artifactPaths"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/proposals/:proposalId/reject",
    body: ["reason"],
    response: ["ok", "rejected", "proposalId", "status"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/patches/apply",
    body: ["message", "patches"],
    response: ["ok", "applied", "newRevisionId", "diff", "validationReport", "artifactPaths"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/revisions/regenerate",
    body: ["revisionId", "reason"],
    response: ["ok", "regenerated", "revisionId", "sourceRevisionId", "artifactPaths", "validationReport"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/revisions/:revisionId/revert",
    response: ["ok", "reverted", "currentRevisionId", "artifactPaths"]
  },
  {
    method: "POST",
    path: "/api/workspaces/:workspaceId/validate",
    body: ["proposalId", "patches", "mode"],
    response: ["ok", "status", "errors", "warnings", "blocked", "geometryValidation"]
  },
  {
    method: "POST",
    path: "/api/plans",
    body: ["message", "initialMessage", "assets", "language", "runtime", "modelProvider", "runtimeProvider"],
    response: ["productPlan", "revision", "runtimeProvider", "modelProvider", "codexThreadId"]
  },
  {
    method: "POST",
    path: "/api/plans/:planId/turns",
    body: ["message", "assetIds", "assets", "overrides"],
    response: ["productPlan", "revision", "assistantMessage"]
  },
  {
    method: "POST",
    path: "/api/plans/:planId/revert",
    body: ["revisionId"],
    response: ["productPlan", "revision"]
  },
  {
    method: "POST",
    path: "/api/assets/register",
    body: ["type", "source", "url", "localPath", "caption", "linkedJobId"],
    response: ["asset"]
  },
  {
    method: "POST",
    path: "/api/jobs",
    body: ["planId", "revisionId", "capability", "provider", "input"],
    response: ["job"]
  },
  {
    method: "GET",
    path: "/api/jobs/:jobId",
    response: ["job"]
  },
  {
    method: "POST",
    path: "/api/model/generate",
    body: ["planId", "revisionId", "spec", "modules", "riskReport", "generateArtifacts"],
    response: ["job", "modelPreview", "geometrySpec", "modelArtifacts", "geometryValidation"]
  },
  {
    method: "POST",
    path: "/api/geometry/generate",
    body: ["planId", "revisionId", "spec", "modules", "riskReport", "generateArtifacts"],
    response: ["job", "geometrySpec", "modelArtifacts", "geometryValidation"]
  },
  {
    method: "POST",
    path: "/api/layout/electronics",
    body: ["planId", "revisionId", "spec", "modules", "modelJob"],
    response: ["job", "electronicsLayout"]
  },
  {
    method: "POST",
    path: "/api/quote/estimate",
    body: ["planId", "revisionId", "draft", "spec", "modules", "riskReport", "quote"],
    response: ["job", "quoteEstimate"]
  },
  {
    method: "POST",
    path: "/api/pipeline/draft",
    body: ["request", "requestText", "overrides"],
    response: ["requestText", "interpreted", "modules", "riskReport", "quote", "spec"]
  },
  {
    method: "POST",
    path: "/api/device-config/generate",
    body: ["spec", "behaviorText"],
    response: ["config"]
  },
  {
    method: "POST",
    path: "/api/review/submit",
    body: ["draft", "behaviorConfig", "planId", "revisionId", "contactInfo"],
    response: ["accepted", "reviewId", "status", "manufacturingPacket", "productPlan", "submission"]
  }
];

export function assertSupportedLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new RangeError(`Unsupported language: ${language}`);
  }
  return language;
}
