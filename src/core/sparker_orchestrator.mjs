import { applyWorkspacePatches, createEmptyProductPlan } from "./workspace_state.mjs";
import { includesAny, unique } from "./utils.mjs";

export function processUserTurn({
  workspaceState = null,
  currentProductPlan = null,
  currentConversation = [],
  userMessage = "",
  adapter = new MockSparkerAdapter()
} = {}) {
  const productPlan = currentProductPlan
    || workspaceState?.productPlan
    || createEmptyProductPlan();
  return adapter.processUserTurn({
    workspaceState,
    currentProductPlan: productPlan,
    currentConversation,
    userMessage
  });
}

export class MockSparkerAdapter {
  processUserTurn({ currentProductPlan = createEmptyProductPlan(), userMessage = "" } = {}) {
    const text = String(userMessage || "").trim();
    const lower = text.toLowerCase();
    const patches = [];
    const unsupportedReasons = unsupportedReasonsFor(lower);
    const generationRequest = isGenerationRequest(lower);

    if (unsupportedReasons.length > 0) {
      patches.push({
        type: "plan_patch",
        set: {
          productType: "manual_expansion",
          userIntent: appendIntent(currentProductPlan.userIntent, text)
        },
        appendRisks: unsupportedReasons.map((reason) => ({
          level: "block",
          message: reason
        }))
      });
    } else {
      const planSet = {
        userIntent: appendIntent(currentProductPlan.userIntent, text)
      };
      const componentPatch = { type: "component_patch", add: [], remove: [] };
      const geometrySet = {};
      const assumptions = [];

      if (isNewProjectRequest(lower, currentProductPlan)) {
        Object.assign(planSet, {
          productType: productTypeFor(lower),
          "requirements.display": true,
          "requirements.usbC": true,
          "requirements.desktopUse": true,
          "constraints.manufacturingMethod": "fdm_3d_printing",
          "constraints.material": "pla"
        });
        assumptions.push("Starting from the standard simple desktop electronics pipeline.");
      }

      const screenSize = screenSizeFrom(lower);
      if (screenSize) planSet["requirements.displaySizeInches"] = screenSize;

      const finish = finishFrom(lower);
      if (finish) planSet["constraints.finish"] = finish;

      const productType = productTypeFor(lower);
      if (productType) planSet.productType = productType;

      if (includesAny(lower, ["3d printable", "3d print", "3d-printed", "3D 打印", "3d 打印", "可打印"])) {
        planSet["constraints.manufacturingMethod"] = "fdm_3d_printing";
      }
      if (includesAny(lower, ["pla", "pla 材料"])) planSet["constraints.material"] = "pla";
      if (includesAny(lower, ["thicker wall", "wall thicker", "increase wall", "加厚", "壁厚"])) {
        planSet["constraints.wallThicknessMm"] = wallThicknessFrom(lower) || 3;
      }

      collectComponentPatches(lower, componentPatch);
      collectGeometryPatches(lower, geometrySet);

      if (Object.keys(planSet).length > 1 || assumptions.length > 0) {
        patches.push({
          type: "plan_patch",
          set: planSet,
          appendAssumptions: assumptions
        });
      } else if (text) {
        patches.push({
          type: "plan_patch",
          set: planSet
        });
      }
      if (componentPatch.add.length || componentPatch.remove.length) patches.push(componentPatch);
      if (Object.keys(geometrySet).length) {
        patches.push({
          type: "geometry_preference_patch",
          set: geometrySet
        });
      }
    }

    const patchResult = applyWorkspacePatches(currentProductPlan, patches);
    const changes = summarizePatches(patchResult.appliedPatches);
    return {
      assistantMessage: assistantMessageFor({
        unsupportedReasons,
        generationRequest,
        changes,
        rejectedPatches: patchResult.rejectedPatches
      }),
      patches,
      appliedPatches: patchResult.appliedPatches,
      rejectedPatches: patchResult.rejectedPatches,
      productPlan: patchResult.productPlan,
      needsClarification: false,
      clarificationQuestions: [],
      shouldRegenerate: generationRequest,
      unsupportedReasons,
      intent: classifyIntent(lower, { unsupportedReasons, generationRequest, changes })
    };
  }
}

export class OpenAISparkerAdapter {
  constructor({ client = null } = {}) {
    this.client = client;
  }

  async processUserTurn() {
    if (!this.client) {
      throw new Error("OpenAISparkerAdapter requires an injected client.");
    }
    throw new Error("OpenAISparkerAdapter is reserved for future structured-output integration.");
  }
}

export function isGenerationRequest(text) {
  const lower = String(text || "").toLowerCase();
  if (includesAny(lower, ["不要生成", "别生成", "do not generate", "don't generate", "not ready"])) return false;
  return includesAny(lower, [
    "生成模型",
    "生成一下",
    "现在造",
    "现在造一下",
    "可以了",
    "开始生成",
    "开始造",
    "造一下",
    "确认生成",
    "generate model",
    "generate the model",
    "build it",
    "make it now",
    "ready to build",
    "this is ready",
    "ready"
  ]);
}

function collectComponentPatches(lower, componentPatch) {
  if (requested(lower, ["button", "buttons", "按钮", "按键"])) {
    componentPatch.add.push({ componentType: "button", quantity: quantityFrom(lower) || 1 });
  }
  if (requested(lower, ["buzzer", "蜂鸣器", "提示音"])) {
    componentPatch.add.push({ componentType: "buzzer", quantity: 1 });
  }
  if (requested(lower, ["speaker", "sound", "audio", "喇叭", "扬声器", "声音"])) {
    componentPatch.add.push({ componentType: "speaker", quantity: 1 });
  }
  if (requested(lower, ["ambient sensor", "ambient light", "light sensor", "环境光", "光线传感器"])) {
    componentPatch.add.push({ componentType: "ambient_sensor", quantity: 1 });
  }
  if (requested(lower, ["usb-c", "usb c", "usbc", "usb-c power", "USB-C".toLowerCase()])) {
    componentPatch.add.push({ componentType: "usb_c", quantity: 1 });
  }
  if (requested(lower, ["camera", "摄像头", "相机"])) componentPatch.add.push({ componentType: "camera", quantity: 1 });
  if (requested(lower, ["battery", "电池"])) componentPatch.add.push({ componentType: "battery", quantity: 1 });

  if (negated(lower, ["battery", "电池"])) componentPatch.remove.push({ componentType: "battery" });
  if (negated(lower, ["camera", "摄像头", "相机"])) componentPatch.remove.push({ componentType: "camera" });
  if (negated(lower, ["speaker", "buzzer", "喇叭", "扬声器", "蜂鸣器"])) {
    componentPatch.remove.push({ componentType: "speaker" });
    componentPatch.remove.push({ componentType: "buzzer" });
  }
}

function collectGeometryPatches(lower, geometrySet) {
  const shape = shapeProfileFor(lower);
  if (shape) geometrySet["enclosure.shapeProfile"] = shape;

  const usbPosition = targetSemanticPositionFor(lower, "usb_c")
    || semanticPositionFor(lower, ["usb-c", "usb c", "usbc", "usb"]);
  if (usbPosition) geometrySet["placements.usb_c.semanticPosition"] = usbPosition;

  const buttonPosition = targetSemanticPositionFor(lower, "buttons")
    || semanticPositionFor(lower, ["button", "buttons", "按钮", "按键"]);
  if (buttonPosition) geometrySet["placements.buttons.semanticPosition"] = buttonPosition;

  const sensorPosition = targetSemanticPositionFor(lower, "ambient_sensor")
    || semanticPositionFor(lower, ["sensor", "ambient", "环境光", "传感器"]);
  if (sensorPosition) geometrySet["placements.ambient_sensor.semanticPosition"] = sensorPosition;

  const tilt = displayTiltFrom(lower);
  if (tilt !== null) geometrySet["display.tiltDeg"] = tilt;

  if (includesAny(lower, ["wider", "更宽", "宽一点"])) geometrySet["dimensions.widthScale"] = 1.15;
  if (includesAny(lower, ["taller", "更高", "高一点", "竖版"])) geometrySet["dimensions.heightScale"] = 1.15;
  if (includesAny(lower, ["thinner", "更薄", "薄一点"])) geometrySet["dimensions.depthDeltaMm"] = -4;
  if (includesAny(lower, ["smaller bezel", "narrower bezel", "bezel smaller", "边框小", "窄边框"])) {
    geometrySet["dimensions.bezelDeltaMm"] = -2;
  }
}

function requested(lower, words) {
  return includesAny(lower, words) && !negated(lower, words);
}

function negated(lower, words) {
  const prefixes = ["no", "without", "remove", "exclude", "不要", "不需要", "去掉", "移除", "取消", "别加"];
  return words.some((word) => prefixes.some((prefix) => {
    if (/^[a-z0-9 -]+$/.test(prefix)) {
      return lower.includes(`${prefix} ${word}`);
    }
    return lower.includes(`${prefix}${word}`) || lower.includes(`${prefix} ${word}`);
  }));
}

function productTypeFor(lower) {
  if (includesAny(lower, ["desk clock", "desktop clock", "clock", "闹钟", "桌面钟", "时钟"])) return "desk_clock";
  if (includesAny(lower, ["photo frame", "digital frame", "picture frame", "相框"])) return "digital_photo_frame";
  if (includesAny(lower, ["sensor display", "sensor dashboard", "传感器屏", "传感器看板"])) return "sensor_display";
  if (includesAny(lower, ["desktop display", "smart display", "桌面屏", "显示屏", "screen", "display"])) return "desktop_display";
  return "";
}

function shapeProfileFor(lower) {
  if (includesAny(lower, ["cat ear", "cat-ear", "cat ears", "猫耳"])) return "cat_ear_photo_frame";
  if (includesAny(lower, ["photo frame", "picture frame", "相框"])) return "photo_frame";
  if (includesAny(lower, ["desktop wedge", "wedge", "倾斜底座", "楔形"])) return "desktop_wedge";
  if (includesAny(lower, ["arched", "arch", "拱形"])) return "arched_frame";
  if (includesAny(lower, ["wide landscape", "landscape", "横向", "横屏"])) return "wide_landscape";
  if (includesAny(lower, ["tall portrait", "portrait", "竖向", "竖屏"])) return "tall_portrait";
  if (includesAny(lower, ["rounded", "round rect", "圆角"])) return "rounded_rect";
  return "";
}

function semanticPositionFor(lower, targetWords) {
  if (!includesAny(lower, targetWords)) return "";
  if (includesAny(lower, backLeftTerms())) return "back_left";
  if (includesAny(lower, backRightTerms())) return "back_right";
  if (includesAny(lower, ["front-top", "upper front", "front upper", "正面上方"])) return "front_top";
  if (includesAny(lower, ["front-bottom", "lower front", "front lower", "正面下方"])) return "front_bottom";
  if (includesAny(lower, ["front-left", "upper-left", "upper left", "左上", "正面左"])) return "front_left";
  if (includesAny(lower, ["front-right", "upper-right", "upper right", "右上", "正面右"])) return "front_right";
  if (includesAny(lower, ["right side", "right-side", "on the right", "右侧", "右边"])) return "right_side";
  if (includesAny(lower, ["left side", "left-side", "on the left", "左侧", "左边"])) return "left_side";
  if (includesAny(lower, ["back", "rear", "后面", "后侧", "背面"])) return "back";
  if (includesAny(lower, ["front", "正面", "前面"])) return "front";
  if (includesAny(lower, ["top", "顶部", "上方"])) return "top";
  if (includesAny(lower, ["bottom", "底部", "下方"])) return "bottom";
  if (includesAny(lower, ["center", "middle", "中间", "居中"])) return "center_front";
  return "";
}

function targetSemanticPositionFor(lower, target) {
  if (target === "usb_c" && includesAny(lower, ["usb-c", "usb c", "usbc", "usb"])) {
    if (includesAny(lower, backLeftTerms())) return "back_left";
    if (includesAny(lower, backRightTerms())) return "back_right";
    if (includesAny(lower, ["back", "rear", "后面", "后侧", "背面"])) return "back";
  }
  if (target === "buttons" && includesAny(lower, ["button", "buttons", "按钮", "按键"])) {
    if (includesAny(lower, ["right side", "right-side", "on the right", "右侧", "右边"])) return "right_side";
    if (includesAny(lower, ["left side", "left-side", "on the left", "左侧", "左边"])) return "left_side";
    if (includesAny(lower, ["front-bottom", "lower front", "front lower", "正面下方"])) return "front_bottom";
    if (includesAny(lower, ["front", "正面", "前面"])) return "front";
  }
  if (target === "ambient_sensor" && includesAny(lower, ["sensor", "ambient", "环境光", "传感器"])) {
    if (includesAny(lower, ["upper-right", "upper right", "右上", "正面右"])) return "front_right";
    if (includesAny(lower, ["upper-left", "upper left", "左上", "正面左"])) return "front_left";
  }
  return "";
}

function backLeftTerms() {
  return [
    "back-left",
    "back left",
    "rear-left",
    "rear left",
    "后面偏左",
    "后侧偏左",
    "背面偏左",
    "后面左侧",
    "后侧左侧",
    "背面左侧",
    "后面左边",
    "后侧左边",
    "背面左边",
    "后左侧",
    "后左"
  ];
}

function backRightTerms() {
  return [
    "back-right",
    "back right",
    "rear-right",
    "rear right",
    "后面偏右",
    "后侧偏右",
    "背面偏右",
    "后面右侧",
    "后侧右侧",
    "背面右侧",
    "后面右边",
    "后侧右边",
    "背面右边",
    "后右侧",
    "后右"
  ];
}

function unsupportedReasonsFor(lower) {
  const reasons = [];
  const checks = [
    [["drone", "无人机"], "Drone structures are outside simple desktop electronic prototypes."],
    [["robot arm", "机械臂"], "Robot arms require manual mechanical engineering validation."],
    [["pet feeder", "feeding mechanism", "喂食器"], "Pet-feeder mechanisms are outside the standard non-motion shell path."],
    [["motorized lock", "电动锁"], "Motorized locks require manual safety and mechanism validation."],
    [["waterproof outdoor camera", "防水户外摄像头"], "Waterproof outdoor camera products require manual enclosure and privacy validation."],
    [["high-power", "high power", "大功率"], "High-power devices are outside the USB-C desktop prototype boundary."],
    [["mains-powered", "mains power", "市电", "强电"], "Mains-powered devices are outside the low-voltage MVP boundary."],
    [["medical", "医疗"], "Medical devices require regulated engineering validation."],
    [["battery charging circuit", "充电电路"], "Battery charging circuit design requires manual electrical validation."]
  ];
  for (const [words, reason] of checks) {
    if (includesAny(lower, words)) reasons.push(reason);
  }
  return unique(reasons);
}

function isNewProjectRequest(lower, currentProductPlan) {
  return !currentProductPlan.userIntent
    || includesAny(lower, ["i want", "make", "build", "做一个", "我想做", "我要做"]);
}

function screenSizeFrom(lower) {
  const matches = [
    [/3\.5\s*-?\s*(inch|in|英寸|寸)?/, 3.5],
    [/\b5\s*-?\s*(inch|in)\b|5\s*(英寸|寸)/, 5],
    [/\b7\s*-?\s*(inch|in)\b|7\s*(英寸|寸)/, 7]
  ];
  for (const [pattern, size] of matches) {
    if (pattern.test(lower)) return size;
  }
  if (includesAny(lower, ["small", "compact", "小型", "迷你"])) return 3.5;
  if (includesAny(lower, ["large", "大屏", "大号"])) return 7;
  return null;
}

function finishFrom(lower) {
  if (includesAny(lower, ["wood", "walnut", "woodgrain", "木纹", "胡桃"])) return "woodgrain";
  if (includesAny(lower, ["graphite", "black", "dark", "石墨", "黑色", "黑"])) return "graphite";
  if (includesAny(lower, ["sage", "green", "鼠尾草", "绿色", "绿"])) return "sage";
  if (includesAny(lower, ["coral", "orange", "red", "珊瑚", "橙", "红"])) return "coral";
  return "";
}

function quantityFrom(lower) {
  if (includesAny(lower, ["two", "2", "两个", "两颗"])) return 2;
  if (includesAny(lower, ["three", "3", "三个", "三颗"])) return 3;
  if (includesAny(lower, ["four", "4", "四个", "四颗"])) return 4;
  return null;
}

function displayTiltFrom(lower) {
  const match = lower.match(/(?:tilt|倾斜)\s*(\d{1,2})|(\d{1,2})\s*(?:deg|degree|degrees|度)/);
  if (!match) return null;
  return Math.max(0, Math.min(25, Number(match[1] || match[2])));
}

function wallThicknessFrom(lower) {
  const match = lower.match(/(\d(?:\.\d)?)\s*mm/);
  if (!match) return null;
  return Math.max(2, Math.min(5, Number(match[1])));
}

function appendIntent(current, text) {
  return [current, text].filter(Boolean).join("\n");
}

function summarizePatches(patches = []) {
  const changes = [];
  for (const patch of patches) {
    if (patch.type === "component_patch") {
      changes.push(...(patch.add || []).map((item) => `added ${item.quantity || 1} ${item.componentType}`));
      changes.push(...(patch.remove || []).map((item) => `removed ${item.componentType}`));
    }
    if (patch.type === "geometry_preference_patch") {
      changes.push(...Object.entries(patch.set || {}).map(([path, value]) => `${path} -> ${value}`));
    }
    if (patch.type === "plan_patch") {
      changes.push(...Object.keys(patch.set || {}).filter((key) => key !== "userIntent"));
    }
  }
  return changes;
}

function assistantMessageFor({ unsupportedReasons, generationRequest, changes, rejectedPatches }) {
  if (unsupportedReasons.length) {
    return `This version supports simple desktop electronic prototypes. ${unsupportedReasons.join(" ")} I can keep a reduced non-motion enclosure concept, but this needs manual engineering validation.`;
  }
  if (rejectedPatches.length) {
    return `I rejected ${rejectedPatches.length} unsafe or unsupported patch and kept the workspace state unchanged for those fields.`;
  }
  if (generationRequest) {
    return "I will regenerate the current revision from the structured ProductPlan and GeometrySpec.";
  }
  if (changes.length) {
    return `Updated the structured hardware plan: ${changes.slice(0, 5).join("; ")}.`;
  }
  return "I updated the ProductPlan context. Continue with a specific component, placement, shape, or generation request.";
}

function classifyIntent(lower, { unsupportedReasons, generationRequest, changes }) {
  if (unsupportedReasons.length) return "unsupported_request";
  if (generationRequest) return "generation_request";
  if (changes.some((item) => item.includes("placements."))) return "layout_or_placement_change";
  if (changes.some((item) => item.includes("enclosure.shapeProfile"))) return "shape_change";
  if (changes.some((item) => item.includes("added") || item.includes("removed"))) return "component_change";
  if (includesAny(lower, ["3d print", "3D 打印", "wall", "壁厚"])) return "manufacturing_constraint_change";
  return "requirement_change";
}
