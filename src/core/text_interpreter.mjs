import { includesAny, includesWholeWordAny, unique } from "./utils.mjs";

export const baseOptions = {
  speaker: false,
  ambient: false,
  motor: false,
  camera: false,
  battery: false
};

export function interpretRequest(requestText, overrides = {}) {
  const text = String(requestText || "").trim();
  const lower = text.toLowerCase();

  const interpreted = {
    requestText: text,
    productType: "display",
    screenSize: 5,
    finish: "woodgrain",
    options: { ...baseOptions },
    dataSources: [],
    functions: []
  };

  if (includesAny(lower, ["pet", "companion", "robot", "expression", "face", "宠物", "陪伴", "伙伴", "机器人", "表情"])) {
    interpreted.productType = "companion";
  }
  if (includesAny(lower, ["prototype", "demo", "conference", "booth", "founder", "原型", "演示", "展会", "展台", "创始人"])) {
    interpreted.productType = "prototype";
  }
  if (interpreted.productType === "display" && includesAny(lower, ["frame", "photo", "display", "screen", "dashboard", "相框", "照片", "屏幕", "桌面屏", "显示", "看板"])) {
    interpreted.productType = interpreted.productType === "prototype" ? "prototype" : "display";
  }

  interpreted.screenSize = detectScreenSize(lower) || interpreted.screenSize;

  if (includesAny(lower, ["wood", "walnut", "retro", "木", "木纹", "胡桃"])) interpreted.finish = "woodgrain";
  if (includesAny(lower, ["black", "graphite", "dark", "黑", "黑色", "石墨"])) interpreted.finish = "graphite";
  if (includesAny(lower, ["green", "sage", "绿", "绿色", "鼠尾草"])) interpreted.finish = "sage";
  if (includesWholeWordAny(lower, ["coral", "orange", "red"]) || includesAny(lower, ["珊瑚", "橙", "红"])) interpreted.finish = "coral";

  interpreted.options.speaker = hasRequestedCapability(lower, ["speaker", "sound", "audio", "alert", "扬声器", "喇叭", "声音", "音频", "提醒"], ["speaker", "sound", "audio", "扬声器", "喇叭", "声音", "音频"]);
  interpreted.options.ambient = hasRequestedCapability(lower, ["dim", "night", "ambient", "light sensor", "变暗", "调暗", "夜间", "夜晚", "环境光", "光线传感器"], ["ambient", "light sensor", "环境光", "光线传感器"]);
  interpreted.options.motor = hasRequestedCapability(lower, ["servo", "turn", "move", "motion", "舵机", "转动", "旋转", "运动结构", "机械运动", "动起来"], ["servo", "motor", "motion", "舵机", "转动", "旋转", "运动结构", "机械运动"]);
  interpreted.options.camera = hasRequestedCapability(lower, ["camera", "recognize", "vision", "face", "detect", "摄像头", "相机", "识别", "视觉", "人脸", "检测"], ["camera", "recognition", "face recognition", "vision", "摄像头", "相机", "识别", "视觉"]);
  interpreted.options.battery = hasRequestedCapability(lower, ["battery", "portable", "wireless power", "电池", "便携", "无线供电", "移动电源"], ["battery", "portable", "wireless power", "电池", "便携", "无线供电", "移动电源"]);

  if (includesAny(lower, ["photo", "album", "picture", "照片", "相册", "图片"])) interpreted.dataSources.push("photos");
  if (includesAny(lower, ["weather", "temperature", "天气", "气温", "温度"])) interpreted.dataSources.push("weather");
  if (includesAny(lower, ["calendar", "schedule", "日历", "日程", "明天安排"])) interpreted.dataSources.push("calendar");
  if (includesAny(lower, ["github", "build", "ci", "构建", "持续集成"])) interpreted.dataSources.push("github");
  if (includesAny(lower, ["stock", "crypto", "market", "股票", "币价", "市场"])) interpreted.dataSources.push("market");
  if (includesAny(lower, ["todo", "task", "待办", "任务"])) interpreted.dataSources.push("tasks");
  if (includesAny(lower, ["api", "metrics", "dashboard", "指标", "看板"])) interpreted.dataSources.push("api_metrics");
  if (interpreted.dataSources.length === 0) interpreted.dataSources.push("photos", "weather");

  const functionMap = {
    photos: "photo_slideshow",
    weather: "weather_card",
    calendar: "calendar_view",
    github: "build_status",
    market: "market_ticker",
    tasks: "task_summary",
    api_metrics: "metrics_dashboard"
  };

  interpreted.functions = interpreted.dataSources.map((source) => functionMap[source] || source);
  if (interpreted.productType === "companion") interpreted.functions.push("expression_screen");

  return applyOverrides({
    ...interpreted,
    dataSources: unique(interpreted.dataSources),
    functions: unique(interpreted.functions)
  }, overrides);
}

function detectScreenSize(text) {
  const matches = [
    ...screenMentions(text, 7, [
      /(?<![\d.])7\s*-?\s*(inch|in|英寸|寸)/g,
      "large",
      "bigger",
      "big screen",
      "大屏",
      "大号"
    ]),
    ...screenMentions(text, 5, [
      /(?<![\d.])5\s*-?\s*(inch|in|英寸|寸)/g,
      "medium",
      "中型",
      "中号"
    ]),
    ...screenMentions(text, 3.5, [
      /(?<![\d.])3\.5\s*-?\s*(inch|in|英寸|寸)?/g,
      "tiny",
      "compact",
      "small",
      "小型",
      "小屏",
      "小号",
      "迷你"
    ])
  ].sort((left, right) => left.index - right.index);

  return matches.at(-1)?.size;
}

function screenMentions(text, size, patterns) {
  const matches = [];
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      const index = text.lastIndexOf(pattern);
      if (index >= 0) matches.push({ size, index });
      continue;
    }
    let match;
    while ((match = pattern.exec(text)) !== null) {
      matches.push({ size, index: match.index });
    }
  }
  return matches;
}

function hasRequestedCapability(text, positiveWords, negatableWords) {
  if (!includesAny(text, positiveWords)) return false;
  return !negatableWords.some((word) => isNegated(text, word));
}

function isNegated(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const englishNegated = new RegExp(`\\b(no|without|exclude|remove)\\s+${escaped}\\b`).test(text);
  const chinesePrefixes = ["不要", "不需要", "别加", "去掉", "移除", "取消"];
  const chineseNegated = chinesePrefixes.some((prefix) => text.includes(`${prefix}${word}`) || text.includes(`${prefix} ${word}`));
  return englishNegated || chineseNegated;
}

function applyOverrides(interpreted, overrides) {
  const next = {
    ...interpreted,
    options: {
      ...interpreted.options
    }
  };

  if (overrides.productType) next.productType = overrides.productType;
  if (overrides.finish) next.finish = overrides.finish;
  if (overrides.screenSize) next.screenSize = Number(overrides.screenSize);
  if (overrides.options && typeof overrides.options === "object") {
    next.options = {
      ...next.options,
      ...overrides.options
    };
  }

  return next;
}
