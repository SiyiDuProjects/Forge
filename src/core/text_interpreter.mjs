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

  if (includesAny(lower, ["pet", "companion", "robot", "expression", "face"])) {
    interpreted.productType = "companion";
  }
  if (includesAny(lower, ["prototype", "demo", "conference", "booth", "founder"])) {
    interpreted.productType = "prototype";
  }
  if (interpreted.productType === "display" && includesAny(lower, ["frame", "photo", "display", "screen", "dashboard"])) {
    interpreted.productType = interpreted.productType === "prototype" ? "prototype" : "display";
  }

  if (includesAny(lower, ["7 inch", "7-inch", "large", "bigger", "big screen"])) {
    interpreted.screenSize = 7;
  } else if (includesAny(lower, ["3.5", "tiny", "compact", "small"])) {
    interpreted.screenSize = 3.5;
  } else if (includesAny(lower, ["5 inch", "5-inch", "medium"])) {
    interpreted.screenSize = 5;
  }

  if (includesAny(lower, ["wood", "walnut", "retro"])) interpreted.finish = "woodgrain";
  if (includesAny(lower, ["black", "graphite", "dark"])) interpreted.finish = "graphite";
  if (includesAny(lower, ["green", "sage"])) interpreted.finish = "sage";
  if (includesWholeWordAny(lower, ["coral", "orange", "red"])) interpreted.finish = "coral";

  interpreted.options.speaker = hasRequestedCapability(lower, ["speaker", "sound", "audio", "alert"], ["speaker", "sound", "audio"]);
  interpreted.options.ambient = hasRequestedCapability(lower, ["dim", "night", "ambient", "light sensor"], ["ambient", "light sensor"]);
  interpreted.options.motor = hasRequestedCapability(lower, ["servo", "turn", "move", "motion"], ["servo", "motor", "motion"]);
  interpreted.options.camera = hasRequestedCapability(lower, ["camera", "recognize", "vision", "face", "detect"], ["camera", "recognition", "face recognition", "vision"]);
  interpreted.options.battery = hasRequestedCapability(lower, ["battery", "portable", "wireless power"], ["battery", "portable", "wireless power"]);

  if (includesAny(lower, ["photo", "album", "picture"])) interpreted.dataSources.push("photos");
  if (includesAny(lower, ["weather", "temperature"])) interpreted.dataSources.push("weather");
  if (includesAny(lower, ["calendar", "schedule"])) interpreted.dataSources.push("calendar");
  if (includesAny(lower, ["github", "build", "ci"])) interpreted.dataSources.push("github");
  if (includesAny(lower, ["stock", "crypto", "market"])) interpreted.dataSources.push("market");
  if (includesAny(lower, ["todo", "task"])) interpreted.dataSources.push("tasks");
  if (includesAny(lower, ["api", "metrics", "dashboard"])) interpreted.dataSources.push("api_metrics");
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

function hasRequestedCapability(text, positiveWords, negatableWords) {
  if (!includesAny(text, positiveWords)) return false;
  return !negatableWords.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b(no|without|exclude|remove|不要|不需要|别加)\\s+${escaped}\\b`).test(text);
  });
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
