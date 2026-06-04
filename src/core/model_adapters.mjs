import { makeId } from "./utils.mjs";

export function createModelAdapter({ provider = process.env.FORGE_MODEL_PROVIDER || "mock" } = {}) {
  if (provider === "openai") return new OpenAIResponsesAdapter();
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
    model = process.env.FORGE_MODEL_NAME || "gpt-5-mini"
  } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async runTurn({ prompt, tools = [], userMessage = "" } = {}) {
    if (!this.apiKey) {
      return {
        ok: false,
        error: {
          code: "OPENAI_API_KEY_MISSING",
          message: "OPENAI_API_KEY is required when modelProvider is openai."
        }
      };
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
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
      })
    });
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "OPENAI_RESPONSE_FAILED",
          message: `OpenAI Responses API returned HTTP ${response.status}.`
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

export function deterministicPatchesFor(message = "") {
  const lower = String(message || "").toLowerCase();
  const patches = [];
  const componentAdditions = [];
  const geometrySet = {};

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
  const regenerated = summaries.find((summary) => summary.regenerated);
  const reverted = summaries.find((summary) => summary.reverted);
  const proposal = summaries.find((summary) => summary.proposalId);
  const artifacts = summaries.find((summary) => Object.keys(summary.artifactPaths || {}).length > 0);
  if (applied) {
    return localized(userMessage, `已通过 Forge action 创建新版本 ${applied.newRevisionId}，并更新 3D 模型/外壳文件状态。`, `I created revision ${applied.newRevisionId} through Forge actions and updated the 3D model/shell artifact state.`);
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
