const SUPPORTED_LANGUAGES = ["zh", "en"];

const copy = {
  zh: {
    appTitle: "Forge",
    navChat: "对话生成",
    navHistory: "项目历史",
    navReview: "审核包",
    projectLabel: "内部草稿",
    projectName: "Forge 实验室",
    settingsButton: "Forge 设置",
    uiPrototype: "内部 MVP",
    topbarStatus: "ProductPlan 实时方案",
    submitOrder: "提交审核下单",
    previewSnapshot: "预览方案快照",
    composerDefault: "持续对话会更新右侧 ProductPlan、零件、模型占位、估算和审核状态",
    composerPlaceholder: "说出你想做的硬件，例如：我想做一个小型木纹桌面屏，显示天气和照片，3.5 英寸，USB-C 供电。",
    addInputAria: "添加输入资产",
    scope: "范围",
    partsChip: "零件",
    modelChip: "模型",
    riskChip: "风险",
    runChainAria: "发送需求并更新方案",
    inspectorAria: "实时方案包",
    settingsTitle: "Forge 设置",
    language: "语言",
    langZh: "简体中文",
    langEn: "English",
    languageSelectAria: "界面语言",
    threadMenuAria: "方案菜单",
    attachSketch: "注册草图",
    attachReference: "注册参考链接",
    attachConstraints: "添加约束说明",
    attachBehavior: "添加设备行为",
    threadRename: "重命名方案",
    threadDuplicate: "复制草稿",
    threadExport: "导出方案快照",
    threadArchive: "归档草稿",
    viewBuild: "对话生成",
    planReady: "标准桌面屏",
    planManual: "人工扩展草案",
    planSubmitted: "已提交人工审核",
    benchAgent: "原型助手",
    fallbackNotice: "后端暂不可用，正在显示本地 ProductPlan 占位",
    rerunNotice: "已更新 ProductPlan revision",
    submitNeedContact: "请先填写姓名和邮箱",
    submittedNotice: "已生成本地人工审核包，等待确认；不是付款，也不是立即生产。",
    actionNotice: "已选择：",
    contactTitle: "提交审核下单",
    contactName: "姓名",
    contactEmail: "邮箱",
    contactHint: "内部版只收姓名和邮箱，用于人工审核后联系。",
    sections: {
      scope: "范围",
      parts: "零件清单（BOM）",
      model: "结构/3D 预览占位",
      layout: "电子零件布局",
      quote: "估算+假设",
      risk: "风险限制",
      review: "审核提交状态"
    },
    required: "待确认",
    confirmed: "已确认",
    modelNotCad: "不是最终 CAD",
    noPlan: "输入第一条硬件想法后生成方案。",
    standardShell: "标准 3D 打印外壳",
    woodgrainDemo: "木纹桌面屏",
    settingsRows: [
      ["内部原型模式", "提交只生成本地人工审核包，不付款、不生产、不接供应商。"],
      ["对话优先", "用户持续聊天，右侧 ProductPlan 实时更新。"],
      ["标准 3D 打印外壳", "木纹、鼠尾草绿、石墨黑都只是标准外壳的表面效果。"],
      ["生成能力占位", "3D、电子布局和 AI provider 都通过 job 接口预留。"],
      ["界面语言", "保留中文和 English 两套文案。"],
      ["文案维护规则", "新增按钮、状态、弹窗、文档都要同步更新中英文。"]
    ],
    demoRequest:
      "我想做一个小型木纹桌面屏，可以显示家庭照片、天气和明天日程，3.5 英寸，USB-C 供电，夜间自动变暗。"
  },
  en: {
    appTitle: "Forge",
    navChat: "Conversation",
    navHistory: "Project history",
    navReview: "Review packet",
    projectLabel: "Internal drafts",
    projectName: "Forge Lab",
    settingsButton: "Workbench settings",
    uiPrototype: "Internal MVP",
    topbarStatus: "Live ProductPlan",
    submitOrder: "Submit for review/order",
    previewSnapshot: "Preview plan snapshot",
    composerDefault: "Conversation updates the ProductPlan, parts, model placeholder, estimate, and review state",
    composerPlaceholder: "Describe the hardware you want, e.g. a small woodgrain desktop display for weather and photos, 3.5 in, USB-C powered.",
    addInputAria: "Add input asset",
    scope: "Scope",
    partsChip: "Parts",
    modelChip: "Model",
    riskChip: "Risk",
    runChainAria: "Send request and update plan",
    inspectorAria: "Live plan packet",
    settingsTitle: "Workbench settings",
    language: "Language",
    langZh: "Simplified Chinese",
    langEn: "English",
    languageSelectAria: "Interface language",
    threadMenuAria: "Plan menu",
    attachSketch: "Register sketch",
    attachReference: "Register reference URL",
    attachConstraints: "Add constraints note",
    attachBehavior: "Add device behavior",
    threadRename: "Rename plan",
    threadDuplicate: "Duplicate draft",
    threadExport: "Export plan snapshot",
    threadArchive: "Archive draft",
    viewBuild: "Conversation",
    planReady: "standard desktop display",
    planManual: "manual expansion draft",
    planSubmitted: "submitted for human review",
    benchAgent: "Prototype assistant",
    fallbackNotice: "Backend unavailable; showing local ProductPlan placeholder",
    rerunNotice: "ProductPlan revision updated",
    submitNeedContact: "Enter name and email first",
    submittedNotice: "Local human review packet generated; no payment or manufacturing has started.",
    actionNotice: "Selected: ",
    contactTitle: "Submit for review/order",
    contactName: "Name",
    contactEmail: "Email",
    contactHint: "Internal v1 only collects name and email for human follow-up.",
    sections: {
      scope: "Scope",
      parts: "Parts list (BOM)",
      model: "Structure / 3D placeholder",
      layout: "Electronics layout",
      quote: "Estimate + assumptions",
      risk: "Risk limits",
      review: "Review submission"
    },
    required: "needs input",
    confirmed: "confirmed",
    modelNotCad: "not final CAD",
    noPlan: "Send the first hardware idea to generate a plan.",
    standardShell: "Standard 3D printed shell",
    woodgrainDemo: "Woodgrain desk display",
    settingsRows: [
      ["Internal prototype mode", "Submission writes a local human review packet; no payment, production, or supplier order starts."],
      ["Conversation first", "The user keeps chatting while the right-side ProductPlan updates."],
      ["Standard 3D printed shell", "Woodgrain, sage, and graphite are finish treatments on the same shell path."],
      ["Generation placeholders", "3D, electronics layout, and AI providers are reserved through job interfaces."],
      ["Interface language", "Keep both Chinese and English copy."],
      ["Copy maintenance", "Buttons, statuses, popovers, and docs must stay bilingual."]
    ],
    demoRequest:
      "I want a small woodgrain desktop display that shows family photos, weather, and tomorrow's calendar, 3.5 in, USB-C powered, and dim at night."
  }
};

const state = {
  lang: initialLanguage(),
  productPlan: null,
  activeSidebar: "chat",
  collapsedSections: new Set(["scope", "parts", "model", "layout", "risk"]),
  notice: "",
  loading: false,
  submittingReview: false,
  contactInfo: { name: "", email: "" }
};

const dom = {
  workspaceView: document.querySelector("#workspaceView"),
  inspectorContent: document.querySelector("#inspectorContent"),
  form: document.querySelector("#promptForm"),
  ideaInput: document.querySelector("#ideaInput"),
  composerSummary: document.querySelector("#composerSummary"),
  scopeLevel: document.querySelector("#scopeLevel"),
  draftStatus: document.querySelector("#draftStatus"),
  apiStatus: document.querySelector("#apiStatus"),
  topbarTitle: document.querySelector("#topbarTitle"),
  copySpec: document.querySelector("#copySpec"),
  submitReview: document.querySelector("#submitReview"),
  openThreadMenu: document.querySelector("#openThreadMenu"),
  openSettings: document.querySelector("#openSettings"),
  openAttach: document.querySelector("#openAttach"),
  openScope: document.querySelector("#openScope"),
  openBom: document.querySelector("#openBom"),
  openGuardrails: document.querySelector("#openGuardrails"),
  openDfm: document.querySelector("#openDfm"),
  languageSelect: document.querySelector("#languageSelect"),
  floatingLayer: document.querySelector("#floatingLayer"),
  scopePopover: document.querySelector("#scopePopover"),
  bomPopover: document.querySelector("#bomPopover"),
  guardrailsPopover: document.querySelector("#guardrailsPopover"),
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
}

async function createInitialPlan() {
  try {
    const response = await apiPost("/api/plans", {
      initialMessage: t("demoRequest"),
      language: state.lang
    });
    state.productPlan = response.productPlan;
    state.contactInfo = response.productPlan.contactInfo || state.contactInfo;
  } catch {
    state.productPlan = fallbackProductPlan();
    setNotice(t("fallbackNotice"));
  }
  render();
}

async function sendTurn(message) {
  state.loading = true;
  render();
  try {
    const response = state.productPlan?.planId && !state.productPlan.planId.startsWith("fallback")
      ? await apiPost(`/api/plans/${state.productPlan.planId}/turns`, { message })
      : await apiPost("/api/plans", { initialMessage: message, language: state.lang });
    state.productPlan = response.productPlan;
    setNotice(t("rerunNotice"));
  } catch {
    state.productPlan = fallbackProductPlan(message);
    setNotice(t("fallbackNotice"));
  } finally {
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
    setNotice(t("submittedNotice"));
  } catch {
    setNotice(t("fallbackNotice"));
  } finally {
    state.loading = false;
    state.submittingReview = false;
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
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function render() {
  renderStaticText();
  renderActiveStates();
  renderHistory();
  renderConversation();
  renderInspector();
  renderPopovers();
  window.requestAnimationFrame(drawPreview);
}

function renderStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");
  setText('[data-view="chat"] span:last-child', t("navChat"));
  setText('[data-view="history"] span:last-child', t("navHistory"));
  setText('[data-view="review"] span:last-child', t("navReview"));
  setText(".sidebar-label", t("projectLabel"));
  setText(".project-row span:last-child", t("projectName"));
  setText("#openSettings span:last-child", t("settingsButton"));
  setText("#copySpec", t("previewSnapshot"));
  setText("#submitReview", t("submitOrder"));
  setText("#openScope", t("scope"));
  setText("#openBom", t("partsChip"));
  setText("#openGuardrails", t("riskChip"));
  setText("#openDfm", t("modelChip"));
  setText("#topbarTitle", t("appTitle"));
  setText("#draftStatus", t("topbarStatus"));
  setText("#composerSummary", state.loading ? "..." : t("composerDefault"));
  setText("#scopeLevel", planStatusText());
  setAttr(".inspector", "aria-label", t("inspectorAria"));
  setAttr("#openAttach", "aria-label", t("addInputAria"));
  setAttr("#runChain", "aria-label", t("runChainAria"));
  setAttr("#openThreadMenu", "aria-label", t("threadMenuAria"));
  setAttr("#languageSelect", "aria-label", t("languageSelectAria"));
  if (dom.ideaInput) dom.ideaInput.placeholder = t("composerPlaceholder");
  if (dom.apiStatus) dom.apiStatus.textContent = state.notice || t("uiPrototype");

  const actionLabels = {
    rename: t("threadRename"),
    duplicate: t("threadDuplicate"),
    export: t("threadExport"),
    archive: t("threadArchive"),
    sketch: t("attachSketch"),
    reference: t("attachReference"),
    constraints: t("attachConstraints"),
    behavior: t("attachBehavior")
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
}

function renderActiveStates() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeSidebar);
  });
}

function renderHistory() {
  const list = document.querySelector(".thread-list");
  if (!list) return;
  const revision = currentRevision();
  const title = planTitle(revision);
  const rows = [
    {
      id: "current",
      title,
      detail: planStatusText(),
      meta: state.productPlan?.revisions?.length ? `r${state.productPlan.revisions.length}` : "new"
    },
    {
      id: "woodgrain-demo",
      title: t("woodgrainDemo"),
      detail: t("standardShell"),
      meta: "demo"
    },
    {
      id: "manual",
      title: state.lang === "zh" ? "人工扩展草案" : "Manual expansion draft",
      detail: state.lang === "zh" ? "非标准产品内部评估" : "Non-standard internal review",
      meta: "hold"
    }
  ];
  list.innerHTML = rows
    .map(
      (row, index) => `
        <button class="thread-row ${index === 0 ? "active" : ""}" type="button" data-history="${escapeHtml(row.id)}">
          <span>
            <strong>${escapeHtml(row.title)}</strong>
            <small>${escapeHtml(row.detail)}</small>
          </span>
          <em>${escapeHtml(row.meta)}</em>
        </button>
      `
    )
    .join("");
}

function renderConversation() {
  if (!state.productPlan) {
    dom.workspaceView.innerHTML = `<section class="workspace-card"><p>${escapeHtml(t("noPlan"))}</p></section>`;
    return;
  }
  const revision = currentRevision();
  const messages = state.productPlan.conversation || [];
  dom.workspaceView.innerHTML = `
    <div class="message-stack">
      ${messages.map((turn) => renderMessage(turn)).join("")}
    </div>
    <section class="inline-panel flow-panel" aria-label="ProductPlan">
      <div class="inline-panel-head">
        <span class="inline-label">ProductPlan</span>
        <strong>${escapeHtml(planTitle(revision))}</strong>
      </div>
      <div class="flow-list">
        ${renderPlanSteps(revision)}
      </div>
    </section>
  `;
}

function renderMessage(turn) {
  const role = turn.role === "assistant" ? "ai" : "user";
  const title = turn.role === "assistant" ? `<strong>${escapeHtml(t("benchAgent"))}</strong>` : "";
  return `
    <article class="message ${role}">
      <div class="bubble">
        ${title}
        <p>${escapeHtml(turn.text)}</p>
      </div>
    </article>
  `;
}

function renderPlanSteps(revision) {
  if (!revision) return "";
  const missing = state.productPlan.requiredInputs?.missing || [];
  const steps = [
    ["scope", t("sections.scope"), planTitle(revision), "done"],
    ["parts", t("sections.parts"), `${revision.modules?.length || 0} modules`, "done"],
    ["model", t("sections.model"), revision.modelPreview?.viewerType || "placeholder_3d", "ready"],
    ["layout", t("sections.layout"), `${revision.electronicsLayout?.placements?.length || 0} placements`, "ready"],
    ["quote", t("sections.quote"), revision.quoteEstimate?.range || revision.quote?.range || "", "done"],
    ["risk", t("sections.risk"), revision.riskReport?.blocked ? t("planManual") : t("planReady"), revision.riskReport?.blocked ? "warn" : "done"],
    ["required", t("required"), missing.length ? missing.join(", ") : t("confirmed"), missing.length ? "warn" : "done"]
  ];
  return steps
    .map(
      ([key, title, summary, stateName], index) => `
        <button class="flow-step ${stateName}" type="button" data-step="${escapeHtml(key)}">
          <span class="step-index">${index + 1}</span>
          <span>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(summary)}</small>
          </span>
          <b>${stateName === "warn" ? "!" : "✓"}</b>
        </button>
      `
    )
    .join("");
}

function renderInspector() {
  const revision = currentRevision();
  if (!revision) {
    dom.inspectorContent.innerHTML = "";
    return;
  }
  const sections = [
    ["scope", t("sections.scope"), inspectorSectionSummary("scope", revision), renderScopeSection(revision)],
    ["parts", t("sections.parts"), inspectorSectionSummary("parts", revision), renderPartsSection(revision)],
    ["model", t("sections.model"), inspectorSectionSummary("model", revision), renderModelSection(revision)],
    ["layout", t("sections.layout"), inspectorSectionSummary("layout", revision), renderLayoutSection(revision)],
    ["quote", t("sections.quote"), inspectorSectionSummary("quote", revision), renderQuoteSection(revision)],
    ["risk", t("sections.risk"), inspectorSectionSummary("risk", revision), renderRiskSection(revision)],
    ["review", t("sections.review"), inspectorSectionSummary("review", revision), renderReviewSection()]
  ];
  dom.inspectorContent.innerHTML = sections
    .map(([key, title, summary, body]) => {
      const collapsed = state.collapsedSections.has(key);
      return `
        <section class="inspector-card">
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

function inspectorSectionSummary(key, revision) {
  if (key === "scope") return planTitle(revision);
  if (key === "parts") return `${revision.modules?.length || 0} modules`;
  if (key === "model") return `${revision.modelPreview?.viewerType || "placeholder_3d"} · ${t("modelNotCad")}`;
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
  const model = revision.modelPreview || {};
  const params = model.modelParameters || {};
  return `
    <div class="preview-card">
      <canvas data-device-canvas width="760" height="520" aria-label="${escapeHtml(t("sections.model"))}"></canvas>
    </div>
    <div class="kv-list">
      <span>Viewer <strong>${escapeHtml(model.viewerType || "placeholder_3d")}</strong></span>
      <span>Mode <strong>${escapeHtml(model.generationMode || "ai_provider_reserved")}</strong></span>
      <span>${escapeHtml(t("modelNotCad"))} <strong>${escapeHtml(params.manufacturingPath || "standardized_3d_print")}</strong></span>
    </div>
    <p class="section-note">${escapeHtml((model.notes || [])[0] || "")}</p>
  `;
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

function renderReviewSection() {
  const review = state.productPlan.reviewSubmission || {};
  return `
    <label class="contact-row">
      <span>${escapeHtml(t("contactName"))}</span>
      <input data-contact-field="name" value="${escapeHtml(state.contactInfo.name)}" />
    </label>
    <label class="contact-row">
      <span>${escapeHtml(t("contactEmail"))}</span>
      <input data-contact-field="email" value="${escapeHtml(state.contactInfo.email)}" />
    </label>
    <p class="section-note">${escapeHtml(review.humanReviewNotice || t("contactHint"))}</p>
    <div class="packet-status ${review.accepted ? "ready" : "quote"}">${escapeHtml(review.status || planStatusText())}</div>
  `;
}

function renderPopovers() {
  const revision = currentRevision();
  if (!revision) return;
  dom.scopePopover.innerHTML = `<strong>${escapeHtml(t("sections.scope"))}</strong><p>${escapeHtml(revision.spec?.user_request || "")}</p>`;
  dom.bomPopover.innerHTML = `<strong>${escapeHtml(t("sections.parts"))}</strong>${renderPartsSection(revision)}`;
  dom.guardrailsPopover.innerHTML = `<strong>${escapeHtml(t("sections.risk"))}</strong>${renderRiskSection(revision)}`;
  dom.dfmPopover.innerHTML = `<strong>${escapeHtml(t("sections.model"))}</strong><p>${escapeHtml(revision.modelPreview?.notes?.join(" ") || "")}</p>`;
}

function currentRevision() {
  const plan = state.productPlan;
  if (!plan) return null;
  return plan.revisions?.find((revision) => revision.revisionId === plan.currentRevisionId)
    || plan.revisions?.at(-1)
    || null;
}

function planTitle(revision) {
  if (!revision) return t("noPlan");
  const size = revision.spec?.enclosure?.screen_size_in || 5;
  const finish = revision.spec?.enclosure?.finish || "woodgrain";
  return state.lang === "zh"
    ? `${finishLabel(finish)} ${size} 英寸桌面屏`
    : `${finishLabel(finish)} ${size} in desktop display`;
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

function fallbackProductPlan(message = t("demoRequest")) {
  const now = new Date().toISOString();
  const revision = {
    revisionId: "fallback-rev",
    productCategory: "standard_desktop_display",
    spec: {
      product_type: "ai_desktop_display",
      user_request: message,
      enclosure: {
        standardization: "3d_print_only",
        finish: "woodgrain",
        screen_size_in: 3.5
      },
      power: "usb_c_low_voltage"
    },
    modules: [
      { id: "core.y_core_lite", category: "Core", name: "Y-Core Lite", unitCost: 58, status: "approved" },
      { id: "display.tft_3_5", category: "Display", name: "3.5 inch TFT", unitCost: 28, status: "approved" },
      { id: "enclosure.woodgrain", category: "Shell", name: "Woodgrain 3D printed shell", unitCost: 24, status: "approved" }
    ],
    riskReport: { blocked: false, items: [{ level: "ok", text: "Local placeholder keeps the standard desktop display boundary." }] },
    quote: { range: "$210-$265" },
    quoteEstimate: { range: "$210-$265", assumptions: ["Local placeholder estimate."] },
    modelPreview: { viewerType: "placeholder_3d", generationMode: "ai_provider_reserved", modelParameters: { dimensionsMm: { width: 132, height: 84, depth: 36 }, finish: "woodgrain", manufacturingPath: "standardized_3d_print" }, notes: ["This is a structure preview placeholder, not final CAD."] },
    electronicsLayout: { placements: [], conflicts: [{ level: "ok", note: "Placeholder layout." }] },
    assumptions: ["Local fallback"],
    createdAt: now
  };
  return {
    planId: "fallback-plan",
    status: "standard_supported",
    currentRevisionId: revision.revisionId,
    requiredInputs: {
      purpose: { confirmed: true },
      screenSize: { confirmed: true, value: 3.5 },
      finish: { confirmed: true, value: "woodgrain" },
      missing: []
    },
    conversation: [
      { turnId: "fallback-user", role: "user", text: message, assetIds: [], createdAt: now },
      { turnId: "fallback-ai", role: "assistant", text: t("fallbackNotice"), assetIds: [], createdAt: now }
    ],
    revisions: [revision],
    assets: [],
    jobs: [],
    contactInfo: { name: "", email: "" },
    reviewSubmission: null,
    createdAt: now,
    updatedAt: now
  };
}

function openFloating(name) {
  dom.floatingLayer.hidden = false;
  dom.floatingLayer.querySelectorAll("[data-dialog]").forEach((dialog) => {
    dialog.hidden = dialog.dataset.dialog !== name;
  });
  setFloatingTrigger(name);
}

function closeFloating() {
  dom.floatingLayer.hidden = true;
  dom.floatingLayer.querySelectorAll("[data-dialog]").forEach((dialog) => {
    dialog.hidden = true;
  });
  setFloatingTrigger("");
}

function setFloatingTrigger(activeName) {
  const triggers = {
    thread: [dom.openThreadMenu],
    attach: [dom.openAttach],
    scope: [dom.openScope],
    bom: [dom.openBom],
    guardrails: [dom.openGuardrails],
    dfm: [dom.openDfm],
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
    if (dom.apiStatus) dom.apiStatus.textContent = t("uiPrototype");
  }, 2200);
}

function drawPreview() {
  const canvas = document.querySelector("[data-device-canvas]");
  const revision = currentRevision();
  if (!canvas || !revision) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(260, rect.width || 280);
  const height = Math.max(150, rect.height || 180);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
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
  const frameWidth = Math.min(width * 0.68, width - 48);
  const frameHeight = frameWidth * 0.58;
  const x = (width - frameWidth) / 2;
  const y = height * 0.18;
  const gradient = ctx.createLinearGradient(x, y, x + frameWidth, y + frameHeight);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
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
  ctx.fillStyle = "rgba(31,33,29,.18)";
  roundedRect(ctx, width * 0.28, height * 0.8, width * 0.44, 14, 7);
  ctx.fill();
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

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeSidebar = button.dataset.view;
    setNotice(button.textContent.trim());
    render();
  });
});

document.querySelector(".thread-list")?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-history]");
  if (!item) return;
  setNotice(item.querySelector("strong")?.textContent || t("navHistory"));
});

dom.workspaceView.addEventListener("click", (event) => {
  const step = event.target.closest("[data-step]");
  if (step) {
    setNotice(step.querySelector("strong")?.textContent || "");
  }
});

dom.inspectorContent.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-inspector-toggle]");
  if (toggle) {
    const key = toggle.dataset.inspectorToggle;
    if (state.collapsedSections.has(key)) state.collapsedSections.delete(key);
    else state.collapsedSections.add(key);
    render();
    return;
  }
  const field = event.target.closest("[data-contact-field]");
  if (field) {
    field.addEventListener("input", () => {
      state.contactInfo[field.dataset.contactField] = field.value;
    }, { once: true });
  }
});

dom.inspectorContent.addEventListener("input", (event) => {
  const field = event.target.closest("[data-contact-field]");
  if (!field) return;
  state.contactInfo[field.dataset.contactField] = field.value;
});

dom.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = dom.ideaInput.value.trim();
  if (!message) return;
  dom.ideaInput.value = "";
  await sendTurn(message);
});

dom.copySpec.addEventListener("click", () => {
  const revision = currentRevision();
  setNotice(revision ? `${t("previewSnapshot")}: ${revision.revisionId}` : t("noPlan"));
});

dom.submitReview.addEventListener("click", submitForReview);
document.addEventListener("click", (event) => {
  if (event.target.closest("#submitReview")) submitForReview();
});
window.yWorkbenchSubmitForReview = submitForReview;
dom.openThreadMenu.addEventListener("click", () => openFloating("thread"));
dom.openSettings.addEventListener("click", () => openFloating("settings"));
dom.openAttach.addEventListener("click", () => openFloating("attach"));
dom.openScope.addEventListener("click", () => openFloating("scope"));
dom.openBom.addEventListener("click", () => openFloating("bom"));
dom.openGuardrails.addEventListener("click", () => openFloating("guardrails"));
dom.openDfm.addEventListener("click", () => openFloating("dfm"));

dom.languageSelect.addEventListener("change", async () => {
  state.lang = dom.languageSelect.value === "en" ? "en" : "zh";
  try {
    window.localStorage.setItem("yWorkbenchLanguage", state.lang);
  } catch {}
  render();
});

dom.floatingLayer.addEventListener("click", (event) => {
  if (event.target === dom.floatingLayer || event.target.closest(".close-floating")) {
    closeFloating();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action) {
    setNotice(`${t("actionNotice")}${action.textContent.trim()}`);
    closeFloating();
  }
});

document.querySelectorAll("[data-settings-tab]").forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsTab));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFloating();
});

window.addEventListener("resize", drawPreview);

bootstrap();
