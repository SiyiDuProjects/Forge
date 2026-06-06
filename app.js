import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SUPPORTED_LANGUAGES = ["zh", "en"];
const RUNTIME_PROVIDER_VALUES = ["mock", "forge-query-engine", "codex"];
const DEFAULT_RUNTIME_PROVIDER = "codex";
const LEGACY_RUNTIME_PROVIDER_KEY = "forgeRuntimeProvider";
const EXPLICIT_RUNTIME_PROVIDER_KEY = "forgeRuntimeProviderExplicit";
const TRANSCRIPT_EVENT_LIMIT = 96;
const threePreviewInstances = new Map();
const INITIAL_RUNTIME_PROVIDER = localChatProvider();

function localChatProvider() {
  try {
    if (window.FORGE_RUNTIME_PROVIDER) return normalizeRuntimeProvider(window.FORGE_RUNTIME_PROVIDER);
    const explicitChoice = window.localStorage.getItem(EXPLICIT_RUNTIME_PROVIDER_KEY);
    if (explicitChoice) return normalizeRuntimeProvider(explicitChoice);
    const legacyChoice = window.localStorage.getItem(LEGACY_RUNTIME_PROVIDER_KEY);
    if (legacyChoice && legacyChoice !== "mock") return normalizeRuntimeProvider(legacyChoice);
    return DEFAULT_RUNTIME_PROVIDER;
  } catch {
    return DEFAULT_RUNTIME_PROVIDER;
  }
}

function normalizeRuntimeProvider(value = "") {
  const normalized = String(value || DEFAULT_RUNTIME_PROVIDER);
  return RUNTIME_PROVIDER_VALUES.includes(normalized) ? normalized : DEFAULT_RUNTIME_PROVIDER;
}

function currentRuntimeProvider() {
  return normalizeRuntimeProvider(state?.runtimeProvider);
}

const copy = {
  zh: {
    appTitle: "Forge",
    newProject: "新项目",
    projectActionsAria: "项目操作",
    projectLabel: "项目",
    projectListAria: "ProductPlan 项目",
    settingsButton: "Forge 设置",
    uiPrototype: "内部 MVP",
    topbarStatus: "ProductPlan 实时方案",
    submitOrder: "提交审核下单",
    previewSnapshot: "预览原型快照",
    composerDefault: "描述硬件需求，发送后更新 ProductPlan 和 3D 生成状态",
    composerCodexReady: "下一条由 Codex 接管，并通过 Forge 工具落盘",
    composerQueryReady: "下一条由 Forge QueryEngine 调用 Forge 工具",
    composerCodexRunning: "Codex 正在处理本次任务",
    composerQueryRunning: "Forge QueryEngine 正在处理本次任务",
    composerPlaceholder: "说出你想做的硬件，例如：我想做一个小型木纹桌面屏，显示天气和照片，3.5 英寸，USB-C 供电。",
    runChainAria: "发送需求并更新方案",
    cancelRunAria: "停止本轮执行",
    inspectorAria: "实时方案包",
    settingsTitle: "Forge 设置",
    language: "语言",
    langZh: "简体中文",
    langEn: "English",
    languageSelectAria: "界面语言",
    threadMenuAria: "项目菜单",
    projectMenuAria: (title) => `${title} 项目菜单`,
    threadRename: "重命名方案",
    threadHistory: "查看版本记录",
    threadDuplicate: "复制草稿",
    threadExport: "导出方案快照",
    threadRemove: "从列表移除",
    projectRemoved: (title) => `已从列表移除：${title}`,
    planReady: "标准桌面屏",
    planManual: "人工扩展草案",
    planSubmitted: "已提交人工审核",
    newDraftTitle: "未命名硬件项目",
    newDraftDetail: "输入第一条需求后生成 ProductPlan",
    newProjectReady: "已准备新项目",
    fallbackNotice: "后端暂不可用，无法创建真实 ProductPlan",
    sendFailed: "发送失败，已保留输入内容",
    sendCancelled: "已停止本轮，输入内容已保留",
    emptyComposer: "请先输入硬件需求",
    rerunNotice: "已更新 ProductPlan revision",
    chatRuntimeNotice: "Forge 工具链已更新项目",
    chatConfirmationRequired: "需要确认后执行",
    chatTraceTitle: "Codex 工作流",
    chatTraceRunning: "正在执行",
    chatTraceEmpty: "本轮没有收到 Codex 步骤",
    chatTraceSource: "来自 Codex SDK streamed events",
    processedRunning: "处理中",
    processedDone: "已处理",
    processedFailed: "处理失败",
    processedCancelled: "已停止",
    processedExpand: "展开工作过程",
    processedCollapse: "收起工作过程",
    processedNoWork: "没有可展示的工作过程",
    processedExplored: "已探索",
    processedRan: "已运行",
    processedEdited: "已编辑",
    processedTodo: "已推进任务",
    processedTool: "已调用工具",
    traceFailed: "执行失败",
    traceDone: "完成",
    runtimeMode: "运行模式",
    runtimeLocal: "本地 Forge（降级）",
    runtimeQueryEngine: "Forge QueryEngine",
    runtimeCodex: "Codex",
    runtimeChanged: "运行模式已更新",
    runtimeStatusChecking: "正在检查运行时",
    runtimeStatusCheckFailed: (message) => `无法检查运行时：${message}`,
    runtimeStatusLocalReady: "本地 Forge 降级模式已就绪",
    runtimeStatusQueryReady: "Forge QueryEngine 已就绪",
    runtimeStatusCodexReady: "Codex SDK 已就绪",
    runtimeStatusCodexMissing: "Codex SDK 不可用，发送会失败",
    runtimeStatusCodexFailed: "Codex 初始化失败",
    runtimeStatusCodexThread: (threadId) => `项目 thread：${threadId}`,
    runtimeStatusCodexNoThread: "本项目尚未创建 Codex thread，首次 Codex 运行会创建",
    runtimeStatusNoWorkspace: "新项目将在首条需求后创建项目 thread",
    runtimeQuickAria: "打开运行模式设置",
    approveChange: "确认执行",
    rejectChange: "取消",
    submitNeedContact: "请先填写姓名和邮箱",
    submittedNotice: "已生成本地人工审核资料，等待确认；不是付款，也不是立即生产。",
    actionNotice: "已选择：",
    reviewContactTitle: "提交审核下单",
    contactName: "姓名",
    contactEmail: "邮箱",
    contactHint: "内部版只收姓名和邮箱，用于人工审核后联系。",
    reviewSubmitConfirm: "生成本地审核资料",
    sections: {
      scope: "范围",
      parts: "零件清单（BOM）",
      model: "原型结构预览（3D）",
      layout: "电子零件布局",
      quote: "估算+假设",
      risk: "风险限制",
      review: "审核提交状态"
    },
    required: "待确认",
    confirmed: "已确认",
    modelPreviewState: "只读 3D 预览",
    prototypePreviewSubtitle: "这是方案结果视图，不是建模编辑器。",
    prototypeViewLabel: "层级",
    previewModes: {
      appearance: "外观层",
      components: "元器件层"
    },
    modelEvidence: "3D 模型 · 零件布局",
    modelShellPath: "外壳路径",
    modelDimensions: "尺寸",
    modelOpenings: "开孔检查",
    modelReviewReady: "人工审核前预览",
    modelArtifacts: "3D 模型状态",
    modelArtifactSummary: "3D 模型已生成",
    modelFullscreenAria: "3D 预览全屏",
    openModelFullscreen: "全屏查看 3D 预览",
    closeModelFullscreen: "收起全屏预览",
    modelFitChecks: "结构检查",
    modelLoading: "正在加载 3D 模型",
    modelLoaded: "真实 3D 预览已加载",
    modelLoadFailed: "3D 模型加载失败",
    modelSketchPreview: "结构草图预览",
    generateModelCta: "生成模型",
    generateModelCommand: "生成模型",
    generationPending: "待确认生成",
    generationInsufficient: "信息不足",
    placedParts: (count) => `已放置 ${count} 个零件`,
    modifyThroughChat: "修改结构请继续对话并生成新版本。",
    geometryValidation: "几何校验",
    geometryBlocked: "几何信息不足或超出标准路径",
    geometryPassed: "可生成可信预览",
    screenOpening: "屏幕开孔",
    usbCRear: "USB-C 后置开口",
    coreBoard: "主板位",
    shellLabel: "标准 3D 打印外壳",
    historyTitle: "版本记录",
    historyIntro: "从左侧项目列表选择 ProductPlan 版本；这里仅保留内部记录视图。",
    currentRevision: "当前版本",
    revisionCount: "版本数量",
    revisionBadge: (index) => `r${index + 1}`,
    revisionDiffTitle: "本版修改",
    noRevisionDiff: "初始版本",
    revertRevision: "切回此版本",
    revisionReverted: "已切回所选版本",
    diffLabels: {
      revision_created: "创建版本",
      product_type_changed: "产品类型",
      shape_changed: "外壳形状",
      manufacturing_constraint_changed: "制造约束",
      dimension_changed: "尺寸约束",
      requirement_changed: "需求",
      component_added: "新增零件",
      component_removed: "移除零件",
      component_quantity_changed: "零件数量",
      placement_changed: "位置",
      warning_added: "新增风险",
      warning_removed: "移除风险",
      artifacts_regenerated: "模型状态"
    },
    reviewPacketTitle: "内部审核资料",
    reviewAudience: "给内部工程师或合作审核人员使用。",
    reviewChecklistTitle: "审核资料内容",
    reviewChecklist: ["ProductPlan 当前版本", "原型结构预览（3D）", "零件清单（BOM）", "风险限制", "报价假设"],
    reviewRiskNote: "摄像头和电池进入人工审核风险项；运动结构进入人工扩展草案。",
    reviewSubmitCta: "生成本地审核资料",
    reviewContactCta: "填写审核联系信息",
    noManufacturing: "不付款、不生产、不联系供应商",
    noPlan: "输入第一条硬件想法后生成方案。",
    standardShell: "标准 3D 打印外壳",
    settingsRows: [
      ["内部原型模式", "提交只生成本地人工审核资料，不付款、不生产、不接供应商。"],
      ["对话优先", "用户持续聊天，中间线程展示 Codex 原生步骤，右侧只保留原型结果。"],
      ["标准 3D 打印外壳", "木纹、鼠尾草绿、石墨黑都只是标准外壳的表面效果。"],
      ["结果预览优先", "3D 视图用于理解原型结果，不提供建模编辑工具。"],
      ["运行模式", "默认由 Codex 接管项目对话和任务调度；本地 Forge 只作降级/测试。"],
      ["界面语言", "保留中文和 English 两套文案。"],
      ["文案维护规则", "新增按钮、状态、弹窗、文档都要同步更新中英文。"]
    ]
  },
  en: {
    appTitle: "Forge",
    newProject: "New project",
    projectActionsAria: "Project actions",
    projectLabel: "Projects",
    projectListAria: "ProductPlan projects",
    settingsButton: "Workbench settings",
    uiPrototype: "Internal MVP",
    topbarStatus: "Live ProductPlan",
    submitOrder: "Submit for review/order",
    previewSnapshot: "Preview prototype snapshot",
    composerDefault: "Describe the hardware request; sending updates the ProductPlan and 3D generation state",
    composerCodexReady: "Next turn will run through Codex and Forge tools",
    composerQueryReady: "Next turn will run through Forge QueryEngine tools",
    composerCodexRunning: "Codex is handling this task",
    composerQueryRunning: "Forge QueryEngine is handling this task",
    composerPlaceholder: "Describe the hardware you want, e.g. a small woodgrain desktop display for weather and photos, 3.5 in, USB-C powered.",
    runChainAria: "Send request and update plan",
    cancelRunAria: "Stop this turn",
    inspectorAria: "Live plan packet",
    settingsTitle: "Workbench settings",
    language: "Language",
    langZh: "Simplified Chinese",
    langEn: "English",
    languageSelectAria: "Interface language",
    threadMenuAria: "Project menu",
    projectMenuAria: (title) => `${title} project menu`,
    threadRename: "Rename plan",
    threadHistory: "View revisions",
    threadDuplicate: "Duplicate draft",
    threadExport: "Export plan snapshot",
    threadRemove: "Remove from list",
    projectRemoved: (title) => `Removed from list: ${title}`,
    planReady: "standard desktop display",
    planManual: "manual expansion draft",
    planSubmitted: "submitted for human review",
    newDraftTitle: "Untitled hardware project",
    newDraftDetail: "Send the first request to create a ProductPlan",
    newProjectReady: "New project ready",
    fallbackNotice: "Backend unavailable; cannot create a real ProductPlan",
    sendFailed: "Send failed; the input was kept",
    sendCancelled: "Turn stopped; the input was kept",
    emptyComposer: "Enter a hardware request first",
    rerunNotice: "ProductPlan revision updated",
    chatRuntimeNotice: "Forge tool runtime updated the project",
    chatConfirmationRequired: "Confirmation required",
    chatTraceTitle: "Codex transcript",
    chatTraceRunning: "Running",
    chatTraceEmpty: "No Codex steps received in this turn",
    chatTraceSource: "From Codex SDK streamed events",
    processedRunning: "Processing",
    processedDone: "Processed",
    processedFailed: "Failed",
    processedCancelled: "Stopped",
    processedExpand: "Expand work process",
    processedCollapse: "Collapse work process",
    processedNoWork: "No visible work process",
    processedExplored: "Explored",
    processedRan: "Ran",
    processedEdited: "Edited",
    processedTodo: "Advanced tasks",
    processedTool: "Called tools",
    traceFailed: "Execution failed",
    traceDone: "Done",
    runtimeMode: "Runtime mode",
    runtimeLocal: "Local Forge (fallback)",
    runtimeQueryEngine: "Forge QueryEngine",
    runtimeCodex: "Codex",
    runtimeChanged: "Runtime mode updated",
    runtimeStatusChecking: "Checking runtime",
    runtimeStatusCheckFailed: (message) => `Runtime check failed: ${message}`,
    runtimeStatusLocalReady: "Local Forge fallback is ready",
    runtimeStatusQueryReady: "Forge QueryEngine is ready",
    runtimeStatusCodexReady: "Codex SDK is ready",
    runtimeStatusCodexMissing: "Codex SDK is unavailable; sending will fail",
    runtimeStatusCodexFailed: "Codex initialization failed",
    runtimeStatusCodexThread: (threadId) => `Project thread: ${threadId}`,
    runtimeStatusCodexNoThread: "This project has not created a Codex thread yet; the first Codex run will create one",
    runtimeStatusNoWorkspace: "A new project thread will be created after the first request",
    runtimeQuickAria: "Open runtime mode settings",
    approveChange: "Confirm",
    rejectChange: "Cancel",
    submitNeedContact: "Enter name and email first",
    submittedNotice: "Local human review material generated; no payment or manufacturing has started.",
    actionNotice: "Selected: ",
    reviewContactTitle: "Submit for review/order",
    contactName: "Name",
    contactEmail: "Email",
    contactHint: "Internal v1 only collects name and email for human follow-up.",
    reviewSubmitConfirm: "Generate local review material",
    sections: {
      scope: "Scope",
      parts: "Parts list (BOM)",
      model: "Prototype structure preview (3D)",
      layout: "Electronics layout",
      quote: "Estimate + assumptions",
      risk: "Risk limits",
      review: "Review submission"
    },
    required: "needs input",
    confirmed: "confirmed",
    modelPreviewState: "read-only 3D preview",
    prototypePreviewSubtitle: "A result view of the planned prototype, not a modeling editor.",
    prototypeViewLabel: "Layer",
    previewModes: {
      appearance: "Appearance",
      components: "Components"
    },
    modelEvidence: "3D model · parts layout",
    modelShellPath: "Shell path",
    modelDimensions: "Dimensions",
    modelOpenings: "Opening check",
    modelReviewReady: "Pre-review preview",
    modelArtifacts: "3D model status",
    modelArtifactSummary: "3D model generated",
    modelFullscreenAria: "Fullscreen 3D preview",
    openModelFullscreen: "Open 3D preview fullscreen",
    closeModelFullscreen: "Exit fullscreen preview",
    modelFitChecks: "Structure checks",
    modelLoading: "Loading 3D model",
    modelLoaded: "Real 3D preview loaded",
    modelLoadFailed: "3D model failed to load",
    modelSketchPreview: "Structure sketch preview",
    generateModelCta: "Generate model",
    generateModelCommand: "generate model",
    generationPending: "waiting for generation",
    generationInsufficient: "insufficient information",
    placedParts: (count) => `${count} placed parts`,
    modifyThroughChat: "To change structure, continue the conversation and generate a new revision.",
    geometryValidation: "Geometry validation",
    geometryBlocked: "Geometry is incomplete or outside the standard path",
    geometryPassed: "Trusted preview can be generated",
    screenOpening: "Screen opening",
    usbCRear: "Rear USB-C cutout",
    coreBoard: "Core board position",
    shellLabel: "Standard 3D printed shell",
    historyTitle: "Revision list",
    historyIntro: "Choose ProductPlan revisions from the left project list; this view is kept as an internal record surface.",
    currentRevision: "Current revision",
    revisionCount: "Revision count",
    revisionBadge: (index) => `r${index + 1}`,
    revisionDiffTitle: "Revision changes",
    noRevisionDiff: "Initial revision",
    revertRevision: "Revert to this revision",
    revisionReverted: "Reverted to selected revision",
    diffLabels: {
      revision_created: "Revision created",
      product_type_changed: "Product type",
      shape_changed: "Shell shape",
      manufacturing_constraint_changed: "Manufacturing constraint",
      dimension_changed: "Dimension constraint",
      requirement_changed: "Requirement",
      component_added: "Component added",
      component_removed: "Component removed",
      component_quantity_changed: "Component quantity",
      placement_changed: "Placement",
      warning_added: "Warning added",
      warning_removed: "Warning removed",
      artifacts_regenerated: "Model status"
    },
    reviewPacketTitle: "Internal review material",
    reviewAudience: "For internal engineers or partner reviewers.",
    reviewChecklistTitle: "Review material contents",
    reviewChecklist: ["Current ProductPlan revision", "Prototype structure preview (3D)", "Parts list (BOM)", "Risk limits", "Quote assumptions"],
    reviewRiskNote: "Camera and battery become human-review risk items; motion structures move into manual expansion drafts.",
    reviewSubmitCta: "Generate local review material",
    reviewContactCta: "Fill review contact details",
    noManufacturing: "No payment, production, or supplier contact",
    noPlan: "Send the first hardware idea to generate a plan.",
    standardShell: "Standard 3D printed shell",
    settingsRows: [
      ["Internal prototype mode", "Submission writes local human review material; no payment, production, or supplier order starts."],
      ["Conversation first", "The center thread shows native Codex steps while the right side stays focused on prototype results."],
      ["Standard 3D printed shell", "Woodgrain, sage, and graphite are finish treatments on the same shell path."],
      ["Result preview first", "The 3D view helps users understand the prototype result; it does not expose modeling tools."],
      ["Runtime mode", "Codex handles project conversation and task routing by default; Local Forge is only a fallback/test mode."],
      ["Interface language", "Keep both Chinese and English copy."],
      ["Copy maintenance", "Buttons, statuses, popovers, and docs must stay bilingual."]
    ]
  }
};

const state = {
  lang: initialLanguage(),
  projects: [],
  activeProjectId: "",
  productPlan: null,
  activeSidebar: "chat",
  previewMode: "appearance",
  viewer: {
    yaw: 0,
    pitch: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: false,
    dragMode: "orbit",
    lastX: 0,
    lastY: 0
  },
  collapsedSections: new Set(["scope", "parts", "layout", "risk"]),
  expandedProcessedTurns: new Set(),
  expandedProcessedDetails: new Set(),
  notice: "",
  loading: false,
  submittingReview: false,
  chatSessionId: "session_default",
  lastChatTurn: null,
  activeTrace: null,
  pendingConfirmation: null,
  runtimeError: "",
  runtimeProvider: INITIAL_RUNTIME_PROVIDER,
  runtimeStatus: null,
  runtimeStatusLoading: false,
  runtimeStatusError: "",
  runtimeStatusRequestId: 0,
  workspaceToken: 0,
  activeProjectMenuId: "",
  activeRequestController: null,
  contactInfo: { name: "", email: "" }
};

const dom = {
  conversation: document.querySelector(".conversation"),
  workspaceView: document.querySelector("#workspaceView"),
  inspectorContent: document.querySelector("#inspectorContent"),
  form: document.querySelector("#promptForm"),
  ideaInput: document.querySelector("#ideaInput"),
  runChain: document.querySelector("#runChain"),
  composerSummary: document.querySelector("#composerSummary"),
  scopeLevel: document.querySelector("#scopeLevel"),
  draftStatus: document.querySelector("#draftStatus"),
  apiStatus: document.querySelector("#apiStatus"),
  topbarTitle: document.querySelector("#topbarTitle"),
  previewSnapshot: document.querySelector("#previewSnapshot"),
  submitReview: document.querySelector("#submitReview"),
  newProject: document.querySelector("#newProject"),
  openSettings: document.querySelector("#openSettings"),
  languageSelect: document.querySelector("#languageSelect"),
  runtimeProviderSelect: document.querySelector("#runtimeProviderSelect"),
  runtimeStatus: document.querySelector("#runtimeStatus"),
  floatingLayer: document.querySelector("#floatingLayer"),
  snapshotPopover: document.querySelector("#snapshotPopover")
};

function initialLanguage() {
  try {
    const saved = window.localStorage.getItem("yWorkbenchLanguage");
    return saved === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function t(key, ...args) {
  const value = key.split(".").reduce((current, part) => current?.[part], copy[state.lang]) ?? key;
  return typeof value === "function" ? value(...args) : value;
}

async function bootstrap() {
  renderStaticText();
  const restored = await restorePersistedProjects();
  if (!restored) createDraftProject();
  render({ scrollConversationToBottom: true });
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
}

async function restorePersistedProjects() {
  const token = state.workspaceToken;
  try {
    const response = await apiGet("/api/workspaces?limit=12");
    if (token !== state.workspaceToken) return false;
    const restored = compactRestoredProjectList((response.workspaces || [])
      .filter((workspace) => workspace?.productPlan?.planId)
      .map((workspace) => createProjectRecord({
        productPlan: workspace.productPlan,
        kind: "restored",
        runtimeProvider: runtimeProviderForRestoredWorkspace(workspace),
        runtimeBinding: runtimeBindingForWorkspace(workspace)
      })));
    if (!restored.length) return false;
    state.projects = restored;
    activateProject(restored[0].projectId);
    await restoreActiveChatSession({ renderAfter: false });
    state.runtimeError = "";
    return true;
  } catch (error) {
    if (token !== state.workspaceToken) return false;
    state.runtimeError = userFacingError(error);
    setNotice(t("fallbackNotice"));
    return false;
  }
}

async function restoreActiveChatSession({ renderAfter = true, scrollConversationToBottom = true } = {}) {
  const project = activeProject();
  const planId = project?.productPlan?.planId;
  if (!project || project.isDraft || !planId) return false;
  const projectId = project.projectId;
  const sessionId = project.chatSessionId || createSessionId(projectId);
  const requestToken = state.workspaceToken;
  try {
    const payload = await apiGet(`/api/workspaces/${encodeURIComponent(planId)}/chat/${encodeURIComponent(sessionId)}?limit=80`);
    if (requestToken !== state.workspaceToken || state.activeProjectId !== projectId) return false;
    const productPlan = mergeConversationFromSession(project.productPlan, payload.messages || []);
    const pendingConfirmation = payload.pendingConfirmation || null;
    const lastChatTurn = restoredTurnFromChatSession({ payload, project, productPlan, pendingConfirmation });
    Object.assign(project, {
      productPlan,
      chatSessionId: payload.sessionId || sessionId,
      chatSessionLoaded: true,
      chatSessionEntries: payload.entries || [],
      chatSessionMessages: payload.messages || [],
      recentEvents: payload.recentEvents || [],
      lastChatTurn,
      pendingConfirmation,
      chatSessionError: ""
    });
    if (state.activeProjectId === projectId) {
      state.productPlan = productPlan;
      state.chatSessionId = project.chatSessionId;
      state.lastChatTurn = lastChatTurn;
      state.pendingConfirmation = pendingConfirmation;
      state.runtimeError = "";
    }
    if (renderAfter) render({ scrollConversationToBottom });
    return true;
  } catch (error) {
    if (requestToken !== state.workspaceToken || state.activeProjectId !== projectId) return false;
    project.chatSessionError = userFacingError(error);
    if (renderAfter) render({ scrollConversationToBottom });
    return false;
  }
}

function activeProject() {
  return state.projects.find((project) => project.projectId === state.activeProjectId) || null;
}

function projectById(projectId) {
  return state.projects.find((project) => project.projectId === projectId) || null;
}

function makeClientId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${suffix}`;
}

function createSessionId(projectId) {
  return `session_${String(projectId || makeClientId("project")).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function createProjectRecord({
  productPlan = null,
  title = "",
  kind = "user",
  isDraft = false,
  runtimeProvider = "",
  runtimeBinding = null
} = {}) {
  const projectId = productPlan?.planId || makeClientId("draft");
  return {
    projectId,
    kind,
    isDraft,
    title: title || projectTitleFromPlan(productPlan) || t("newDraftTitle"),
    productPlan,
    chatSessionId: createSessionId(projectId),
    lastChatTurn: null,
    activeTrace: null,
    pendingConfirmation: null,
    runtimeError: "",
    runtimeProvider: runtimeProvider || state?.runtimeProvider || INITIAL_RUNTIME_PROVIDER,
    runtimeBinding: runtimeBinding || null,
    contactInfo: productPlan?.contactInfo || { name: "", email: "" },
    createdAt: new Date().toISOString()
  };
}

function runtimeProviderForRestoredWorkspace(workspace = {}) {
  return runtimeBindingForWorkspace(workspace)?.provider === "codex" ? "codex" : (state?.runtimeProvider || INITIAL_RUNTIME_PROVIDER);
}

function runtimeBindingForWorkspace(workspace = {}) {
  const binding = workspace.runtimeBinding || workspace.manifest?.runtimeBinding || workspace.productPlan?.workspaceState?.runtimeBinding || null;
  if (binding?.provider || binding?.bindingId) return binding;
  const legacyThreadId = workspace.manifest?.codexThreadId || workspace.productPlan?.workspaceState?.codexThreadId || "";
  return legacyThreadId ? {
    provider: "codex",
    status: "ready",
    bindingId: legacyThreadId,
    providerState: { threadId: legacyThreadId },
    migratedFrom: "codexThreadId"
  } : null;
}

function compactRestoredProjectList(projects = []) {
  const seenTitles = new Set();
  return projects.filter((project) => {
    const title = normalizeProjectTitle(projectTitle(project));
    const key = title || project.projectId;
    if (!key || seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
}

function normalizeProjectTitle(title = "") {
  return String(title || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function saveActiveProject() {
  const project = activeProject();
  if (!project) return;
  project.productPlan = state.productPlan;
  project.lastChatTurn = state.lastChatTurn;
  project.activeTrace = state.activeTrace;
  project.pendingConfirmation = state.pendingConfirmation;
  project.runtimeError = state.runtimeError;
  project.runtimeProvider = state.runtimeProvider;
  project.runtimeBinding = state.activeTrace?.runtimeBinding || project.runtimeBinding || null;
  project.contactInfo = { ...state.contactInfo };
  project.title = state.productPlan ? projectTitleFromPlan(state.productPlan) : (project.title || t("newDraftTitle"));
}

function activateProject(projectId) {
  saveActiveProject();
  const project = state.projects.find((item) => item.projectId === projectId);
  if (!project) return false;
  state.activeProjectId = project.projectId;
  state.productPlan = project.productPlan || null;
  state.chatSessionId = project.chatSessionId || createSessionId(project.projectId);
  state.lastChatTurn = project.lastChatTurn || null;
  state.activeTrace = project.activeTrace || null;
  state.pendingConfirmation = project.pendingConfirmation || null;
  state.runtimeError = project.runtimeError || "";
  state.runtimeProvider = project.runtimeProvider || state.runtimeProvider || INITIAL_RUNTIME_PROVIDER;
  state.contactInfo = { ...(project.contactInfo || state.productPlan?.contactInfo || { name: "", email: "" }) };
  state.activeSidebar = "chat";
  return true;
}

function upsertProjectFromPlan(productPlan, fields = {}) {
  if (!productPlan?.planId) return null;
  let project = state.projects.find((item) => item.projectId === productPlan.planId || item.productPlan?.planId === productPlan.planId);
  if (!project && state.activeProjectId) {
    const active = activeProject();
    if (active?.isDraft) project = active;
  }
  if (!project) {
    project = createProjectRecord({ productPlan, kind: fields.kind || "user" });
    state.projects.unshift(project);
  }
  const wasDraft = Boolean(project.isDraft);
  project.projectId = productPlan.planId;
  project.isDraft = false;
  project.productPlan = productPlan;
  project.title = projectTitleFromPlan(productPlan);
  project.chatSessionId = fields.chatSessionId || (wasDraft ? createSessionId(productPlan.planId) : project.chatSessionId) || createSessionId(productPlan.planId);
  project.lastChatTurn = fields.lastChatTurn ?? project.lastChatTurn ?? null;
  project.activeTrace = fields.activeTrace ?? project.activeTrace ?? null;
  project.pendingConfirmation = fields.pendingConfirmation ?? project.pendingConfirmation ?? null;
  project.runtimeError = fields.runtimeError || "";
  project.runtimeProvider = fields.runtimeProvider || state.runtimeProvider || project.runtimeProvider || INITIAL_RUNTIME_PROVIDER;
  project.runtimeBinding = fields.runtimeBinding || project.runtimeBinding || null;
  project.contactInfo = productPlan.contactInfo || project.contactInfo || { name: "", email: "" };
  project.kind = fields.kind || project.kind || "user";
  state.activeProjectId = project.projectId;
  state.productPlan = productPlan;
  state.chatSessionId = project.chatSessionId;
  state.lastChatTurn = project.lastChatTurn;
  state.activeTrace = project.activeTrace;
  state.pendingConfirmation = project.pendingConfirmation;
  state.runtimeError = project.runtimeError;
  state.runtimeProvider = project.runtimeProvider;
  state.contactInfo = { ...project.contactInfo };
  return project;
}

function mergeConversationFromSession(productPlan, messages = []) {
  if (!productPlan || !Array.isArray(messages) || !messages.length) return productPlan;
  const existing = Array.isArray(productPlan.conversation) ? productPlan.conversation : [];
  if (existing.length >= messages.length) return productPlan;
  return {
    ...productPlan,
    conversation: messages.map((message) => ({
      turnId: message.messageId || message.metadata?.turnId || "",
      role: message.role === "assistant" ? "assistant" : "user",
      text: message.content || "",
      assetIds: [],
      createdAt: message.createdAt || ""
    }))
  };
}

function restoredTurnFromChatSession({ payload = {}, project = {}, productPlan = null, pendingConfirmation = null } = {}) {
  const traceEvents = transcriptEventsFromWorkspaceEvents(payload.recentEvents || []);
  if (!traceEvents.length && !pendingConfirmation) return null;
  const messages = payload.messages || [];
  const userMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const assistantMessage = [...messages].reverse().find((message) => message.role === "assistant")?.content || "";
  return normalizeTranscriptTurn({
    ok: true,
    traceState: "restored",
    traceKind: "chat_session",
    userMessage,
    assistantMessage,
    runtimeProvider: project.runtimeProvider || currentRuntimeProvider(),
    modelProvider: project.runtimeProvider || currentRuntimeProvider(),
    runtimeBinding: project.runtimeBinding || null,
    bindingId: project.runtimeBinding?.bindingId || "",
    toolCalls: [],
    toolResults: [],
    modelResponses: [],
    traceEvents,
    eventsAppended: payload.recentEvents || [],
    messages
  });
}

function traceEventFromWorkspaceEvent(event = {}) {
  if (!event?.type) return null;
  return {
    ...(event.payload || {}),
    type: event.type,
    eventId: event.eventId || makeClientId("trace"),
    timestamp: event.timestamp || ""
  };
}

function transcriptEventsFromWorkspaceEvents(events = []) {
  return (events || [])
    .map(traceEventFromWorkspaceEvent)
    .filter(Boolean);
}

function normalizeTranscriptTurn(turn = {}, { traceEvents = [], workspaceEvents = [] } = {}) {
  if (!turn) return turn;
  const persistedEvents = workspaceEvents.length ? workspaceEvents : (turn.eventsAppended || []);
  const mergedEvents = mergeTranscriptEvents(
    turn.traceEvents || [],
    traceEvents,
    transcriptEventsFromWorkspaceEvents(persistedEvents)
  ).slice(-TRANSCRIPT_EVENT_LIMIT);
  return {
    ...turn,
    traceEvents: mergedEvents,
    eventsAppended: turn.eventsAppended || workspaceEvents || []
  };
}

function mergeTranscriptEvents(...eventGroups) {
  const merged = [];
  const byKey = new Map();
  for (const group of eventGroups) {
    for (const rawEvent of group || []) {
      if (!rawEvent?.type) continue;
      const event = {
        ...rawEvent,
        eventId: rawEvent.eventId || ""
      };
      const key = transcriptEventKey(event, merged.length);
      if (byKey.has(key)) {
        const index = byKey.get(key);
        merged[index] = mergeTraceEvent(merged[index], event);
      } else {
        byKey.set(key, merged.length);
        merged.push(event);
      }
    }
  }
  return merged;
}

function mergeTraceEvent(existing = {}, incoming = {}) {
  return {
    ...existing,
    ...incoming,
    eventId: existing.eventId || incoming.eventId || "",
    timestamp: existing.timestamp || incoming.timestamp || "",
    item: {
      ...(existing.item || {}),
      ...(incoming.item || {})
    },
    summary: {
      ...(existing.summary || {}),
      ...(incoming.summary || {})
    }
  };
}

function transcriptEventKey(event = {}, index = 0) {
  const turn = event.turnId || "turn";
  if (["codex_item_started", "codex_item_updated", "codex_item_completed"].includes(event.type)) {
    const itemId = event.itemId || event.item?.id || `${event.itemType || event.item?.type || "item"}:${index}`;
    return `codex-item:${turn}:${event.type}:${itemId}`;
  }
  if (["codex_turn_started", "codex_turn_completed", "codex_turn_failed"].includes(event.type)) {
    return `codex-turn:${turn}:${event.type}`;
  }
  if (["codex_thread_requested", "codex_thread_initializing", "codex_thread_ready", "codex_thread_started"].includes(event.type)) {
    const phase = event.type === "codex_thread_started" || event.type === "codex_thread_ready" ? "ready" : event.type;
    return `codex-thread:${turn}:${phase}:${event.bindingId || event.codexThreadId || event.runtimeBinding?.bindingId || event.workspaceId || ""}`;
  }
  if (event.type === "stream_started") return `stream:${event.sessionId || ""}:${event.runtimeProvider || ""}:${event.modelProvider || ""}`;
  if (event.type === "chat_turn_started") return `chat-start:${turn}:${event.runtimeProvider || ""}:${event.modelProvider || ""}`;
  if (event.type === "context_pack_built") return `context:${turn}:${event.currentRevisionId || ""}:${event.allowedToolCount || 0}`;
  if (event.type === "model_request") return `model-request:${turn}:${event.iteration || 0}:${event.modelProvider || ""}`;
  if (event.type === "model_response") return `model-response:${turn}:${event.iteration || 0}:${event.modelProvider || ""}:${event.toolCallCount || 0}:${event.hasFinalMessage === undefined ? "" : event.hasFinalMessage}:${event.ok}`;
  if (event.type.startsWith("tool_")) return `tool:${turn}:${event.type}:${event.toolCallId || event.toolName || ""}`;
  if (event.type === "confirmation_required" || event.type === "confirmation_resolved") {
    return `confirmation:${event.type}:${event.confirmationId || event.toolCallId || ""}:${event.approved === undefined ? "" : event.approved}`;
  }
  if (event.type === "assistant_message") return `assistant:${event.messageId || event.confirmationId || turn}:${event.text || ""}`;
  if (event.type === "user_message") return `user:${turn}:${event.text || ""}`;
  if (event.type === "chat_turn_completed" || event.type === "chat_turn_failed") return `chat-turn:${turn}:${event.type}`;
  if (event.eventId) return `event:${event.eventId}`;
  return `event:${event.type}:${event.timestamp || ""}:${index}`;
}

function createDraftProject() {
  const project = createProjectRecord({
    title: t("newDraftTitle"),
    kind: "draft",
    isDraft: true
  });
  state.projects.unshift(project);
  activateProject(project.projectId);
  return project;
}

function removeProjectFromList(projectId) {
  const project = projectById(projectId);
  if (!project) return null;
  const title = projectTitle(project);
  const wasActive = project.projectId === state.activeProjectId;
  state.projects = state.projects.filter((item) => item.projectId !== project.projectId);
  if (wasActive) {
    const nextProject = state.projects[0];
    if (nextProject) {
      activateProject(nextProject.projectId);
    } else {
      state.activeProjectId = "";
      state.productPlan = null;
      state.lastChatTurn = null;
      state.activeTrace = null;
      state.pendingConfirmation = null;
      state.runtimeError = "";
      createDraftProject();
    }
  }
  return { title, wasActive };
}

function syncActiveProject(fields = {}) {
  const project = activeProject();
  if (!project) return;
  Object.assign(project, fields);
  saveActiveProject();
}

function createRunningTrace({ message = "", hasRealPlan = false } = {}) {
  return {
    ok: true,
    traceState: "running",
    traceKind: hasRealPlan ? "chat_turn" : "plan_create",
    userMessage: message,
    runtimeProvider: currentRuntimeProvider(),
    modelProvider: currentRuntimeProvider(),
    toolCalls: [],
    toolResults: [],
    modelResponses: [],
    traceEvents: [],
    eventsAppended: [],
    startedAt: new Date().toISOString()
  };
}

function createFailedTrace({ message = "", error = "" } = {}) {
  return {
    ok: false,
    traceState: "failed",
    traceKind: "chat_turn",
    userMessage: message,
    runtimeProvider: currentRuntimeProvider(),
    modelProvider: currentRuntimeProvider(),
    assistantMessage: error || t("sendFailed"),
    toolCalls: [],
    toolResults: [],
    modelResponses: [],
    traceEvents: [],
    eventsAppended: []
  };
}

function createCancelledTrace({ message = "" } = {}) {
  const existing = state.activeTrace || {};
  return {
    ...existing,
    ok: false,
    traceState: "cancelled",
    traceKind: existing.traceKind || "chat_turn",
    userMessage: message || existing.userMessage || "",
    runtimeProvider: existing.runtimeProvider || currentRuntimeProvider(),
    modelProvider: existing.modelProvider || currentRuntimeProvider(),
    assistantMessage: t("sendCancelled"),
    toolCalls: existing.toolCalls || [],
    toolResults: existing.toolResults || [],
    modelResponses: existing.modelResponses || [],
    traceEvents: existing.traceEvents || [],
    eventsAppended: existing.eventsAppended || [],
    cancelledAt: new Date().toISOString()
  };
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function planCreationTrace(response = {}, message = "") {
  return {
    ok: true,
    traceState: "done",
    traceKind: "plan_create",
    userMessage: message,
    runtimeProvider: response.runtimeProvider || currentRuntimeProvider(),
    modelProvider: response.modelProvider || response.runtimeProvider || currentRuntimeProvider(),
    runtimeBinding: response.runtimeBinding || null,
    bindingId: response.bindingId || response.runtimeBinding?.bindingId || "",
    assistantMessage: response.assistantMessage || t("rerunNotice"),
    toolCalls: [],
    toolResults: [],
    modelResponses: response.runtimeBinding ? [{ ok: true, toolCallCount: 0, runtimeBinding: response.runtimeBinding, bindingId: response.runtimeBinding.bindingId || "" }] : [],
    traceEvents: response.traceEvents || [],
    eventsAppended: [],
    revision: response.revision || response.productPlan?.revisions?.at?.(-1) || null,
    productPlan: response.productPlan || null
  };
}

function applyStreamTraceEvent(event = {}, token = state.workspaceToken) {
  if (token !== state.workspaceToken || !state.activeTrace) return;
  const traceEvent = {
    ...event,
    eventId: event.eventId || makeClientId("trace")
  };
  state.activeTrace.traceEvents = mergeTranscriptEvents(
    state.activeTrace.traceEvents || [],
    [traceEvent]
  ).slice(-TRANSCRIPT_EVENT_LIMIT);
  if (traceEvent.runtimeProvider) state.activeTrace.runtimeProvider = normalizeRuntimeProvider(traceEvent.runtimeProvider);
  if (traceEvent.modelProvider) state.activeTrace.modelProvider = traceEvent.modelProvider;
  if (traceEvent.turnId) state.activeTrace.turnId = traceEvent.turnId;
  if (traceEvent.runtimeBinding) state.activeTrace.runtimeBinding = traceEvent.runtimeBinding;
  if (traceEvent.bindingId) state.activeTrace.bindingId = traceEvent.bindingId;
  if (traceEvent.codexThreadId) state.activeTrace.bindingId = traceEvent.codexThreadId;
  if (traceEvent.type === "model_response") {
    state.activeTrace.modelResponses = [
      ...(state.activeTrace.modelResponses || []),
      {
        ok: Boolean(traceEvent.ok),
        toolCallCount: traceEvent.toolCallCount || 0,
        hasFinalMessage: Boolean(traceEvent.hasFinalMessage),
        errorCode: traceEvent.error?.code || "",
        errorMessage: traceEvent.error?.message || "",
        runtimeBinding: traceEvent.runtimeBinding || null,
        bindingId: traceEvent.bindingId || traceEvent.runtimeBinding?.bindingId || traceEvent.codexThreadId || ""
      }
    ];
  }
  syncActiveProject({ activeTrace: state.activeTrace, runtimeProvider: state.runtimeProvider });
  render({ scrollConversationToBottom: true });
}

async function sendTurn(message) {
  const token = ++state.workspaceToken;
  const hasRealPlan = state.productPlan?.planId && !state.productPlan.planId.startsWith("fallback");
  const controller = new AbortController();
  state.loading = true;
  state.activeRequestController = controller;
  state.runtimeError = "";
  state.activeTrace = createRunningTrace({ message, hasRealPlan });
  state.lastChatTurn = null;
  syncActiveProject({ runtimeError: "", activeTrace: state.activeTrace, lastChatTurn: null, runtimeProvider: state.runtimeProvider });
  render({ scrollConversationToBottom: true });
  try {
    const response = hasRealPlan
      ? await apiPostStream(`/api/workspaces/${state.productPlan.planId}/chat/turn/stream`, {
        sessionId: state.chatSessionId,
        userMessage: message,
        runtime: currentRuntimeProvider(),
        modelProvider: currentRuntimeProvider(),
        runtimeProvider: currentRuntimeProvider()
      }, (event) => applyStreamTraceEvent(event, token), { signal: controller.signal })
      : await apiPostStream("/api/plans/stream", {
        initialMessage: message,
        language: state.lang,
        runtime: currentRuntimeProvider(),
        modelProvider: currentRuntimeProvider(),
        runtimeProvider: currentRuntimeProvider()
      }, (event) => applyStreamTraceEvent(event, token), { signal: controller.signal });
    if (token !== state.workspaceToken) return;
    if (!response.productPlan) throw new Error("ProductPlan was not returned.");
    const streamTraceEvents = state.activeTrace?.traceEvents || [];
    const completedTrace = normalizeTranscriptTurn(
      hasRealPlan ? response : planCreationTrace(response, message),
      {
        traceEvents: streamTraceEvents,
        workspaceEvents: response.eventsAppended || []
      }
    );
    upsertProjectFromPlan(response.productPlan, {
      lastChatTurn: completedTrace,
      activeTrace: null,
      pendingConfirmation: response.pendingConfirmation || null,
      runtimeError: "",
      runtimeBinding: response.runtimeBinding || completedTrace.runtimeBinding || null
    });
    state.lastChatTurn = completedTrace;
    state.activeTrace = null;
    state.pendingConfirmation = response.pendingConfirmation || null;
    state.activeSidebar = "chat";
    setNotice(response.pendingConfirmation ? t("chatConfirmationRequired") : (hasRealPlan ? t("chatRuntimeNotice") : t("rerunNotice")));
    refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
    return true;
  } catch (error) {
    if (token !== state.workspaceToken) return;
    if (isAbortError(error)) {
      state.runtimeError = "";
      state.activeTrace = createCancelledTrace({ message });
      state.pendingConfirmation = null;
      syncActiveProject({ runtimeError: "", activeTrace: state.activeTrace, pendingConfirmation: null });
      state.activeSidebar = "chat";
      setNotice(t("sendCancelled"));
      return false;
    }
    state.runtimeError = userFacingError(error);
    state.activeTrace = createFailedTrace({ message, error: state.runtimeError });
    state.pendingConfirmation = null;
    syncActiveProject({ runtimeError: state.runtimeError, activeTrace: state.activeTrace, pendingConfirmation: null });
    state.activeSidebar = "chat";
    setNotice(t("sendFailed"));
    return false;
  } finally {
    if (token !== state.workspaceToken) {
      if (state.activeRequestController === controller) state.activeRequestController = null;
      return;
    }
    state.loading = false;
    state.activeRequestController = null;
    render({ scrollConversationToBottom: true });
  }
}

function cancelActiveTurn() {
  if (!state.loading || !state.activeRequestController) return false;
  state.activeRequestController.abort();
  return true;
}

async function resolveChatConfirmation(approved) {
  if (!state.productPlan || !state.pendingConfirmation || state.loading) return;
  const token = ++state.workspaceToken;
  state.loading = true;
  render({ scrollConversationToBottom: true });
  try {
    const response = await apiPost(`/api/workspaces/${state.productPlan.planId}/chat/confirm`, {
      sessionId: state.chatSessionId,
      confirmationId: state.pendingConfirmation.confirmationId,
      approved
    });
    if (token !== state.workspaceToken) return;
    state.productPlan = response.productPlan || state.productPlan;
    state.lastChatTurn = normalizeTranscriptTurn(response, {
      workspaceEvents: response.eventsAppended || []
    });
    state.pendingConfirmation = null;
    state.runtimeError = "";
    syncActiveProject({
      productPlan: state.productPlan,
      lastChatTurn: state.lastChatTurn,
      pendingConfirmation: null,
      runtimeError: ""
    });
    setNotice(approved ? t("chatRuntimeNotice") : t("actionNotice") + t("rejectChange"));
  } catch (error) {
    if (token !== state.workspaceToken) return;
    state.runtimeError = userFacingError(error);
    syncActiveProject({ runtimeError: state.runtimeError });
    setNotice(t("sendFailed"));
  } finally {
    if (token !== state.workspaceToken) return;
    state.loading = false;
    render({ scrollConversationToBottom: true });
  }
}

async function submitForReview() {
  if (!state.productPlan || state.submittingReview) return;
  state.submittingReview = true;
  syncContactInfoFromDom();
  if (!state.contactInfo.name.trim() || !state.contactInfo.email.trim()) {
    setNotice(t("submitNeedContact"));
    state.submittingReview = false;
    render();
    return;
  }
  state.loading = true;
  render();
  try {
    const response = await apiPost("/api/review/submit", {
      planId: state.productPlan.planId,
      revisionId: state.productPlan.currentRevisionId,
      contactInfo: state.contactInfo
    });
    state.productPlan = response.productPlan || state.productPlan;
    state.productPlan.reviewSubmission = response.submission || state.productPlan.reviewSubmission;
    syncActiveProject({ productPlan: state.productPlan });
    setNotice(t("submittedNotice"));
    closeFloating();
  } catch (error) {
    state.runtimeError = userFacingError(error);
    syncActiveProject({ runtimeError: state.runtimeError });
    setNotice(t("sendFailed"));
  } finally {
    state.loading = false;
    state.submittingReview = false;
    render();
  }
}

async function revertToRevision(revisionId) {
  if (!state.productPlan || !revisionId) return;
  state.loading = true;
  render();
  try {
    const response = await apiPost(`/api/plans/${state.productPlan.planId}/revert`, { revisionId });
    state.productPlan = response.productPlan || state.productPlan;
    state.runtimeError = "";
    syncActiveProject({ productPlan: state.productPlan, runtimeError: "" });
    state.activeSidebar = "chat";
    setNotice(t("revisionReverted"));
  } catch (error) {
    state.runtimeError = userFacingError(error);
    syncActiveProject({ runtimeError: state.runtimeError });
    setNotice(t("sendFailed"));
  } finally {
    state.loading = false;
    render({ scrollConversationToBottom: true });
  }
}

function syncContactInfoFromDom() {
  const name = document.querySelector('[data-contact-field="name"]');
  const email = document.querySelector('[data-contact-field="email"]');
  if (name) state.contactInfo.name = name.value;
  if (email) state.contactInfo.email = email.value;
}

async function apiPost(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: { message: text.slice(0, 240) } };
    }
  }
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function apiGet(path) {
  const response = await fetch(path, {
    method: "GET",
    headers: { accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error?.message || `HTTP ${response.status}`);
  }
  return payload;
}

async function refreshRuntimeStatus({ renderAfter = true } = {}) {
  const requestId = ++state.runtimeStatusRequestId;
  state.runtimeStatusLoading = true;
  state.runtimeStatusError = "";
  if (renderAfter) renderStaticText();
  try {
    const payload = await apiGet(runtimeStatusPath());
    if (requestId !== state.runtimeStatusRequestId) return;
    state.runtimeStatus = payload;
    state.runtimeStatusError = "";
  } catch (error) {
    if (requestId !== state.runtimeStatusRequestId) return;
    state.runtimeStatus = null;
    state.runtimeStatusError = userFacingError(error);
  } finally {
    if (requestId === state.runtimeStatusRequestId) {
      state.runtimeStatusLoading = false;
      if (renderAfter) renderStaticText();
    }
  }
}

function refreshRuntimeStatusForProjectBoundary() {
  state.runtimeStatus = null;
  state.runtimeStatusError = "";
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
}

function runtimeStatusPath() {
  const params = new URLSearchParams({
    runtimeProvider: currentRuntimeProvider(),
    modelProvider: currentRuntimeProvider()
  });
  if (state.productPlan?.planId) params.set("workspaceId", state.productPlan.planId);
  return `/api/runtime/status?${params.toString()}`;
}

function runtimeStatusText() {
  if (state.runtimeStatusLoading) return t("runtimeStatusChecking");
  if (state.runtimeStatusError) return t("runtimeStatusCheckFailed", state.runtimeStatusError);
  const status = state.runtimeStatus;
  const runtime = currentRuntimeProvider();
  if (!status?.runtimes) return t("runtimeStatusChecking");
  if (runtime === "codex") return codexRuntimeStatusLine(status.runtimes.codex || {});
  if (runtime === "forge-query-engine") return t("runtimeStatusQueryReady");
  return t("runtimeStatusLocalReady");
}

function runtimeStatusTone() {
  if (state.runtimeStatusLoading) return "checking";
  if (state.runtimeStatusError) return "warning";
  const runtime = currentRuntimeProvider();
  const codex = state.runtimeStatus?.runtimes?.codex;
  if (runtime === "codex" && codex && !codex.available) return "warning";
  return "ready";
}

function codexRuntimeStatusLine(codex = {}) {
  if (!codex.available) return codex.message ? `${t("runtimeStatusCodexMissing")} · ${codex.message}` : t("runtimeStatusCodexMissing");
  const binding = codex.runtimeBinding || null;
  const bindingId = codex.bindingId || binding?.bindingId || "";
  if (binding?.status === "failed") {
    return `${t("runtimeStatusCodexFailed")} · ${binding.error?.message || binding.error?.code || ""}`.trim();
  }
  if (bindingId) return `${t("runtimeStatusCodexReady")} · ${t("runtimeStatusCodexThread", compactId(bindingId))}`;
  if (codex.workspaceId) return `${t("runtimeStatusCodexReady")} · ${t("runtimeStatusCodexNoThread")}`;
  return `${t("runtimeStatusCodexReady")} · ${t("runtimeStatusNoWorkspace")}`;
}

async function apiPostStream(path, body, onTraceEvent = () => {}, { signal = null } = {}) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      accept: "text/event-stream",
      "content-type": "application/json"
    },
    body: JSON.stringify(body),
    signal
  });
  if (!response.ok || !response.body) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload = null;
  let errorPayload = null;

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
      const processed = processSseBuffer(buffer, (event) => {
        if (event.eventName === "trace") onTraceEvent(event.data);
        if (event.eventName === "final") finalPayload = event.data;
        if (event.eventName === "error") errorPayload = event.data;
      });
      buffer = processed.remaining;
    }
    if (done) break;
  }
  if (buffer.trim()) {
    processSseBlock(buffer, (event) => {
      if (event.eventName === "trace") onTraceEvent(event.data);
      if (event.eventName === "final") finalPayload = event.data;
      if (event.eventName === "error") errorPayload = event.data;
    });
  }
  if (errorPayload && !finalPayload) {
    throw new Error(errorPayload?.error?.message || "Stream request failed.");
  }
  if (!finalPayload) throw new Error("Stream ended before returning a final payload.");
  if (finalPayload?.ok === false) {
    throw new Error(finalPayload?.error?.message || "Stream final payload failed.");
  }
  return finalPayload;
}

function processSseBuffer(buffer, onEvent) {
  const chunks = buffer.split(/\n\n/);
  const remaining = chunks.pop() || "";
  chunks.forEach((chunk) => processSseBlock(chunk, onEvent));
  return { remaining };
}

function processSseBlock(block, onEvent) {
  const lines = String(block || "").split(/\n/);
  let eventName = "message";
  const dataLines = [];
  lines.forEach((line) => {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  });
  if (!dataLines.length) return;
  try {
    onEvent({ eventName, data: JSON.parse(dataLines.join("\n")) });
  } catch {
    // Ignore malformed stream chunks; the final payload/error still decides the turn.
  }
}

function userFacingError(error) {
  return error instanceof Error ? error.message : String(error || t("fallbackNotice"));
}

function render({ scrollConversationToBottom = false } = {}) {
  renderStaticText();
  renderActiveStates();
  renderProjectList();
  renderConversation();
  renderInspector();
  renderModelFullscreen();
  renderPopovers();
  if (scrollConversationToBottom) scheduleConversationScrollToBottom();
  window.requestAnimationFrame(drawPreview);
}

function scheduleConversationScrollToBottom() {
  if (state.activeSidebar !== "chat" || !dom.conversation) return;
  window.requestAnimationFrame(() => {
    dom.conversation.scrollTop = dom.conversation.scrollHeight;
    window.requestAnimationFrame(() => {
      dom.conversation.scrollTop = dom.conversation.scrollHeight;
    });
  });
}

function renderStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");
  setText("#newProject span:last-child", t("newProject"));
  setText(".sidebar-label", t("projectLabel"));
  setText("#openSettings span:last-child", t("settingsButton"));
  setText("#previewSnapshot", t("previewSnapshot"));
  setText("#submitReview", t("submitOrder"));
  setText("#topbarTitle", currentTopbarTitle());
  if (dom.draftStatus) {
    dom.draftStatus.textContent = "";
    dom.draftStatus.hidden = true;
  }
  setText("#composerSummary", composerSummaryText());
  setText("#scopeLevel", composerMetaText());
  dom.scopeLevel?.classList.toggle("active", currentRuntimeProvider() === "codex" || state.loading);
  setAttr("#scopeLevel", "aria-label", t("runtimeQuickAria"));
  setAttr("#scopeLevel", "title", t("runtimeQuickAria"));
  setAttr(".primary-nav", "aria-label", t("projectActionsAria"));
  setAttr(".thread-list", "aria-label", t("projectListAria"));
  setAttr(".inspector", "aria-label", t("inspectorAria"));
  setAttr("#runChain", "aria-label", state.loading ? t("cancelRunAria") : t("runChainAria"));
  setAttr("#runChain", "title", state.loading ? t("cancelRunAria") : t("runChainAria"));
  setAttr("#runChain", "aria-busy", state.loading ? "true" : "false");
  if (dom.runChain) dom.runChain.dataset.running = state.loading ? "true" : "false";
  setAttr("#languageSelect", "aria-label", t("languageSelectAria"));
  setAttr(".thread-popover", "aria-label", t("threadMenuAria"));
  setAttr(".detail-popover", "aria-label", t("sections.model"));
  setAttr(".review-contact-dialog", "aria-label", t("reviewContactTitle"));
  setAttr(".model-fullscreen-dialog", "aria-label", t("modelFullscreenAria"));
  setAttr(".model-fullscreen-exit", "aria-label", t("closeModelFullscreen"));
  if (dom.ideaInput) dom.ideaInput.placeholder = t("composerPlaceholder");
  if (dom.apiStatus) dom.apiStatus.textContent = state.notice || "";

  const actionLabels = {
    rename: t("threadRename"),
    history: t("threadHistory"),
    duplicate: t("threadDuplicate"),
    export: t("threadExport"),
    remove: t("threadRemove")
  };
  Object.entries(actionLabels).forEach(([action, label]) => setText(`[data-action="${action}"]`, label));

  setText(".settings-dialog .floating-head strong", t("settingsTitle"));
  setText('[data-settings-tab="language"]', t("language"));
  const settingRows = document.querySelectorAll(".settings-row");
  t("settingsRows").forEach(([title, detail], index) => {
    const row = settingRows[index];
    if (!row) return;
    row.querySelector("strong").textContent = title;
    row.querySelector("small").textContent = detail;
  });
  if (dom.languageSelect) {
    dom.languageSelect.value = state.lang;
    dom.languageSelect.querySelector('option[value="zh"]').textContent = t("langZh");
    dom.languageSelect.querySelector('option[value="en"]').textContent = t("langEn");
  }
  if (dom.runtimeProviderSelect) {
    dom.runtimeProviderSelect.value = currentRuntimeProvider();
    dom.runtimeProviderSelect.querySelector('option[value="mock"]').textContent = t("runtimeLocal");
    dom.runtimeProviderSelect.querySelector('option[value="forge-query-engine"]').textContent = t("runtimeQueryEngine");
    dom.runtimeProviderSelect.querySelector('option[value="codex"]').textContent = t("runtimeCodex");
    setAttr("#runtimeProviderSelect", "aria-label", t("runtimeMode"));
  }
  if (dom.runtimeStatus) {
    dom.runtimeStatus.textContent = runtimeStatusText();
    dom.runtimeStatus.dataset.status = runtimeStatusTone();
  }
  setText(".review-contact-dialog .floating-head strong", t("reviewContactTitle"));
  setText("#reviewContactNameLabel", t("contactName"));
  setText("#reviewContactEmailLabel", t("contactEmail"));
  setText("#reviewContactHint", t("contactHint"));
  setText("#confirmReviewSubmit", t("reviewSubmitConfirm"));
  syncContactInputValue("name");
  syncContactInputValue("email");
}

function syncContactInputValue(fieldName) {
  const input = document.querySelector(`[data-contact-field="${fieldName}"]`);
  if (!input || document.activeElement === input) return;
  input.value = state.contactInfo[fieldName] || "";
}

function renderActiveStates() {
  dom.newProject?.classList.toggle("active", !state.productPlan);
}

function renderProjectList() {
  const list = document.querySelector(".thread-list");
  if (!list) return;
  const projects = state.projects;
  if (!projects.length) {
    list.innerHTML = `
      <div class="thread-row active">
        <button class="thread-row-main" type="button" data-new-project-row>
          <span class="project-dot"></span>
          <strong>${escapeHtml(t("newDraftTitle"))}</strong>
        </button>
      </div>
    `;
    return;
  }

  const rows = projects;
  list.innerHTML = rows
    .map(
      (project) => {
        const title = projectTitle(project);
        return `
          <div class="thread-row ${project.projectId === state.activeProjectId ? "active" : ""}" data-project-row="${escapeHtml(project.projectId)}">
            <button class="thread-row-main" type="button" data-sidebar-project="${escapeHtml(project.projectId)}" aria-label="${escapeHtml(title)}">
              <span class="project-dot"></span>
              <strong>${escapeHtml(title)}</strong>
            </button>
            <button class="project-row-menu-button" type="button" data-project-menu="${escapeHtml(project.projectId)}" aria-label="${escapeHtml(t("projectMenuAria", title))}" title="${escapeHtml(t("threadMenuAria"))}">...</button>
          </div>
        `;
      }
    )
    .join("");
}

function renderConversation() {
  if (state.activeSidebar === "history") {
    renderHistoryWorkspace();
    return;
  }
  if (state.activeSidebar === "review") {
    renderReviewWorkspace();
    return;
  }
  renderChatWorkspace();
}

function renderChatWorkspace() {
  const processedTranscript = processedTranscriptViewModel(state.activeTrace || state.lastChatTurn, state.pendingConfirmation);
  if (!state.productPlan) {
    dom.workspaceView.innerHTML = `
      <section class="workspace-card">
        <p>${escapeHtml(t("noPlan"))}</p>
        ${state.runtimeError ? `<p class="error-message">${escapeHtml(state.runtimeError)}</p>` : ""}
      </section>
      ${renderTranscriptSection(processedTranscript)}
    `;
    return;
  }
  const messages = visibleConversationMessages(state.productPlan.conversation || [], processedTranscript);
  dom.workspaceView.innerHTML = `
    <div class="message-stack">
      ${messages.map((turn) => renderMessage(turn)).join("")}
    </div>
    ${renderTranscriptSection(processedTranscript)}
    ${state.runtimeError ? `<section class="inline-panel runtime-error-panel"><p class="error-message">${escapeHtml(state.runtimeError)}</p></section>` : ""}
  `;
}

function renderHistoryWorkspace() {
  const revision = currentRevision();
  const revisions = state.productPlan?.revisions || [];
  dom.workspaceView.innerHTML = `
    <section class="workspace-card history-workspace">
      <div class="workspace-head">
        <strong>${escapeHtml(t("historyTitle"))}</strong>
        <span>${escapeHtml(t("currentRevision"))}: ${escapeHtml(revision?.revisionId || "-")}</span>
      </div>
      <p class="workspace-copy">${escapeHtml(t("historyIntro"))}</p>
      <div class="snapshot-facts compact">
        <span>
          <small>${escapeHtml(t("revisionCount"))}</small>
          <strong>${escapeHtml(String(revisions.length || 0))}</strong>
        </span>
        <span>
          <small>ProductPlan</small>
          <strong>${escapeHtml(planTitle(revision))}</strong>
        </span>
        <span>
          <small>Status</small>
          <strong>${escapeHtml(planStatusText())}</strong>
        </span>
      </div>
      <div class="queue-list">
        ${revisions.map((item, index) => `
          <div class="queue-item ${item.revisionId === state.productPlan.currentRevisionId ? "queued" : ""}">
            <button type="button" data-history-revision="${escapeHtml(item.revisionId)}">
              <span>${escapeHtml(t("revisionBadge", index))}</span>
              <strong>${escapeHtml(planTitle(item))}</strong>
              <p>${escapeHtml(compactDiffSummary(item))}</p>
            </button>
            ${item.revisionId === state.productPlan.currentRevisionId ? "" : `<button class="queue-revert" type="button" data-revert-revision="${escapeHtml(item.revisionId)}">${escapeHtml(t("revertRevision"))}</button>`}
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReviewWorkspace() {
  const revision = currentRevision();
  const review = state.productPlan?.reviewSubmission || {};
  dom.workspaceView.innerHTML = `
    <section class="workspace-card review-workspace">
      <div class="workspace-head">
        <strong>${escapeHtml(t("reviewPacketTitle"))}</strong>
        <span>${escapeHtml(review.status || planStatusText())}</span>
      </div>
      <p class="workspace-copy">${escapeHtml(t("reviewAudience"))}</p>
      <div class="packet-status ${review.accepted ? "ready" : "quote"}">${escapeHtml(t("noManufacturing"))}</div>
      <div class="review-packet">
        <strong class="packet-heading">${escapeHtml(t("reviewChecklistTitle"))}</strong>
        ${t("reviewChecklist").map((item) => `<div class="packet-item">${escapeHtml(item)}</div>`).join("")}
      </div>
      <p class="section-note">${escapeHtml(t("reviewRiskNote"))}</p>
      <div class="segmented-row">
        <button type="button" data-review-action="contact">${escapeHtml(t("reviewContactCta"))}</button>
        <button type="button" class="active" data-review-action="submit">${escapeHtml(t("reviewSubmitCta"))}</button>
      </div>
      <div class="code-output compact">${escapeHtml(JSON.stringify({
        planId: state.productPlan?.planId || "",
        revisionId: revision?.revisionId || "",
        status: state.productPlan?.status || "",
        quote: revision?.quoteEstimate?.range || revision?.quote?.range || "",
        riskItems: revision?.riskReport?.items?.length || 0
      }, null, 2))}</div>
    </section>
  `;
}

function renderMessage(turn) {
  const role = turn.role === "assistant" ? "ai" : "user";
  return `
    <article class="message ${role}">
      <div class="bubble">
        <p>${escapeHtml(turn.text)}</p>
      </div>
    </article>
  `;
}

function visibleConversationMessages(messages = [], processed = null) {
  if (!processed?.finalText || !Array.isArray(messages) || !messages.length) return messages || [];
  const finalText = normalizeDisplayText(processed.finalText);
  if (!finalText) return messages;
  const lastAssistantIndex = messages.reduce((lastIndex, turn, index) => (
    turn?.role === "assistant" ? index : lastIndex
  ), -1);
  return messages.filter((turn, index) => {
    if (index !== lastAssistantIndex || turn?.role !== "assistant") return true;
    return normalizeDisplayText(turn.text) !== finalText;
  });
}

function normalizeDisplayText(text = "") {
  return codexDisplayText(text).replace(/\s+/g, " ").trim();
}

function renderTranscriptSection(processed = null) {
  const view = processed || processedTranscriptViewModel(state.activeTrace || state.lastChatTurn, state.pendingConfirmation);
  if (!view) return "";
  const expanded = processedTranscriptExpanded(view);
  return `
    <section class="transcript-panel processed-transcript" aria-label="${escapeHtml(t("chatTraceTitle"))}">
      ${renderProcessedTranscriptHeader(view, expanded)}
      ${renderProcessedWorkDetails(view, expanded)}
      ${renderProcessedFinalMessage(view)}
    </section>
  `;
}

function renderProcessedTranscriptHeader(view = {}, expanded = false) {
  const duration = view.durationText ? ` ${view.durationText}` : "";
  return `
    <button class="processed-transcript-head" type="button" data-processed-toggle="${escapeHtml(view.key)}" aria-expanded="${expanded ? "true" : "false"}" aria-label="${escapeHtml(expanded ? t("processedCollapse") : t("processedExpand"))}">
      <span>${escapeHtml(processedStatusLabel(view))}${escapeHtml(duration)}</span>
      <strong>${expanded ? "v" : ">"}</strong>
    </button>
  `;
}

function renderProcessedFinalMessage(view = {}) {
  if (!view.finalText) return "";
  return `
    <article class="message ai processed-final-message">
      <div class="bubble">
        ${renderProcessedTextBlocks(view.finalText)}
      </div>
    </article>
  `;
}

function renderProcessedWorkDetails(view = {}, expanded = false) {
  if (!expanded) return "";
  const content = [
    ...view.progressTexts.map((text) => renderProcessedTextBlocks(text, "processed-work-text")),
    view.todoItems.length ? renderProcessedTodoList(view.todoItems) : "",
    renderProcessedActionRows(view),
    renderProcessedPending(view)
  ].filter(Boolean).join("");
  return `
    <div class="processed-work-details">
      ${content || `<p class="processed-empty">${escapeHtml(t("processedNoWork"))}</p>`}
    </div>
  `;
}

function renderProcessedTodoList(items = []) {
  return `
    <ul class="processed-todo-list">
      ${items.map((item) => `
        <li data-completed="${item.completed ? "true" : "false"}">
          <span>${item.completed ? "x" : ""}</span>
          <p>${renderInlineText(item.text || "")}</p>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderProcessedActionRows(view = {}) {
  const rows = [];
  if (view.todoTotal) {
    rows.push({
      id: "todo",
      label: t("processedTodo"),
      value: state.lang === "zh"
        ? `${view.todoCompleted}/${view.todoTotal} 个任务`
        : `${view.todoCompleted}/${view.todoTotal} tasks`
    });
  }
  if (view.exploredCount) {
    rows.push({
      id: "commands",
      label: t("processedExplored"),
      value: localizedCount(view.exploredCount, "个只读动作", "read-only action", "read-only actions"),
      details: view.commandDetails.filter((item) => item.kind === "explored")
    });
  }
  if (view.runCount) {
    rows.push({
      id: "commands",
      label: t("processedRan"),
      value: localizedCount(view.runCount, "个动作", "action", "actions"),
      details: view.commandDetails.filter((item) => item.kind === "ran")
    });
  }
  if (view.fileChangeCount) {
    rows.push({
      id: "files",
      label: t("processedEdited"),
      value: localizedCount(view.fileChangeCount, "个文件", "file", "files"),
      details: view.fileDetails
    });
  }
  if (view.toolCount) {
    rows.push({
      id: "tools",
      label: t("processedTool"),
      value: localizedCount(view.toolCount, "次", "time", "times"),
      details: view.toolDetails
    });
  }
  if (!rows.length) return "";
  return `
    <div class="processed-action-list">
      ${rows.map((row, index) => renderProcessedActionRow(view, row, index)).join("")}
    </div>
  `;
}

function renderProcessedActionRow(view = {}, row = {}, index = 0) {
  const detailKey = processedDetailKey(view.key, row.id || row.label, index);
  const hasDetails = Array.isArray(row.details) && row.details.length > 0;
  const expanded = hasDetails && state.expandedProcessedDetails.has(detailKey);
  const content = `
    <span>${escapeHtml(row.label)}</span>
    <p>${escapeHtml(row.value)}</p>
    ${hasDetails ? `<strong>${expanded ? "v" : ">"}</strong>` : ""}
  `;
  return `
    <div class="processed-action-group">
      ${hasDetails ? `
        <button class="processed-action-row" type="button" data-processed-detail-toggle="${escapeHtml(detailKey)}" aria-expanded="${expanded ? "true" : "false"}">
          ${content}
        </button>
      ` : `
        <div class="processed-action-row">
          ${content}
        </div>
      `}
      ${expanded ? renderProcessedDetailList(row.id, row.details) : ""}
    </div>
  `;
}

function renderProcessedDetailList(kind = "", details = []) {
  if (!details.length) return "";
  if (kind === "files") {
    return `
      <ul class="processed-detail-list">
        ${details.map((item) => `
          <li>
            <span>${escapeHtml(item.kind || "update")}</span>
            <code>${escapeHtml(item.path || "")}</code>
            ${item.status ? `<small>${escapeHtml(item.status)}</small>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
  }
  if (kind === "tools") {
    return `
      <ul class="processed-detail-list">
        ${details.map((item) => `
          <li>
            <span>${escapeHtml(item.status || "tool")}</span>
            <code>${escapeHtml([item.server, item.tool].filter(Boolean).join("/") || "")}</code>
            ${item.error ? `<small>${escapeHtml(item.error)}</small>` : ""}
          </li>
        `).join("")}
      </ul>
    `;
  }
  return `
    <ul class="processed-detail-list">
      ${details.map((item) => `
        <li>
          <span>${escapeHtml(item.status || item.kind || "")}</span>
          <code>${escapeHtml(item.command || "")}</code>
          ${item.exitCode !== "" ? `<small>exit ${escapeHtml(item.exitCode)}</small>` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderProcessedPending(view = {}) {
  if (!view.pending) return "";
  return `
    <div class="processed-confirmation">
      <p>${escapeHtml(t("chatConfirmationRequired"))}</p>
      <div class="segmented-row">
        <button type="button" class="active" data-chat-confirm="approve">${escapeHtml(t("approveChange"))}</button>
        <button type="button" data-chat-confirm="reject">${escapeHtml(t("rejectChange"))}</button>
      </div>
    </div>
  `;
}

function processedTranscriptViewModel(turn = null, pending = null) {
  if (!turn && !pending) return null;
  const events = compactTraceEvents(turn?.traceEvents || []);
  const agentTexts = [];
  const fallbackAssistantTexts = [];
  const reasoningTexts = [];
  const todoByText = new Map();
  const filePaths = new Set();
  const sensitiveSnippets = [];
  const commandDetails = [];
  const fileDetails = [];
  const toolDetails = [];
  let anonymousFileChanges = 0;
  let commandCount = 0;
  let exploredCount = 0;
  let toolCount = 0;
  let webSearchCount = 0;
  let errorText = "";

  for (const event of events) {
    if (event.type === "assistant_message") {
      const text = codexDisplayText(event.text || "");
      if (text) fallbackAssistantTexts.push(text);
      continue;
    }
    if (!["codex_item_started", "codex_item_updated", "codex_item_completed"].includes(event.type)) continue;
    const item = event.item || {};
    const summary = event.summary || {};
    const itemType = event.itemType || item.type || "";
    if (itemType === "agent_message") {
      const text = codexDisplayText(item.text || "");
      if (text) agentTexts.push(text);
    } else if (itemType === "reasoning") {
      const text = String(item.text || "").trim();
      if (text) reasoningTexts.push(text);
    } else if (itemType === "todo_list") {
      for (const todo of item.items || []) {
        const text = String(todo.text || "").trim();
        if (text) todoByText.set(text, { text, completed: Boolean(todo.completed) });
      }
    } else if (itemType === "command_execution") {
      const command = item.command || summary.command || "";
      commandCount += 1;
      addSensitiveSnippet(sensitiveSnippets, "command", command);
      const exploration = isExplorationCommand(command);
      if (exploration) exploredCount += 1;
      commandDetails.push({
        kind: exploration ? "explored" : "ran",
        command,
        status: item.status || summary.status || "",
        exitCode: item.exitCode ?? item.exit_code ?? summary.exitCode ?? summary.exit_code ?? ""
      });
    } else if (itemType === "file_change") {
      const changes = Array.isArray(item.changes) ? item.changes : [];
      if (changes.length) {
        for (const change of changes) {
          if (change?.path) {
            filePaths.add(change.path);
            addSensitiveSnippet(sensitiveSnippets, "path", change.path);
            fileDetails.push({
              kind: change.kind || "update",
              path: change.path,
              status: item.status || summary.status || ""
            });
          } else {
            anonymousFileChanges += 1;
          }
        }
      } else if (summary.changeCount) {
        anonymousFileChanges += Number(summary.changeCount) || 0;
      }
    } else if (itemType === "mcp_tool_call") {
      toolCount += 1;
      toolDetails.push({
        server: item.server || summary.server || "",
        tool: item.tool || summary.tool || "",
        status: item.status || summary.status || "",
        error: item.error?.message || summary.error || ""
      });
    } else if (itemType === "web_search") {
      webSearchCount += 1;
      exploredCount += 1;
    } else if (itemType === "error") {
      errorText = String(item.message || summary.message || "").trim();
    }
  }

  const rawFinalText = lastNonEmpty(agentTexts) || codexDisplayText(turn?.assistantMessage || "") || lastNonEmpty(fallbackAssistantTexts) || errorText;
  const finalText = redactProcessedText(rawFinalText, sensitiveSnippets);
  const progressTexts = [
    ...agentTexts.filter((text) => normalizeDisplayText(text) !== normalizeDisplayText(rawFinalText)),
    ...reasoningTexts
  ].map((text) => redactProcessedText(text, sensitiveSnippets)).filter(Boolean);
  const todoItems = Array.from(todoByText.values()).map((todo) => ({
    ...todo,
    text: redactProcessedText(todo.text, sensitiveSnippets)
  }));
  const runCount = Math.max(0, commandCount - exploredCount);
  return {
    key: processedTranscriptKey(turn, events),
    traceState: turn?.traceState || (pending ? "running" : "done"),
    pending: Boolean(pending),
    finalText,
    progressTexts,
    todoItems,
    todoTotal: todoItems.length,
    todoCompleted: todoItems.filter((item) => item.completed).length,
    exploredCount,
    runCount,
    fileChangeCount: filePaths.size + anonymousFileChanges,
    toolCount,
    webSearchCount,
    commandDetails,
    fileDetails,
    toolDetails,
    durationText: processedDurationText(turn, events)
  };
}

function addSensitiveSnippet(snippets = [], type = "value", value = "") {
  for (const variant of sensitiveSnippetVariants(value, type)) {
    snippets.push({ type, value: variant });
  }
}

function sensitiveSnippetVariants(value = "", type = "value") {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const variants = new Set([raw]);
  if (type === "command") {
    const shellMatch = raw.match(/(?:^|\s)(?:\/bin\/)?(?:bash|zsh|sh)\s+-lc\s+(['"])(.*?)\1/);
    if (shellMatch?.[2]) variants.add(shellMatch[2].trim());
  }
  if (type === "path") {
    const normalized = raw.replaceAll("\\", "/");
    variants.add(normalized);
    for (const marker of ["source-materials/", "notes/", "data/workspaces/"]) {
      const index = normalized.indexOf(marker);
      if (index >= 0) variants.add(normalized.slice(index));
    }
  }
  return Array.from(variants).filter((item) => item.length >= 3);
}

function redactProcessedText(text = "", snippets = []) {
  let safe = String(text || "");
  const unique = [];
  const seen = new Set();
  for (const snippet of snippets || []) {
    const value = String(snippet?.value || "").trim();
    if (value.length < 3 || seen.has(value)) continue;
    seen.add(value);
    unique.push({ type: snippet.type || "value", value });
  }
  unique.sort((a, b) => b.value.length - a.value.length);
  for (const snippet of unique) {
    const label = snippet.type === "path"
      ? (state.lang === "zh" ? "[已隐藏路径]" : "[path hidden]")
      : (state.lang === "zh" ? "[已隐藏指令]" : "[command hidden]");
    safe = safe.split(snippet.value).join(label);
  }
  return safe.trim();
}

function processedTranscriptKey(turn = {}, events = []) {
  const turnId = turn?.turnId || events.find((event) => event.turnId)?.turnId || "";
  if (turnId) return `processed:${turnId}`;
  const eventId = events.find((event) => event.eventId)?.eventId || events.find((event) => event.itemId)?.itemId || "";
  if (eventId) return `processed:${eventId}`;
  return `processed:${state.chatSessionId || "current"}`;
}

function processedTranscriptExpanded(view = {}) {
  if (view.pending || view.traceState === "running") return true;
  return state.expandedProcessedTurns.has(view.key);
}

function toggleProcessedTranscript(key = "") {
  if (!key) return;
  if (state.expandedProcessedTurns.has(key)) state.expandedProcessedTurns.delete(key);
  else state.expandedProcessedTurns.add(key);
  render();
}

function processedDetailKey(turnKey = "", group = "", index = 0) {
  return `processed-detail:${turnKey || "turn"}:${group || "group"}:${index}`;
}

function toggleProcessedDetail(key = "") {
  if (!key) return;
  if (state.expandedProcessedDetails.has(key)) state.expandedProcessedDetails.delete(key);
  else state.expandedProcessedDetails.add(key);
  render();
}

function processedStatusLabel(view = {}) {
  if (view.pending || view.traceState === "running") return t("processedRunning");
  if (view.traceState === "failed" || view.traceState === "blocked") return t("processedFailed");
  if (view.traceState === "cancelled") return t("processedCancelled");
  return t("processedDone");
}

function processedDurationText(turn = {}, events = []) {
  const start = timestampMs(turn?.startedAt) || firstEventTime(events);
  if (!start) return "";
  const end = terminalEventTime(events)
    || timestampMs(turn?.completedAt)
    || timestampMs(turn?.cancelledAt)
    || (turn?.traceState === "running" ? Date.now() : lastEventTime(events));
  if (!end || end < start) return "";
  return formatProcessedDuration(end - start);
}

function firstEventTime(events = []) {
  for (const event of events) {
    const value = timestampMs(event.at || event.timestamp);
    if (value) return value;
  }
  return 0;
}

function lastEventTime(events = []) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const value = timestampMs(events[index]?.at || events[index]?.timestamp);
    if (value) return value;
  }
  return 0;
}

function terminalEventTime(events = []) {
  const terminalTypes = new Set([
    "chat_turn_completed",
    "chat_turn_failed",
    "codex_turn_completed",
    "codex_turn_failed",
    "plan_create_failed"
  ]);
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (!terminalTypes.has(events[index]?.type)) continue;
    const value = timestampMs(events[index]?.at || events[index]?.timestamp);
    if (value) return value;
  }
  return 0;
}

function timestampMs(value = "") {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function formatProcessedDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.floor(Number(durationMs || 0) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function isExplorationCommand(command = "") {
  const text = String(command || "").trim();
  if (!text) return false;
  return /^(rg|grep|find|ls|cat|sed|awk|nl|wc|head|tail|git\s+(status|diff|show|log)|node\s+--check)\b/.test(text);
}

function lastNonEmpty(values = []) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = String(values[index] || "").trim();
    if (value) return value;
  }
  return "";
}

function localizedCount(count = 0, zhUnit = "", enSingular = "", enPlural = "") {
  const value = Number(count || 0);
  if (state.lang === "zh") return `${value} ${zhUnit}`.trim();
  return `${value} ${value === 1 ? enSingular : enPlural}`;
}

function renderProcessedTextBlocks(text = "", className = "processed-text") {
  const value = String(text || "").trim();
  if (!value) return "";
  return value.split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => renderProcessedTextBlock(block, className))
    .join("");
}

function renderProcessedTextBlock(block = "", className = "processed-text") {
  const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const bulletLines = lines.filter((line) => /^[-*]\s+/.test(line));
  if (bulletLines.length && bulletLines.length === lines.length) {
    return `
      <ul class="${escapeHtml(className)} processed-bullets">
        ${bulletLines.map((line) => `<li>${renderInlineText(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}
      </ul>
    `;
  }
  return `<p class="${escapeHtml(className)}">${lines.map(renderInlineText).join("<br>")}</p>`;
}

function renderInlineText(text = "") {
  return String(text || "")
    .split(/(`[^`]+`)/g)
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function compactTraceEvents(events = []) {
  const turnsWithCodexAgentMessage = new Set(events
    .filter((event) => ["codex_item_started", "codex_item_updated", "codex_item_completed"].includes(event?.type))
    .filter((event) => event.itemType === "agent_message" || event.item?.type === "agent_message")
    .map((event) => event.turnId || "")
    .filter(Boolean));
  const laterItemIds = new Set();
  let laterCodexTurnTerminal = false;
  const compacted = [];
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index] || {};
    if (event.type === "assistant_message" && turnsWithCodexAgentMessage.has(event.turnId || "")) continue;
    if (["codex_item_started", "codex_item_updated", "codex_item_completed"].includes(event.type)) {
      const itemKey = event.itemId || event.item?.id || `${event.itemType || "item"}:${index}`;
      if (laterItemIds.has(itemKey)) continue;
      laterItemIds.add(itemKey);
    }
    if (event.type === "codex_turn_started" && laterCodexTurnTerminal) continue;
    if (event.type === "codex_turn_completed" || event.type === "codex_turn_failed") laterCodexTurnTerminal = true;
    compacted.unshift(event);
  }
  return compacted;
}

function codexDisplayText(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.assistantMessage === "string") return parsed.assistantMessage;
  } catch {
    // Non-JSON agent messages are already display text.
  }
  return raw;
}

function runtimeDisplayName(value = "") {
  const normalized = normalizeRuntimeProvider(value || DEFAULT_RUNTIME_PROVIDER);
  if (normalized === "codex") return t("runtimeCodex");
  if (normalized === "forge-query-engine") return "Forge QueryEngine";
  return t("runtimeLocal");
}

function compactId(value = "") {
  const text = String(value || "");
  if (text.length <= 16) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

function toolCallSummary(call, result = {}) {
  if (result.message) return result.message;
  if (result.artifactPaths && Object.values(result.artifactPaths).some(Boolean)) {
    return state.lang === "zh" ? "已返回派生文件路径" : "Returned derived artifact paths";
  }
  if (call.permission?.requiresConfirmation) return call.permission.reason || t("chatConfirmationRequired");
  const count = Array.isArray(call.input?.patches) ? call.input.patches.length : 0;
  if (count) return state.lang === "zh" ? `${count} 个结构化 patch` : `${count} structured patch(es)`;
  return call.input?.message || call.input?.query || "";
}

function renderInspector() {
  const revision = currentRevision();
  if (!revision) {
    dom.inspectorContent.hidden = true;
    dom.inspectorContent.innerHTML = "";
    return;
  }
  dom.inspectorContent.hidden = false;
  const sections = [["model", t("sections.model"), inspectorSectionSummary("model", revision), renderModelSection(revision)]];
  dom.inspectorContent.innerHTML = sections
    .map(([key, title, summary, body]) => {
      const collapsed = state.collapsedSections.has(key);
      return `
        <section class="inspector-card ${key === "model" ? "model-priority" : ""}">
          <button class="card-head inspector-toggle" type="button" data-inspector-toggle="${escapeHtml(key)}">
            <span class="inspector-title">
              <span>${escapeHtml(title)}</span>
              <small>${escapeHtml(summary)}</small>
            </span>
            <strong>${collapsed ? "+" : "-"}</strong>
          </button>
          <div class="inspector-section" ${collapsed ? "hidden" : ""}>${body}</div>
        </section>
      `;
    })
    .join("");
}

function renderModelFullscreen() {
  const dialog = document.querySelector('[data-dialog="modelFullscreen"]');
  if (!dialog) return;
  const revision = currentRevision();
  const canvas = dialog.querySelector('[data-device-canvas="fullscreen"]');
  if (canvas) {
    const previewEngine = revision ? previewEngineForRevision(revision) : "canvas2d";
    canvas.dataset.previewEngine = previewEngine;
    canvas.setAttribute("aria-label", t("sections.model"));
  }
  setText("#modelFullscreenTitle", t("sections.model"));
  setText("#modelFullscreenStatus", revision ? artifactSummary(revision) : t("noPlan"));
  const controls = document.querySelector("#modelFullscreenControls");
  if (controls) controls.innerHTML = revision ? renderPreviewControls() : "";
}

function inspectorSectionSummary(key, revision) {
  if (key === "runtime") {
    const pending = state.pendingConfirmation;
    const turn = state.activeTrace || state.lastChatTurn;
    if (pending) return t("chatConfirmationRequired");
    if (turn?.traceState === "running") return t("chatTraceRunning");
    if (turn?.traceState === "cancelled") return t("sendCancelled");
    if (turn?.ok === false) return t("traceFailed");
    return turn ? t("traceDone") : "";
  }
  if (key === "scope") return planTitle(revision);
  if (key === "parts") return `${revision.modules?.length || 0} modules`;
  if (key === "model") return artifactSummary(revision);
  if (key === "layout") return `${revision.electronicsLayout?.placements?.length || 0} placements`;
  if (key === "quote") return revision.quoteEstimate?.range || revision.quote?.range || "-";
  if (key === "risk") return revision.riskReport?.blocked ? t("planManual") : t("planReady");
  if (key === "review") return state.productPlan.reviewSubmission?.status || planStatusText();
  return "";
}

function renderScopeSection(revision) {
  const spec = revision.spec || {};
  const required = state.productPlan.requiredInputs || {};
  return `
    <div class="kv-list">
      <span>Product <strong>${escapeHtml(spec.product_type || "-")}</strong></span>
      <span>Screen <strong>${escapeHtml(String(spec.enclosure?.screen_size_in || "-"))} in</strong></span>
      <span>Finish <strong>${escapeHtml(spec.enclosure?.finish || "-")}</strong></span>
      <span>Power <strong>${escapeHtml(spec.power || "-")}</strong></span>
    </div>
    <p class="section-note">${escapeHtml(t("required"))}</p>
    <div class="pill-list">
      ${["purpose", "screenSize", "finish"].map((key) => `<span>${escapeHtml(key)}: ${required[key]?.confirmed ? escapeHtml(t("confirmed")) : escapeHtml(t("required"))}</span>`).join("")}
    </div>
  `;
}

function renderPartsSection(revision) {
  return (revision.modules || [])
    .map((module) => `
      <div class="artifact-item ${escapeHtml(module.status)}">
        <span>
          <span>${escapeHtml(module.category)}</span>
          <strong>${escapeHtml(module.name)}</strong>
        </span>
        <b>${escapeHtml(String(module.unitCost || 0))}</b>
      </div>
    `)
    .join("");
}

function renderModelSection(revision) {
  const params = revision.modelPreview?.modelParameters || {};
  const dimensions = params.dimensionsMm || {};
  const pending = generationIsPending(revision);
  const previewEngine = previewEngineForRevision(revision);
  const fitChecks = [
    openingSummary(params.openings, revision.modules),
    placedPartsSummary(revision),
    validationSummary(revision)
  ].filter(Boolean).join(" / ");
  return `
    <div class="preview-card">
      <span class="preview-engine-badge" data-model-render-status="inspector">${escapeHtml(renderPreviewStatus(revision))}</span>
      <button class="preview-fullscreen-button" type="button" data-preview-fullscreen aria-label="${escapeHtml(t("openModelFullscreen"))}">
        <span aria-hidden="true">⛶</span>
      </button>
      <canvas data-device-canvas="inspector" data-preview-id="inspector" data-preview-engine="${escapeHtml(previewEngine)}" width="760" height="520" aria-label="${escapeHtml(t("sections.model"))}"></canvas>
    </div>
    ${renderPreviewControls()}
    ${pending ? `<div class="model-action-row"><button class="snapshot-link primary" type="button" data-model-action="generate">${escapeHtml(t("generateModelCta"))}</button></div>` : ""}
    <div class="kv-list">
      <span>${escapeHtml(t("modelShellPath"))} <strong>${escapeHtml(t("standardShell"))}</strong></span>
      <span>${escapeHtml(t("modelDimensions"))} <strong>${escapeHtml(formatDimensions(dimensions))}</strong></span>
      <span>${escapeHtml(t("modelFitChecks"))} <strong>${escapeHtml(fitChecks)}</strong></span>
      <span>${escapeHtml(t("modelArtifacts"))} <strong>${escapeHtml(artifactSummary(revision))}</strong></span>
    </div>
  `;
}

function renderPreviewControls() {
  return `
    <div class="preview-controls" aria-label="${escapeHtml(t("prototypeViewLabel"))}">
      <span class="preview-controls-label">${escapeHtml(t("prototypeViewLabel"))}</span>
      <span class="preview-control-buttons">
        ${["appearance", "components"].map((mode) => `
          <button class="${state.previewMode === mode ? "active" : ""}" type="button" data-preview-mode="${escapeHtml(mode)}" aria-pressed="${state.previewMode === mode ? "true" : "false"}">
            ${escapeHtml(t(`previewModes.${mode}`))}
          </button>
        `).join("")}
      </span>
    </div>
  `;
}

function formatDimensions(dimensions) {
  const width = dimensions.width || dimensions.widthMm;
  const height = dimensions.height || dimensions.heightMm;
  const depth = dimensions.depth || dimensions.depthMm;
  if (!width || !height || !depth) return "-";
  return `${width} x ${height} x ${depth} mm`;
}

function openingSummary(openings = [], modules = []) {
  const hasDisplay = openings.some((opening) => opening.type === "display") || modules.some((module) => module.category === "Display");
  const hasUsb = openings.some((opening) => opening.id === "usb_c_rear") || modules.some((module) => /usb/i.test(module.name || ""));
  const count = [hasDisplay, hasUsb].filter(Boolean).length || openings.length;
  if (state.lang === "zh") return `${count || 2} 项已标注`;
  return `${count || 2} marked`;
}

function artifactSummary(revision) {
  if (generationIsPending(revision)) return t("generationPending");
  if (revision.modelArtifacts?.status === "blocked") return t("generationInsufficient");
  const artifacts = revision.modelArtifacts?.artifacts || revision.modelPreview?.assets || {};
  const ready = ["glb", "shellFront", "shellBack", "stl", "step"].filter((key) => artifacts[key]);
  if (ready.length === 0) return state.lang === "zh" ? "待生成" : "pending";
  return t("modelArtifactSummary");
}

function generationIsPending(revision) {
  return revision?.generationStatus === "pending_confirmation"
    || revision?.modelArtifacts?.status === "pending_confirmation";
}

function placedPartsSummary(revision) {
  return t("placedParts", placedModules(revision).length);
}

function placedModules(revision) {
  return (revision?.geometrySpec?.modules || []).filter((module) => {
    if (module.category === "Shell") return false;
    if (module.geometryStatus !== "ready") return false;
    if (module.capabilities?.includes("servo_motion")) return false;
    return Boolean(module.dimensionsMm && module.placement?.positionMm);
  });
}

function validationSummary(revision) {
  const validation = revision.geometryValidation || revision.modelArtifacts?.validation || revision.modelPreview?.validation;
  if (!validation) return "-";
  if (validation.canGenerateArtifacts) return t("geometryPassed");
  return t("geometryBlocked");
}

function renderLayoutSection(revision) {
  const layout = revision.electronicsLayout || {};
  const placements = layout.placements || [];
  return `
    ${placements.slice(0, 5).map((item) => `
      <div class="source-item">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.role)} / ${escapeHtml(item.interfaceDirection)}</span>
      </div>
    `).join("")}
    <p class="section-note">${escapeHtml((layout.conflicts || [])[0]?.note || "")}</p>
  `;
}

function renderQuoteSection(revision) {
  const quote = revision.quoteEstimate || {};
  return `
    <div class="quote-grid">
      <span>Range <strong>${escapeHtml(quote.range || revision.quote?.range || "-")}</strong></span>
      ${(quote.lineItems || []).map((item) => `<span>${escapeHtml(item.label)} <strong>$${escapeHtml(String(item.amountUsd || 0))}</strong></span>`).join("")}
    </div>
    <p class="section-note">${escapeHtml((quote.assumptions || [])[1] || "")}</p>
  `;
}

function renderRiskSection(revision) {
  return (revision.riskReport?.items || [])
    .map((item) => `<div class="risk-item ${escapeHtml(item.level === "ok" ? "pass" : item.level)}"><strong>${escapeHtml(item.level)}</strong><span>${escapeHtml(item.text)}</span></div>`)
    .join("");
}

function renderPopovers() {
  const revision = currentRevision();
  if (!revision) {
    const empty = `<strong>${escapeHtml(t("newDraftTitle"))}</strong><p>${escapeHtml(t("noPlan"))}</p>`;
    if (dom.snapshotPopover) dom.snapshotPopover.innerHTML = empty;
    return;
  }
  if (!dom.snapshotPopover) return;
  dom.snapshotPopover.innerHTML = `
    <strong>${escapeHtml(t("sections.model"))}</strong>
    <p>${escapeHtml(t("prototypePreviewSubtitle"))}</p>
    <div class="popover-row selected">
      <span>${escapeHtml(t("shellLabel"))}</span>
      <small>${escapeHtml(t("modelPreviewState"))}</small>
    </div>
    <div class="popover-row selected">
      <span>${escapeHtml(t("screenOpening"))}</span>
      <small>${escapeHtml(t("modelOpenings"))}</small>
    </div>
    <div class="popover-row selected">
      <span>${escapeHtml(t("usbCRear"))}</span>
      <small>${escapeHtml(t("modelReviewReady"))}</small>
    </div>
    <div class="popover-row selected">
      <span>${escapeHtml(t("modelArtifacts"))}</span>
      <small>${escapeHtml(artifactSummary(revision))}</small>
    </div>
    <div class="popover-row selected">
      <span>${escapeHtml(t("sections.parts"))}</span>
      <small>${escapeHtml(placedPartsSummary(revision))}</small>
    </div>
    <p>${escapeHtml(t("modifyThroughChat"))}</p>
    ${generationIsPending(revision) ? `<button class="snapshot-link primary" type="button" data-model-action="generate">${escapeHtml(t("generateModelCta"))}</button>` : ""}
  `;
}

function currentRevision() {
  const plan = state.productPlan;
  if (!plan) return null;
  return plan.revisions?.find((revision) => revision.revisionId === plan.currentRevisionId)
    || plan.revisions?.at(-1)
    || null;
}

function revisionIndex(revision) {
  const revisions = state.productPlan?.revisions || [];
  return Math.max(0, revisions.findIndex((item) => item.revisionId === revision?.revisionId));
}

function revisionBadge(revision) {
  return t("revisionBadge", revisionIndex(revision));
}

function projectTitle(project) {
  if (!project) return t("newDraftTitle");
  if (project.productPlan) return projectTitleFromPlan(project.productPlan);
  return project.title || t("newDraftTitle");
}

function projectTitleFromPlan(plan) {
  if (!plan) return "";
  const revision = plan.revisions?.find((item) => item.revisionId === plan.currentRevisionId)
    || plan.revisions?.at(-1)
    || null;
  return revision ? revisionTitle(revision) : (plan.workspaceState?.title || t("newDraftTitle"));
}

function planTitle(revision) {
  if (!revision) return t("noPlan");
  return revisionTitle(revision);
}

function revisionTitle(revision) {
  const size = revision.spec?.enclosure?.screen_size_in || 5;
  const finish = revision.spec?.enclosure?.finish || "woodgrain";
  const productType = revision.productPlanSnapshot?.productType || revision.spec?.product_archetype || "desktop_display";
  return state.lang === "zh"
    ? `${finishLabel(finish)} ${size} 英寸${productTypeLabel(productType)}`
    : `${finishLabel(finish)} ${size} in ${productTypeLabel(productType)}`;
}

function productTypeLabel(productType) {
  const zh = {
    desktop_display: "桌面屏",
    desk_clock: "桌面闹钟",
    digital_photo_frame: "数字相框",
    sensor_display: "传感器屏",
    manual_expansion: "人工扩展原型"
  };
  const en = {
    desktop_display: "desktop display",
    desk_clock: "desktop clock",
    digital_photo_frame: "digital photo frame",
    sensor_display: "sensor display",
    manual_expansion: "manual expansion prototype"
  };
  return (state.lang === "zh" ? zh : en)[productType] || productType;
}

function compactDiffSummary(revision) {
  const changes = revision?.diff?.changes || [];
  if (!changes.length) return t("noRevisionDiff");
  return changes.slice(0, 3).map(formatDiffChange).join(" · ");
}

function formatDiffChange(change = {}) {
  const label = t(`diffLabels.${change.type}`) || change.type;
  if (change.type === "component_added") return `${label}: ${change.quantity || 1} ${change.componentType}`;
  if (change.type === "component_removed") return `${label}: ${change.componentType}`;
  if (change.type === "component_quantity_changed") return `${label}: ${change.componentType} ${change.from} -> ${change.to}`;
  if (change.type === "placement_changed") return `${label}: ${change.target} ${change.from || "-"} -> ${change.to || "-"}`;
  if (change.type === "shape_changed") return `${label}: ${change.from || "-"} -> ${change.to || "-"}`;
  if (change.type === "requirement_changed") return `${label}: ${change.field} ${String(change.from ?? "-")} -> ${String(change.to ?? "-")}`;
  if (change.type === "artifacts_regenerated") return `${label}: ${change.from || "-"} -> ${change.to || "-"}`;
  if (change.field) return `${label}: ${change.field}`;
  if (change.warning) return `${label}: ${change.warning}`;
  return label;
}

function finishLabel(finish) {
  const labels = {
    woodgrain: state.lang === "zh" ? "木纹" : "Woodgrain",
    graphite: state.lang === "zh" ? "石墨黑" : "Graphite",
    sage: state.lang === "zh" ? "鼠尾草绿" : "Sage",
    coral: state.lang === "zh" ? "珊瑚色" : "Coral"
  };
  return labels[finish] || finish;
}

function planStatusText() {
  const status = state.productPlan?.status;
  if (status === "submitted_for_review") return t("planSubmitted");
  if (status === "manual_expansion_draft") return t("planManual");
  return t("planReady");
}

function composerSummaryText() {
  const runtime = currentRuntimeProvider();
  if (state.loading && runtime === "codex") return t("composerCodexRunning");
  if (state.loading && runtime === "forge-query-engine") return t("composerQueryRunning");
  if (state.loading) return t("chatTraceRunning");
  if (runtime === "codex") return t("composerCodexReady");
  if (runtime === "forge-query-engine") return t("composerQueryReady");
  return t("composerDefault");
}

function composerMetaText() {
  return `${planStatusText()} · ${runtimeDisplayName(currentRuntimeProvider())}`;
}

function currentTopbarTitle() {
  const project = activeProject();
  if (project) return projectTitle(project);
  const revision = currentRevision();
  if (revision) return planTitle(revision);
  return t("newDraftTitle");
}

function openFloating(name) {
  dom.floatingLayer.hidden = false;
  dom.floatingLayer.querySelectorAll("[data-dialog]").forEach((dialog) => {
    dialog.hidden = dialog.dataset.dialog !== name;
  });
  setFloatingTrigger(name);
  if (name === "modelFullscreen") window.requestAnimationFrame(drawPreview);
}

function closeFloating() {
  dom.floatingLayer.hidden = true;
  dom.floatingLayer.querySelectorAll("[data-dialog]").forEach((dialog) => {
    dialog.hidden = true;
  });
  disposeThreePreview("fullscreen");
  state.activeProjectMenuId = "";
  resetProjectMenuPosition();
  setFloatingTrigger("");
}

function openProjectMenu(projectId, anchor) {
  if (!projectById(projectId)) return;
  state.activeProjectMenuId = projectId;
  openFloating("thread");
  positionProjectMenu(anchor);
}

function positionProjectMenu(anchor) {
  const popover = document.querySelector(".thread-popover");
  if (!popover || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const width = Math.min(260, Math.max(180, window.innerWidth - 20));
  const preferRight = rect.right + 8 + width <= window.innerWidth - 10;
  const left = preferRight
    ? rect.right + 8
    : Math.max(10, Math.min(rect.left, window.innerWidth - width - 10));
  const top = Math.max(10, Math.min(rect.top - 6, window.innerHeight - 210));
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.style.right = "auto";
  popover.style.bottom = "auto";
  popover.style.width = `${width}px`;
}

function resetProjectMenuPosition() {
  const popover = document.querySelector(".thread-popover");
  if (!popover) return;
  popover.style.left = "";
  popover.style.top = "";
  popover.style.right = "";
  popover.style.bottom = "";
  popover.style.width = "";
}

function setFloatingTrigger(activeName) {
  const triggers = {
    prototypeSnapshot: [dom.previewSnapshot],
    reviewContact: [dom.submitReview],
    settings: [dom.openSettings]
  };
  Object.entries(triggers).forEach(([name, buttons]) => {
    buttons.forEach((button) => button?.classList.toggle("active", name === activeName));
  });
  document.querySelectorAll("[data-project-menu]").forEach((button) => {
    button.classList.toggle("active", activeName === "thread" && button.dataset.projectMenu === state.activeProjectMenuId);
  });
}

function openRuntimeSettings() {
  openFloating("settings");
  showSettingsPanel("studio");
  focusRuntimeProviderSelect();
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
  window.requestAnimationFrame(focusRuntimeProviderSelect);
  window.setTimeout(focusRuntimeProviderSelect, 0);
}

function focusRuntimeProviderSelect() {
  dom.runtimeProviderSelect?.focus({ preventScroll: true });
}

function showSettingsPanel(panelName) {
  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.settingsTab === panelName);
  });
  document.querySelectorAll("[data-settings-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.settingsPanel !== panelName;
  });
}

function setNotice(message) {
  state.notice = message;
  if (dom.apiStatus) dom.apiStatus.textContent = message;
  window.clearTimeout(setNotice.timeout);
  setNotice.timeout = window.setTimeout(() => {
    state.notice = "";
    if (dom.apiStatus) dom.apiStatus.textContent = "";
  }, 2200);
}

function startNewProject() {
  saveActiveProject();
  state.workspaceToken += 1;
  createDraftProject();
  state.activeSidebar = "chat";
  state.loading = false;
  state.submittingReview = false;
  state.lastChatTurn = null;
  state.activeTrace = null;
  state.pendingConfirmation = null;
  state.runtimeError = "";
  syncActiveProject({
    lastChatTurn: null,
    activeTrace: null,
    pendingConfirmation: null,
    runtimeError: "",
    runtimeProvider: state.runtimeProvider
  });
  if (dom.ideaInput) dom.ideaInput.value = "";
  render({ scrollConversationToBottom: true });
  setNotice(t("newProjectReady"));
  refreshRuntimeStatusForProjectBoundary();
  dom.ideaInput?.focus();
}

function modelGlbUrl(revision) {
  const artifact = revision?.modelArtifacts?.artifacts?.glb || revision?.modelPreview?.assets?.glb;
  return revision?.modelArtifacts?.status === "generated" && artifact?.url
    ? artifact.url
    : "";
}

function previewEngineForRevision(revision) {
  return modelGlbUrl(revision) ? "three" : "canvas2d";
}

function renderPreviewStatus(revision) {
  if (previewEngineForRevision(revision) === "three") return t("modelLoading");
  if (revision?.modelArtifacts?.status === "generated") return t("modelLoadFailed");
  return t("modelSketchPreview");
}

function drawPreview() {
  const revision = currentRevision();
  if (!revision) return;
  cleanupThreePreviews();
  document.querySelectorAll("[data-device-canvas]").forEach((canvas) => {
    if (canvas.closest("[hidden]")) {
      disposeThreePreview(canvas.dataset.previewId);
      return;
    }
    if (canvas.dataset.previewEngine === "three") {
      drawThreePreview(canvas, revision);
    } else {
      disposeThreePreview(canvas.dataset.previewId);
      drawDevicePreview(canvas, revision);
    }
  });
}

function drawThreePreview(canvas, revision) {
  const previewId = canvas.dataset.previewId || "default";
  const glbUrl = modelGlbUrl(revision);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, rect.width || 280);
  const height = Math.max(150, rect.height || 180);
  let instance = threePreviewInstances.get(previewId);
  if (!instance || instance.canvas !== canvas || instance.glbUrl !== glbUrl) {
    disposeThreePreview(previewId);
    instance = createThreePreviewInstance({ canvas, previewId, glbUrl, width, height });
    threePreviewInstances.set(previewId, instance);
    loadThreeModel(instance, revision);
  }
  resizeThreePreview(instance, width, height);
  applyThreePreviewMode(instance);
}

function createThreePreviewInstance({ canvas, previewId, glbUrl, width, height }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0xf6f6f2, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.screenSpacePanning = true;
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c0, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(2.2, 2.8, 3.2);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xcfe5ff, 0.9);
  fillLight.position.set(-2.4, 1.2, -2.2);
  scene.add(fillLight);
  const instance = {
    previewId,
    canvas,
    glbUrl,
    renderer,
    scene,
    camera,
    controls,
    root: null,
    basePositions: new Map(),
    initialCameraFramed: false,
    status: "loading",
    animationFrame: 0,
    leftButtonMode: THREE.MOUSE.ROTATE
  };
  canvas.addEventListener("pointerdown", (event) => {
    instance.leftButtonMode = controls.mouseButtons.LEFT;
    if (event.shiftKey) controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  });
  canvas.addEventListener("pointerup", () => {
    controls.mouseButtons.LEFT = instance.leftButtonMode;
  });
  canvas.addEventListener("pointerleave", () => {
    controls.mouseButtons.LEFT = instance.leftButtonMode;
  });
  setRenderStatus(previewId, t("modelLoading"));
  return instance;
}

function loadThreeModel(instance, revision) {
  const loader = new GLTFLoader();
  loader.load(
    instance.glbUrl,
    (gltf) => {
      instance.root = gltf.scene;
      instance.root.name = "forge_generated_3d_preview";
      instance.scene.add(instance.root);
      instance.root.traverse((node) => {
        if (!node.isObject3D) return;
        instance.basePositions.set(node.uuid, node.position.clone());
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;
          node.material = normalizeThreeMaterial(node.material);
          node.userData.baseMaterial = Array.isArray(node.material)
            ? node.material.map((material) => material.clone())
            : node.material?.clone?.();
        }
      });
      instance.status = "loaded";
      frameThreeModel(instance, revision);
      applyThreePreviewMode(instance);
      setRenderStatus(instance.previewId, t("modelLoaded"));
      animateThreePreview(instance);
    },
    undefined,
    () => {
      instance.status = "failed";
      setRenderStatus(instance.previewId, t("modelLoadFailed"));
      instance.renderer.render(instance.scene, instance.camera);
    }
  );
}

function normalizeThreeMaterial(material) {
  if (!material) return material;
  const normalized = material.clone();
  if (normalized.opacity < 1 || normalized.transparent) {
    normalized.transparent = true;
    normalized.depthWrite = false;
  }
  normalized.needsUpdate = true;
  return normalized;
}

function frameThreeModel(instance) {
  if (!instance.root) return;
  const box = new THREE.Box3().setFromObject(instance.root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  instance.scene.userData.modelCenter = center;
  instance.scene.userData.modelRadius = Math.max(size.x, size.y, size.z, 1);
  instance.controls.target.copy(center);
  if (!instance.initialCameraFramed) {
    const radius = instance.scene.userData.modelRadius;
    instance.camera.position.set(center.x + radius * 0.34, center.y + radius * 0.16, center.z + radius * 2.18);
    instance.initialCameraFramed = true;
  }
  instance.controls.update();
}

function resizeThreePreview(instance, width, height) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  instance.renderer.setPixelRatio(ratio);
  instance.renderer.setSize(width, height, false);
  instance.camera.aspect = width / height;
  instance.camera.updateProjectionMatrix();
}

function applyThreePreviewMode(instance) {
  if (!instance.root || instance.status !== "loaded") return;
  const componentsVisible = state.previewMode === "components";
  instance.root.traverse((node) => {
    const base = instance.basePositions.get(node.uuid);
    if (base) node.position.copy(base);
    applyLayerVisibility(node, componentsVisible);
  });
}

function applyLayerVisibility(node, componentsVisible) {
  if (!node.isObject3D) return;
  const isShell = isShellLayerNode(node);
  const isModule = node.name?.startsWith("module.");
  const isInterface = node.name?.startsWith("interface.");
  const isRoute = node.name?.startsWith("route.");
  const isFeature = node.name?.startsWith("feature.");
  const isShellFeature = isShellFeatureNode(node);
  const isExteriorFeature = node.name === "feature.opening.screen"
    || node.name === "feature.opening.usb_c"
    || node.name === "feature.opening.ambient_sensor"
    || node.name === "feature.opening.camera"
    || node.name?.startsWith("feature.opening.speaker_vents");
  const isInternalFeature = isFeature && !isExteriorFeature;
  const isExteriorModule = ["front_display", "front_sensor", "front_camera_review", "screen_glass", "sensor_lens"].includes(node.userData?.role);
  const isInterfaceLayerObject = isInterface || isRoute || nodeHasMaterialName(node, ["interface_marker", "cable_route"]);
  if (isShell) {
    node.visible = true;
    if (componentsVisible) {
      applyNodeMaterialLayer(node, {
        opacity: 0.12,
        transparent: true,
        depthWrite: false
      });
    } else {
      resetNodeMaterialLayer(node);
    }
    return;
  }
  if (isFeature) {
    node.visible = componentsVisible || isExteriorFeature;
    if (componentsVisible && isShellFeature) {
      applyNodeMaterialLayer(node, {
        opacity: 0.12,
        transparent: true,
        depthWrite: false
      });
    } else {
      resetNodeMaterialLayer(node);
    }
    if (isInternalFeature && !componentsVisible) node.visible = false;
    return;
  }
  if (isModule) {
    node.visible = componentsVisible || isExteriorModule;
    resetNodeMaterialLayer(node);
    return;
  }
  if (isInterfaceLayerObject) {
    node.visible = componentsVisible;
    resetNodeMaterialLayer(node);
  }
}

function isShellLayerNode(node) {
  const role = String(node.userData?.role || "");
  return Boolean(
    node.name?.startsWith("shell.")
    || nodeHasMaterialName(node, ["shell_finish"])
    || /shell|bezel|rail|tray|side_wall/.test(role)
  );
}

function isShellFeatureNode(node) {
  const role = String(node.userData?.role || "");
  const featureType = String(node.userData?.featureType || "");
  return Boolean(
    node.name?.startsWith("feature.")
    && /opening|cutout|window|vents|standoff|battery_bay/.test(`${node.name} ${featureType} ${role}`)
  );
}

function nodeHasMaterialName(node, names) {
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  return materials.some((material) => material?.name && names.includes(material.name));
}

function applyNodeMaterialLayer(node, { opacity, transparent, depthWrite }) {
  const apply = (material, index = 0) => {
    if (!material) return;
    const base = Array.isArray(node.userData.baseMaterial)
      ? node.userData.baseMaterial[index]
      : node.userData.baseMaterial;
    if (base && material.color && base.color) material.color.copy(base.color);
    material.opacity = opacity;
    material.transparent = transparent || opacity < 1;
    material.depthWrite = depthWrite && opacity >= 0.5;
    material.needsUpdate = true;
  };
  if (Array.isArray(node.material)) node.material.forEach(apply);
  else apply(node.material);
}

function resetNodeMaterialLayer(node) {
  const reset = (material, index = 0) => {
    if (!material) return;
    const base = Array.isArray(node.userData.baseMaterial)
      ? node.userData.baseMaterial[index]
      : node.userData.baseMaterial;
    if (base && material.color && base.color) material.color.copy(base.color);
    material.opacity = base?.opacity ?? 1;
    material.transparent = base?.transparent ?? material.opacity < 1;
    material.depthWrite = base?.depthWrite ?? material.opacity >= 0.5;
    material.needsUpdate = true;
  };
  if (Array.isArray(node.material)) node.material.forEach(reset);
  else reset(node.material);
}

function animateThreePreview(instance) {
  if (!threePreviewInstances.has(instance.previewId)) return;
  instance.controls.update();
  instance.renderer.render(instance.scene, instance.camera);
  instance.animationFrame = window.requestAnimationFrame(() => animateThreePreview(instance));
}

function setRenderStatus(previewId, message) {
  const safePreviewId = String(previewId).replace(/"/g, "");
  document.querySelectorAll(`[data-model-render-status="${safePreviewId}"]`).forEach((element) => {
    element.textContent = message;
  });
}

function cleanupThreePreviews() {
  for (const [previewId, instance] of threePreviewInstances) {
    if (!instance.canvas.isConnected) disposeThreePreview(previewId);
  }
}

function disposeThreePreview(previewId) {
  if (!previewId) return;
  const instance = threePreviewInstances.get(previewId);
  if (!instance) return;
  window.cancelAnimationFrame(instance.animationFrame);
  instance.controls?.dispose();
  instance.scene?.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose?.();
    if (Array.isArray(node.material)) node.material.forEach((material) => material.dispose?.());
    else node.material?.dispose?.();
  });
  instance.renderer?.dispose();
  threePreviewInstances.delete(previewId);
}

function drawDevicePreview(canvas, revision) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(260, rect.width || 280);
  const height = Math.max(150, rect.height || 180);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const viewer = state.viewer || { yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 };
  const finish = revision.spec?.enclosure?.finish || "woodgrain";
  const colors = {
    woodgrain: ["#9a6534", "#4d2d16"],
    sage: ["#7f987a", "#3f5b45"],
    graphite: ["#3a3f42", "#15191a"],
    coral: ["#c9654e", "#7a3128"]
  }[finish] || ["#9a6534", "#4d2d16"];
  ctx.fillStyle = "#f6f6f2";
  roundedRect(ctx, 0, 0, width, height, 8);
  ctx.fill();
  const orbitScale = Math.max(0.72, Math.min(1.42, viewer.zoom || 1));
  const yawScale = 0.86 + Math.abs(Math.cos(viewer.yaw || 0)) * 0.14;
  const frameWidth = Math.min(width * 0.68, width - 48) * orbitScale * yawScale;
  const frameHeight = frameWidth * (0.58 + Math.sin(viewer.pitch || 0) * 0.04);
  const x = (width - frameWidth) / 2 + (viewer.panX || 0);
  const y = height * 0.18 + (viewer.panY || 0);
  const gradient = ctx.createLinearGradient(x, y, x + frameWidth, y + frameHeight);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);

  if (state.previewMode === "components") {
    drawComponentsLayerPreview(ctx, x, y, frameWidth, frameHeight, gradient, revision);
  } else {
    drawAppearanceLayerPreview(ctx, x, y, frameWidth, frameHeight, gradient, revision);
  }

  ctx.fillStyle = "rgba(31,33,29,.18)";
  roundedRect(ctx, width * 0.28, height * 0.8, width * 0.44, 14, 7);
  ctx.fill();
}

function drawAppearanceLayerPreview(ctx, x, y, frameWidth, frameHeight, gradient, revision) {
  ctx.fillStyle = gradient;
  roundedRect(ctx, x, y, frameWidth, frameHeight, 18);
  ctx.fill();
  ctx.fillStyle = "#101716";
  roundedRect(ctx, x + 22, y + 22, frameWidth - 44, frameHeight - 44, 10);
  ctx.fill();
  ctx.fillStyle = "#f3faf6";
  roundedRect(ctx, x + 38, y + 40, frameWidth * 0.28, 24, 7);
  ctx.fill();
  ctx.fillStyle = "#2f6f9f";
  roundedRect(ctx, x + frameWidth * 0.56, y + 40, frameWidth * 0.24, 18, 6);
  ctx.fill();
  drawLabel(ctx, x + 30, y + frameHeight + 22, t("screenOpening"));
}

function drawComponentsLayerPreview(ctx, x, y, frameWidth, frameHeight, gradient, revision) {
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = gradient;
  roundedRect(ctx, x, y, frameWidth, frameHeight, 18);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.22)";
  roundedRect(ctx, x + 24, y + 24, frameWidth - 48, frameHeight - 48, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#1e2422";
  roundedRect(ctx, x + frameWidth * 0.42, y + frameHeight * 0.68, frameWidth * 0.16, 12, 5);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.36)";
  [0.28, 0.72].forEach((left) => {
    [0.3, 0.58].forEach((top) => {
      ctx.beginPath();
      ctx.arc(x + frameWidth * left, y + frameHeight * top, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  drawProjectedModules(ctx, revision, x, y, frameWidth, frameHeight);
  drawProjectedRoutes(ctx, revision, x, y, frameWidth, frameHeight);
  drawLabel(ctx, x, y + frameHeight + 22, t("shellLabel"));
  drawLabel(ctx, x + frameWidth * 0.48, y + frameHeight + 22, t("coreBoard"));
}

function drawProjectedModules(ctx, revision, x, y, frameWidth, frameHeight) {
  const spec = revision.geometrySpec || {};
  const dimensions = spec.enclosure?.dimensionsMm || {};
  const modules = placedModules(revision);
  modules.forEach((module) => {
    const position = module.placement.positionMm || {};
    const moduleDimensions = module.dimensionsMm || {};
    const centerX = x + frameWidth * (0.5 + Number(position.x || 0) / (dimensions.width || 1));
    const centerY = y + frameHeight * (0.5 - Number(position.y || 0) / (dimensions.height || 1));
    const w = Math.max(10, frameWidth * Number(moduleDimensions.width || 10) / (dimensions.width || 1));
    const h = Math.max(8, frameHeight * Number(moduleDimensions.height || 8) / (dimensions.height || 1));
    ctx.fillStyle = moduleColor(module);
    roundedRect(ctx, centerX - w / 2, centerY - h / 2, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.58)";
    ctx.lineWidth = 1;
    ctx.stroke();
    drawTinyLabel(ctx, centerX - w / 2, centerY - h / 2 - 4, module.category);
  });
}

function drawProjectedRoutes(ctx, revision, x, y, frameWidth, frameHeight) {
  const spec = revision.geometrySpec || {};
  const dimensions = spec.enclosure?.dimensionsMm || {};
  ctx.save();
  ctx.strokeStyle = "rgba(47,50,46,.45)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (const route of spec.cableRoutes || []) {
    const points = route.pointsMm || [];
    if (points.length < 2) continue;
    ctx.beginPath();
    points.forEach((point, index) => {
      const px = x + frameWidth * (0.5 + Number(point.x || 0) / (dimensions.width || 1));
      const py = y + frameHeight * (0.5 - Number(point.y || 0) / (dimensions.height || 1));
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
  }
  ctx.restore();
}

function moduleColor(module) {
  if (module.status === "review") return "rgba(214, 132, 38, .88)";
  if (module.category === "Display") return "rgba(18, 25, 25, .9)";
  if (module.category === "Core") return "rgba(61, 128, 93, .86)";
  if (module.category === "Power") return "rgba(53, 91, 156, .86)";
  if (module.category === "Sensor") return "rgba(95, 151, 138, .86)";
  if (module.category === "Audio") return "rgba(114, 109, 142, .86)";
  return "rgba(91, 99, 108, .82)";
}

function drawTinyLabel(ctx, x, y, label) {
  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#535851";
  ctx.fillText(String(label || "").slice(0, 18), x, y);
}

function drawLabel(ctx, x, y, label) {
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#555b55";
  ctx.fillText(label, x, y);
}

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setAttr(selector, attr, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attr, value);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelector(".thread-list")?.addEventListener("click", (event) => {
  const menuButton = event.target.closest("[data-project-menu]");
  if (menuButton) {
    event.preventDefault();
    event.stopPropagation();
    openProjectMenu(menuButton.dataset.projectMenu, menuButton);
    return;
  }
  const newProjectRow = event.target.closest("[data-new-project-row]");
  if (newProjectRow) {
    startNewProject();
    return;
  }
  const projectButton = event.target.closest("[data-sidebar-project]");
  if (!projectButton) return;
  if (!activateProject(projectButton.dataset.sidebarProject)) return;
  setNotice(projectTitle(activeProject()));
  render({ scrollConversationToBottom: true });
  restoreActiveChatSession().catch(() => {});
  refreshRuntimeStatusForProjectBoundary();
});

dom.workspaceView.addEventListener("click", (event) => {
  if (handlePreviewModeClick(event)) return;
  const processedDetailToggle = event.target.closest("[data-processed-detail-toggle]");
  if (processedDetailToggle) {
    toggleProcessedDetail(processedDetailToggle.dataset.processedDetailToggle);
    return;
  }
  const processedToggle = event.target.closest("[data-processed-toggle]");
  if (processedToggle) {
    toggleProcessedTranscript(processedToggle.dataset.processedToggle);
    return;
  }
  const dialogTrigger = event.target.closest("[data-open-dialog]");
  if (dialogTrigger) {
    openFloating(dialogTrigger.dataset.openDialog);
    return;
  }
  const historyRevision = event.target.closest("[data-history-revision]");
  if (historyRevision) {
    state.productPlan.currentRevisionId = historyRevision.dataset.historyRevision;
    syncActiveProject({ productPlan: state.productPlan });
    state.activeSidebar = "chat";
    setNotice(`${t("currentRevision")}: ${historyRevision.dataset.historyRevision}`);
    render({ scrollConversationToBottom: true });
    return;
  }
  const revertRevision = event.target.closest("[data-revert-revision]");
  if (revertRevision) {
    revertToRevision(revertRevision.dataset.revertRevision);
    return;
  }
  const chatConfirm = event.target.closest("[data-chat-confirm]");
  if (chatConfirm) {
    resolveChatConfirmation(chatConfirm.dataset.chatConfirm === "approve");
    return;
  }
  const modelAction = event.target.closest("[data-model-action]");
  if (modelAction?.dataset.modelAction === "generate") {
    triggerModelGeneration();
    return;
  }
  const reviewAction = event.target.closest("[data-review-action]");
  if (reviewAction?.dataset.reviewAction === "submit") {
    openFloating("reviewContact");
    return;
  }
  if (reviewAction?.dataset.reviewAction === "contact") {
    openFloating("reviewContact");
    return;
  }
});

dom.inspectorContent.addEventListener("click", (event) => {
  if (handlePreviewModeClick(event)) return;
  const chatConfirm = event.target.closest("[data-chat-confirm]");
  if (chatConfirm) {
    resolveChatConfirmation(chatConfirm.dataset.chatConfirm === "approve");
    return;
  }
  const fullscreenTrigger = event.target.closest("[data-preview-fullscreen]");
  if (fullscreenTrigger) {
    openFloating("modelFullscreen");
    return;
  }
  const modelAction = event.target.closest("[data-model-action]");
  if (modelAction?.dataset.modelAction === "generate") {
    triggerModelGeneration();
    return;
  }
  const toggle = event.target.closest("[data-inspector-toggle]");
  if (toggle) {
    const key = toggle.dataset.inspectorToggle;
    if (state.collapsedSections.has(key)) state.collapsedSections.delete(key);
    else state.collapsedSections.add(key);
    render();
    return;
  }
});

function handlePreviewModeClick(event) {
  const previewMode = event.target.closest("[data-preview-mode]");
  if (!previewMode) return false;
  state.previewMode = previewMode.dataset.previewMode || "appearance";
  syncPreviewModeUi();
  applyPreviewModeToInstances();
  return true;
}

function syncPreviewModeUi() {
  document.querySelectorAll("[data-preview-mode]").forEach((button) => {
    const active = button.dataset.previewMode === state.previewMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyPreviewModeToInstances() {
  for (const instance of threePreviewInstances.values()) {
    applyThreePreviewMode(instance);
  }
}

async function triggerModelGeneration() {
  if (!currentRevision() || state.loading) return;
  await sendTurn(t("generateModelCommand"));
}

async function submitComposer(event) {
  event?.preventDefault();
  if (state.loading) {
    cancelActiveTurn();
    return;
  }
  const message = dom.ideaInput?.value.trim() || "";
  if (!message) {
    setNotice(t("emptyComposer"));
    dom.ideaInput?.focus();
    return;
  }
  const sent = await sendTurn(message);
  if (sent && dom.ideaInput) dom.ideaInput.value = "";
}

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const canvas = target?.closest("[data-device-canvas]");
  if (!canvas) return;
  if (canvas.dataset.previewEngine === "three") return;
  state.viewer.dragging = true;
  state.viewer.dragMode = event.shiftKey ? "pan" : "orbit";
  state.viewer.lastX = event.clientX;
  state.viewer.lastY = event.clientY;
  canvas.setPointerCapture?.(event.pointerId);
});

document.addEventListener("pointermove", (event) => {
  if (!state.viewer.dragging) return;
  const dx = event.clientX - state.viewer.lastX;
  const dy = event.clientY - state.viewer.lastY;
  state.viewer.lastX = event.clientX;
  state.viewer.lastY = event.clientY;
  if (state.viewer.dragMode === "pan") {
    state.viewer.panX += dx;
    state.viewer.panY += dy;
  } else {
    state.viewer.yaw += dx * 0.014;
    state.viewer.pitch = Math.max(-0.8, Math.min(0.8, state.viewer.pitch + dy * 0.008));
  }
  drawPreview();
});

document.addEventListener("pointerup", () => {
  state.viewer.dragging = false;
});

document.addEventListener("wheel", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const canvas = target?.closest("[data-device-canvas]");
  if (!canvas || canvas.dataset.previewEngine === "three") return;
  event.preventDefault();
  const nextZoom = state.viewer.zoom + (event.deltaY > 0 ? -0.08 : 0.08);
  state.viewer.zoom = Math.max(0.72, Math.min(1.42, nextZoom));
  drawPreview();
}, { passive: false });

dom.form.addEventListener("submit", submitComposer);
dom.runChain.addEventListener("click", submitComposer);

dom.previewSnapshot.addEventListener("click", () => {
  if (!currentRevision()) {
    setNotice(t("noPlan"));
    return;
  }
  openFloating("prototypeSnapshot");
});

dom.submitReview.addEventListener("click", () => openFloating("reviewContact"));
window.yWorkbenchSubmitForReview = submitForReview;
dom.newProject.addEventListener("click", startNewProject);
dom.openSettings.addEventListener("click", openRuntimeSettings);
dom.scopeLevel?.addEventListener("click", openRuntimeSettings);

dom.languageSelect.addEventListener("change", async () => {
  state.lang = dom.languageSelect.value === "en" ? "en" : "zh";
  try {
    window.localStorage.setItem("yWorkbenchLanguage", state.lang);
  } catch {}
  render();
});

dom.runtimeProviderSelect?.addEventListener("change", () => {
  const value = normalizeRuntimeProvider(dom.runtimeProviderSelect.value);
  state.runtimeProvider = value;
  try {
    window.localStorage.setItem(LEGACY_RUNTIME_PROVIDER_KEY, value);
    window.localStorage.setItem(EXPLICIT_RUNTIME_PROVIDER_KEY, value);
  } catch {}
  syncActiveProject({ runtimeProvider: value });
  render();
  setNotice(t("runtimeChanged"));
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
});

dom.floatingLayer.addEventListener("click", (event) => {
  if (event.target === dom.floatingLayer || event.target.closest(".close-floating")) {
    closeFloating();
    return;
  }
  if (handlePreviewModeClick(event)) return;
  const reviewSubmit = event.target.closest("[data-review-submit]");
  if (reviewSubmit) {
    submitForReview();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action) {
    const targetProjectId = state.activeProjectMenuId;
    const targetProject = projectById(targetProjectId);
    if (action.dataset.action === "history") {
      const switchedProject = targetProject && targetProject.projectId !== state.activeProjectId
        ? activateProject(targetProject.projectId)
        : false;
      state.activeSidebar = "history";
      closeFloating();
      render();
      if (switchedProject) {
        restoreActiveChatSession().catch(() => {});
        refreshRuntimeStatusForProjectBoundary();
      }
      return;
    }
    if (action.dataset.action === "remove") {
      const removed = removeProjectFromList(targetProjectId);
      closeFloating();
      if (removed) setNotice(t("projectRemoved", removed.title));
      render({ scrollConversationToBottom: true });
      if (removed?.wasActive) {
        restoreActiveChatSession().catch(() => {});
        refreshRuntimeStatusForProjectBoundary();
      }
      return;
    }
    const suffix = targetProject ? ` · ${projectTitle(targetProject)}` : "";
    setNotice(`${t("actionNotice")}${action.textContent.trim()}${suffix}`);
    closeFloating();
  }
  const modelAction = event.target.closest("[data-model-action]");
  if (modelAction?.dataset.modelAction === "generate") {
    closeFloating();
    triggerModelGeneration();
  }
});

dom.floatingLayer.addEventListener("input", (event) => {
  const field = event.target.closest("[data-contact-field]");
  if (!field) return;
  state.contactInfo[field.dataset.contactField] = field.value;
});

document.querySelectorAll("[data-settings-tab]").forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsTab));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFloating();
});

window.addEventListener("resize", drawPreview);

bootstrap();
