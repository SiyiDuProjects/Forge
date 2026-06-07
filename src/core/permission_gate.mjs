import { getToolMetadata } from "./tool_registry.mjs";

const UNSUPPORTED_MUTATION_PATTERNS = [
  /\bdrone\b/i,
  /\bfly\b/i,
  /\bflying\b/i,
  /\bquadcopter\b/i,
  /\bmains\b/i,
  /\b120v\b/i,
  /\b220v\b/i,
  /\bac\s+power\b/i,
  /无人机/,
  /飞行/,
  /会飞/,
  /市电/,
  /交流电/
];

const QUESTION_PATTERNS = [
  /\?/,
  /^what if\b/i,
  /^would\b/i,
  /^should\b/i,
  /^could\b/i,
  /^can we\b/i,
  /\bmaybe\b/i,
  /\btoo childish\b/i,
  /会不会/,
  /是否/,
  /能不能/,
  /要不要/,
  /可以吗/,
  /怎么样/,
  /吗[？?]?$/,
  /么[？?]?$/
];

const MUTATION_INTENT_PATTERNS = [
  /\badd\b/i,
  /\bmove\b/i,
  /\bmake\b/i,
  /\bchange\b/i,
  /\bfill\b/i,
  /\bpatch\b/i,
  /\bturn\b/i,
  /\buse\b/i,
  /\bapply\b/i,
  /\bcommit\b/i,
  /\bconfirm\b/i,
  /\bpromote\b/i,
  /\bimport\b/i,
  /\byes\b/i,
  /\brevert\b/i,
  /\bregenerate\b/i,
  /\bgenerate\b/i,
  /添加/,
  /加/,
  /填/,
  /填充/,
  /写入/,
  /放到/,
  /移动/,
  /移到/,
  /改/,
  /做成/,
  /用/,
  /确认/,
  /执行/,
  /提交/,
  /提升/,
  /导入/,
  /加入/,
  /放进/,
  /切回/,
  /回退/,
  /生成/
];

const CONFIRMATION_INTENT_PATTERNS = [
  /\byes\b/i,
  /\buse it\b/i,
  /\buse that\b/i,
  /\bapply it\b/i,
  /\bapply that\b/i,
  /\bcommit\b/i,
  /\bconfirm\b/i,
  /\bgo ahead\b/i,
  /可以/,
  /就用/,
  /确认/,
  /执行/,
  /提交/,
  /应用/,
  /采纳/
];

const RAW_MUTATION_KEYS = new Set([
  "geometrySpec",
  "rawGeometrySpec",
  "rawMesh",
  "meshVertices",
  "vertices",
  "filePath",
  "localPath",
  "targetPath",
  "relativePath",
  "outputPath",
  "artifactPath",
  "artifactBytes",
  "glbBytes",
  "stlBytes",
  "stepBytes"
]);

const RAW_MUTATION_TEXT_EXEMPT_KEYS = new Set([
  "message",
  "summary",
  "assistantMessage",
  "reason",
  "userMessage"
]);

const RAW_MUTATION_STRING_PATTERNS = [
  /model\.glb/i,
  /model\.stl/i,
  /model\.step/i,
  /shell_front\.stl/i,
  /shell_back\.stl/i,
  /geometry-spec\.json/i,
  /\.glb\b/i,
  /\.stl\b/i,
  /\.step\b/i,
  /raw\s+mesh/i,
  /mesh\s+vertex/i
];

export function checkToolPermission({
  toolName,
  toolInput = {},
  toolMetadata = getToolMetadata(toolName),
  userMessage = "",
  mode = "normal",
  confirmation = null
} = {}) {
  if (!toolMetadata) {
    return deny("UNKNOWN_TOOL", `Unknown Forge tool: ${toolName}`);
  }

  const mutatesWorkspace = toolMetadata.behavior?.readOnly !== true;

  if (mutatesWorkspace && containsRawMutationTarget(toolInput)) {
    return deny("RAW_MUTATION_TARGET", "Forge tools cannot directly mutate GeometrySpec, mesh files, artifact files, or arbitrary project paths.");
  }

  if (mutatesWorkspace && UNSUPPORTED_MUTATION_PATTERNS.some((pattern) => pattern.test(String(userMessage || "")))) {
    return deny("OUT_OF_SCOPE_MUTATION", "This request is outside Forge's standard 3D printed desktop prototype path.");
  }

  if (mode === "confirmed" || confirmation?.approved === true) {
    return allow("Approved confirmation.");
  }

  if (!toolMetadata.permission?.requiresConfirmation) {
    return allow(toolMetadata.permission?.reason || "Tool does not require confirmation.");
  }

  if (toolName === "commitStagedChange" && hasConfirmationIntent(userMessage)) {
    return allow("User explicitly confirmed committing the staged change.");
  }

  if (["applyDesignPatch", "applyWorkspaceDescriptorDraftSpecs", "promoteWorkspaceComponentDescriptorDraft", "selectComponentDescriptor", "revertRevision", "regenerateRevision", "submitReviewPacket"].includes(toolName) && hasExplicitMutationIntent(userMessage)) {
    return allow("User explicitly requested this workspace mutation.");
  }

  return confirm(toolMetadata.permission?.reason || "This tool changes the active Forge workspace.");
}

export function hasExplicitMutationIntent(message = "") {
  const text = String(message || "").trim();
  if (!text) return false;
  if (QUESTION_PATTERNS.some((pattern) => pattern.test(text))) return false;
  return MUTATION_INTENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasConfirmationIntent(message = "") {
  const text = String(message || "").trim();
  if (!text) return false;
  if (QUESTION_PATTERNS.some((pattern) => pattern.test(text)) && !/\byes\b/i.test(text)) return false;
  return CONFIRMATION_INTENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function containsRawMutationTarget(value) {
  const stack = [{ key: "", value }];
  while (stack.length) {
    const { key, value: current } = stack.pop();
    if (!current) continue;
    if (typeof current === "string") {
      if (!RAW_MUTATION_TEXT_EXEMPT_KEYS.has(key) && RAW_MUTATION_STRING_PATTERNS.some((pattern) => pattern.test(current))) return true;
      continue;
    }
    if (Array.isArray(current)) {
      stack.push(...current.map((item) => ({ key, value: item })));
      continue;
    }
    if (typeof current === "object") {
      for (const [key, nested] of Object.entries(current)) {
        if (RAW_MUTATION_KEYS.has(key)) return true;
        stack.push({ key, value: nested });
      }
    }
  }
  return false;
}

function allow(reason) {
  return { decision: "allow", allowed: true, requiresConfirmation: false, reason };
}

function confirm(reason) {
  return { decision: "confirm", allowed: false, requiresConfirmation: true, reason };
}

function deny(code, reason) {
  return {
    decision: "deny",
    allowed: false,
    requiresConfirmation: false,
    reason,
    error: { code, message: reason }
  };
}
