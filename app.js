import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const SUPPORTED_LANGUAGES = ["zh", "en"];
const RUNTIME_PROVIDER_VALUES = ["mock", "forge-query-engine", "codex"];
const DEMO_RUNTIME_PROVIDER = "mock";
const threePreviewInstances = new Map();
const INITIAL_RUNTIME_PROVIDER = localChatProvider();

function localChatProvider() {
  try {
    return normalizeRuntimeProvider(window.FORGE_RUNTIME_PROVIDER || window.localStorage.getItem("forgeRuntimeProvider"));
  } catch {
    return "mock";
  }
}

function normalizeRuntimeProvider(value = "") {
  const normalized = String(value || "mock");
  return RUNTIME_PROVIDER_VALUES.includes(normalized) ? normalized : "mock";
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
    composerPlaceholder: "说出你想做的硬件，例如：我想做一个小型木纹桌面屏，显示天气和照片，3.5 英寸，USB-C 供电。",
    runChainAria: "发送需求并更新方案",
    cancelRunAria: "停止本轮执行",
    inspectorAria: "实时方案包",
    settingsTitle: "Forge 设置",
    language: "语言",
    langZh: "简体中文",
    langEn: "English",
    languageSelectAria: "界面语言",
    threadMenuAria: "方案菜单",
    threadRename: "重命名方案",
    threadHistory: "查看版本记录",
    threadDuplicate: "复制草稿",
    threadExport: "导出方案快照",
    threadArchive: "归档草稿",
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
    chatTraceTitle: "执行状态",
    chatTraceRunning: "正在执行",
    chatTraceEmpty: "本轮没有执行工具",
    traceReceived: "收到请求",
    tracePrepare: "准备项目上下文",
    traceWaiting: "等待运行结果",
    traceStream: "实时连接",
    tracePlanCreate: "创建 ProductPlan",
    traceRuntime: "运行模式",
    traceCodexTurn: "Codex 运行",
    traceCodexItem: "Codex 步骤",
    traceCodexCommand: "Codex 命令",
    traceCodexFileChange: "Codex 文件变更",
    traceCodexMcp: "Codex 工具",
    traceCodexUsage: "Token 用量",
    traceModelRequest: "请求模型",
    traceModel: "模型响应",
    traceToolSelected: "选择工具",
    traceToolRunning: "执行工具",
    traceToolResult: "工具结果",
    traceToolDenied: "工具被拦截，已回流修正",
    traceProposal: "方案变更",
    traceRevision: "版本更新",
    traceArtifacts: "3D 生成",
    traceConfirmation: "等待确认",
    traceFailed: "执行失败",
    traceDone: "完成",
    runtimeMode: "运行模式",
    runtimeLocal: "本地 Forge",
    runtimeQueryEngine: "Forge QueryEngine",
    runtimeCodex: "Codex",
    runtimeChanged: "运行模式已更新",
    runtimeStatusChecking: "正在检查运行时",
    runtimeStatusCheckFailed: (message) => `无法检查运行时：${message}`,
    runtimeStatusLocalReady: "本地 Forge 工具链已就绪",
    runtimeStatusQueryReady: "Forge QueryEngine 已就绪",
    runtimeStatusCodexReady: "Codex SDK 已就绪",
    runtimeStatusCodexMissing: "Codex SDK 不可用，发送会失败",
    runtimeStatusCodexThread: (threadId) => `项目 thread：${threadId}`,
    runtimeStatusCodexNoThread: "本项目尚未创建 Codex thread，首次 Codex 运行会创建",
    runtimeStatusNoWorkspace: "新项目将在首条需求后创建项目 thread",
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
    modelViewerHint: "拖拽旋转，滚轮缩放，Shift 拖拽平移；外观层看整体外壳，元器件层会把外壳变透明；不能拖动零件或改孔位。",
    modelArtifacts: "3D 模型状态",
    modelArtifactSummary: "3D 模型已生成",
    componentAssetsTitle: "组件资产来源",
    assetQuality: "资产质量",
    validationStatus: "验证状态",
    resolvedPreview: "预览来源",
    artifactLinksTitle: "生成证据",
    proxyComponentNotice: "这个原型使用机械代理组件：尺寸、孔位、接口和避让体积来自 ComponentDescriptor，仍需人工工程验证，不能视为生产就绪。",
    artifactLabels: {
      productPlan: "ProductPlan 快照",
      geometrySpec: "GeometrySpec",
      componentSelections: "组件选择",
      componentDescriptors: "组件描述符",
      componentAssetManifest: "资产清单",
      validationReport: "验证报告",
      designSummary: "设计摘要",
      glb: "3D 模型",
      stl: "外壳合并文件",
      shellFront: "前壳文件",
      shellBack: "后壳文件",
      step: "内部工程交接"
    },
    assetQualityLabels: {
      mechanical_proxy: "机械代理",
      procedural_proxy: "程序化代理",
      vendor_reference: "供应商参考",
      verified_mechanical: "已验证机械资产",
      missing: "缺失"
    },
    validationStatusLabels: {
      unverified_proxy: "未验证代理",
      descriptor_reviewed: "描述符已审核",
      vendor_supplied: "供应商提供",
      engineer_verified: "工程师已验证",
      missing: "缺失"
    },
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
    woodgrainDemo: "木纹桌面屏",
    settingsRows: [
      ["内部原型模式", "提交只生成本地人工审核资料，不付款、不生产、不接供应商。"],
      ["对话优先", "用户持续聊天，右侧 ProductPlan 实时更新。"],
      ["标准 3D 打印外壳", "木纹、鼠尾草绿、石墨黑都只是标准外壳的表面效果。"],
      ["结果预览优先", "3D 视图用于理解原型结果，不提供建模编辑工具。"],
      ["运行模式", "默认使用本地 Forge 工具链；需要真实 Codex 时手动切换。"],
      ["界面语言", "保留中文和 English 两套文案。"],
      ["文案维护规则", "新增按钮、状态、弹窗、文档都要同步更新中英文。"]
    ],
    demoRequest:
      "我想做一个小型木纹桌面屏，可以显示家庭照片、天气和明天日程，3.5 英寸，USB-C 供电。",
    demoConversationTurns: [
      "我想做一个小型木纹桌面屏，可以显示家庭照片、天气和明天日程，3.5 英寸，USB-C 供电。",
      "把它改成桌面闹钟，加两个按钮放在右侧。",
      "加一个小蜂鸣器，再做成相框风格。",
      "顶部加猫耳，USB-C 移到后面偏左。",
      "可以了，生成模型。"
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
    composerPlaceholder: "Describe the hardware you want, e.g. a small woodgrain desktop display for weather and photos, 3.5 in, USB-C powered.",
    runChainAria: "Send request and update plan",
    cancelRunAria: "Stop this turn",
    inspectorAria: "Live plan packet",
    settingsTitle: "Workbench settings",
    language: "Language",
    langZh: "Simplified Chinese",
    langEn: "English",
    languageSelectAria: "Interface language",
    threadMenuAria: "Plan menu",
    threadRename: "Rename plan",
    threadHistory: "View revisions",
    threadDuplicate: "Duplicate draft",
    threadExport: "Export plan snapshot",
    threadArchive: "Archive draft",
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
    chatTraceTitle: "Run status",
    chatTraceRunning: "Running",
    chatTraceEmpty: "No tool executed in this turn",
    traceReceived: "Request received",
    tracePrepare: "Preparing project context",
    traceWaiting: "Waiting for runtime result",
    traceStream: "Live connection",
    tracePlanCreate: "Creating ProductPlan",
    traceRuntime: "Runtime",
    traceCodexTurn: "Codex run",
    traceCodexItem: "Codex step",
    traceCodexCommand: "Codex command",
    traceCodexFileChange: "Codex file change",
    traceCodexMcp: "Codex tool",
    traceCodexUsage: "Token usage",
    traceModelRequest: "Model request",
    traceModel: "Model response",
    traceToolSelected: "Tool selected",
    traceToolRunning: "Running tool",
    traceToolResult: "Tool result",
    traceToolDenied: "Tool denied and fed back",
    traceProposal: "Plan change",
    traceRevision: "Revision update",
    traceArtifacts: "3D generation",
    traceConfirmation: "Waiting for confirmation",
    traceFailed: "Execution failed",
    traceDone: "Done",
    runtimeMode: "Runtime mode",
    runtimeLocal: "Local Forge",
    runtimeQueryEngine: "Forge QueryEngine",
    runtimeCodex: "Codex",
    runtimeChanged: "Runtime mode updated",
    runtimeStatusChecking: "Checking runtime",
    runtimeStatusCheckFailed: (message) => `Runtime check failed: ${message}`,
    runtimeStatusLocalReady: "Local Forge tools are ready",
    runtimeStatusQueryReady: "Forge QueryEngine is ready",
    runtimeStatusCodexReady: "Codex SDK is ready",
    runtimeStatusCodexMissing: "Codex SDK is unavailable; sending will fail",
    runtimeStatusCodexThread: (threadId) => `Project thread: ${threadId}`,
    runtimeStatusCodexNoThread: "This project has not created a Codex thread yet; the first Codex run will create one",
    runtimeStatusNoWorkspace: "A new project thread will be created after the first request",
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
    modelViewerHint: "Drag to rotate, wheel to zoom, Shift-drag to pan; the appearance layer shows the shell, and the components layer makes the shell transparent; parts and holes are not editable.",
    modelArtifacts: "3D model status",
    modelArtifactSummary: "3D model generated",
    componentAssetsTitle: "Component asset sources",
    assetQuality: "Asset quality",
    validationStatus: "Validation",
    resolvedPreview: "Preview source",
    artifactLinksTitle: "Generated evidence",
    proxyComponentNotice: "This prototype uses mechanical proxy components: dimensions, holes, connectors, and keepout/access volumes come from ComponentDescriptor data and still require human engineering validation before production.",
    artifactLabels: {
      productPlan: "ProductPlan snapshot",
      geometrySpec: "GeometrySpec",
      componentSelections: "Component selections",
      componentDescriptors: "Component descriptors",
      componentAssetManifest: "Asset manifest",
      validationReport: "Validation report",
      designSummary: "Design summary",
      glb: "3D model",
      stl: "Combined shell file",
      shellFront: "Front shell file",
      shellBack: "Back shell file",
      step: "Internal engineering handoff"
    },
    assetQualityLabels: {
      mechanical_proxy: "mechanical proxy",
      procedural_proxy: "procedural proxy",
      vendor_reference: "vendor reference",
      verified_mechanical: "verified mechanical asset",
      missing: "missing"
    },
    validationStatusLabels: {
      unverified_proxy: "unverified proxy",
      descriptor_reviewed: "descriptor reviewed",
      vendor_supplied: "vendor supplied",
      engineer_verified: "engineer verified",
      missing: "missing"
    },
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
    woodgrainDemo: "Woodgrain desk display",
    settingsRows: [
      ["Internal prototype mode", "Submission writes local human review material; no payment, production, or supplier order starts."],
      ["Conversation first", "The user keeps chatting while the right-side ProductPlan updates."],
      ["Standard 3D printed shell", "Woodgrain, sage, and graphite are finish treatments on the same shell path."],
      ["Result preview first", "The 3D view helps users understand the prototype result; it does not expose modeling tools."],
      ["Runtime mode", "Use the local Forge tool runtime by default; switch manually when a real Codex run is needed."],
      ["Interface language", "Keep both Chinese and English copy."],
      ["Copy maintenance", "Buttons, statuses, popovers, and docs must stay bilingual."]
    ],
    demoRequest:
      "I want a small woodgrain desktop display that shows family photos, weather, and tomorrow's calendar, 3.5 in, USB-C powered.",
    demoConversationTurns: [
      "I want a small woodgrain desktop display that shows family photos, weather, and tomorrow's calendar, 3.5 in, USB-C powered.",
      "Turn it into a desktop clock and add two buttons on the right side.",
      "Add a small buzzer and make it look like a photo frame.",
      "Add cat ears to the top corners and move USB-C to the back-left.",
      "Ready, generate model."
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
  activeRequestController: null,
  contactInfo: { name: "", email: "" }
};

const dom = {
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
  copySpec: document.querySelector("#copySpec"),
  submitReview: document.querySelector("#submitReview"),
  openThreadMenu: document.querySelector("#openThreadMenu"),
  newProject: document.querySelector("#newProject"),
  openSettings: document.querySelector("#openSettings"),
  languageSelect: document.querySelector("#languageSelect"),
  runtimeProviderSelect: document.querySelector("#runtimeProviderSelect"),
  runtimeStatus: document.querySelector("#runtimeStatus"),
  floatingLayer: document.querySelector("#floatingLayer"),
  dfmPopover: document.querySelector("#dfmPopover")
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
  render();
  await createInitialPlan();
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
}

async function createInitialPlan() {
  const token = state.workspaceToken;
  try {
    const turns = demoConversationTurns();
    const response = await apiPost("/api/plans", {
      initialMessage: turns[0],
      language: state.lang,
      runtime: DEMO_RUNTIME_PROVIDER,
      modelProvider: DEMO_RUNTIME_PROVIDER,
      runtimeProvider: DEMO_RUNTIME_PROVIDER
    });
    let productPlan = response.productPlan;
    for (const message of turns.slice(1)) {
      const turnResponse = await apiPost(`/api/plans/${productPlan.planId}/turns`, { message });
      productPlan = turnResponse.productPlan;
    }
    if (token !== state.workspaceToken) return;
    upsertProjectFromPlan(productPlan, { kind: "sample" });
    state.contactInfo = productPlan.contactInfo || state.contactInfo;
    state.runtimeError = "";
  } catch (error) {
    if (token !== state.workspaceToken) return;
    state.runtimeError = userFacingError(error);
    setNotice(t("fallbackNotice"));
  }
  if (token !== state.workspaceToken) return;
  render();
}

function demoConversationTurns() {
  const turns = t("demoConversationTurns");
  if (Array.isArray(turns) && turns.length > 0) return turns;
  return [t("demoRequest")];
}

function activeProject() {
  return state.projects.find((project) => project.projectId === state.activeProjectId) || null;
}

function makeClientId(prefix) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${suffix}`;
}

function createSessionId(projectId) {
  return `session_${String(projectId || makeClientId("project")).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function createProjectRecord({ productPlan = null, title = "", kind = "user", isDraft = false } = {}) {
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
    runtimeProvider: state?.runtimeProvider || INITIAL_RUNTIME_PROVIDER,
    contactInfo: productPlan?.contactInfo || { name: "", email: "" },
    createdAt: new Date().toISOString()
  };
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
  project.projectId = productPlan.planId;
  project.isDraft = false;
  project.productPlan = productPlan;
  project.title = projectTitleFromPlan(productPlan);
  project.chatSessionId = fields.chatSessionId || project.chatSessionId || createSessionId(productPlan.planId);
  project.lastChatTurn = fields.lastChatTurn ?? project.lastChatTurn ?? null;
  project.activeTrace = fields.activeTrace ?? project.activeTrace ?? null;
  project.pendingConfirmation = fields.pendingConfirmation ?? project.pendingConfirmation ?? null;
  project.runtimeError = fields.runtimeError || "";
  project.runtimeProvider = fields.runtimeProvider || state.runtimeProvider || project.runtimeProvider || INITIAL_RUNTIME_PROVIDER;
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
    codexThreadId: response.codexThreadId || response.productPlan?.workspaceState?.codexThreadId || "",
    assistantMessage: response.assistantMessage || t("rerunNotice"),
    toolCalls: [],
    toolResults: [],
    modelResponses: response.codexThreadId ? [{ ok: true, toolCallCount: 0, codexThreadId: response.codexThreadId }] : [],
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
  state.activeTrace.traceEvents = [
    ...(state.activeTrace.traceEvents || []),
    traceEvent
  ].slice(-36);
  if (traceEvent.runtimeProvider) state.activeTrace.runtimeProvider = normalizeRuntimeProvider(traceEvent.runtimeProvider);
  if (traceEvent.modelProvider) state.activeTrace.modelProvider = traceEvent.modelProvider;
  if (traceEvent.turnId) state.activeTrace.turnId = traceEvent.turnId;
  if (traceEvent.codexThreadId) state.activeTrace.codexThreadId = traceEvent.codexThreadId;
  if (traceEvent.type === "model_response") {
    state.activeTrace.modelResponses = [
      ...(state.activeTrace.modelResponses || []),
      {
        ok: Boolean(traceEvent.ok),
        toolCallCount: traceEvent.toolCallCount || 0,
        hasFinalMessage: Boolean(traceEvent.hasFinalMessage),
        errorCode: traceEvent.error?.code || "",
        errorMessage: traceEvent.error?.message || "",
        codexThreadId: traceEvent.codexThreadId || ""
      }
    ];
  }
  syncActiveProject({ activeTrace: state.activeTrace, runtimeProvider: state.runtimeProvider });
  render();
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
  render();
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
    const completedTrace = hasRealPlan ? response : planCreationTrace(response, message);
    completedTrace.traceEvents = streamTraceEvents;
    upsertProjectFromPlan(response.productPlan, {
      lastChatTurn: completedTrace,
      activeTrace: null,
      pendingConfirmation: response.pendingConfirmation || null,
      runtimeError: ""
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
    render();
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
  render();
  try {
    const response = await apiPost(`/api/workspaces/${state.productPlan.planId}/chat/confirm`, {
      sessionId: state.chatSessionId,
      confirmationId: state.pendingConfirmation.confirmationId,
      approved
    });
    if (token !== state.workspaceToken) return;
    state.productPlan = response.productPlan || state.productPlan;
    state.lastChatTurn = response;
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
    render();
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
    render();
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
  if (codex.codexThreadId) return `${t("runtimeStatusCodexReady")} · ${t("runtimeStatusCodexThread", compactId(codex.codexThreadId))}`;
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

function render() {
  renderStaticText();
  renderActiveStates();
  renderProjectList();
  renderConversation();
  renderInspector();
  renderModelFullscreen();
  renderPopovers();
  window.requestAnimationFrame(drawPreview);
}

function renderStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");
  setText("#newProject span:last-child", t("newProject"));
  setText(".sidebar-label", t("projectLabel"));
  setText("#openSettings span:last-child", t("settingsButton"));
  setText("#copySpec", t("previewSnapshot"));
  setText("#submitReview", t("submitOrder"));
  setText("#topbarTitle", currentTopbarTitle());
  if (dom.draftStatus) {
    dom.draftStatus.textContent = "";
    dom.draftStatus.hidden = true;
  }
  setText("#composerSummary", state.loading ? t("chatTraceRunning") : t("composerDefault"));
  setText("#scopeLevel", planStatusText());
  setAttr(".primary-nav", "aria-label", t("projectActionsAria"));
  setAttr(".thread-list", "aria-label", t("projectListAria"));
  setAttr(".inspector", "aria-label", t("inspectorAria"));
  setAttr("#runChain", "aria-label", state.loading ? t("cancelRunAria") : t("runChainAria"));
  setAttr("#runChain", "title", state.loading ? t("cancelRunAria") : t("runChainAria"));
  setAttr("#runChain", "aria-busy", state.loading ? "true" : "false");
  if (dom.runChain) dom.runChain.dataset.running = state.loading ? "true" : "false";
  setAttr("#openThreadMenu", "aria-label", t("threadMenuAria"));
  setAttr("#languageSelect", "aria-label", t("languageSelectAria"));
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
    archive: t("threadArchive")
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
      <button class="thread-row active" type="button" data-new-project-row>
        <span class="project-dot"></span>
        <strong>${escapeHtml(t("newDraftTitle"))}</strong>
      </button>
    `;
    return;
  }

  const rows = projects;
  list.innerHTML = rows
    .map(
      (project) => `
        <button class="thread-row ${project.projectId === state.activeProjectId ? "active" : ""}" type="button" data-sidebar-project="${escapeHtml(project.projectId)}" aria-label="${escapeHtml(projectTitle(project))}">
          <span class="project-dot"></span>
          <strong>${escapeHtml(projectTitle(project))}</strong>
        </button>
      `
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
  if (!state.productPlan) {
    dom.workspaceView.innerHTML = `
      <section class="workspace-card">
        <p>${escapeHtml(t("noPlan"))}</p>
        ${state.runtimeError ? `<p class="error-message">${escapeHtml(state.runtimeError)}</p>` : ""}
      </section>
    `;
    return;
  }
  const messages = state.productPlan.conversation || [];
  dom.workspaceView.innerHTML = `
    <div class="message-stack">
      ${messages.map((turn) => renderMessage(turn)).join("")}
    </div>
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

function renderRuntimeStatusSection() {
  const pending = state.pendingConfirmation;
  const turn = state.activeTrace || state.lastChatTurn;
  if (!pending && !turn) return "";
  const calls = turn?.toolCalls || [];
  const results = turn?.toolResults || [];
  const running = turn?.traceState === "running";
  return `
    <div class="runtime-status-panel" aria-label="${escapeHtml(t("chatTraceTitle"))}">
      <div class="runtime-status-head">
        <strong>${escapeHtml(pending ? t("chatConfirmationRequired") : running ? t("chatTraceRunning") : t("chatTraceTitle"))}</strong>
        <span>${escapeHtml(runtimeDisplayName(turn?.runtimeProvider || currentRuntimeProvider()))}</span>
      </div>
      ${renderTraceTimeline(turn, pending)}
      ${pending ? `
        <div class="packet-status warning">${escapeHtml(pending.toolCall?.name || "")}</div>
        <p class="section-note">${escapeHtml(pending.permission?.reason || t("chatConfirmationRequired"))}</p>
        <div class="segmented-row">
          <button type="button" class="active" data-chat-confirm="approve">${escapeHtml(t("approveChange"))}</button>
          <button type="button" data-chat-confirm="reject">${escapeHtml(t("rejectChange"))}</button>
        </div>
      ` : ""}
      <div class="queue-list compact">
        ${calls.length ? calls.map((call, index) => {
          const result = results[index]?.summary || {};
          const stateText = call.permission?.decision === "confirm"
            ? t("chatConfirmationRequired")
            : result.ok === false
              ? (result.code || "failed")
              : (result.newRevisionId || result.proposalId || call.permission?.decision || "ok");
          return `
            <div class="queue-item ${result.ok === false ? "blocked" : "queued"}">
              <button type="button" tabindex="-1">
                <span>${escapeHtml(call.name)}</span>
                <strong>${escapeHtml(stateText)}</strong>
                <p>${escapeHtml(toolCallSummary(call, result))}</p>
              </button>
            </div>
          `;
        }).join("") : `<p class="section-note">${escapeHtml(running ? t("traceWaiting") : t("chatTraceEmpty"))}</p>`}
      </div>
    </div>
  `;
}

function renderTraceTimeline(turn = {}, pending = null) {
  const rows = traceRows(turn, pending);
  if (!rows.length) return "";
  return `
    <div class="trace-timeline">
      ${rows.map((row) => `
        <div class="trace-row ${escapeHtml(row.status || "done")}">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(row.value || "")}</strong>
          ${row.detail ? `<p>${escapeHtml(row.detail)}</p>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function traceRows(turn = {}, pending = null) {
  const eventRows = traceEventRows(turn?.traceEvents || []);
  if (turn?.traceState === "running") {
    if (eventRows.length) {
      return [
        ...eventRows,
        { status: "pending", label: t("traceWaiting"), value: t("chatTraceRunning"), detail: normalizeRuntimeProvider(turn.runtimeProvider) === "codex" ? "Codex thread / Forge tools" : "Forge QueryEngine" }
      ];
    }
    return [
      { status: "done", label: t("traceReceived"), value: t("traceDone"), detail: turn.userMessage || "" },
      { status: "running", label: t("tracePrepare"), value: runtimeDisplayName(turn.runtimeProvider), detail: traceRuntimeDetail(turn) },
      { status: "pending", label: t("traceWaiting"), value: t("chatTraceRunning"), detail: normalizeRuntimeProvider(turn.runtimeProvider) === "codex" ? "Codex thread / Forge tools" : "Forge QueryEngine" }
    ];
  }
  if (turn?.traceState === "failed") {
    return [
      { status: "blocked", label: t("traceRuntime"), value: runtimeDisplayName(turn.runtimeProvider), detail: traceRuntimeDetail(turn) },
      { status: "blocked", label: t("traceFailed"), value: turn.assistantMessage || t("sendFailed") }
    ];
  }
  if (turn?.traceState === "cancelled") {
    return [
      ...eventRows,
      { status: "cancelled", label: t("traceRuntime"), value: runtimeDisplayName(turn.runtimeProvider), detail: traceRuntimeDetail(turn) },
      { status: "cancelled", label: t("traceDone"), value: turn.assistantMessage || t("sendCancelled") }
    ];
  }

  const rows = [];
  if (eventRows.length) {
    rows.push(...eventRows);
  } else {
    rows.push({
      status: "done",
      label: t("traceRuntime"),
      value: runtimeDisplayName(turn?.runtimeProvider || currentRuntimeProvider()),
      detail: traceRuntimeDetail(turn)
    });
  }
  if (turn?.codexThreadId) {
    rows.push({
      status: "done",
      label: "Codex thread",
      value: compactId(turn.codexThreadId),
      detail: turn.codexThreadId
    });
  }
  const modelResponses = turn?.modelResponses || [];
  if (!eventRows.length && modelResponses.length) {
    const failed = modelResponses.find((response) => response.ok === false);
    rows.push({
      status: failed ? "blocked" : "done",
      label: t("traceModel"),
      value: failed ? (failed.errorCode || t("traceFailed")) : `${modelResponses.length}`,
      detail: failed?.errorMessage || modelResponses.map((response) => {
        const count = response.toolCallCount || 0;
        return state.lang === "zh" ? `${count} 个工具意图` : `${count} tool intent${count === 1 ? "" : "s"}`;
      }).join(" / ")
    });
  }
  if ((turn?.toolResults || []).some((item) => item.summary?.code === "RAW_MUTATION_TARGET")) {
    rows.push({
      status: "blocked",
      label: t("traceToolDenied"),
      value: "RAW_MUTATION_TARGET",
      detail: state.lang === "zh" ? "已拒绝直接改 GeometrySpec / artifacts" : "Rejected direct GeometrySpec / artifact mutation"
    });
  }
  if (turn?.proposal?.proposalId) {
    rows.push({
      status: "done",
      label: t("traceProposal"),
      value: turn.proposal.proposalId,
      detail: turn.proposal.status || ""
    });
  }
  if (turn?.revision?.revisionId) {
    rows.push({
      status: "done",
      label: t("traceRevision"),
      value: turn.revision.revisionId,
      detail: turn.revision.status || turn.revision.modelArtifacts?.status || ""
    });
  }
  const artifacts = turn?.artifactPaths || {};
  if (Object.values(artifacts).some(Boolean)) {
    rows.push({
      status: "done",
      label: t("traceArtifacts"),
      value: t("traceDone"),
      detail: Object.keys(artifacts).filter((key) => artifacts[key]).slice(0, 4).join(", ")
    });
  }
  if (pending) {
    rows.push({
      status: "pending",
      label: t("traceConfirmation"),
      value: pending.toolCall?.name || "",
      detail: pending.permission?.reason || ""
    });
  }
  const eventCount = Array.isArray(turn?.eventsAppended) ? turn.eventsAppended.length : 0;
  if (eventCount && rows.length <= 1) {
    rows.push({
      status: "done",
      label: "events.jsonl",
      value: String(eventCount),
      detail: state.lang === "zh" ? "已写入项目事件" : "Project events appended"
    });
  }
  return rows;
}

function traceEventRows(events = []) {
  return events.map((event) => {
    switch (event.type) {
      case "stream_started":
        return {
          status: "running",
          label: t("traceStream"),
          value: runtimeDisplayName(event.runtimeProvider || currentRuntimeProvider()),
          detail: event.modelProvider ? `modelProvider: ${event.modelProvider}` : ""
        };
      case "plan_create_started":
        return {
          status: "running",
          label: t("tracePlanCreate"),
          value: runtimeDisplayName(event.runtimeProvider || currentRuntimeProvider()),
          detail: event.text || ""
        };
      case "product_plan_created":
        return {
          status: "done",
          label: t("tracePlanCreate"),
          value: event.revisionId || event.planId || t("traceDone"),
          detail: event.modelStatus || ""
        };
      case "codex_thread_requested":
      case "codex_thread_initializing":
        return {
          status: "running",
          label: "Codex thread",
          value: event.type === "codex_thread_requested" ? t("tracePrepare") : t("chatTraceRunning"),
          detail: event.workspaceId || ""
        };
      case "codex_thread_ready":
        return {
          status: "done",
          label: "Codex thread",
          value: compactId(event.codexThreadId || ""),
          detail: event.codexThreadId || ""
        };
      case "codex_thread_started":
        return {
          status: "done",
          label: "Codex thread",
          value: compactId(event.codexThreadId || ""),
          detail: event.codexThreadId || ""
        };
      case "codex_turn_started":
        return {
          status: "running",
          label: t("traceCodexTurn"),
          value: t("chatTraceRunning"),
          detail: event.sdkEventType || ""
        };
      case "codex_turn_completed":
        return {
          status: "done",
          label: t("traceCodexTurn"),
          value: t("traceDone"),
          detail: formatCodexUsage(event.usage) || (event.itemCount ? `${event.itemCount} items` : "")
        };
      case "codex_turn_failed":
        return {
          status: "blocked",
          label: t("traceCodexTurn"),
          value: event.error?.code || t("traceFailed"),
          detail: event.error?.message || ""
        };
      case "codex_item_started":
      case "codex_item_updated":
      case "codex_item_completed":
        return traceRowForCodexItem(event);
      case "codex_sdk_event":
        return {
          status: "done",
          label: t("traceCodexItem"),
          value: event.sdkEventType || t("traceDone"),
          detail: ""
        };
      case "chat_turn_started":
        return {
          status: "running",
          label: t("traceRuntime"),
          value: runtimeDisplayName(event.runtimeProvider || currentRuntimeProvider()),
          detail: event.modelProvider ? `modelProvider: ${event.modelProvider}` : ""
        };
      case "user_message":
        return {
          status: "done",
          label: t("traceReceived"),
          value: t("traceDone"),
          detail: event.text || ""
        };
      case "context_pack_built":
        return {
          status: "done",
          label: t("tracePrepare"),
          value: `${event.allowedToolCount || 0} tools`,
          detail: state.lang === "zh"
            ? `${event.openProposalCount || 0} 个待确认方案 / 当前版本 ${event.currentRevisionId || "-"}`
            : `${event.openProposalCount || 0} open proposals / current ${event.currentRevisionId || "-"}`
        };
      case "model_request":
        return {
          status: "running",
          label: t("traceModelRequest"),
          value: event.modelProvider || "",
          detail: state.lang === "zh"
            ? `${event.toolCount || 0} 个可用工具 / 第 ${Number(event.iteration || 0) + 1} 轮`
            : `${event.toolCount || 0} tools / iteration ${Number(event.iteration || 0) + 1}`
        };
      case "model_response":
        return {
          status: event.ok ? "done" : "blocked",
          label: t("traceModel"),
          value: event.ok ? `${event.toolCallCount || 0}` : (event.error?.code || t("traceFailed")),
          detail: event.error?.message || (event.codexThreadId ? `Codex thread: ${event.codexThreadId}` : "")
        };
      case "tool_call_selected":
        return {
          status: "running",
          label: t("traceToolSelected"),
          value: event.toolName || "",
          detail: formatTraceSummary(event.inputSummary)
        };
      case "tool_execution_started":
        return {
          status: "running",
          label: t("traceToolRunning"),
          value: event.toolName || "",
          detail: event.toolCallId || ""
        };
      case "tool_result":
      case "tool_failed":
        return {
          status: event.ok === false || event.type === "tool_failed" ? "blocked" : "done",
          label: t("traceToolResult"),
          value: event.summary?.newRevisionId || event.summary?.proposalId || event.toolName || "",
          detail: event.error?.message || formatTraceSummary(event.summary)
        };
      case "tool_denied":
        return {
          status: "blocked",
          label: t("traceToolDenied"),
          value: event.error?.code || event.toolName || "",
          detail: event.error?.message || ""
        };
      case "confirmation_required":
        return {
          status: "pending",
          label: t("traceConfirmation"),
          value: event.toolName || "",
          detail: event.permission?.reason || ""
        };
      case "assistant_message":
        return {
          status: "done",
          label: t("traceDone"),
          value: event.pendingConfirmationId ? t("chatConfirmationRequired") : t("traceDone"),
          detail: event.text || ""
        };
      case "chat_turn_completed":
        return {
          status: event.pendingConfirmationId ? "pending" : "done",
          label: t("traceDone"),
          value: event.pendingConfirmationId ? t("chatConfirmationRequired") : t("traceDone"),
          detail: state.lang === "zh"
            ? `${event.toolCallCount || 0} 个工具 / ${event.toolResultCount || 0} 个结果`
            : `${event.toolCallCount || 0} tools / ${event.toolResultCount || 0} results`
        };
      case "chat_turn_failed":
      case "plan_create_failed":
        return {
          status: "blocked",
          label: t("traceFailed"),
          value: event.error?.code || t("traceFailed"),
          detail: event.error?.message || ""
        };
      default:
        return {
          status: "done",
          label: event.type || t("traceDone"),
          value: t("traceDone"),
          detail: ""
        };
    }
  });
}

function traceRowForCodexItem(event = {}) {
  const summary = event.summary || {};
  const failed = event.itemStatus === "failed" || summary.status === "failed";
  const completed = event.type === "codex_item_completed" || event.itemStatus === "completed" || summary.status === "completed";
  return {
    status: failed ? "blocked" : completed ? "done" : "running",
    label: codexItemLabel(event.itemType),
    value: codexItemValue(event.itemType, summary, event.itemStatus),
    detail: formatTraceSummary(summary)
  };
}

function codexItemLabel(itemType = "") {
  if (itemType === "command_execution") return t("traceCodexCommand");
  if (itemType === "file_change") return t("traceCodexFileChange");
  if (itemType === "mcp_tool_call") return t("traceCodexMcp");
  return t("traceCodexItem");
}

function codexItemValue(itemType = "", summary = {}, status = "") {
  if (itemType === "command_execution") return summary.command || status || t("chatTraceRunning");
  if (itemType === "file_change") return summary.changeCount ? `${summary.changeCount}` : (summary.status || status || t("traceDone"));
  if (itemType === "mcp_tool_call") return [summary.server, summary.tool].filter(Boolean).join("/") || status || t("traceDone");
  if (itemType === "agent_message") return state.lang === "zh" ? "输出消息" : "assistant message";
  if (itemType === "reasoning") return state.lang === "zh" ? "推理摘要" : "reasoning summary";
  if (itemType === "todo_list") {
    const itemCount = Number(summary.itemCount || 0);
    const completedCount = Number(summary.completedCount || 0);
    return itemCount ? `${completedCount}/${itemCount}` : status || t("traceDone");
  }
  if (itemType === "web_search") return summary.query || status || t("traceDone");
  if (itemType === "error") return summary.message || t("traceFailed");
  return status || t("traceDone");
}

function formatCodexUsage(usage = null) {
  if (!usage) return "";
  const parts = [];
  if (usage.inputTokens !== undefined) parts.push(`in ${usage.inputTokens}`);
  if (usage.cachedInputTokens !== undefined) parts.push(`cached ${usage.cachedInputTokens}`);
  if (usage.outputTokens !== undefined) parts.push(`out ${usage.outputTokens}`);
  if (usage.reasoningOutputTokens !== undefined) parts.push(`reasoning ${usage.reasoningOutputTokens}`);
  return parts.length ? `${t("traceCodexUsage")}: ${parts.join(" / ")}` : "";
}

function formatTraceSummary(summary = {}) {
  const entries = Object.entries(summary || {})
    .filter(([, value]) => value !== "" && value !== null && value !== undefined && value !== false)
    .slice(0, 6)
    .map(([key, value]) => formatTraceValue(key, value))
    .filter(Boolean);
  return entries.join(" / ");
}

function formatTraceValue(key, value) {
  if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
  if (value && typeof value === "object") {
    if (key === "artifactPaths") {
      const artifactKeys = Object.keys(value).filter((itemKey) => value[itemKey]);
      return artifactKeys.length ? `${key}: ${artifactKeys.join(", ")}` : "";
    }
    return `${key}: ${JSON.stringify(value).slice(0, 96)}`;
  }
  return `${key}: ${value}`;
}

function traceRuntimeDetail(turn = {}) {
  const model = turn?.modelProvider || turn?.runtimeProvider || currentRuntimeProvider();
  return model ? `modelProvider: ${model}` : "";
}

function runtimeDisplayName(value = "") {
  const normalized = String(value || "mock");
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
  const runtimeStatus = renderRuntimeStatusSection();
  if (!revision && !runtimeStatus) {
    dom.inspectorContent.hidden = true;
    dom.inspectorContent.innerHTML = "";
    return;
  }
  dom.inspectorContent.hidden = false;
  const sections = [];
  if (revision) {
    sections.push(["model", t("sections.model"), inspectorSectionSummary("model", revision), renderModelSection(revision)]);
  }
  if (runtimeStatus) {
    sections.push(["runtime", t("chatTraceTitle"), inspectorSectionSummary("runtime", revision), runtimeStatus]);
  }
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
    ${renderProxyComponentNotice(revision)}
    ${renderComponentAssetList(revision)}
    ${renderArtifactLinks(revision)}
    <p class="section-note">${escapeHtml(t("modelViewerHint"))}</p>
    <p class="section-note">${escapeHtml(t("modifyThroughChat"))}</p>
  `;
}

function renderProxyComponentNotice(revision) {
  return revision?.geometrySpec?.componentAssetManifest
    ? `<p class="proxy-notice">${escapeHtml(t("proxyComponentNotice"))}</p>`
    : "";
}

function renderComponentAssetList(revision) {
  const components = revision?.geometrySpec?.componentAssetManifest?.components || [];
  if (!components.length) return "";
  return `
    <div class="component-assets">
      <strong>${escapeHtml(t("componentAssetsTitle"))}</strong>
      ${components.slice(0, 6).map((component) => `
        <div class="component-asset-row">
          <span>
            <b>${escapeHtml(component.displayName || component.componentId)}</b>
            <small>${escapeHtml(t("assetQuality"))}: ${escapeHtml(assetQualityLabel(component.assetQuality))} / ${escapeHtml(t("validationStatus"))}: ${escapeHtml(validationStatusLabel(component.validationStatus))}</small>
          </span>
          <em>${escapeHtml(t("resolvedPreview"))}: ${escapeHtml(resolvedAssetLabel(component.preview?.resolvedType))}</em>
        </div>
      `).join("")}
    </div>
  `;
}

function renderArtifactLinks(revision) {
  if (generationIsPending(revision) || revision?.modelArtifacts?.status !== "generated") return "";
  const artifacts = revision.modelArtifacts?.artifacts || revision.modelPreview?.assets || {};
  const links = [
    "productPlan",
    "geometrySpec",
    "componentSelections",
    "componentDescriptors",
    "componentAssetManifest",
    "validationReport",
    "designSummary",
    "glb",
    "shellFront",
    "shellBack",
    "stl",
    "step"
  ]
    .map((key) => [key, artifacts[key]])
    .filter(([, artifact]) => artifact?.url)
    .map(([key, artifact]) => `
      <a class="artifact-link" href="${escapeHtml(artifact.url)}" target="_blank" rel="noreferrer">
        ${escapeHtml(t(`artifactLabels.${key}`))}
      </a>
    `)
    .join("");
  return links
    ? `<div class="artifact-links"><strong>${escapeHtml(t("artifactLinksTitle"))}</strong><span>${links}</span></div>`
    : "";
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

function assetQualityLabel(value = "missing") {
  return t(`assetQualityLabels.${value}`) || value;
}

function validationStatusLabel(value = "missing") {
  return t(`validationStatusLabels.${value}`) || value;
}

function resolvedAssetLabel(value = "procedural_visual_proxy") {
  return String(value || "procedural_visual_proxy").replaceAll("_", " ");
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
    if (dom.dfmPopover) dom.dfmPopover.innerHTML = empty;
    return;
  }
  if (!dom.dfmPopover) return;
  dom.dfmPopover.innerHTML = `
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
  setFloatingTrigger("");
}

function setFloatingTrigger(activeName) {
  const triggers = {
    thread: [dom.openThreadMenu],
    reviewContact: [dom.submitReview],
    settings: [dom.openSettings]
  };
  Object.entries(triggers).forEach(([name, buttons]) => {
    buttons.forEach((button) => button?.classList.toggle("active", name === activeName));
  });
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
  render();
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
  const newProjectRow = event.target.closest("[data-new-project-row]");
  if (newProjectRow) {
    startNewProject();
    return;
  }
  const projectButton = event.target.closest("[data-sidebar-project]");
  if (!projectButton) return;
  if (!activateProject(projectButton.dataset.sidebarProject)) return;
  setNotice(projectTitle(activeProject()));
  render();
  refreshRuntimeStatusForProjectBoundary();
});

dom.workspaceView.addEventListener("click", (event) => {
  if (handlePreviewModeClick(event)) return;
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
    render();
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

dom.copySpec.addEventListener("click", () => {
  if (!currentRevision()) {
    setNotice(t("noPlan"));
    return;
  }
  openFloating("dfm");
});

dom.submitReview.addEventListener("click", () => openFloating("reviewContact"));
window.yWorkbenchSubmitForReview = submitForReview;
dom.newProject.addEventListener("click", startNewProject);
dom.openThreadMenu.addEventListener("click", () => openFloating("thread"));
dom.openSettings.addEventListener("click", () => {
  openFloating("settings");
  refreshRuntimeStatus({ renderAfter: true }).catch(() => {});
});

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
    window.localStorage.setItem("forgeRuntimeProvider", value);
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
    if (action.dataset.action === "history") {
      state.activeSidebar = "history";
      closeFloating();
      render();
      return;
    }
    setNotice(`${t("actionNotice")}${action.textContent.trim()}`);
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
