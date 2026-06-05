import { JOB_CAPABILITY, PRODUCT_PLAN_STATUS, SUPPORTED_LANGUAGES } from "../contracts/workbench_contract.mjs";
import { registerAssets } from "./assets.mjs";
import { createGenerationJob } from "./jobs.mjs";
import {
  appendWorkspaceEvent,
  persistProjectPlan,
  persistReviewSubmission,
  persistRevision,
  persistRevisionRevert,
  readRuntimePlan
} from "./project_workspace.mjs";
import { createReviewSubmission } from "./review_queue.mjs";
import { isGenerationRequest, processUserTurn } from "./sparker_orchestrator.mjs";
import { includesAny, makeId } from "./utils.mjs";
import { applyWorkspacePatches, clone, createEmptyProductPlan, createRevisionDiff, createWorkspaceState, productPlanToDraft } from "./workspace_state.mjs";

const plans = new Map();

export function createProductPlan({ message, initialMessage, assets = [], language = "zh" } = {}) {
  const text = String(message || initialMessage || "").trim();
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "zh";
  const now = new Date().toISOString();
  const planId = makeId("plan");
  const assetRefs = registerAssets(assets);
  const workspaceState = createWorkspaceState({
    workspaceId: planId,
    title: text || "Forge hardware prototype"
  });
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
    proposals: workspaceState.proposals,
    workspaceState,
    assets: assetRefs,
    jobs: [],
    contactInfo: { name: "", email: "" },
    reviewSubmission: null,
    language: lang,
    createdAt: now,
    updatedAt: now
  };

  const sparkerResult = processUserTurn({
    workspaceState,
    currentProductPlan: workspaceState.productPlan,
    currentConversation: plan.conversation,
    userMessage: text
  });
  workspaceState.productPlan = sparkerResult.productPlan;
  const revision = createRevisionForTurn({
    plan,
    turn: userTurn,
    requestText: text,
    structuredProductPlan: sparkerResult.productPlan,
    patches: sparkerResult.appliedPatches,
    sparkerResult,
    generateArtifacts: sparkerResult.shouldRegenerate
  });
  const assistantTurn = createTurn({
    role: "assistant",
    text: assistantMessageForPlan(plan, revision),
    createdAt: new Date().toISOString()
  });
  plan.conversation.push(assistantTurn);
  plan.updatedAt = assistantTurn.createdAt;
  plans.set(plan.planId, plan);
  appendWorkspaceEvent({
    plan,
    type: "user_message",
    actor: "user",
    payload: {
      turnId: userTurn.turnId,
      text: userTurn.text,
      assetIds: userTurn.assetIds
    }
  });
  appendWorkspaceEvent({
    plan,
    type: "assistant_message",
    actor: "assistant",
    payload: {
      turnId: assistantTurn.turnId,
      text: assistantTurn.text
    }
  });
  persistProjectPlan({ plan });
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
  appendWorkspaceEvent({
    plan,
    type: "user_message",
    actor: "user",
    payload: {
      turnId: turn.turnId,
      text: turn.text,
      assetIds: turn.assetIds
    }
  });

  const previous = currentRevision(plan);
  const previousProductPlan = previous?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  const sparkerResult = processUserTurn({
    workspaceState: plan.workspaceState,
    currentProductPlan: previousProductPlan,
    currentConversation: plan.conversation,
    userMessage: turn.text
  });
  const requestText = [previous?.requestText, turn.text]
    .filter(Boolean)
    .join("\nUpdate: ");
  const revision = createRevisionForTurn({
    plan,
    turn,
    requestText,
    structuredProductPlan: sparkerResult.productPlan,
    patches: sparkerResult.appliedPatches,
    sparkerResult,
    previousRevision: previous,
    overrides,
    generateArtifacts: sparkerResult.shouldRegenerate || isGenerationConfirmation(turn.text)
  });
  const assistantTurn = createTurn({
    role: "assistant",
    text: assistantMessageForPlan(plan, revision)
  });
  plan.conversation.push(assistantTurn);
  plan.updatedAt = assistantTurn.createdAt;
  appendWorkspaceEvent({
    plan,
    type: "assistant_message",
    actor: "assistant",
    payload: {
      turnId: assistantTurn.turnId,
      text: assistantTurn.text
    }
  });
  persistProjectPlan({ plan });
  return { productPlan: plan, revision, assistantMessage: assistantTurn };
}

export function getProductPlan(planId) {
  return plans.get(planId);
}

export function hydrateProductPlanFromWorkspace({ planId, rootDir, force = false } = {}) {
  const id = String(planId || "").trim();
  if (!id) return null;
  if (!force && plans.has(id)) return plans.get(id);
  const plan = readRuntimePlan({ workspaceId: id, rootDir });
  if (!plan?.planId) return null;
  plans.set(plan.planId, plan);
  return plan;
}

export function listProductPlans() {
  return [...plans.values()];
}

export function revertProductPlanRevision({ planId, revisionId } = {}) {
  const plan = plans.get(planId);
  if (!plan) {
    const error = new Error(`Unknown ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }
  const revision = plan.revisions.find((item) => item.revisionId === revisionId);
  if (!revision) {
    const error = new Error(`Unknown revision for ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }
  const fromRevisionId = plan.currentRevisionId || "";
  plan.currentRevisionId = revision.revisionId;
  if (plan.workspaceState) {
    plan.workspaceState.currentRevisionId = revision.revisionId;
    plan.workspaceState.productPlan = clone(revision.productPlanSnapshot || plan.workspaceState.productPlan);
  }
  plan.updatedAt = new Date().toISOString();
  persistRevisionRevert({
    plan,
    fromRevisionId,
    toRevisionId: revision.revisionId
  });
  persistProjectPlan({ plan });
  return { productPlan: plan, revision };
}

export function createProductPlanRevisionFromPatches({
  planId,
  patches = [],
  summary = "",
  message = "",
  source = "forge_action",
  generateArtifacts = true
} = {}) {
  const plan = getPlanOrThrow(planId);
  ensureWorkspaceCollections(plan);
  const previous = currentRevision(plan);
  const previousProductPlan = previous?.productPlanSnapshot
    || plan.workspaceState?.productPlan
    || createEmptyProductPlan();
  const patchResult = applyWorkspacePatches(previousProductPlan, patches);
  if (patchResult.rejectedPatches.length > 0) {
    const error = new Error("One or more patches were rejected.");
    error.statusCode = 400;
    error.rejectedPatches = patchResult.rejectedPatches;
    throw error;
  }
  const turn = createTurn({
    role: "action",
    text: String(summary || message || "Forge action patch").trim()
  });
  const requestText = [previous?.requestText, summary || message]
    .filter(Boolean)
    .join("\nAction: ");
  const revision = createRevisionForTurn({
    plan,
    turn,
    requestText,
    structuredProductPlan: patchResult.productPlan,
    patches: patchResult.appliedPatches,
    sparkerResult: {
      appliedPatches: patchResult.appliedPatches,
      rejectedPatches: [],
      intent: source
    },
    previousRevision: previous,
    generateArtifacts
  });
  return {
    productPlan: plan,
    revision,
    appliedPatches: patchResult.appliedPatches
  };
}

export function regenerateProductPlanRevision({ planId, revisionId = "", reason = "manual_regeneration" } = {}) {
  const plan = getPlanOrThrow(planId);
  ensureWorkspaceCollections(plan);
  const sourceRevision = revisionId
    ? plan.revisions.find((item) => item.revisionId === revisionId)
    : currentRevision(plan);
  if (!sourceRevision) {
    const error = new Error(`Unknown revision for ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }
  const turn = createTurn({
    role: "action",
    text: String(reason || "manual_regeneration")
  });
  const revision = createRevisionForTurn({
    plan,
    turn,
    requestText: sourceRevision.requestText || reason,
    structuredProductPlan: clone(sourceRevision.productPlanSnapshot || plan.workspaceState?.productPlan || createEmptyProductPlan()),
    patches: [],
    sparkerResult: {
      appliedPatches: [],
      rejectedPatches: [],
      intent: "regenerate_revision"
    },
    previousRevision: sourceRevision,
    generateArtifacts: true
  });
  return { productPlan: plan, revision, sourceRevision };
}

export async function submitProductPlanReview({ planId, revisionId, contactInfo = {} } = {}) {
  const plan = getPlanOrThrow(planId);
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
  persistReviewSubmission({
    plan,
    revision,
    submission
  });
  persistProjectPlan({ plan });
  return { productPlan: plan, submission };
}

function createRevisionForTurn({
  plan,
  turn,
  requestText,
  structuredProductPlan = createEmptyProductPlan(),
  patches = [],
  sparkerResult = {},
  previousRevision = currentRevision(plan),
  generateArtifacts = false
}) {
  const draft = productPlanToDraft({
    productPlan: structuredProductPlan,
    requestText
  });
  const revisionId = makeId("rev");
  const status = classifyPlanStatus(requestText, draft, structuredProductPlan, sparkerResult);
  const modelJob = createGenerationJob({
    planId: plan.planId,
    revisionId,
    capability: JOB_CAPABILITY.MODEL_GENERATION,
    input: {
      productPlan: structuredProductPlan,
      spec: draft.spec,
      modules: draft.modules,
      riskReport: draft.riskReport,
      generateArtifacts
    }
  });
  const layoutJob = createGenerationJob({
    planId: plan.planId,
    revisionId,
    capability: JOB_CAPABILITY.ELECTRONICS_LAYOUT,
    input: {
      productPlan: structuredProductPlan,
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
    productPlanSnapshot: clone(structuredProductPlan),
    patches: clone(patches),
    rejectedPatches: clone(sparkerResult.rejectedPatches || []),
    unsupportedReasons: clone(sparkerResult.unsupportedReasons || []),
    intent: sparkerResult.intent || "",
    spec: draft.spec,
    modules: draft.modules,
    riskReport: draft.riskReport,
    quote: draft.quote,
    geometrySpec: modelJob.output?.geometrySpec,
    modelArtifacts: modelJob.output?.modelArtifacts,
    geometryValidation: modelJob.output?.geometryValidation,
    generationStatus: modelJob.output?.modelArtifacts?.status || "pending_confirmation",
    generationConfirmed: modelJob.output?.modelArtifacts?.status === "generated",
    modelPreview: modelJob.output?.modelPreview,
    electronicsLayout: layoutJob.output?.electronicsLayout,
    assumptions: quoteJob.output?.quoteEstimate?.assumptions || [],
    quoteEstimate: quoteJob.output?.quoteEstimate,
    createdAt: new Date().toISOString()
  };
  revision.diff = createRevisionDiff({
    previousRevision,
    nextRevision: revision,
    previousProductPlan: previousRevision?.productPlanSnapshot,
    nextProductPlan: structuredProductPlan
  });

  plan.assets.push(...generatedAssetsFromRevision(revision));
  plan.status = status;
  plan.currentRevisionId = revision.revisionId;
  plan.requiredInputs = requiredInputsFor(requestText, draft);
  plan.revisions.push(revision);
  plan.jobs.push(modelJob, layoutJob, quoteJob);
  plan.updatedAt = revision.createdAt;
  if (plan.workspaceState) {
    plan.workspaceState.productPlan = clone(structuredProductPlan);
    plan.workspaceState.currentRevisionId = revision.revisionId;
    plan.workspaceState.revisions.push({
      revisionId: revision.revisionId,
      sourceTurnId: turn.turnId,
      patches: revision.patches,
      diff: revision.diff,
      artifactPaths: artifactPathsForRevision(revision),
      createdAt: revision.createdAt
    });
  }
  persistRevision({
    plan,
    revision
  });
  return revision;
}

function generatedAssetsFromRevision(revision) {
  const assets = revision.modelPreview?.assets || {};
  const artifactAssets = revision.modelArtifacts?.artifacts || {};
  const collected = [
    assets.preview,
    assets.glb,
    assets.stl,
    assets.shellFront,
    assets.shellBack,
    assets.step,
    assets.cad,
    assets.productPlan,
    assets.componentSelections,
    assets.componentDescriptors,
    assets.componentAssetManifest,
    assets.geometrySpec,
    assets.validationReport,
    assets.designSummary,
    assets.cadqueryScript,
    artifactAssets.productPlan,
    artifactAssets.geometrySpec,
    artifactAssets.componentSelections,
    artifactAssets.validationReport,
    artifactAssets.designSummary,
    artifactAssets.cadqueryScript,
    artifactAssets.glb,
    artifactAssets.stl,
    artifactAssets.shellFront,
    artifactAssets.shellBack,
    artifactAssets.step,
    ...(assets.renders || [])
  ].filter(Boolean);
  const seen = new Set();
  return collected.filter((asset) => {
    if (!asset.assetId || seen.has(asset.assetId)) return false;
    seen.add(asset.assetId);
    return true;
  });
}

export function artifactPathsForRevision(revision) {
  const artifacts = revision.modelArtifacts?.artifacts || {};
  return Object.fromEntries(
    Object.entries(artifacts)
      .filter(([, asset]) => asset?.localPath || asset?.url)
      .map(([key, asset]) => [key, asset.localPath || asset.url])
  );
}

export function currentRevision(plan) {
  return plan.revisions.find((revision) => revision.revisionId === plan.currentRevisionId)
    || plan.revisions.at(-1);
}

function getPlanOrThrow(planId) {
  const plan = plans.get(planId);
  if (!plan) {
    const error = new Error(`Unknown ProductPlan: ${planId}`);
    error.statusCode = 404;
    throw error;
  }
  ensureWorkspaceCollections(plan);
  return plan;
}

function ensureWorkspaceCollections(plan) {
  if (!plan.workspaceState) {
    plan.workspaceState = createWorkspaceState({
      workspaceId: plan.planId,
      title: plan.revisions.at(-1)?.requestText || "Forge hardware prototype"
    });
  }
  if (!Array.isArray(plan.workspaceState.proposals)) plan.workspaceState.proposals = [];
  if (!Array.isArray(plan.workspaceState.revisions)) plan.workspaceState.revisions = [];
  plan.proposals = plan.workspaceState.proposals;
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

function classifyPlanStatus(text, draft, structuredProductPlan = {}, sparkerResult = {}) {
  if (structuredProductPlan.productType === "manual_expansion" || sparkerResult.unsupportedReasons?.length) {
    return PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT;
  }
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
  const hasExcludedModules = draft.interpreted.options.motor;

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

function isGenerationConfirmation(text) {
  return isGenerationRequest(text);
}

function assistantMessageForPlan(plan, revision) {
  const missing = plan.requiredInputs.missing || [];
  const isZh = plan.language !== "en";
  if (revision.unsupportedReasons?.length) {
    return isZh
      ? `这个请求需要人工扩展验证：${revision.unsupportedReasons.join(" ")} 我可以保留一个不含运动/高风险系统的外壳概念，但不能把它当作标准桌面电子原型直接生成。`
      : `This request needs manual expansion validation: ${revision.unsupportedReasons.join(" ")} I can keep a reduced non-motion enclosure concept, but it cannot be treated as a standard desktop electronics prototype.`;
  }
  if (revision.rejectedPatches?.length) {
    return isZh
      ? `我拒绝了 ${revision.rejectedPatches.length} 个不安全或不支持的结构化修改，其余 ProductPlan 状态已更新。`
      : `I rejected ${revision.rejectedPatches.length} unsafe or unsupported structured change and updated the remaining ProductPlan state.`;
  }
  if (missing.length > 0) {
    const labels = isZh
      ? { purpose: "用途", screenSize: "屏幕尺寸", finish: "外观风格" }
      : { purpose: "purpose", screenSize: "screen size", finish: "finish" };
    const joined = missing.map((item) => labels[item] || item).join(isZh ? "、" : ", ");
    return isZh
      ? `我先生成了一个可编辑方案。还需要确认：${joined}。`
      : `I created an editable plan first. Still need confirmation for: ${joined}.`;
  }
  if (plan.status === PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT) {
    return isZh
      ? "这个想法已经进入人工扩展草案：我会继续把对话变成产品状态，但它不属于标准桌面屏的一键下单范围。"
      : "This idea moved into a manual expansion draft. I can keep turning the conversation into product state, but it is outside the standard desktop display path.";
  }
  const hasReviewRisk = (revision.riskReport?.items || []).some((item) => item.level === "warn");
  const modules = revision.spec.module_stack?.join(isZh ? "、" : ", ");
  const changeCount = revision.diff?.changes?.length || 0;
  const changePrefix = changeCount
    ? isZh ? `已记录 ${changeCount} 项结构化修改。` : `${changeCount} structured change(s) recorded. `
    : "";
  if (revision.generationStatus === "pending_confirmation") {
    return isZh
      ? `${changePrefix}已更新标准桌面屏方案：${modules}。${hasReviewRisk ? "摄像头/电池等风险已标为人工审核项。" : ""}3D 装配预览等待你确认生成；现在不会生成新的 3D 模型文件。`
      : `${changePrefix}Updated the standard desktop display plan: ${modules}. ${hasReviewRisk ? "Camera, battery, or other risks are marked for human review. " : ""}The 3D assembly preview is waiting for generation confirmation; no new 3D model file has been generated yet.`;
  }
  if (revision.generationStatus === "generated") {
    return isZh
      ? `${changePrefix}已生成带零件布局的 3D 装配预览：${modules}。${hasReviewRisk ? "摄像头/电池等风险已标为人工审核项。" : "3D 模型已挂到当前版本。"}`
      : `${changePrefix}Generated the 3D assembly preview with placed parts: ${modules}. ${hasReviewRisk ? "Camera, battery, or other risks are marked for human review." : "The 3D model is attached to this revision."}`;
  }
  if (isZh) {
    return `已更新标准桌面屏方案：${modules}。${hasReviewRisk ? "摄像头/电池等风险已标为人工审核项。" : "右侧方案包已刷新。"}`;
  }
  return `Updated the standard desktop display plan: ${modules}. ${hasReviewRisk ? "Camera, battery, or other risks are marked for human review." : "The plan packet is refreshed."}`;
}
