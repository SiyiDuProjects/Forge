import { JOB_CAPABILITY, PRODUCT_PLAN_STATUS, SUPPORTED_LANGUAGES } from "../contracts/workbench_contract.mjs";
import { registerAssets } from "./assets.mjs";
import { createGenerationJob } from "./jobs.mjs";
import { createDraft } from "./pipeline.mjs";
import { createReviewSubmission } from "./review_queue.mjs";
import { includesAny, makeId } from "./utils.mjs";

const plans = new Map();

export function createProductPlan({ message, initialMessage, assets = [], language = "zh" } = {}) {
  const text = String(message || initialMessage || "").trim();
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "zh";
  const now = new Date().toISOString();
  const planId = makeId("plan");
  const assetRefs = registerAssets(assets);
  const userTurn = createTurn({
    role: "user",
    text,
    assetIds: assetRefs.map((asset) => asset.assetId),
    createdAt: now
  });
  const plan = {
    planId,
    status: PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED,
    currentRevisionId: "",
    requiredInputs: {},
    conversation: [userTurn],
    revisions: [],
    assets: assetRefs,
    jobs: [],
    contactInfo: { name: "", email: "" },
    reviewSubmission: null,
    language: lang,
    createdAt: now,
    updatedAt: now
  };

  const revision = createRevisionForTurn({ plan, turn: userTurn, requestText: text });
  const assistantTurn = createTurn({
    role: "assistant",
    text: assistantMessageForPlan(plan, revision),
    createdAt: new Date().toISOString()
  });
  plan.conversation.push(assistantTurn);
  plan.updatedAt = assistantTurn.createdAt;
  plans.set(plan.planId, plan);
  return { productPlan: plan, revision, assistantMessage: assistantTurn };
}

export function addProductPlanTurn({ planId, message, assetIds = [], assets = [], overrides = {} } = {}) {
  const plan = plans.get(planId);
  if (!plan) {
    const error = new Error(`Unknown ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }

  const assetRefs = registerAssets(assets);
  plan.assets.push(...assetRefs);
  const turn = createTurn({
    role: "user",
    text: String(message || "").trim(),
    assetIds: [...assetIds, ...assetRefs.map((asset) => asset.assetId)]
  });
  plan.conversation.push(turn);

  const previous = currentRevision(plan);
  const requestText = [previous?.spec?.user_request, turn.text]
    .filter(Boolean)
    .join("\nUpdate: ");
  const revision = createRevisionForTurn({ plan, turn, requestText, overrides });
  const assistantTurn = createTurn({
    role: "assistant",
    text: assistantMessageForPlan(plan, revision)
  });
  plan.conversation.push(assistantTurn);
  plan.updatedAt = assistantTurn.createdAt;
  return { productPlan: plan, revision, assistantMessage: assistantTurn };
}

export function getProductPlan(planId) {
  return plans.get(planId);
}

export function listProductPlans() {
  return [...plans.values()];
}

export async function submitProductPlanReview({ planId, revisionId, contactInfo = {} } = {}) {
  const plan = plans.get(planId);
  if (!plan) {
    const error = new Error(`Unknown ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }
  const revision = revisionId
    ? plan.revisions.find((item) => item.revisionId === revisionId)
    : currentRevision(plan);
  if (!revision) {
    const error = new Error(`Unknown revision for ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }

  plan.contactInfo = {
    name: String(contactInfo.name || plan.contactInfo.name || "").trim(),
    email: String(contactInfo.email || plan.contactInfo.email || "").trim()
  };
  const submission = await createReviewSubmission({
    productPlan: plan,
    revision,
    contactInfo: plan.contactInfo,
    jobs: plan.jobs.filter((job) => job.revisionId === revision.revisionId),
    assets: plan.assets
  });
  plan.status = PRODUCT_PLAN_STATUS.SUBMITTED_FOR_REVIEW;
  plan.reviewSubmission = submission;
  plan.updatedAt = new Date().toISOString();
  return { productPlan: plan, submission };
}

function createRevisionForTurn({ plan, turn, requestText, overrides = {} }) {
  const draft = createDraft({ requestText, overrides });
  const revisionId = makeId("rev");
  const status = classifyPlanStatus(requestText, draft);
  const modelJob = createGenerationJob({
    planId: plan.planId,
    revisionId,
    capability: JOB_CAPABILITY.MODEL_GENERATION,
    input: {
      spec: draft.spec,
      modules: draft.modules
    }
  });
  const layoutJob = createGenerationJob({
    planId: plan.planId,
    revisionId,
    capability: JOB_CAPABILITY.ELECTRONICS_LAYOUT,
    input: {
      spec: draft.spec,
      modules: draft.modules,
      modelJob
    }
  });
  const quoteJob = createGenerationJob({
    planId: plan.planId,
    revisionId,
    capability: JOB_CAPABILITY.QUOTE_ESTIMATE,
    input: {
      draft,
      spec: draft.spec,
      modules: draft.modules,
      riskReport: draft.riskReport,
      quote: draft.quote
    }
  });
  const revision = {
    revisionId,
    sourceTurnId: turn.turnId,
    productCategory: status === PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED
      ? "standard_desktop_display"
      : "manual_expansion",
    requestText: draft.requestText,
    spec: draft.spec,
    modules: draft.modules,
    riskReport: draft.riskReport,
    quote: draft.quote,
    modelPreview: modelJob.output?.modelPreview,
    electronicsLayout: layoutJob.output?.electronicsLayout,
    assumptions: quoteJob.output?.quoteEstimate?.assumptions || [],
    quoteEstimate: quoteJob.output?.quoteEstimate,
    createdAt: new Date().toISOString()
  };

  plan.assets.push(...generatedAssetsFromRevision(revision));
  plan.status = status;
  plan.currentRevisionId = revision.revisionId;
  plan.requiredInputs = requiredInputsFor(requestText, draft);
  plan.revisions.push(revision);
  plan.jobs.push(modelJob, layoutJob, quoteJob);
  return revision;
}

function generatedAssetsFromRevision(revision) {
  const assets = revision.modelPreview?.assets || {};
  return [
    assets.preview,
    assets.glb,
    assets.cad,
    ...(assets.renders || [])
  ].filter(Boolean);
}

function currentRevision(plan) {
  return plan.revisions.find((revision) => revision.revisionId === plan.currentRevisionId)
    || plan.revisions.at(-1);
}

function createTurn({ role, text, assetIds = [], createdAt = new Date().toISOString() }) {
  return {
    turnId: makeId("turn"),
    role,
    text,
    assetIds,
    createdAt
  };
}

function classifyPlanStatus(text, draft) {
  const lower = String(text || "").toLowerCase();
  const nonStandardWords = [
    "cup",
    "bottle",
    "keyboard",
    "lamp",
    "light",
    "watch",
    "wearable",
    "drone",
    "robot arm",
    "hinge",
    "mechanical",
    "water bottle",
    "水杯",
    "键盘",
    "灯",
    "手表",
    "无人机",
    "机械臂"
  ];
  const displayWords = [
    "display",
    "screen",
    "dashboard",
    "frame",
    "monitor",
    "booth",
    "counter",
    "桌面屏",
    "屏幕",
    "显示",
    "相框",
    "展台"
  ];
  const hasExplicitNonStandard = includesAny(lower, nonStandardWords)
    && !includesAny(lower, displayWords);
  const hasExcludedModules = draft.interpreted.options.camera
    || draft.interpreted.options.battery
    || draft.interpreted.options.motor;

  return hasExplicitNonStandard || hasExcludedModules
    ? PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT
    : PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED;
}

function requiredInputsFor(text, draft) {
  const lower = String(text || "").toLowerCase();
  const hasPurpose = lower.length >= 12;
  const hasScreenSize = includesAny(lower, [
    "3.5",
    "5 inch",
    "5-inch",
    "7 inch",
    "7-inch",
    "small",
    "medium",
    "large",
    "tiny",
    "compact",
    "big",
    "小",
    "中",
    "大",
    "英寸"
  ]);
  const hasFinish = includesAny(lower, [
    "wood",
    "woodgrain",
    "walnut",
    "retro",
    "black",
    "graphite",
    "dark",
    "green",
    "sage",
    "coral",
    "orange",
    "red",
    "木",
    "木纹",
    "黑",
    "绿色",
    "红",
    "橙"
  ]);
  const missing = [];
  if (!hasPurpose) missing.push("purpose");
  if (!hasScreenSize) missing.push("screenSize");
  if (!hasFinish) missing.push("finish");
  return {
    purpose: { value: draft.requestText, confirmed: hasPurpose },
    screenSize: { value: draft.interpreted.screenSize, confirmed: hasScreenSize },
    finish: { value: draft.interpreted.finish, confirmed: hasFinish },
    missing
  };
}

function assistantMessageForPlan(plan, revision) {
  const missing = plan.requiredInputs.missing || [];
  if (missing.length > 0) {
    const labels = {
      purpose: "用途",
      screenSize: "屏幕尺寸",
      finish: "外观风格"
    };
    return `我先生成了一个可编辑方案。还需要确认：${missing.map((item) => labels[item] || item).join("、")}。`;
  }
  if (plan.status === PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT) {
    return "这个想法已经进入人工扩展草案：我会继续把对话变成产品状态，但它不属于标准桌面屏的一键下单范围。";
  }
  return `已更新标准桌面屏方案：${revision.spec.module_stack?.join("、")}。右侧方案包已刷新。`;
}
