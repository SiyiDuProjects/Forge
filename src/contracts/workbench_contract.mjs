export const CONTRACT_VERSION = "2026-06-03";

export const WORKBENCH_CHAIN = [
  "parse_request",
  "build_scope",
  "match_bom",
  "run_guardrails",
  "estimate_quote",
  "draft_firmware",
  "draft_dfm_packet"
];

export const RISK_STATUS = {
  READY: "ready_for_engineer_review",
  BLOCKED: "blocked_until_scope_change"
};

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
    body: ["draft", "behaviorConfig"],
    response: ["accepted", "reviewId", "status", "manufacturingPacket"]
  }
];

export function assertSupportedLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new RangeError(`Unsupported language: ${language}`);
  }
  return language;
}
