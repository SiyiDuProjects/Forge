import { matchModules } from "./module_catalog.mjs";
import { createProductSpec } from "./product_spec.mjs";
import { estimateQuote } from "./quote_estimator.mjs";
import { evaluateRisk } from "./risk_gate.mjs";
import { interpretRequest } from "./text_interpreter.mjs";
import { unique } from "./utils.mjs";

export function createWorkspaceState({ workspaceId = "forge_demo_001", title = "3.5 inch desktop smart display" } = {}) {
  return {
    workspaceId,
    title,
    currentRevisionId: "",
    conversation: [],
    productPlan: createEmptyProductPlan(),
    componentSelections: [],
    componentDescriptors: [],
    geometrySpec: {},
    validationWarnings: [],
    generatedArtifacts: {},
    revisions: [],
    directEditingAllowed: false
  };
}

export function createEmptyProductPlan() {
  return {
    productType: "desktop_display",
    userIntent: "",
    requirements: {
      display: null,
      displaySizeInches: null,
      ambientSensor: false,
      usbC: null,
      battery: false,
      camera: false,
      speaker: false,
      buzzer: false,
      buttons: 0,
      desktopUse: true,
      wallMount: false,
      portable: false
    },
    constraints: {
      manufacturingMethod: "fdm_3d_printing",
      material: "pla",
      wallThicknessMm: 2.4,
      clearanceMm: 0.5,
      maxWidthMm: null,
      maxHeightMm: null,
      maxDepthMm: null,
      preferredStyle: "rounded_rect",
      finish: "woodgrain",
      priority: "readable_prototype"
    },
    geometryPreferences: {
      enclosure: {
        shapeProfile: "rounded_rect"
      },
      placements: {
        usb_c: { semanticPosition: "back" },
        buttons: { semanticPosition: "front_bottom" },
        ambient_sensor: { semanticPosition: "front_right" },
        speaker: { semanticPosition: "back_right" }
      },
      display: {
        tiltDeg: 0
      },
      dimensions: {
        widthScale: 1,
        heightScale: 1,
        depthDeltaMm: 0,
        bezelDeltaMm: 0
      }
    },
    assumptions: [
      "Using off-the-shelf development board.",
      "USB-C is used for low-voltage desktop power/data access.",
      "This is a prototype preview, not electrically validated."
    ],
    risks: []
  };
}

export function productPlanFromSpecModules({ spec = {}, modules = [], riskReport = {}, requestText = "" } = {}) {
  const moduleCapabilities = new Set(modules.flatMap((module) => module.capabilities || []));
  const screenSize = Number(spec.enclosure?.screen_size_in || 3.5);
  const finish = spec.enclosure?.finish || "woodgrain";
  const productPlan = createEmptyProductPlan();
  productPlan.productType = "desktop_display";
  productPlan.userIntent = requestText || spec.user_request || "Desktop display prototype";
  productPlan.requirements = {
    ...productPlan.requirements,
    display: true,
    displaySizeInches: screenSize,
    ambientSensor: moduleCapabilities.has("ambient_light_sensor"),
    usbC: true,
    battery: moduleCapabilities.has("battery"),
    camera: moduleCapabilities.has("camera"),
    speaker: moduleCapabilities.has("speaker"),
    desktopUse: true,
    portable: moduleCapabilities.has("battery"),
    wallMount: false
  };
  productPlan.constraints = {
    ...productPlan.constraints,
    finish,
    manufacturingMethod: "fdm_3d_printing",
    material: "pla",
    wallThicknessMm: Number(spec.enclosure?.wallThicknessMm || 2.4),
    clearanceMm: 0.5
  };
  productPlan.risks = (riskReport.items || []).map((item) => ({
    level: item.level || "warning",
    message: item.text || item.message || String(item)
  }));
  if (moduleCapabilities.has("camera")) {
    productPlan.risks.push({
      level: "warning",
      moduleId: "camera_module_basic",
      message: "Camera placement requires human privacy and product-safety review."
    });
  }
  if (moduleCapabilities.has("battery")) {
    productPlan.risks.push({
      level: "warning",
      moduleId: "battery_lipo_2000",
      message: "Battery placement requires human electrical and safety review."
    });
  }
  return productPlan;
}

export function applyPlanPatch(productPlan = createEmptyProductPlan(), planPatch = {}) {
  const next = clone(productPlan);
  for (const [path, value] of Object.entries(planPatch.set || {})) {
    setPath(next, path, value);
  }
  for (const path of planPatch.unset || []) {
    unsetPath(next, path);
  }
  for (const assumption of planPatch.appendAssumptions || []) {
    if (!next.assumptions.includes(assumption)) next.assumptions.push(assumption);
  }
  for (const risk of planPatch.appendRisks || []) {
    next.risks.push(risk);
  }
  return next;
}

export function applyComponentPatch(productPlan = createEmptyProductPlan(), componentPatch = {}) {
  const next = clone(productPlan);
  for (const item of componentPatch.add || []) {
    applyComponentChange(next, item, "add");
  }
  for (const item of componentPatch.remove || []) {
    applyComponentChange(next, item, "remove");
  }
  return next;
}

export function applyGeometryPreferencePatch(productPlan = createEmptyProductPlan(), geometryPatch = {}) {
  const next = clone(productPlan);
  for (const [path, value] of Object.entries(geometryPatch.set || {})) {
    if (path === "enclosure.shapeProfile") {
      setPath(next, "geometryPreferences.enclosure.shapeProfile", value);
      setPath(next, "constraints.preferredStyle", value);
      continue;
    }
    if (path.startsWith("enclosure.")) {
      setPath(next, `geometryPreferences.${path}`, value);
      continue;
    }
    if (path.startsWith("placements.")) {
      setPath(next, `geometryPreferences.${path}`, value);
      continue;
    }
    if (path.startsWith("display.")) {
      setPath(next, `geometryPreferences.${path}`, value);
      continue;
    }
    if (path.startsWith("dimensions.")) {
      setPath(next, `geometryPreferences.${path}`, value);
      continue;
    }
    setPath(next, `geometryPreferences.${path}`, value);
  }
  return next;
}

export function applyWorkspacePatches(productPlan = createEmptyProductPlan(), patches = []) {
  let next = clone(productPlan);
  const appliedPatches = [];
  const rejectedPatches = [];
  for (const patch of patches || []) {
    try {
      assertSafePatch(patch);
      if (patch.type === "plan_patch") next = applyPlanPatch(next, patch);
      else if (patch.type === "component_patch") next = applyComponentPatch(next, patch);
      else if (patch.type === "geometry_preference_patch") next = applyGeometryPreferencePatch(next, patch);
      else throw new Error(`Unsupported patch type: ${patch.type || "unknown"}`);
      appliedPatches.push(clone(patch));
    } catch (error) {
      rejectedPatches.push({
        patch: clone(patch),
        reason: error instanceof Error ? error.message : "Patch rejected"
      });
    }
  }
  return { productPlan: next, appliedPatches, rejectedPatches };
}

export function applyUserMessageToPlan({ currentProductPlan = createEmptyProductPlan(), currentConversation = [], userMessage = "", adapter = new MockPlanAdapter() } = {}) {
  const result = adapter.generatePlanPatch({
    currentProductPlan,
    currentConversation,
    userMessage
  });
  const nextProductPlan = applyPlanPatch(currentProductPlan, result.planPatch);
  return {
    ...result,
    productPlan: nextProductPlan,
    readyToGenerate: generationReadiness(nextProductPlan).ready
  };
}

export class MockPlanAdapter {
  generatePlanPatch({ currentProductPlan = createEmptyProductPlan(), userMessage = "" } = {}) {
    const interpreted = interpretRequest(userMessage, {});
    const lower = String(userMessage || "").toLowerCase();
    const set = {
      productType: "desktop_display",
      userIntent: [currentProductPlan.userIntent, userMessage].filter(Boolean).join("\n"),
      "requirements.display": true,
      "requirements.displaySizeInches": interpreted.screenSize || currentProductPlan.requirements?.displaySizeInches || 3.5,
      "requirements.ambientSensor": Boolean(currentProductPlan.requirements?.ambientSensor || interpreted.options.ambient),
      "requirements.usbC": true,
      "requirements.battery": Boolean(interpreted.options.battery),
      "requirements.camera": Boolean(interpreted.options.camera),
      "requirements.speaker": Boolean(currentProductPlan.requirements?.speaker || interpreted.options.speaker),
      "requirements.desktopUse": true,
      "constraints.finish": interpreted.finish || currentProductPlan.constraints?.finish || "woodgrain",
      "constraints.manufacturingMethod": "fdm_3d_printing",
      "constraints.material": "pla"
    };
    if (lower.includes("no battery") || lower.includes("without battery") || lower.includes("不要电池") || lower.includes("不需要电池")) set["requirements.battery"] = false;
    if (lower.includes("no camera") || lower.includes("without camera") || lower.includes("no battery or camera") || lower.includes("不要摄像头") || lower.includes("不需要摄像头")) set["requirements.camera"] = false;
    if (lower.includes("3d print") || lower.includes("3d printable") || lower.includes("3D 打印") || lower.includes("可打印")) {
      set["constraints.manufacturingMethod"] = "fdm_3d_printing";
    }
    const patched = applyPlanPatch(currentProductPlan, { set });
    const missing = generationReadiness(patched).missing;
    return {
      assistantMessage: missing.length
        ? `I can generate the prototype after these details are confirmed: ${missing.join(", ")}.`
        : "I have enough information to generate the prototype preview and shell files.",
      planPatch: { set },
      missingQuestions: missing,
      readyToGenerate: missing.length === 0
    };
  }
}

export class OpenAIPlanAdapter {
  constructor({ client = null } = {}) {
    this.client = client;
  }

  async generatePlanPatch() {
    if (!this.client) {
      throw new Error("OpenAIPlanAdapter requires an injected client.");
    }
    throw new Error("OpenAIPlanAdapter is reserved for future structured-output integration.");
  }
}

export function generationReadiness(productPlan = {}) {
  const missing = [];
  if (!productPlan.productType) missing.push("product archetype");
  if (productPlan.requirements?.display !== true) missing.push("display requirement");
  if (!productPlan.requirements?.displaySizeInches) missing.push("display size");
  if (productPlan.requirements?.usbC !== true) missing.push("power method");
  if (!productPlan.constraints?.manufacturingMethod) missing.push("manufacturing method");
  return {
    ready: missing.length === 0,
    missing
  };
}

export function productPlanToDraft({ productPlan = createEmptyProductPlan(), requestText = "" } = {}) {
  const interpreted = productPlanToInterpreted(productPlan, requestText);
  const modules = matchModules(interpreted);
  const riskReport = addStructuredRisks(evaluateRisk(interpreted, modules), productPlan);
  const quote = estimateQuote(interpreted, modules, riskReport);
  const spec = createProductSpec(interpreted, modules, riskReport, quote);
  spec.product_archetype = productPlan.productType || "desktop_display";
  spec.product_plan_state = clone(productPlan);
  spec.enclosure = {
    ...spec.enclosure,
    shape_profile: productPlan.geometryPreferences?.enclosure?.shapeProfile
      || productPlan.constraints?.preferredStyle
      || "rounded_rect",
    wall_thickness_mm: productPlan.constraints?.wallThicknessMm || 2.4,
    display_tilt_deg: productPlan.geometryPreferences?.display?.tiltDeg || 0
  };
  spec.geometry_preferences = clone(productPlan.geometryPreferences || {});
  spec.input_controls = {
    buttons: Number(productPlan.requirements?.buttons || 0),
    buzzer: Boolean(productPlan.requirements?.buzzer)
  };
  return {
    requestText: interpreted.requestText,
    interpreted,
    modules,
    riskReport,
    quote,
    spec
  };
}

export function createRevisionDiff({ previousRevision = null, nextRevision = null, previousProductPlan = null, nextProductPlan = null } = {}) {
  const fromPlan = previousProductPlan || previousRevision?.productPlanSnapshot || previousRevision?.geometrySpec?.productPlan || null;
  const toPlan = nextProductPlan || nextRevision?.productPlanSnapshot || nextRevision?.geometrySpec?.productPlan || null;
  const changes = [];
  if (!fromPlan || !toPlan) {
    return {
      fromRevision: previousRevision?.revisionId || "",
      toRevision: nextRevision?.revisionId || "",
      changes: nextRevision ? [{ type: "revision_created" }] : []
    };
  }

  diffScalar(changes, "product_type_changed", "productType", fromPlan.productType, toPlan.productType);
  diffScalar(changes, "shape_changed", "shapeProfile", shapeProfile(fromPlan), shapeProfile(toPlan));
  diffScalar(changes, "manufacturing_constraint_changed", "manufacturingMethod", fromPlan.constraints?.manufacturingMethod, toPlan.constraints?.manufacturingMethod);
  diffScalar(changes, "manufacturing_constraint_changed", "wallThicknessMm", fromPlan.constraints?.wallThicknessMm, toPlan.constraints?.wallThicknessMm);
  diffScalar(changes, "dimension_changed", "displayTiltDeg", fromPlan.geometryPreferences?.display?.tiltDeg || 0, toPlan.geometryPreferences?.display?.tiltDeg || 0);

  const requirementKeys = ["display", "displaySizeInches", "ambientSensor", "usbC", "battery", "camera", "speaker", "buzzer", "buttons"];
  for (const key of requirementKeys) {
    diffScalar(changes, "requirement_changed", key, fromPlan.requirements?.[key], toPlan.requirements?.[key]);
  }

  const fromComponents = componentSet(fromPlan);
  const toComponents = componentSet(toPlan);
  for (const componentType of [...toComponents.keys()].filter((key) => !fromComponents.has(key))) {
    changes.push({
      type: "component_added",
      componentType,
      quantity: toComponents.get(componentType)
    });
  }
  for (const componentType of [...fromComponents.keys()].filter((key) => !toComponents.has(key))) {
    changes.push({
      type: "component_removed",
      componentType,
      quantity: fromComponents.get(componentType)
    });
  }
  for (const [componentType, quantity] of toComponents) {
    if (fromComponents.has(componentType) && fromComponents.get(componentType) !== quantity) {
      changes.push({
        type: "component_quantity_changed",
        componentType,
        from: fromComponents.get(componentType),
        to: quantity
      });
    }
  }

  const placementKeys = unique([
    ...Object.keys(fromPlan.geometryPreferences?.placements || {}),
    ...Object.keys(toPlan.geometryPreferences?.placements || {})
  ]);
  for (const target of placementKeys) {
    const from = fromPlan.geometryPreferences?.placements?.[target]?.semanticPosition;
    const to = toPlan.geometryPreferences?.placements?.[target]?.semanticPosition;
    if (from !== to) {
      changes.push({
        type: "placement_changed",
        target,
        from,
        to
      });
    }
  }

  const fromWarnings = warningKeys(previousRevision);
  const toWarnings = warningKeys(nextRevision);
  for (const warning of [...toWarnings].filter((item) => !fromWarnings.has(item))) {
    changes.push({ type: "warning_added", warning });
  }
  for (const warning of [...fromWarnings].filter((item) => !toWarnings.has(item))) {
    changes.push({ type: "warning_removed", warning });
  }
  if (previousRevision?.modelArtifacts?.status !== nextRevision?.modelArtifacts?.status) {
    changes.push({
      type: "artifacts_regenerated",
      from: previousRevision?.modelArtifacts?.status || "",
      to: nextRevision?.modelArtifacts?.status || ""
    });
  }

  return {
    fromRevision: previousRevision?.revisionId || "",
    toRevision: nextRevision?.revisionId || "",
    changes
  };
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function productPlanToInterpreted(productPlan, requestText) {
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const dataSources = [];
  if (productPlan.productType === "desk_clock") dataSources.push("calendar");
  if (productPlan.productType === "digital_photo_frame") dataSources.push("photos");
  if (productPlan.productType === "sensor_display" || requirements.ambientSensor) dataSources.push("api_metrics");
  if (dataSources.length === 0) dataSources.push("photos", "weather");
  const functions = dataSources.map((source) => ({
    photos: "photo_slideshow",
    weather: "weather_card",
    calendar: "calendar_view",
    api_metrics: "metrics_dashboard"
  }[source] || source));
  if (productPlan.productType === "desk_clock") functions.push("clock_display");
  if (requirements.buzzer) functions.push("audio_alert");

  return {
    requestText: requestText || productPlan.userIntent || "Desktop display prototype",
    productType: productPlan.productType === "manual_expansion" ? "prototype" : "display",
    screenSize: Number(requirements.displaySizeInches || 3.5),
    finish: constraints.finish || "woodgrain",
    options: {
      speaker: Boolean(requirements.speaker || requirements.buzzer),
      buzzer: Boolean(requirements.buzzer),
      buttons: Number(requirements.buttons || 0),
      ambient: Boolean(requirements.ambientSensor),
      motor: Boolean(requirements.motionStructure),
      camera: Boolean(requirements.camera),
      battery: Boolean(requirements.battery)
    },
    dataSources: unique(dataSources),
    functions: unique(functions)
  };
}

function addStructuredRisks(riskReport, productPlan) {
  const items = [...(riskReport.items || [])];
  for (const risk of productPlan.risks || []) {
    items.push({
      level: risk.level || "warn",
      text: risk.message || risk.text || String(risk),
      moduleId: risk.moduleId || ""
    });
  }
  return {
    ...riskReport,
    items
  };
}

function applyComponentChange(productPlan, item = {}, mode) {
  const componentType = normalizeComponentType(item.componentType || item.type);
  const quantity = Number.isFinite(Number(item.quantity)) ? Math.max(1, Number(item.quantity)) : 1;
  if (componentType === "button") {
    productPlan.requirements.buttons = mode === "remove" ? 0 : quantity;
    return;
  }
  if (componentType === "buzzer") {
    productPlan.requirements.buzzer = mode === "add";
    productPlan.requirements.speaker = productPlan.requirements.speaker || mode === "add";
    return;
  }
  if (componentType === "speaker") {
    productPlan.requirements.speaker = mode === "add";
    if (mode === "remove") productPlan.requirements.buzzer = false;
    return;
  }
  if (componentType === "ambient_sensor") {
    productPlan.requirements.ambientSensor = mode === "add";
    return;
  }
  if (componentType === "usb_c") {
    productPlan.requirements.usbC = mode === "add";
    return;
  }
  if (componentType === "camera") {
    productPlan.requirements.camera = mode === "add";
    return;
  }
  if (componentType === "battery") {
    productPlan.requirements.battery = mode === "add";
    productPlan.requirements.portable = mode === "add";
    return;
  }
  if (componentType === "display") {
    productPlan.requirements.display = mode === "add";
  }
}

function normalizeComponentType(value) {
  const normalized = String(value || "").toLowerCase().replace(/[-\s]+/g, "_");
  const map = {
    buttons: "button",
    push_button: "button",
    push_buttons: "button",
    ambient: "ambient_sensor",
    sensor: "ambient_sensor",
    ambient_light_sensor: "ambient_sensor",
    usb: "usb_c",
    usbc: "usb_c",
    usb_c_power: "usb_c",
    sound: "speaker",
    audio: "speaker"
  };
  return map[normalized] || normalized;
}

function assertSafePatch(patch = {}) {
  const paths = [
    ...Object.keys(patch.set || {}),
    ...(patch.unset || [])
  ];
  for (const path of paths) {
    if (isUnsafePath(path)) throw new Error(`Unsafe patch path: ${path}`);
  }
}

function isUnsafePath(path) {
  return String(path || "").split(".").some((part) => ["__proto__", "prototype", "constructor"].includes(part));
}

function setPath(target, path, value) {
  if (isUnsafePath(path)) throw new Error(`Unsafe patch path: ${path}`);
  const parts = String(path).split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
}

function unsetPath(target, path) {
  if (isUnsafePath(path)) throw new Error(`Unsafe patch path: ${path}`);
  const parts = String(path).split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") return;
    cursor = cursor[part];
  }
  delete cursor[parts.at(-1)];
}

function diffScalar(changes, type, field, from, to) {
  if (from === to) return;
  changes.push({ type, field, from, to });
}

function shapeProfile(productPlan) {
  return productPlan.geometryPreferences?.enclosure?.shapeProfile
    || productPlan.constraints?.preferredStyle
    || "rounded_rect";
}

function componentSet(productPlan) {
  const requirements = productPlan.requirements || {};
  const components = new Map();
  if (requirements.display !== false) components.set("display", 1);
  if (requirements.usbC !== false) components.set("usb_c", 1);
  if (requirements.ambientSensor) components.set("ambient_sensor", 1);
  if (requirements.speaker) components.set("speaker", 1);
  if (requirements.buzzer) components.set("buzzer", 1);
  if (requirements.buttons) components.set("button", Number(requirements.buttons));
  if (requirements.camera) components.set("camera", 1);
  if (requirements.battery) components.set("battery", 1);
  return components;
}

function warningKeys(revision) {
  return new Set([
    ...(revision?.riskReport?.items || []).filter((item) => item.level === "warn" || item.level === "block").map((item) => item.text || item.message || ""),
    ...(revision?.geometryValidation?.issues || []).filter((item) => item.level === "warn" || item.level === "block").map((item) => item.code || item.message || "")
  ].filter(Boolean));
}
