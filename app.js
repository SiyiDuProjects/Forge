const scenarioBase = {
  walnut: {
    finish: "walnut",
    screenSize: 3.5,
    dfmLevel: 1,
    status: "ready",
    quote: { bom: 124, build: 88, dfm: 44, range: "$256-$317" }
  },
  motion: {
    finish: "sage",
    screenSize: 5,
    dfmLevel: 3,
    status: "warning",
    quote: { bom: 160, build: 110, dfm: 96, range: "$366-$454" }
  },
  booth: {
    finish: "graphite",
    screenSize: 7,
    dfmLevel: 1,
    status: "quote",
    quote: { bom: 190, build: 132, dfm: 44, range: "$366-$454" }
  }
};

const scenarioCopy = {
  walnut: {
    zh: {
      title: "核桃木桌面屏",
      short: "通过，生产检查 L1",
      badge: "就绪",
      request:
        "我想要一台小型桌面屏，可以显示家庭照片、天气、明天日程和 GitHub 构建状态。外观像复古核桃木相框，USB-C 供电，夜间自动变暗。",
      device: "桌面屏",
      screen: "3.5 英寸",
      finishLabel: "核桃木",
      power: "USB-C 桌面供电",
      agent:
        "这是一个清晰的 v1 原型方案：固定桌面屏、库存主控、USB-C 供电、环境光调暗，不引入需要认证的复杂模块。",
      included: ["Y-Core Lite 主控", "3.5 英寸 TFT 屏", "USB-C 供电", "核桃木外壳", "环境光板"],
      deferred: ["摄像头模块", "电池包"],
      bom: [
        ["Y-Core Lite 主控", "主控", "$42", "selected"],
        ["3.5 英寸 TFT 屏", "显示", "$28", "selected"],
        ["USB-C 桌面供电", "供电", "$12", "selected"],
        ["核桃木桌面外壳", "外壳", "$34", "selected"],
        ["环境光板", "传感器", "$8", "selected"],
        ["摄像头模块", "视觉", "$36", "deferred"],
        ["电池包", "电源", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "仅 USB-C", "桌面供电让 v1 避开电池认证。"],
        ["pass", "无摄像头", "MVP 避开隐私和摄像头开孔评审。"],
        ["pass", "无运动结构", "固定相框只需要基础外壳确认。"]
      ],
      firmware: {
        rules: ["早晨：天气和通勤", "下午：照片轮播", "晚上：明日日程"],
        modes: ["照片", "天气", "日程", "构建状态"],
        constraints: ["离线缓存", "夜间调暗", "仅 USB-C"]
      },
      packet: ["蓝图预览", "零件清单（BOM）", "风险限制报告", "报价区间", "设备行为规则（固件）"],
      assumption: "使用库存 3.5 英寸屏和核桃木外壳；除外壳适配外不做额外 CAD。"
    },
    en: {
      title: "Walnut desk display",
      short: "Pass, check L1 (DFM)",
      badge: "ready",
      request:
        "I want a small desktop screen that shows family photos, weather, tomorrow's calendar, and GitHub build status. Make it look like a retro walnut frame, USB-C powered, and dim at night.",
      device: "Desktop display",
      screen: "3.5 in",
      finishLabel: "walnut",
      power: "USB-C bench power",
      agent:
        "This is a clean v1 bench build: fixed desk display, stocked controller, USB-C power, ambient dimming, and no certification-heavy modules.",
      included: ["Y-Core Lite", "3.5 in TFT", "USB-C power", "Walnut shell", "Ambient light board"],
      deferred: ["Camera module", "Battery pack"],
      bom: [
        ["Y-Core Lite", "core", "$42", "selected"],
        ["3.5 in TFT", "display", "$28", "selected"],
        ["USB-C bench power", "power", "$12", "selected"],
        ["Walnut desktop shell", "enclosure", "$34", "selected"],
        ["Ambient light board", "sensor", "$8", "selected"],
        ["Camera module", "vision", "$36", "deferred"],
        ["Battery pack", "power", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "USB-C only", "Bench power keeps the v1 away from battery certification."],
        ["pass", "No camera", "The MVP avoids privacy and camera enclosure review."],
        ["pass", "No motion", "Fixed frame needs only a simple enclosure check."]
      ],
      firmware: {
        rules: ["Morning: weather + commute", "Afternoon: photo reel", "Evening: tomorrow calendar"],
        modes: ["Photo", "Weather", "Calendar", "Build status"],
        constraints: ["offline-safe cache", "night dimming", "USB-C only"]
      },
      packet: ["Blueprint preview", "Parts list (BOM)", "Risk limit report", "Quote band", "Device behavior rules"],
      assumption: "Stocked 3.5 in display and walnut shell; no custom CAD beyond enclosure fit."
    }
  },
  motion: {
    zh: {
      title: "运动陪伴屏",
      short: "舵机警告",
      badge: "L3",
      request:
        "做一个友好的桌面陪伴屏，有简单表情、天气、短提示音扬声器、两个按钮，还有一个小舵机可以让屏幕轻微转动。",
      device: "陪伴屏",
      screen: "5 英寸",
      finishLabel: "鼠尾草绿",
      power: "USB-C 桌面供电",
      agent:
        "陪伴屏概念可以作为界面原型推进，但舵机会把生产可行性检查提升到 DFM L3（机械级）。需要限制速度、封闭运动结构，并加入机械止挡。",
      included: ["Y-Core Lite 主控", "5 英寸 TFT 屏", "扬声器舱", "舵机支架", "鼠尾草绿外壳"],
      deferred: ["摄像头模块", "电池包"],
      bom: [
        ["Y-Core Lite 主控", "主控", "$42", "selected"],
        ["5 英寸 TFT 屏", "显示", "$48", "selected"],
        ["微型扬声器舱", "音频", "$16", "selected"],
        ["微型舵机支架", "运动", "$18", "warning"],
        ["鼠尾草绿桌面外壳", "外壳", "$36", "selected"],
        ["摄像头模块", "视觉", "$36", "deferred"],
        ["电池包", "电源", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "仅 USB-C", "这个 MVP 不进入电池路径。"],
        ["warn", "舵机运动", "运动结构需要生产可行性（DFM）L3 间隙确认和物理止挡限制。"],
        ["pass", "无摄像头", "隐私评审保持在范围外。"]
      ],
      firmware: {
        rules: ["待机：友好表情", "提醒：提示音和脸部动画", "运动：最大 12 度扫动"],
        modes: ["表情", "天气", "提醒", "睡眠"],
        constraints: ["舵机速度上限", "机械止挡", "仅 USB-C"]
      },
      packet: ["运动范围警告", "零件清单（BOM）", "舵机生产检查说明（DFM）", "报价区间", "设备行为规则（固件）"],
      assumption: "舵机只允许作为低速、受限行程的可见台架原型。"
    },
    en: {
      title: "Motion companion",
      short: "Servo warning",
      badge: "L3",
      request:
        "Build a friendly desktop companion screen with simple expressions, weather, a speaker for short alerts, two buttons, and a tiny servo that turns the display slightly.",
      device: "Companion display",
      screen: "5 in",
      finishLabel: "sage",
      power: "USB-C bench power",
      agent:
        "The companion concept is viable as a UI prototype, but the servo raises the manufacturing check to DFM L3 (mechanical). Keep motion slow, enclosed, and mechanically limited.",
      included: ["Y-Core Lite", "5 in TFT", "Speaker pod", "Servo mount", "Sage shell"],
      deferred: ["Camera module", "Battery pack"],
      bom: [
        ["Y-Core Lite", "core", "$42", "selected"],
        ["5 in TFT", "display", "$48", "selected"],
        ["Micro speaker pod", "audio", "$16", "selected"],
        ["Micro servo mount", "motion", "$18", "warning"],
        ["Sage desktop shell", "enclosure", "$36", "selected"],
        ["Camera module", "vision", "$36", "deferred"],
        ["Battery pack", "power", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "USB-C only", "No battery path in this MVP."],
        ["warn", "Servo motion", "Motion needs manufacturing check (DFM) L3 clearance and physical stop limits."],
        ["pass", "No camera", "Privacy review stays out of scope."]
      ],
      firmware: {
        rules: ["Idle: friendly expression", "Alert: speaker chirp + face animation", "Motion: 12 degree sweep max"],
        modes: ["Expression", "Weather", "Alert", "Sleep"],
        constraints: ["servo speed cap", "mechanical stop", "USB-C only"]
      },
      packet: ["Motion scope warning", "Parts list (BOM)", "Servo manufacturing note (DFM)", "Quote band", "Device behavior rules"],
      assumption: "Servo is allowed only as a visible bench prototype with low-speed constrained travel."
    }
  },
  booth: {
    zh: {
      title: "展台计数屏",
      short: "手动报价",
      badge: "报价",
      request:
        "我需要一个会议展台用的 founder prototype：桌面屏显示 API 指标、倒计时、自定义品牌视觉，并且可以从网页更新展示文案。",
      device: "展台屏",
      screen: "7 英寸",
      finishLabel: "石墨黑",
      power: "USB-C 桌面供电",
      agent:
        "展台屏是报价优先的原型。硬件部分直接，但自定义品牌件和网页更新文案需要保留为手动报价假设。",
      included: ["Y-Core Lite 主控", "7 英寸 TFT 屏", "石墨黑外壳", "USB-C 供电", "品牌铭牌"],
      deferred: ["摄像头模块", "电池包"],
      bom: [
        ["Y-Core Lite 主控", "主控", "$42", "selected"],
        ["7 英寸 TFT 屏", "显示", "$72", "selected"],
        ["石墨黑桌面外壳", "外壳", "$38", "selected"],
        ["品牌铭牌", "定制", "$26", "warning"],
        ["USB-C 桌面供电", "供电", "$12", "selected"],
        ["摄像头模块", "视觉", "$36", "deferred"],
        ["电池包", "电源", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "仅 USB-C", "展台桌面供电避开电池认证。"],
        ["warn", "自定义品牌", "铭牌和配色需要人工确认报价。"],
        ["pass", "无摄像头", "这个原型不采集访客影像。"]
      ],
      firmware: {
        rules: ["展示 API 指标卡片", "展台时段显示倒计时", "网页文案槽更新消息横幅"],
        modes: ["指标", "倒计时", "品牌消息", "待机"],
        constraints: ["手动文案更新", "仅 USB-C", "不采集访客"]
      },
      packet: ["报价假设", "零件清单（BOM）", "品牌说明", "报价区间", "设备行为规则（固件）"],
      assumption: "手动报价包含品牌铭牌、文案槽和展台专用视觉打磨。"
    },
    en: {
      title: "Booth counter unit",
      short: "Manual quote",
      badge: "quote",
      request:
        "I need a founder prototype for a conference booth: a desk display that shows API metrics, a countdown, custom branding, and a way to update messages from the web.",
      device: "Counter display",
      screen: "7 in",
      finishLabel: "graphite",
      power: "USB-C bench power",
      agent:
        "The booth unit is a quote-focused prototype. Hardware is straightforward, but custom branding and web-updated copy should remain a manual quote assumption.",
      included: ["Y-Core Lite", "7 in TFT", "Graphite shell", "USB-C power", "Brand plate"],
      deferred: ["Camera module", "Battery pack"],
      bom: [
        ["Y-Core Lite", "core", "$42", "selected"],
        ["7 in TFT", "display", "$72", "selected"],
        ["Graphite desktop shell", "enclosure", "$38", "selected"],
        ["Brand plate", "custom", "$26", "warning"],
        ["USB-C bench power", "power", "$12", "selected"],
        ["Camera module", "vision", "$36", "deferred"],
        ["Battery pack", "power", "$44", "deferred"]
      ],
      guardrails: [
        ["pass", "USB-C only", "Booth counter power avoids battery certification."],
        ["warn", "Custom branding", "Brand plate and color matching require manual quote confirmation."],
        ["pass", "No camera", "No visitor capture in this prototype."]
      ],
      firmware: {
        rules: ["Show API metric tiles", "Countdown panel during booth hours", "Web copy slot updates message banner"],
        modes: ["Metrics", "Countdown", "Brand message", "Idle"],
        constraints: ["manual copy update", "USB-C only", "no visitor capture"]
      },
      packet: ["Quote assumption", "Parts list (BOM)", "Branding note", "Quote band", "Device behavior rules"],
      assumption: "Manual quote includes branding plate, copy slot, and booth-specific visual polish."
    }
  }
};

const blockedCopy = {
  zh: {
    title: "摄像头和电池阻塞测试",
    included: ["Y-Core Lite 主控", "5 英寸 TFT 屏", "USB-C 供电"],
    deferred: ["摄像头模块", "电池包"],
    guardrails: [
      ["block", "摄像头模块", "需要隐私、图像处理和外壳开孔评审后才能进入范围。"],
      ["block", "电池包", "需要电芯选择、充电方案、运输和安全认证后才能进入范围。"],
      ["pass", "桌面供电回退", "范围编辑建议：v1 使用 USB-C 桌面供电，并移除摄像头。"]
    ],
    quote: { bom: 132, build: 88, dfm: 0, range: "阻塞" }
  },
  en: {
    title: "Camera/battery blocked test",
    included: ["Y-Core Lite", "5 in TFT", "USB-C power"],
    deferred: ["Camera module", "Battery pack"],
    guardrails: [
      ["block", "Camera module", "Deferred until privacy, image handling, and enclosure review exist."],
      ["block", "Battery pack", "Deferred until cell selection, charging, shipping, and safety certification exist."],
      ["pass", "Bench power fallback", "Scope edit: use USB-C bench power and no camera for v1."]
    ],
    quote: { bom: 132, build: 88, dfm: 0, range: "blocked" }
  }
};

const copy = {
  zh: {
    appTitle: "Y 工作台",
    sidebarAria: "Y 工作台导航",
    navAria: "工作台视图",
    navBuild: "开始做原型",
    navParts: "零件清单（BOM）",
    navDfm: "生产可行性（DFM）",
    navFirmware: "设备行为规则（固件）",
    projectLabel: "工作台",
    currentWorkbenchAria: "当前工作台",
    projectName: "Y 实验室",
    scenariosAria: "原型场景",
    settingsButton: "工作台设置",
    uiPrototype: "界面原型",
    threadMenuAria: "原型菜单",
    topbarDefaultStatus: "完整界面流程",
    previewPacket: "预览原型方案包",
    queueDfmMock: "加入可行性检查",
    holdL3: "暂缓 L3 检查",
    conversationAria: "工作台内容",
    composerAria: "模拟原型输入框",
    composerDefault: "模拟流程：需求、范围、零件清单（BOM）、风险限制、报价、设备行为、生产可行性（DFM）",
    addInputAria: "添加原型输入",
    scope: "范围",
    partsChip: "零件",
    riskChip: "风险",
    dfmChip: "可行性",
    guardrails: "风险限制",
    runChainAria: "运行模拟原型链路",
    inspectorAria: "原型输出检查器",
    settingsTitle: "工作台设置",
    closeSettingsAria: "关闭工作台设置",
    settingsNavAria: "设置分区",
    studio: "工作室",
    parts: "零件",
    dfm: "生产检查",
    firmware: "设备行为",
    language: "语言",
    langZh: "简体中文",
    langEn: "English",
    languageSelectAria: "界面语言",
    levelL1: "生产检查 L1",
    levelL3: "生产检查 L3",
    dfmCost: "生产检查",
    threadRename: "重命名原型",
    threadDuplicate: "复制场景",
    threadExport: "导出原型方案预览",
    threadArchive: "归档草稿",
    attachSketch: "产品草图",
    attachReference: "参考产品",
    attachConstraints: "约束说明",
    attachBehavior: "设备行为",
    scopeAria: "MVP 范围",
    bomAria: "零件清单（BOM）",
    dfmAria: "生产可行性等级（DFM）",
    viewBuild: "Y 工作台",
    statusParts: "已选、库存、延期",
    statusDfm: "就绪、阻塞、已入队",
    statusFirmware: "规则预览",
    statusWarning: "舵机警告",
    statusQuote: "手动报价",
    statusReady: "生产检查就绪",
    manualQuote: "手动报价",
    composerParts: (scenario) => `零件清单（BOM）：${scenario.included.length} 个已选，${scenario.deferred.length} 个延期`,
    composerDfm: (count) => `生产可行性（DFM）：${count} 个模拟方案包，覆盖就绪、阻塞和已入队`,
    composerFirmware: (scenario) => `设备行为规则（固件）：${scenario.firmware.rules.length} 条模拟规则，带 v1 约束`,
    composerBuild: (scenario) => `模拟流程：${scenario.title} 从需求进入范围、零件清单（BOM）、风险限制、报价、设备行为和生产可行性（DFM）`,
    benchAgent: "原型助手",
    scopeNote: "范围建议：舵机只作为界面原型状态展示，接受生产可行性（DFM）L3 机械确认后才能进入队列。",
    quoteNote: "报价假设：",
    buildFlowAria: "模拟原型流程",
    benchRun: "原型运行",
    flowChain: "需求 -> 范围 -> 零件清单（BOM） -> 风险限制 -> 报价 -> 设备行为 -> 生产可行性（DFM）",
    parseTitle: "解析需求",
    parseDetail: "提取产品类型、屏幕尺寸、外壳材质、请求行为和 v1 排除项。",
    scopeTitle: "原型范围",
    includedCount: (scenario) => `${scenario.included.length} 项包含，${scenario.deferred.length} 项延期`,
    scopeDetail: (scenario) => `本期包含：${scenario.included.join("，")}。v1 延期：${scenario.deferred.join("，")}。`,
    bomTitle: "匹配零件清单（BOM）",
    bomSummary: (count) => `${count} 个已选零件`,
    bomDetail: "优先使用库存台架模块；被阻塞的模块保留为可见的 v1 延期项。",
    runGuardrails: "运行风险限制",
    guardrailWarningSummary: "舵机警告",
    guardrailPassSummary: "摄像头和电池不进入 v1",
    quoteTitle: "估算报价",
    quoteDetail: (scenario) => `零件清单（BOM） $${scenario.quote.bom}，组装 $${scenario.quote.build}，生产检查 $${scenario.quote.dfm}。${scenario.assumption}`,
    packetTitle: "起草生产检查包",
    packetWarningSummary: "暂缓到生产检查 L3",
    packetReadySummary: "可以加入队列",
    packetDetail: (scenario) => `方案包包含：${scenario.packet.join("，")}。`,
    done: "完成",
    pass: "通过",
    warn: "警告",
    manual: "手动",
    hold: "暂缓",
    queue: "入队",
    selected: "已选",
    stocked: "库存",
    deferred: "延期",
    needsConfirm: "需确认",
    partsShelf: "零件清单（BOM）",
    dfmQueue: "生产可行性（DFM）",
    mockPacketBoard: "模拟方案包看板",
    ready: "就绪",
    blocked: "阻塞",
    queued: "已入队",
    firmwareRules: "设备行为规则（固件）",
    rules: "规则",
    modes: "显示模式",
    constraints: "约束",
    inspectorScope: "范围",
    inspectorQuote: "报价",
    inspectorPacket: "生产检查包（DFM）",
    device: "设备",
    display: "屏幕",
    finish: "外观",
    power: "供电",
    includedHeading: "本期包含",
    deferredHeading: "v1 延期",
    build: "组装",
    band: "区间",
    mockRulePreview: "模拟规则预览",
    packetHeld: "暂缓到生产检查 L3",
    packetManualQuote: "带手动报价入队",
    packetReady: "可以加入队列",
    canvasAria: "打样设备预览",
    reasoning: "推理说明：",
    selectedParts: "已选零件",
    deferredParts: "延期零件",
    dfmLevels: "生产可行性等级（DFM）",
    dfmL0Label: "L0 范围草案",
    dfmL1Label: "L1 基础生产检查",
    dfmL3Label: "L3 机械生产检查",
    dfmL0: "仅范围草案，不生成可排队方案包。",
    dfmL1: "检查模块适配、外壳和报价区间。",
    dfmL3: "检查运动结构、机械间隙和安全限制。",
    dfmBlocked: "摄像头和电池保持在 v1 范围外。",
    noticeRerun: "已重新运行模拟链路",
    noticePreview: "已打开原型方案预览（模拟）",
    noticeHeld: "已暂缓到生产检查 L3",
    noticeQueued: "已加入模拟队列",
    noticeAction: "已选择：",
    settingsRows: [
      ["仅原型模式", "所有按钮只打开模拟视图，不调用真实制造服务。"],
      ["紧凑输出", "线程和右侧检查器保持适合反复审阅的密度。"],
      ["显示延期零件", "始终把摄像头和电池显示为 v1 被阻止模块。"],
      ["库存状态标签", "显示库存、已选、警告和延期状态。"],
      ["必须经过生产可行性检查", "只有风险限制通过的模拟方案包才能进入队列。"],
      ["显示阻塞队列", "在生产可行性队列里保留范围修正建议。"],
      ["仅预览规则", "设备行为面板只展示计划行为，不生成可部署代码。"],
      ["约束标签", "始终显示 USB-C 供电、无摄像头、无电池的 v1 约束。"],
      ["界面语言", "保留中文和 English 两套文案；新增功能必须同步维护。"],
      ["文案维护规则", "按钮、状态、弹窗、文档和后续功能说明都要同步更新中英文。"]
    ]
  },
  en: {
    appTitle: "Y Workbench",
    sidebarAria: "Y Workbench navigation",
    navAria: "Workbench views",
    navBuild: "Start prototype",
    navParts: "Parts list (BOM)",
    navDfm: "Manufacturing check (DFM)",
    navFirmware: "Device behavior rules",
    projectLabel: "Workbench",
    currentWorkbenchAria: "Current workbench",
    projectName: "Y Lab",
    scenariosAria: "Prototype scenarios",
    settingsButton: "Bench settings",
    uiPrototype: "UI prototype",
    threadMenuAria: "Prototype menu",
    topbarDefaultStatus: "Complete UI flow",
    previewPacket: "Preview packet",
    queueDfmMock: "Queue DFM check",
    holdL3: "Hold L3 check",
    conversationAria: "Workbench content",
    composerAria: "Mock prototype input",
    composerDefault: "Mock flow: request, scope, parts list (BOM), risk limits, quote, behavior rules, manufacturing check (DFM)",
    addInputAria: "Add build input",
    scope: "Scope",
    partsChip: "Parts",
    riskChip: "Risk",
    dfmChip: "DFM check",
    guardrails: "Risk limits",
    runChainAria: "Run mock prototype chain",
    inspectorAria: "Prototype output inspector",
    settingsTitle: "Bench settings",
    closeSettingsAria: "Close bench settings",
    settingsNavAria: "Settings sections",
    studio: "Studio",
    parts: "Parts",
    dfm: "DFM check",
    firmware: "Behavior",
    language: "Language",
    langZh: "Simplified Chinese",
    langEn: "English",
    languageSelectAria: "Interface language",
    levelL1: "DFM check L1",
    levelL3: "DFM check L3",
    dfmCost: "DFM check",
    threadRename: "Rename prototype",
    threadDuplicate: "Duplicate scenario",
    threadExport: "Export packet preview",
    threadArchive: "Archive draft",
    attachSketch: "Product sketch",
    attachReference: "Reference product",
    attachConstraints: "Constraints note",
    attachBehavior: "Device behavior",
    scopeAria: "MVP scope",
    bomAria: "Parts list (BOM)",
    dfmAria: "Manufacturing check level (DFM)",
    viewBuild: "Y Workbench",
    statusParts: "Selected, stocked, deferred",
    statusDfm: "Ready, blocked, queued",
    statusFirmware: "Rules preview",
    statusWarning: "Servo warning",
    statusQuote: "Manual quote",
    statusReady: "Manufacturing check ready",
    manualQuote: "Manual quote",
    composerParts: (scenario) => `Parts list (BOM): ${scenario.included.length} selected, ${scenario.deferred.length} deferred`,
    composerDfm: (count) => `Manufacturing check (DFM): ${count} mock plan packets across ready, blocked, and queued`,
    composerFirmware: (scenario) => `Device behavior rules: ${scenario.firmware.rules.length} mock rules with v1 constraints`,
    composerBuild: (scenario) => `Mock flow: ${scenario.title} from request to scope, parts list (BOM), risk limits, quote, behavior rules, and manufacturing check (DFM)`,
    benchAgent: "Prototype assistant",
    scopeNote: "Scope note: Servo stays in UI prototype state until manufacturing check (DFM) L3 mechanical clearance is accepted.",
    quoteNote: "Quote note: ",
    buildFlowAria: "Mock prototype flow",
    benchRun: "Prototype run",
    flowChain: "request -> scope -> parts list (BOM) -> risk limits -> quote -> behavior rules -> manufacturing check (DFM)",
    parseTitle: "Parse request",
    parseDetail: "Extract product type, display size, enclosure finish, requested behaviors, and v1 exclusions.",
    scopeTitle: "Build scope",
    includedCount: (scenario) => `${scenario.included.length} included, ${scenario.deferred.length} deferred`,
    scopeDetail: (scenario) => `Included: ${scenario.included.join(", ")}. Deferred: ${scenario.deferred.join(", ")}.`,
    bomTitle: "Match parts list (BOM)",
    bomSummary: (count) => `${count} selected parts`,
    bomDetail: "Use stocked bench modules first; keep blocked modules visible as deferred v1 items.",
    runGuardrails: "Run risk limits",
    guardrailWarningSummary: "Servo warning",
    guardrailPassSummary: "Camera/battery out of v1",
    quoteTitle: "Estimate quote",
    quoteDetail: (scenario) => `Parts list (BOM) $${scenario.quote.bom}, build $${scenario.quote.build}, manufacturing check $${scenario.quote.dfm}. ${scenario.assumption}`,
    packetTitle: "Draft manufacturing check packet",
    packetWarningSummary: "Held for manufacturing check L3",
    packetReadySummary: "Ready to queue",
    packetDetail: (scenario) => `Packet contains ${scenario.packet.join(", ")}.`,
    done: "done",
    pass: "pass",
    warn: "warn",
    manual: "manual",
    hold: "hold",
    queue: "queue",
    selected: "selected",
    stocked: "stocked",
    deferred: "deferred",
    needsConfirm: "needs review",
    partsShelf: "Parts list (BOM)",
    dfmQueue: "Manufacturing check (DFM)",
    mockPacketBoard: "Mock packet board",
    ready: "ready",
    blocked: "blocked",
    queued: "queued",
    firmwareRules: "Device behavior rules",
    rules: "rules",
    modes: "modes",
    constraints: "constraints",
    inspectorScope: "Scope",
    inspectorQuote: "Quote",
    inspectorPacket: "Manufacturing check packet",
    device: "Device",
    display: "Display",
    finish: "Finish",
    power: "Power",
    includedHeading: "Included",
    deferredHeading: "Deferred for v1",
    build: "Build",
    band: "Band",
    mockRulePreview: "mock rule preview",
    packetHeld: "held for manufacturing check L3",
    packetManualQuote: "queued with manual quote",
    packetReady: "ready to queue",
    canvasAria: "Generated hardware preview",
    reasoning: "Reasoning: ",
    selectedParts: "Selected parts",
    deferredParts: "Deferred parts",
    dfmLevels: "Manufacturing readiness levels (DFM)",
    dfmL0Label: "L0 scope draft",
    dfmL1Label: "L1 basic check",
    dfmL3Label: "L3 mechanical check",
    dfmL0: "Scope draft only; no queueable packet.",
    dfmL1: "Module fit, shell, quote band.",
    dfmL3: "Motion, mechanical clearance, safety limits.",
    dfmBlocked: "Camera and battery stay out of v1.",
    noticeRerun: "Mock chain rerun",
    noticePreview: "Packet preview opened (mock)",
    noticeHeld: "Held for manufacturing check L3",
    noticeQueued: "Queued mock packet",
    noticeAction: "Selected: ",
    settingsRows: [
      ["Prototype mode only", "Every button opens a mock view, not a real manufacturing service."],
      ["Dense output", "Keep the thread and inspector dense enough for repeated review."],
      ["Show deferred parts", "Always show camera and battery as blocked v1 modules."],
      ["Stock labels", "Show stocked, selected, warning, and deferred states."],
      ["Require manufacturing check", "Only risk-limit-passing mock packets can enter the queue."],
      ["Show blocked queue", "Keep scope-edit suggestions visible in the manufacturing check queue."],
      ["Preview rules only", "The behavior panel shows planned device behavior, not deployable code."],
      ["Constraint labels", "Always show USB-C power, no camera, and no battery v1 constraints."],
      ["Interface language", "Keep both Chinese and English copy; new features must update both."],
      ["Copy maintenance", "Buttons, statuses, popovers, docs, and future feature text must stay bilingual."]
    ]
  }
};

const state = {
  lang: initialLanguage(),
  view: "build",
  scenario: "walnut",
  expandedStep: "scope",
  partsFilter: "selected",
  queueFilter: "ready",
  firmwareMode: "rules",
  collapsedSections: new Set(),
  notice: ""
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
  const value = copy[state.lang][key] ?? copy.zh[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function activeScenario(id = state.scenario) {
  return { ...scenarioBase[id], ...scenarioCopy[id][state.lang] };
}

function activeBlockedCase() {
  return { dfmLevel: 4, status: "blocked", ...blockedCopy[state.lang] };
}

function partStatusLabel(status) {
  return {
    selected: t("selected"),
    stocked: t("stocked"),
    deferred: t("deferred"),
    warning: t("needsConfirm")
  }[status] || status;
}

function queueStatusLabel(status) {
  return {
    ready: t("ready"),
    blocked: t("blocked"),
    queued: t("queued")
  }[status] || status;
}

function render() {
  const scenario = activeScenario();
  renderStaticText();
  dom.ideaInput.value = scenario.request;
  dom.topbarTitle.textContent = viewTitle();
  dom.draftStatus.textContent = statusText(scenario);
  dom.apiStatus.textContent = state.notice || t("uiPrototype");
  dom.composerSummary.textContent = composerText(scenario);
  dom.scopeLevel.textContent = scenario.status === "warning" ? t("levelL3") : scenario.status === "quote" ? t("manualQuote") : t("levelL1");
  dom.submitReview.textContent = scenario.status === "warning" ? t("holdL3") : t("queueDfmMock");

  renderActiveStates();
  renderWorkspace(scenario);
  renderInspector(scenario);
  renderPopovers(scenario);
  window.requestAnimationFrame(() => drawPreview(scenario));
}

function renderStaticText() {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");

  setText('[data-view="build"] span:last-child', t("navBuild"));
  setText('[data-view="parts"] span:last-child', t("navParts"));
  setText('[data-view="dfm"] span:last-child', t("navDfm"));
  setText('[data-view="firmware"] span:last-child', t("navFirmware"));
  setText(".sidebar-label", t("projectLabel"));
  setText(".project-row span:last-child", t("projectName"));
  setText("#openSettings span:last-child", t("settingsButton"));
  setText("#copySpec", t("previewPacket"));
  setText("#openScope", t("scope"));
  setText("#openBom", t("partsChip"));
  setText("#openGuardrails", t("riskChip"));
  setText("#openDfm", t("dfmChip"));

  setAttr(".project-sidebar", "aria-label", t("sidebarAria"));
  setAttr(".primary-nav", "aria-label", t("navAria"));
  setAttr(".project-row", "aria-label", t("currentWorkbenchAria"));
  setAttr(".thread-list", "aria-label", t("scenariosAria"));
  setAttr("#openThreadMenu", "aria-label", t("threadMenuAria"));
  setAttr(".conversation", "aria-label", t("conversationAria"));
  setAttr("#promptForm", "aria-label", t("composerAria"));
  setAttr("#openAttach", "aria-label", t("addInputAria"));
  setAttr("#runChain", "aria-label", t("runChainAria"));
  setAttr(".inspector", "aria-label", t("inspectorAria"));
  setAttr('[data-dialog="settings"]', "aria-label", t("settingsTitle"));
  setAttr(".close-floating", "aria-label", t("closeSettingsAria"));
  setAttr(".settings-nav", "aria-label", t("settingsNavAria"));
  setAttr('[data-dialog="thread"]', "aria-label", t("threadMenuAria"));
  setAttr('[data-dialog="attach"]', "aria-label", t("addInputAria"));
  setAttr('[data-dialog="scope"]', "aria-label", t("scopeAria"));
  setAttr('[data-dialog="bom"]', "aria-label", t("bomAria"));
  setAttr('[data-dialog="guardrails"]', "aria-label", t("guardrails"));
  setAttr('[data-dialog="dfm"]', "aria-label", t("dfmAria"));
  setAttr("#languageSelect", "aria-label", t("languageSelectAria"));

  setText(".settings-dialog .floating-head strong", t("settingsTitle"));
  setText('[data-settings-tab="studio"]', t("studio"));
  setText('[data-settings-tab="parts"]', t("parts"));
  setText('[data-settings-tab="dfm"]', t("dfm"));
  setText('[data-settings-tab="firmware"]', t("firmware"));
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

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    const scenario = activeScenario(button.dataset.scenario);
    button.querySelector("strong").textContent = scenario.title;
    button.querySelector("small").textContent = scenario.short;
    button.querySelector("em").textContent = scenario.badge;
  });
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setAttr(selector, attr, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attr, value);
}

function viewTitle() {
  return {
    build: t("viewBuild"),
    parts: t("partsShelf"),
    dfm: t("dfmQueue"),
    firmware: t("firmwareRules")
  }[state.view];
}

function statusText(scenario) {
  if (state.view === "parts") return t("statusParts");
  if (state.view === "dfm") return t("statusDfm");
  if (state.view === "firmware") return t("statusFirmware");
  if (scenario.status === "warning") return t("statusWarning");
  if (scenario.status === "quote") return t("statusQuote");
  return t("statusReady");
}

function composerText(scenario) {
  if (state.view === "parts") return t("composerParts", scenario);
  if (state.view === "dfm") return t("composerDfm", queueItems().length);
  if (state.view === "firmware") return t("composerFirmware", scenario);
  return t("composerBuild", scenario);
}

function renderActiveStates() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.classList.toggle("active", button.dataset.scenario === state.scenario);
  });
}

function renderWorkspace(scenario) {
  if (state.view === "parts") {
    renderPartsView(scenario);
    return;
  }
  if (state.view === "dfm") {
    renderDfmView();
    return;
  }
  if (state.view === "firmware") {
    renderFirmwareView(scenario);
    return;
  }
  renderBuildView(scenario);
}

function renderBuildView(scenario) {
  dom.workspaceView.innerHTML = `
    <div class="message-stack">
      <article class="message user">
        <div class="bubble"><p>${escapeHtml(scenario.request)}</p></div>
      </article>
      <article class="message ai">
        <div class="bubble">
          <strong>${escapeHtml(t("benchAgent"))}</strong>
          <p>${escapeHtml(scenario.agent)}</p>
          ${scenario.status === "warning" ? `<p class="inline-note warn">${escapeHtml(t("scopeNote"))}</p>` : ""}
          ${scenario.status === "quote" ? `<p class="inline-note warn">${escapeHtml(t("quoteNote"))}${escapeHtml(scenario.assumption)}</p>` : ""}
        </div>
      </article>
    </div>

    <section class="inline-panel flow-panel" aria-label="${escapeHtml(t("buildFlowAria"))}">
      <div class="inline-panel-head">
        <span class="inline-label">${escapeHtml(t("benchRun"))}</span>
        <strong>${escapeHtml(t("flowChain"))}</strong>
      </div>
      <div class="flow-list">
        ${flowSteps(scenario)
          .map(
            (step, index) => `
              <button class="flow-step ${step.state} ${state.expandedStep === step.key ? "open" : ""}" type="button" data-step="${step.key}">
                <span class="step-index">${index + 1}</span>
                <span>
                  <strong>${escapeHtml(step.title)}</strong>
                  <small>${escapeHtml(step.summary)}</small>
                  ${state.expandedStep === step.key ? `<em>${escapeHtml(step.detail)}</em>` : ""}
                </span>
                <b>${escapeHtml(step.label)}</b>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function flowSteps(scenario) {
  const selectedCount = scenario.bom.filter((item) => item[3] === "selected").length;
  return [
    {
      key: "parse",
      title: t("parseTitle"),
      summary: `${scenario.device}, ${scenario.screen}, ${scenario.finishLabel}`,
      detail: t("parseDetail"),
      state: "done",
      label: t("done")
    },
    {
      key: "scope",
      title: t("scopeTitle"),
      summary: t("includedCount", scenario),
      detail: t("scopeDetail", scenario),
      state: "done",
      label: t("done")
    },
    {
      key: "bom",
      title: t("bomTitle"),
      summary: t("bomSummary", selectedCount),
      detail: t("bomDetail"),
      state: "done",
      label: t("done")
    },
    {
      key: "guardrails",
      title: t("runGuardrails"),
      summary: scenario.status === "warning" ? t("guardrailWarningSummary") : t("guardrailPassSummary"),
      detail: scenario.guardrails.map((item) => `${item[1]}: ${item[2]}`).join(" "),
      state: scenario.status === "warning" ? "warn" : "done",
      label: scenario.status === "warning" ? t("warn") : t("pass")
    },
    {
      key: "quote",
      title: t("quoteTitle"),
      summary: scenario.quote.range,
      detail: t("quoteDetail", scenario),
      state: scenario.status === "quote" ? "warn" : "done",
      label: scenario.status === "quote" ? t("manual") : t("done")
    },
    {
      key: "packet",
      title: t("packetTitle"),
      summary: scenario.status === "warning" ? t("packetWarningSummary") : t("packetReadySummary"),
      detail: t("packetDetail", scenario),
      state: scenario.status === "warning" ? "warn" : "ready",
      label: scenario.status === "warning" ? t("hold") : t("queue")
    }
  ];
}

function renderPartsView(scenario) {
  const filters = [
    ["selected", t("selected")],
    ["stocked", t("stocked")],
    ["deferred", t("deferred")]
  ];
  const visible =
    state.partsFilter === "selected"
      ? scenario.bom.filter((item) => item[3] === "selected" || item[3] === "warning")
      : state.partsFilter === "deferred"
        ? scenario.bom.filter((item) => item[3] === "deferred")
        : allParts(scenario);

  dom.workspaceView.innerHTML = `
    <section class="workspace-card">
      <div class="workspace-head">
        <span>${escapeHtml(t("partsShelf"))}</span>
        <strong>${escapeHtml(scenario.title)}</strong>
      </div>
      <div class="segmented-row">
        ${filters.map(([filter, label]) => `<button type="button" class="${state.partsFilter === filter ? "active" : ""}" data-parts-filter="${filter}">${escapeHtml(label)}</button>`).join("")}
      </div>
      <div class="parts-grid">
        ${visible
          .map(
            (item) => `
              <article class="part-card ${item[3]}">
                <span>${escapeHtml(item[1])}</span>
                <strong>${escapeHtml(item[0])}</strong>
                <small>${escapeHtml(item[2])} / ${escapeHtml(partStatusLabel(item[3]))}</small>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function allParts(scenario) {
  const stocked =
    state.lang === "zh"
      ? [
          ["Y-Core Lite 主控", "主控", "$42", "stocked"],
          ["3.5 英寸 TFT 屏", "显示", "$28", "stocked"],
          ["5 英寸 TFT 屏", "显示", "$48", "stocked"],
          ["7 英寸 TFT 屏", "显示", "$72", "stocked"],
          ["USB-C 桌面供电", "供电", "$12", "stocked"],
          ["环境光板", "传感器", "$8", "stocked"]
        ]
      : [
          ["Y-Core Lite", "core", "$42", "stocked"],
          ["3.5 in TFT", "display", "$28", "stocked"],
          ["5 in TFT", "display", "$48", "stocked"],
          ["7 in TFT", "display", "$72", "stocked"],
          ["USB-C bench power", "power", "$12", "stocked"],
          ["Ambient light board", "sensor", "$8", "stocked"]
        ];
  return [...scenario.bom, ...stocked].filter((item, index, list) => list.findIndex((candidate) => candidate[0] === item[0]) === index);
}

function renderDfmView() {
  const filters = [
    ["ready", t("ready")],
    ["blocked", t("blocked")],
    ["queued", t("queued")]
  ];
  const items = queueItems().filter((item) => state.queueFilter === item.status);
  dom.workspaceView.innerHTML = `
    <section class="workspace-card">
      <div class="workspace-head">
        <span>${escapeHtml(t("dfmQueue"))}</span>
        <strong>${escapeHtml(t("mockPacketBoard"))}</strong>
      </div>
      <div class="segmented-row">
        ${filters.map(([filter, label]) => `<button type="button" class="${state.queueFilter === filter ? "active" : ""}" data-queue-filter="${filter}">${escapeHtml(label)}</button>`).join("")}
      </div>
      <div class="queue-list">
        ${items
          .map(
            (item) => `
              <article class="queue-item ${item.status}">
                <span>${escapeHtml(queueStatusLabel(item.status))}</span>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function queueItems() {
  return state.lang === "zh"
    ? [
        { title: "核桃木桌面屏", status: "ready", detail: "生产检查 L1 方案包已包含范围、零件清单（BOM）、报价、设备行为和风险限制。" },
        { title: "摄像头和电池阻塞测试", status: "blocked", detail: "摄像头和电池需要先编辑范围，才能加入方案包队列。" },
        { title: "运动陪伴屏", status: "blocked", detail: "舵机运动需要生产可行性（DFM）L3 机械间隙确认。" },
        { title: "展台计数屏", status: "queued", detail: "已附带品牌铭牌和文案槽的手动报价假设。" }
      ]
    : [
        { title: "Walnut desk display", status: "ready", detail: "Manufacturing check L1 packet has scope, parts list (BOM), quote, behavior rules, and risk limits." },
        { title: "Camera/battery blocked test", status: "blocked", detail: "Camera and battery require scope edit before packet can queue." },
        { title: "Motion companion", status: "blocked", detail: "Servo motion requires manufacturing check (DFM) L3 mechanical clearance." },
        { title: "Booth counter unit", status: "queued", detail: "Manual quote assumption attached for branding plate and copy slot." }
      ];
}

function renderFirmwareView(scenario) {
  const modes = [
    ["rules", t("rules")],
    ["modes", t("modes")],
    ["constraints", t("constraints")]
  ];
  const rows =
    state.firmwareMode === "rules"
      ? scenario.firmware.rules
      : state.firmwareMode === "modes"
        ? scenario.firmware.modes
        : scenario.firmware.constraints;
  dom.workspaceView.innerHTML = `
    <section class="workspace-card">
      <div class="workspace-head">
        <span>${escapeHtml(t("firmwareRules"))}</span>
        <strong>${escapeHtml(scenario.title)}</strong>
      </div>
      <div class="segmented-row">
        ${modes.map(([mode, label]) => `<button type="button" class="${state.firmwareMode === mode ? "active" : ""}" data-firmware-mode="${mode}">${escapeHtml(label)}</button>`).join("")}
      </div>
      <div class="rule-list">
        ${rows.map((row, index) => `<div class="rule-row"><span>${index + 1}</span><strong>${escapeHtml(row)}</strong></div>`).join("")}
      </div>
    </section>
  `;
}

function renderInspector(scenario) {
  const sections = [
    ["scope", t("inspectorScope"), renderScopeSection(scenario)],
    ["bom", t("bomAria"), renderBomSection(scenario)],
    ["guardrails", t("guardrails"), renderGuardrailSection(scenario)],
    ["quote", t("inspectorQuote"), renderQuoteSection(scenario)],
    ["firmware", t("firmware"), renderFirmwareSection(scenario)],
    ["packet", t("inspectorPacket"), renderPacketSection(scenario)]
  ];

  dom.inspectorContent.innerHTML = sections
    .map(([key, title, body]) => {
      const collapsed = state.collapsedSections.has(key);
      return `
        <section class="inspector-card">
          <button class="card-head inspector-toggle" type="button" data-inspector-toggle="${key}">
            <span>${escapeHtml(title)}</span>
            <strong>${collapsed ? "+" : "-"}</strong>
          </button>
          <div class="inspector-section" ${collapsed ? "hidden" : ""}>${body}</div>
        </section>
      `;
    })
    .join("");
}

function renderScopeSection(scenario) {
  return `
    <div class="kv-list">
      <span>${escapeHtml(t("device"))} <strong>${escapeHtml(scenario.device)}</strong></span>
      <span>${escapeHtml(t("display"))} <strong>${escapeHtml(scenario.screen)}</strong></span>
      <span>${escapeHtml(t("finish"))} <strong>${escapeHtml(scenario.finishLabel)}</strong></span>
      <span>${escapeHtml(t("power"))} <strong>${escapeHtml(scenario.power)}</strong></span>
    </div>
    <p class="section-note">${escapeHtml(t("includedHeading"))}</p>
    <div class="pill-list">${scenario.included.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    <p class="section-note">${escapeHtml(t("deferredHeading"))}</p>
    <div class="pill-list deferred">${scenario.deferred.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
  `;
}

function renderBomSection(scenario) {
  return scenario.bom
    .filter((item) => item[3] !== "deferred")
    .map((item) => `<div class="artifact-item ${item[3]}"><span><span>${escapeHtml(item[1])}</span><strong>${escapeHtml(item[0])}</strong></span><b>${escapeHtml(item[2])}</b></div>`)
    .join("");
}

function renderGuardrailSection(scenario) {
  const blockedCase = activeBlockedCase();
  const items = [...scenario.guardrails, ...blockedCase.guardrails.filter((item) => item[0] === "block")];
  return items.map((item) => `<div class="risk-item ${item[0]}"><strong>${escapeHtml(item[1])}</strong><span>${escapeHtml(item[2])}</span></div>`).join("");
}

function renderQuoteSection(scenario) {
  return `
    <div class="quote-grid">
      <span>${escapeHtml(t("bomAria"))} <strong>$${scenario.quote.bom}</strong></span>
      <span>${escapeHtml(t("build"))} <strong>$${scenario.quote.build}</strong></span>
      <span>${escapeHtml(t("dfmCost"))} <strong>$${scenario.quote.dfm}</strong></span>
      <span>${escapeHtml(t("band"))} <strong>${escapeHtml(scenario.quote.range)}</strong></span>
    </div>
    <p class="section-note">${escapeHtml(scenario.assumption)}</p>
  `;
}

function renderFirmwareSection(scenario) {
  return scenario.firmware.rules.map((rule) => `<div class="source-item"><strong>${escapeHtml(rule)}</strong><span>${escapeHtml(t("mockRulePreview"))}</span></div>`).join("");
}

function renderPacketSection(scenario) {
  return `
    <div class="packet-status ${scenario.status}">${escapeHtml(scenario.status === "warning" ? t("packetHeld") : scenario.status === "quote" ? t("packetManualQuote") : t("packetReady"))}</div>
    ${scenario.packet.map((item) => `<div class="packet-item">${escapeHtml(item)}</div>`).join("")}
    <canvas data-device-canvas width="760" height="520" aria-label="${escapeHtml(t("canvasAria"))}"></canvas>
  `;
}

function renderPopovers(scenario) {
  const blockedCase = activeBlockedCase();
  const selectedParts = scenario.bom.filter((item) => item[3] !== "deferred");
  const deferredParts = scenario.bom.filter((item) => item[3] === "deferred");
  dom.scopePopover.innerHTML = `
    <strong>${escapeHtml(t("scopeAria"))}</strong>
    <p>${escapeHtml(t("reasoning"))}${escapeHtml(scenario.agent)}</p>
    <h4>${escapeHtml(t("includedHeading"))}</h4>
    <div class="pill-list">${scenario.included.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
    <h4>${escapeHtml(t("deferredHeading"))}</h4>
    <div class="pill-list deferred">${scenario.deferred.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
  `;
  dom.bomPopover.innerHTML = `
    <strong>${escapeHtml(t("bomAria"))}</strong>
    <h4>${escapeHtml(t("selectedParts"))}</h4>
    ${selectedParts.map((item) => `<div class="popover-row ${item[3]}"><span>${escapeHtml(item[0])}</span><b>${escapeHtml(item[2])}</b></div>`).join("")}
    <h4>${escapeHtml(t("deferredParts"))}</h4>
    ${deferredParts.map((item) => `<div class="popover-row ${item[3]}"><span>${escapeHtml(item[0])}</span><b>${escapeHtml(item[2])}</b></div>`).join("")}
  `;
  dom.guardrailsPopover.innerHTML = `
    <strong>${escapeHtml(t("guardrails"))}</strong>
    ${[...scenario.guardrails, ...blockedCase.guardrails].map((item) => `<div class="popover-row ${item[0]}"><span>${escapeHtml(item[1])}</span><small>${escapeHtml(item[2])}</small></div>`).join("")}
  `;
  dom.dfmPopover.innerHTML = `
    <strong>${escapeHtml(t("dfmLevels"))}</strong>
    <div class="popover-row ${scenario.dfmLevel === 0 ? "selected" : ""}"><span>${escapeHtml(t("dfmL0Label"))}</span><small>${escapeHtml(t("dfmL0"))}</small></div>
    <div class="popover-row ${scenario.dfmLevel === 1 ? "selected" : ""}"><span>${escapeHtml(t("dfmL1Label"))}</span><small>${escapeHtml(t("dfmL1"))}</small></div>
    <div class="popover-row ${scenario.dfmLevel === 3 ? "selected" : ""}"><span>${escapeHtml(t("dfmL3Label"))}</span><small>${escapeHtml(t("dfmL3"))}</small></div>
    <div class="popover-row ${blockedCase.dfmLevel === 4 ? "blocked" : ""}"><span>${escapeHtml(t("blocked"))}</span><small>${escapeHtml(t("dfmBlocked"))}</small></div>
  `;
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
  dom.apiStatus.textContent = message;
  window.clearTimeout(setNotice.timeout);
  setNotice.timeout = window.setTimeout(() => {
    state.notice = "";
    dom.apiStatus.textContent = t("uiPrototype");
  }, 1600);
}

function drawPreview(scenario) {
  const canvas = document.querySelector("[data-device-canvas]");
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(260, rect.width || 280);
  const height = Math.max(150, rect.height || 180);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const colors = {
    walnut: ["#9a6534", "#4d2d16"],
    sage: ["#7f987a", "#3f5b45"],
    graphite: ["#3a3f42", "#15191a"]
  }[scenario.finish] || ["#9a6534", "#4d2d16"];

  ctx.fillStyle = "#f6f6f2";
  roundedRect(ctx, 0, 0, width, height, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(31,33,29,.12)";
  roundedRect(ctx, width * 0.25, height * 0.76, width * 0.5, 14, 7);
  ctx.fill();
  const frameWidth = scenario.screenSize === 7 ? width * 0.62 : scenario.screenSize === 5 ? width * 0.52 : width * 0.44;
  const frameHeight = frameWidth * 0.58;
  const x = (width - frameWidth) / 2;
  const y = height * 0.2;
  const gradient = ctx.createLinearGradient(x, y, x + frameWidth, y + frameHeight);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  roundedRect(ctx, x, y, frameWidth, frameHeight, 18);
  ctx.fill();
  ctx.fillStyle = "#101716";
  roundedRect(ctx, x + 24, y + 24, frameWidth - 48, frameHeight - 48, 10);
  ctx.fill();
  ctx.fillStyle = "#f3faf6";
  roundedRect(ctx, x + 38, y + 38, frameWidth * 0.28, 24, 7);
  ctx.fill();
  ctx.fillStyle = "#2f6f9f";
  roundedRect(ctx, x + frameWidth * 0.55, y + 38, frameWidth * 0.25, 18, 6);
  ctx.fill();
  if (scenario.status === "warning") {
    ctx.fillStyle = colors[1];
    roundedRect(ctx, x + frameWidth * 0.38, y + frameHeight - 2, frameWidth * 0.24, 38, 7);
    ctx.fill();
  }
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    closeFloating();
    render();
  });
});

document.querySelectorAll("[data-scenario]").forEach((button) => {
  button.addEventListener("click", () => {
    state.scenario = button.dataset.scenario;
    state.view = "build";
    state.expandedStep = "scope";
    closeFloating();
    render();
  });
});

dom.workspaceView.addEventListener("click", (event) => {
  const step = event.target.closest("[data-step]");
  if (step) {
    state.expandedStep = state.expandedStep === step.dataset.step ? "" : step.dataset.step;
    render();
    return;
  }
  const partsFilter = event.target.closest("[data-parts-filter]");
  if (partsFilter) {
    state.partsFilter = partsFilter.dataset.partsFilter;
    render();
    return;
  }
  const queueFilter = event.target.closest("[data-queue-filter]");
  if (queueFilter) {
    state.queueFilter = queueFilter.dataset.queueFilter;
    render();
    return;
  }
  const firmwareMode = event.target.closest("[data-firmware-mode]");
  if (firmwareMode) {
    state.firmwareMode = firmwareMode.dataset.firmwareMode;
    render();
  }
});

dom.inspectorContent.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-inspector-toggle]");
  if (!toggle) return;
  const key = toggle.dataset.inspectorToggle;
  if (state.collapsedSections.has(key)) {
    state.collapsedSections.delete(key);
  } else {
    state.collapsedSections.add(key);
  }
  render();
});

dom.form.addEventListener("submit", (event) => {
  event.preventDefault();
  state.view = "build";
  state.expandedStep = "parse";
  setNotice(t("noticeRerun"));
  render();
});

dom.copySpec.addEventListener("click", () => {
  state.view = "build";
  state.expandedStep = "packet";
  setNotice(t("noticePreview"));
  render();
});

dom.submitReview.addEventListener("click", () => {
  const scenario = activeScenario();
  state.view = "dfm";
  state.queueFilter = scenario.status === "warning" ? "blocked" : "queued";
  setNotice(scenario.status === "warning" ? t("noticeHeld") : t("noticeQueued"));
  render();
});

dom.openThreadMenu.addEventListener("click", () => openFloating("thread"));
dom.openSettings.addEventListener("click", () => openFloating("settings"));
dom.openAttach.addEventListener("click", () => openFloating("attach"));
dom.openScope.addEventListener("click", () => openFloating("scope"));
dom.openBom.addEventListener("click", () => openFloating("bom"));
dom.openGuardrails.addEventListener("click", () => openFloating("guardrails"));
dom.openDfm.addEventListener("click", () => openFloating("dfm"));

dom.languageSelect.addEventListener("change", () => {
  state.lang = dom.languageSelect.value === "en" ? "en" : "zh";
  state.notice = "";
  try {
    window.localStorage.setItem("yWorkbenchLanguage", state.lang);
  } catch {
    // Language persistence is optional for this UI-only prototype.
  }
  render();
});

dom.floatingLayer.addEventListener("click", (event) => {
  if (event.target === dom.floatingLayer || event.target.closest(".close-floating")) {
    closeFloating();
    return;
  }
  const action = event.target.closest("[data-action]");
  if (action) {
    setNotice(`${t("noticeAction")}${action.textContent.trim()}`);
    closeFloating();
  }
});

document.querySelectorAll("[data-settings-tab]").forEach((button) => {
  button.addEventListener("click", () => showSettingsPanel(button.dataset.settingsTab));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFloating();
});

window.addEventListener("resize", () => drawPreview(activeScenario()));

render();
