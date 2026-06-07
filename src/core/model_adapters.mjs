import { makeId } from "./utils.mjs";
import {
  buildCodexProductPrompt,
  ensureCodexProjectThread,
  parseCodexToolIntent,
  runCodexProductTurn
} from "./codex_runtime.mjs";
import { projectWorkspacePath } from "./project_workspace.mjs";
import { hydrateProductPlanFromWorkspace } from "./product_plan.mjs";

export function createModelAdapter({
  provider = process.env.FORGE_MODEL_PROVIDER || "mock",
  workspaceId = "",
  rootDir = undefined,
  codexFactory = null
} = {}) {
  const normalizedProvider = normalizeAdapterProvider(provider);
  if (normalizedProvider === "codex") {
    return new CodexSdkRuntimeAdapter({ workspaceId, rootDir, codexFactory });
  }
  if (normalizedProvider === "openai") return new OpenAIResponsesAdapter();
  return new MockModelAdapter();
}

export class MockModelAdapter {
  async runTurn({ userMessage = "", contextPack = {}, toolResults = [] } = {}) {
    if (toolResults.length > 0) {
      return {
        ok: true,
        finalMessage: finalMessageForResults({ userMessage, toolResults }),
        toolCalls: []
      };
    }

    const text = String(userMessage || "");
    const lower = text.toLowerCase();
    if (isUnsupported(lower, text)) {
      return {
        ok: true,
        finalMessage: localized(text, "这个需求超出了 Forge 当前标准路径：V1 只支持低压 USB-C 桌面类显示/相框/传感器屏的 3D 打印原型方案。可以先把它记录成人工扩展草案，但不会直接生成标准模型或生产文件。", "That request is outside Forge's current standard path. V1 supports low-voltage USB-C desktop display/frame/sensor-display prototypes with a standardized 3D printed shell, so I will not create standard model artifacts for it."),
        toolCalls: []
      };
    }

    if (mentionsArtifacts(lower, text)) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("getRevisionArtifacts", {
          workspaceId: contextPack.workspaceId || "",
          revisionId: contextPack.projectSummary?.currentRevisionId || ""
        })]
      };
    }

    const revertRevisionId = parseRevertRevisionId(text);
    if (revertRevisionId) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("revertRevision", {
          workspaceId: contextPack.workspaceId || "",
          revisionId: revertRevisionId
        })]
      };
    }

    const draftSpecPatch = parseWorkspaceDraftSpecPatch(text);
    if (draftSpecPatch) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("applyWorkspaceDescriptorDraftSpecs", {
          workspaceId: contextPack.workspaceId || "",
          draftId: draftSpecPatch.draftId,
          specsText: draftSpecPatch.specsText,
          baseComponentId: draftSpecPatch.baseComponentId,
          markReviewable: draftSpecPatch.markReviewable
        })]
      };
    }

    const promotionDraftId = parseWorkspaceDraftPromotionId(text);
    if (promotionDraftId) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("promoteWorkspaceComponentDescriptorDraft", {
          workspaceId: contextPack.workspaceId || "",
          draftId: promotionDraftId,
          replaceExisting: parseDraftReplaceIntent(text)
        })]
      };
    }

    const inspectionDraftId = parseWorkspaceDraftInspectionId(text);
    if (inspectionDraftId) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("inspectWorkspaceComponentDescriptorDrafts", {
          workspaceId: contextPack.workspaceId || "",
          draftId: inspectionDraftId
        })]
      };
    }

    const selectedComponentId = parseDescriptorSelectionId(text);
    if (selectedComponentId) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("selectComponentDescriptor", {
          workspaceId: contextPack.workspaceId || "",
          componentId: selectedComponentId,
          quantity: parseSelectionQuantity(text)
        })]
      };
    }

    if (isCommitIntent(lower, text)) {
      const proposal = contextPack.openProposals?.[0];
      if (!proposal?.proposalId) {
        return {
          ok: true,
          finalMessage: localized(text, "现在没有可提交的暂存方案。请先让我提出或暂存一个结构修改。", "There is no staged proposal to commit yet. Ask me to propose or stage a design change first."),
          toolCalls: []
        };
      }
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("commitStagedChange", {
          workspaceId: contextPack.workspaceId || "",
          proposalId: proposal.proposalId
        })]
      };
    }

    if (mentionsGenerateModel(lower, text)) {
      return {
        ok: true,
        finalMessage: "",
        toolCalls: [toolCall("regenerateRevision", {
          workspaceId: contextPack.workspaceId || "",
          revisionId: contextPack.projectSummary?.currentRevisionId || "",
          reason: "user_confirmed_model_generation"
        })]
      };
    }

    if (mentionsButtons(lower, text) && isExploratory(lower, text)) {
      return propose(text, contextPack);
    }

    if (mentionsCatEars(lower, text) && isExploratory(lower, text)) {
      return propose(text, contextPack);
    }

    const directPatches = deterministicPatchesFor(text);
    if (directPatches.length > 0) {
      const toolCalls = [];
      if (mentionsButtons(lower, text)) {
        toolCalls.push(toolCall("searchComponentLibrary", {
          workspaceId: contextPack.workspaceId || "",
          query: "button",
          componentType: "button",
          limit: 5
        }));
      }
      toolCalls.push(toolCall("applyDesignPatch", {
        workspaceId: contextPack.workspaceId || "",
        message: text,
        patches: directPatches
      }));
      return { ok: true, finalMessage: "", toolCalls };
    }

    if (isExploratory(lower, text)) {
      return propose(text, contextPack);
    }

    return {
      ok: true,
      finalMessage: localized(text, "我可以围绕当前 ProductPlan 讨论方案，或把明确的结构修改转成 proposal/revision。请说明要新增、移动、生成、回退，还是先只比较方案。", "I can discuss the current ProductPlan or turn explicit structure changes into proposals/revisions. Tell me whether to add, move, generate, revert, or only compare options."),
      toolCalls: []
    };
  }
}

export class OpenAIResponsesAdapter {
  constructor({
    apiKey = process.env.OPENAI_API_KEY || "",
    model = process.env.FORGE_MODEL_NAME || process.env.OPENAI_MODEL || "gpt-5-mini",
    baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com"
  } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.responsesUrl = openAIResponsesUrl(baseUrl);
  }

  async runTurn({ prompt, tools = [], userMessage = "", signal = null } = {}) {
    if (!this.apiKey) {
      return {
        ok: false,
        error: {
          code: "OPENAI_API_KEY_MISSING",
          message: "OPENAI_API_KEY is required when modelProvider is openai."
        }
      };
    }
    let response;
    try {
      response = await fetch(this.responsesUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            {
              role: "system",
              content: prompt || ""
            },
            {
              role: "user",
              content: userMessage || ""
            }
          ],
          tools
        }),
        signal
      });
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "OPENAI_RESPONSE_FAILED",
          message: `OpenAI Responses API request failed: ${error instanceof Error ? error.message : "unknown network error"}.`
        }
      };
    }
    if (!response.ok) {
      const message = await openAIErrorMessage(response);
      return {
        ok: false,
        error: {
          code: "OPENAI_RESPONSE_FAILED",
          message
        }
      };
    }
    const json = await response.json();
    return {
      ok: true,
      finalMessage: extractOpenAIText(json),
      toolCalls: extractOpenAIToolCalls(json),
      rawResponseId: json.id || ""
    };
  }
}

export class CodexSdkRuntimeAdapter {
  constructor({
    workspaceId = "",
    rootDir = undefined,
    codexFactory = null
  } = {}) {
    this.workspaceId = workspaceId;
    this.rootDir = rootDir;
    this.workspacePath = workspaceId ? projectWorkspacePath(workspaceId, { rootDir }) : "";
    this.codexFactory = codexFactory;
  }

  async runTurn({
    prompt = "",
    userMessage = "",
    toolResults = [],
    onCodexEvent = null,
    signal = null
  } = {}) {
    const thread = await ensureCodexProjectThread({
      workspaceId: this.workspaceId,
      rootDir: this.rootDir,
      workspacePath: this.workspacePath,
      codexFactory: this.codexFactory
    });
    if (!thread.ok) return thread;

    const run = await runCodexProductTurn({
      thread: thread.thread,
      workspaceId: this.workspaceId,
      rootDir: this.rootDir,
      prompt: buildCodexProductPrompt({
        forgePrompt: prompt,
        toolResults,
        userMessage
      }),
      onCodexEvent,
      signal
    });
    if (!run.ok) return run;
    hydrateProductPlanFromWorkspace({
      planId: this.workspaceId,
      rootDir: this.rootDir,
      force: true
    });
    const parsed = parseCodexToolIntent(run.text);
    const runtimeBinding = run.runtimeBinding || thread.runtimeBinding || null;
    const bindingId = run.bindingId || runtimeBinding?.bindingId || thread.bindingId || "";
    return {
      ok: true,
      finalMessage: parsed.finalMessage,
      toolCalls: parsed.toolCalls,
      rawResponseId: bindingId,
      runtimeBinding,
      bindingId,
      codexThreadCreated: Boolean(thread.created)
    };
  }
}

export class CodexModelAdapter extends CodexSdkRuntimeAdapter {}

function normalizeAdapterProvider(provider = "") {
  const value = String(provider || "").trim().toLowerCase();
  if (value === "codex") return "codex";
  if (value === "openai") return "openai";
  return "mock";
}

export function openAIResponsesUrl(baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com") {
  const normalized = String(baseUrl || "https://api.openai.com").replace(/\/+$/, "");
  return normalized.endsWith("/v1") ? `${normalized}/responses` : `${normalized}/v1/responses`;
}

async function openAIErrorMessage(response) {
  const fallback = `OpenAI Responses API returned HTTP ${response.status}.`;
  const text = await response.text().catch(() => "");
  if (!text) return fallback;
  try {
    const json = JSON.parse(text);
    const detail = json.error?.message || json.message || json.code || "";
    return detail ? `${fallback} ${detail}` : fallback;
  } catch {
    return `${fallback} ${text.slice(0, 200)}`;
  }
}

export function deterministicPatchesFor(message = "") {
  const lower = String(message || "").toLowerCase();
  const patches = [];
  const componentAdditions = [];
  const planSet = {};
  const geometrySet = {};
  const finish = parseFinishPreference(lower, message);

  if (finish) {
    planSet["constraints.finish"] = finish;
  }

  if (mentionsButtons(lower, message)) {
    componentAdditions.push({ componentType: "button", componentId: "button_6mm", quantity: 2 });
    geometrySet["placements.buttons.semanticPosition"] = "right_side";
  }
  if (mentionsUsbBackLeft(lower, message)) {
    geometrySet["placements.usb_c.semanticPosition"] = "back_left";
  }
  if (mentionsCatEars(lower, message)) {
    geometrySet["enclosure.shapeProfile"] = "cat_ear_photo_frame";
  }
  if (componentAdditions.length > 0) {
    patches.push({ type: "component_patch", add: componentAdditions });
  }
  if (Object.keys(planSet).length > 0) {
    patches.push({ type: "plan_patch", set: planSet });
  }
  if (Object.keys(geometrySet).length > 0) {
    patches.push({ type: "geometry_preference_patch", set: geometrySet });
  }
  return patches;
}

function propose(message, contextPack) {
  return {
    ok: true,
    finalMessage: "",
    toolCalls: [toolCall("proposeDesignChange", {
      workspaceId: contextPack.workspaceId || "",
      message
    })]
  };
}

function toolCall(name, input) {
  return {
    toolCallId: makeId("toolcall"),
    name,
    input
  };
}

function finalMessageForResults({ userMessage = "", toolResults = [] } = {}) {
  const summaries = toolResults.map((item) => item.summary || {}).filter(Boolean);
  const failed = toolResults.find((item) => item.result?.ok === false);
  if (failed) {
    return localized(userMessage, `我没有执行这个修改：${failed.result?.error?.message || "工具调用失败"}`, `I did not apply that change: ${failed.result?.error?.message || "the tool call failed"}`);
  }
  const committed = summaries.find((summary) => summary.committed);
  const applied = summaries.find((summary) => summary.applied);
  const specsApplied = summaries.find((summary) => summary.specsApplied);
  const selected = summaries.find((summary) => summary.selected);
  const promoted = summaries.find((summary) => summary.promoted);
  const draftInspection = summaries.find((summary) => summary.draftInspection);
  const regenerated = summaries.find((summary) => summary.regenerated);
  const reverted = summaries.find((summary) => summary.reverted);
  const proposal = summaries.find((summary) => summary.proposalId);
  const artifacts = summaries.find((summary) => Object.values(summary.artifactPaths || {}).some(Boolean));
  if (applied) {
    return localized(
      userMessage,
      `已通过 Forge action 创建新版本 ${applied.newRevisionId}；3D 模型仍需明确确认生成，未写入新的模型文件。`,
      `I created revision ${applied.newRevisionId} through Forge actions. 3D model generation still needs explicit confirmation, so no new model files were written.`
    );
  }
  if (specsApplied) {
    return localized(
      userMessage,
      `已把明确规格写入零件草稿 ${specsApplied.draftId}，抽取字段：${specsApplied.extractedFields.join(", ") || "无"}；readyForLibraryPromotion=${specsApplied.readyForLibraryPromotion ? "true" : "false"}。未修改 ProductPlan 版本，也未生成模型。`,
      `I applied explicit specs to descriptor draft ${specsApplied.draftId}. Extracted fields: ${specsApplied.extractedFields.join(", ") || "none"}; readyForLibraryPromotion=${specsApplied.readyForLibraryPromotion ? "true" : "false"}. No ProductPlan revision was created and no model files were generated.`
    );
  }
  if (selected) {
    return localized(
      userMessage,
      `已选择零件 ${selected.componentId} 并创建新版本 ${selected.newRevisionId}；3D 模型仍需明确确认生成，未写入新的模型文件。`,
      `I selected component ${selected.componentId} and created revision ${selected.newRevisionId}. 3D model generation still needs explicit confirmation, so no new model files were written.`
    );
  }
  if (promoted) {
    return localized(
      userMessage,
      `已将草稿 ${promoted.draftId} 提升为可选零件 ${promoted.componentId}；还没有选择到 ProductPlan 版本，也未生成 3D 模型。`,
      `I promoted draft ${promoted.draftId} as selectable component ${promoted.componentId}. It has not been selected into a ProductPlan revision yet, and no 3D model files were generated.`
    );
  }
  if (draftInspection) {
    return localized(
      userMessage,
      `已检查零件草稿 ${draftInspection.draftId || "requested draft"}：${draftInspection.readyForPromotionCount}/${draftInspection.draftCount} 个可提升；未修改 ProductPlan，也未生成模型。`,
      `I inspected descriptor draft ${draftInspection.draftId || "requested draft"}: ${draftInspection.readyForPromotionCount}/${draftInspection.draftCount} drafts are promotable. ProductPlan was not modified and no model files were generated.`
    );
  }
  if (committed) {
    return localized(userMessage, `已提交暂存方案，生成新版本 ${committed.newRevisionId}，相关验证和模型证据已写入项目文件夹。`, `I committed the staged proposal and created revision ${committed.newRevisionId}; validation and model evidence were written to the project folder.`);
  }
  if (regenerated) {
    return localized(userMessage, `已基于当前 ProductPlan 重新生成版本 ${regenerated.newRevisionId || regenerated.revisionId} 的模型证据。`, `I regenerated model evidence for revision ${regenerated.newRevisionId || regenerated.revisionId} from the current ProductPlan.`);
  }
  if (reverted) {
    return localized(userMessage, `已切回版本 ${reverted.newRevisionId || "selected revision"}。`, `I reverted the active workspace to ${reverted.newRevisionId || "the selected revision"}.`);
  }
  if (proposal) {
    return localized(userMessage, `我先生成了一个可确认的方案 ${proposal.proposalId}，还没有创建新版本。`, `I created proposal ${proposal.proposalId}; no new revision has been committed yet.`);
  }
  if (artifacts) {
    return localized(userMessage, "我找到了当前版本的生成证据路径；这些是派生文件，不是可直接编辑的源文件。", "I found artifact paths for the current revision. These are derived evidence files, not directly editable source files.");
  }
  return localized(userMessage, "已完成一次 Forge 工具回合。", "The Forge tool turn is complete.");
}

function mentionsButtons(lower, raw = "") {
  return lower.includes("button") || /按钮/.test(raw);
}

function mentionsUsbBackLeft(lower, raw = "") {
  return (lower.includes("usb") && lower.includes("back") && lower.includes("left"))
    || (/usb/i.test(raw) && /后/.test(raw) && /左/.test(raw));
}

function mentionsCatEars(lower, raw = "") {
  return lower.includes("cat ear") || lower.includes("cat-ear") || /猫耳/.test(raw);
}

function parseFinishPreference(lower, raw = "") {
  if (lower.includes("graphite") || lower.includes("black") || /石墨|黑|灰/.test(raw)) return "graphite";
  if (lower.includes("sage") || lower.includes("green") || /鼠尾草|绿色|绿/.test(raw)) return "sage";
  if (lower.includes("coral") || lower.includes("orange") || lower.includes("red") || /珊瑚|橙|红/.test(raw)) return "coral";
  if (lower.includes("woodgrain") || lower.includes("wood") || lower.includes("walnut") || /木纹|胡桃|木质/.test(raw)) return "woodgrain";
  return "";
}

function mentionsGenerateModel(lower, raw = "") {
  return lower.includes("generate model") || lower.includes("regenerate") || /生成模型/.test(raw);
}

function mentionsArtifacts(lower, raw = "") {
  return lower.includes("artifact") || lower.includes("files") || /文件|证据|产物/.test(raw);
}

function isExploratory(lower, raw = "") {
  return lower.includes("what if")
    || lower.startsWith("would")
    || lower.startsWith("should")
    || lower.startsWith("could")
    || lower.includes("maybe")
    || lower.includes("too childish")
    || /会不会|是否|能不能|要不要|可以吗|怎么样|吗[？?]?$/.test(raw);
}

function isCommitIntent(lower, raw = "") {
  return lower.includes("yes apply")
    || lower.includes("apply it")
    || lower.includes("apply that")
    || lower.includes("use it")
    || lower.includes("use that")
    || lower.includes("commit")
    || /确认|就用|应用|采纳|提交/.test(raw);
}

function parseRevertRevisionId(raw = "") {
  const match = String(raw).match(/\b(rev-[a-zA-Z0-9._-]+)/);
  if (match) return match[1];
  const zhMatch = String(raw).match(/切回\s*([a-zA-Z0-9._-]*rev-[a-zA-Z0-9._-]+)/);
  return zhMatch?.[1] || "";
}

function parseDescriptorSelectionId(raw = "") {
  const text = String(raw || "");
  const patterns = [
    /\b(?:use|select|choose|switch to|change to)\s+([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/i,
    /(?:选择|选用|改用|使用|用)\s*([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function parseWorkspaceDraftSpecPatch(raw = "") {
  const text = String(raw || "");
  const id = "[a-z][a-z0-9]*(?:_[a-z0-9]+)+";
  const patterns = [
    new RegExp(`\\b(?:apply|fill|patch|update)\\s+(?:specs?\\s+)?(?:to\\s+)?(?:workspace\\s+)?(?:descriptor\\s+)?draft\\s+(${id})\\b`, "i"),
    new RegExp(`\\b(?:apply|fill|patch|update)\\s+(${id})\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\s+(?:specs?|from\\s+specs?)\\b`, "i"),
    new RegExp(`(?:填充|写入|更新)\\s*(?:规格|specs?)?\\s*(?:到|进)?\\s*(?:零件|descriptor)?\\s*(?:草稿|draft)\\s*(${id})\\b`, "i")
  ];
  let draftId = "";
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      draftId = match[1];
      break;
    }
  }
  if (!draftId) return null;
  const specsText = text.includes(":")
    ? text.slice(text.indexOf(":") + 1).trim()
    : text;
  const baseMatch = text.match(/\bbase(?:ComponentId| component)?\s*[:=]?\s*([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\b/i);
  return {
    draftId,
    specsText,
    baseComponentId: baseMatch?.[1] || "",
    markReviewable: /\breviewable\b/i.test(text) || /可审核|可提升|已审核|reviewed/i.test(text)
  };
}

function parseWorkspaceDraftInspectionId(raw = "") {
  const text = String(raw || "");
  const id = "[a-z][a-z0-9]*(?:_[a-z0-9]+)+";
  const patterns = [
    new RegExp(`\\b(?:inspect|check|scan|review)\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\s+(${id})\\b`, "i"),
    new RegExp(`\\b(?:inspect|check|scan|review)\\s+(${id})\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\b`, "i"),
    new RegExp(`(?:检查|扫描|查看|审核)\\s*(?:零件|descriptor)?\\s*(?:草稿|draft)\\s*(${id})\\b`, "i"),
    new RegExp(`(${id})\\s*(?:零件)?(?:草稿|draft)\\s*(?:检查|扫描|查看|审核)`, "i")
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function parseWorkspaceDraftPromotionId(raw = "") {
  const text = String(raw || "");
  const id = "[a-z][a-z0-9]*(?:_[a-z0-9]+)+";
  const patterns = [
    new RegExp(`\\b(?:promote|import)\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\s+(${id})\\b`, "i"),
    new RegExp(`\\b(?:promote|import)\\s+(${id})\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\b`, "i"),
    new RegExp(`\\badd\\s+(?:workspace\\s+)?(?:descriptor\\s+)?draft\\s+(${id})\\s+to\\s+(?:the\\s+)?(?:component\\s+)?library\\b`, "i"),
    new RegExp(`(?:提升|导入|加入(?:零件库)?|放进(?:零件库)?)\\s*(?:零件|descriptor)?\\s*(?:草稿|draft)?\\s*(${id})\\b`, "i"),
    new RegExp(`(${id})\\s*(?:零件)?(?:草稿|draft)\\s*(?:提升|导入|加入|放进)`, "i")
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

function parseDraftReplaceIntent(raw = "") {
  const text = String(raw || "");
  return /\b(?:replace|replace-existing|overwrite|update)\b/i.test(text)
    || /替换|覆盖|更新|重新提升/.test(text);
}

function parseSelectionQuantity(raw = "") {
  const text = String(raw || "");
  const explicit = text.match(/\b(?:quantity|qty|x)\s*[:=]?\s*(\d{1,2})\b/i)
    || text.match(/(\d{1,2})\s*(?:pcs|pieces|buttons|button)\b/i)
    || text.match(/(\d{1,2})\s*个/);
  if (!explicit?.[1]) return 1;
  return Math.max(1, Math.min(99, Number(explicit[1]) || 1));
}

function isUnsupported(lower, raw = "") {
  return lower.includes("drone")
    || lower.includes("make it fly")
    || lower.includes("mains powered")
    || lower.includes("120v")
    || lower.includes("220v")
    || /无人机|飞行|会飞|市电/.test(raw);
}

function localized(raw, zh, en) {
  return /[\u4e00-\u9fff]/.test(raw) ? zh : en;
}

function extractOpenAIText(json = {}) {
  if (typeof json.output_text === "string" && json.output_text) return json.output_text;
  const textParts = [];
  for (const item of json.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) textParts.push(content.text);
    }
  }
  return textParts.join("\n");
}

function extractOpenAIToolCalls(json = {}) {
  const calls = [];
  for (const item of json.output || []) {
    if (item.type === "function_call") {
      let input = {};
      try {
        input = item.arguments ? JSON.parse(item.arguments) : {};
      } catch {
        input = {};
      }
      calls.push({
        toolCallId: item.call_id || item.id || makeId("toolcall"),
        name: item.name,
        input
      });
    }
  }
  return calls;
}
