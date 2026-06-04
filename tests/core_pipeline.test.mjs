import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT, JOB_CAPABILITY, PRODUCT_PLAN_STATUS, RISK_STATUS, SUPPORTED_LANGUAGES, WORKBENCH_CHAIN } from "../src/contracts/workbench_contract.mjs";
import { createGenerationJob } from "../src/core/jobs.mjs";
import { createGeometrySpec, generateModelArtifacts } from "../src/core/geometry_generation.mjs";
import { createDeviceConfig, createDraft, listCatalogModules, submitReview } from "../src/core/pipeline.mjs";
import { addProductPlanTurn, createProductPlan, submitProductPlanReview } from "../src/core/product_plan.mjs";

async function readGlbJson(localPath) {
  const buffer = await readFile(localPath);
  assert.equal(buffer.slice(0, 4).toString("utf8"), "glTF");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a);
  return JSON.parse(buffer.slice(20, 20 + jsonLength).toString("utf8"));
}

test("draft pipeline creates a reviewable woodgrain desktop display packet", () => {
  const draft = createDraft({
    requestText:
      "Small retro woodgrain desktop screen with photos, weather, tomorrow calendar, GitHub build status, USB-C power, and night dimming."
  });

  assert.equal(draft.interpreted.productType, "display");
  assert.equal(draft.interpreted.screenSize, 3.5);
  assert.equal(draft.interpreted.finish, "woodgrain");
  assert.equal(draft.riskReport.blocked, false);
  assert.equal(draft.riskReport.status, RISK_STATUS.READY);
  assert.ok(draft.modules.some((module) => module.id === "core.y_core_lite"));
  assert.ok(draft.modules.some((module) => module.id === "sensor.ambient_light"));
  assert.ok(draft.modules.some((module) => module.name === "Woodgrain 3D printed shell"));
  assert.equal(draft.spec.product_type, "ai_desktop_display");
  assert.equal(draft.spec.enclosure.method, "parameterized_3d_printed_shell");
  assert.equal(draft.spec.enclosure.standardization, "3d_print_only");
  assert.equal(draft.spec.power, "usb_c_low_voltage");
  assert.match(draft.quote.range, /^\$\d+-\$\d+$/);
});

test("camera and battery requests stay reviewable but require human risk review", async () => {
  const draft = createDraft({
    requestText: "A portable wireless display with camera recognition and battery power."
  });

  assert.equal(draft.interpreted.options.camera, true);
  assert.equal(draft.interpreted.options.battery, true);
  assert.equal(draft.riskReport.blocked, false);
  assert.equal(draft.riskReport.status, RISK_STATUS.READY);
  assert.equal(draft.riskReport.reviewLevel, 3);
  assert.ok(draft.riskReport.items.some((item) => item.level === "warn" && item.text.includes("Camera")));
  assert.ok(draft.riskReport.items.some((item) => item.level === "warn" && item.text.includes("Battery")));
  assert.ok(draft.modules.some((module) => module.id === "vision.camera_request" && module.status === "review"));
  assert.ok(draft.modules.some((module) => module.id === "power.battery_request" && module.status === "review"));

  const submission = await submitReview({ draft, behaviorConfig: {} });
  assert.equal(submission.accepted, true);
  assert.equal(submission.status, "queued_for_human_review");
});

test("Chinese camera and battery requests stay reviewable with parsed finish and size", () => {
  const draft = createDraft({
    requestText: "做一个石墨黑 5 英寸便携桌面屏，加入摄像头识别和电池供电。"
  });

  assert.equal(draft.interpreted.screenSize, 5);
  assert.equal(draft.interpreted.finish, "graphite");
  assert.equal(draft.interpreted.options.camera, true);
  assert.equal(draft.interpreted.options.battery, true);
  assert.equal(draft.riskReport.blocked, false);
  assert.equal(draft.riskReport.status, RISK_STATUS.READY);
  assert.equal(draft.riskReport.reviewLevel, 3);
  assert.ok(draft.modules.some((module) => module.id === "vision.camera_request" && module.status === "review"));
  assert.ok(draft.modules.some((module) => module.id === "power.battery_request" && module.status === "review"));
});

test("servo motion is blocked from the standard desktop screen path", () => {
  const draft = createDraft({
    requestText: "A friendly companion display with weather, speaker alerts, and a small servo motion."
  });

  assert.equal(draft.interpreted.productType, "companion");
  assert.equal(draft.interpreted.options.motor, true);
  assert.equal(draft.riskReport.blocked, true);
  assert.equal(draft.riskReport.reviewLevel, 4);
  assert.ok(draft.modules.some((module) => module.id === "motion.mini_servo"));
});

test("Chinese motion wording is blocked from the standard desktop screen path", () => {
  const draft = createDraft({
    requestText: "做一个 5 英寸桌面屏，再加一个小舵机，让屏幕可以轻微转动。"
  });

  assert.equal(draft.interpreted.options.motor, true);
  assert.equal(draft.riskReport.blocked, true);
  assert.equal(draft.riskReport.reviewLevel, 4);
  assert.ok(draft.modules.some((module) => module.id === "motion.mini_servo"));
});

test("Chinese demo request parses ambient dimming and local content sources", () => {
  const draft = createDraft({
    requestText: "小型木纹桌面屏，可以显示家庭照片、天气和明天日程，3.5 英寸，USB-C 供电，夜间自动变暗。"
  });

  assert.equal(draft.interpreted.screenSize, 3.5);
  assert.equal(draft.interpreted.finish, "woodgrain");
  assert.equal(draft.interpreted.options.ambient, true);
  assert.deepEqual(draft.interpreted.dataSources, ["photos", "weather", "calendar"]);
  assert.ok(draft.modules.some((module) => module.id === "sensor.ambient_light"));
});

test("firmware rule generation turns behavior text into preview config", () => {
  const draft = createDraft({
    requestText: "Desktop display with photos, weather, and GitHub build status."
  });
  const { config } = createDeviceConfig({
    spec: draft.spec,
    behaviorText: "Weekday mornings show weather, afternoons show photos, evenings show tomorrow calendar, and GitHub build failures alert."
  });

  assert.equal(config.version, "draft");
  assert.ok(config.capability_check.includes("screen"));
  assert.ok(config.rules.some((rule) => rule.window === "07:00-11:00" && rule.action === "display.weather_card"));
  assert.ok(config.rules.some((rule) => rule.trigger === "github.build_failed"));
});

test("catalog and API contract expose stable integration handles", () => {
  const modules = listCatalogModules();
  assert.ok(modules.some((module) => module.id === "core.y_core_lite"));
  assert.ok(modules.every((module) => module.id && module.name && module.status));
  assert.deepEqual(SUPPORTED_LANGUAGES, ["zh", "en"]);
  assert.ok(WORKBENCH_CHAIN.includes("run_guardrails"));
  assert.ok(WORKBENCH_CHAIN.includes("build_geometry_spec"));
  assert.ok(WORKBENCH_CHAIN.includes("draft_model_preview"));
  assert.ok(WORKBENCH_CHAIN.includes("generate_model_artifacts"));
  assert.ok(WORKBENCH_CHAIN.includes("validate_geometry"));
  assert.ok(WORKBENCH_CHAIN.includes("draft_electronics_layout"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/pipeline/draft"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/plans"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/model/generate"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/geometry/generate"));
});

test("frontend keeps Chinese and English language assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.match(packageJson, /"three"/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /"three": "\/vendor\/three\/three\.module\.js"/);
  assert.match(html, /type="module" src="app\.js/);
  assert.match(html, /id="languageSelect"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="en"/);
  assert.match(app, /GLTFLoader/);
  assert.match(app, /OrbitControls/);
  assert.match(app, /data-preview-engine/);
  assert.match(app, /previewEngineForRevision/);
  assert.match(app, /正在加载 3D 模型/);
  assert.match(app, /真实 3D 预览已加载/);
  assert.match(app, /3D 模型加载失败/);
  assert.match(html, /对话生成/);
  assert.match(html, /提交审核下单/);
  assert.match(html, /ProductPlan/);
  assert.match(app, /木纹桌面屏/);
  assert.match(app, /Woodgrain desk display/);
  assert.match(app, /标准 3D 打印外壳/);
  assert.match(app, /Standard 3D printed shell/);
  assert.match(app, /Parts list \(BOM\)/);
  assert.match(app, /Prototype structure preview \(3D\)/);
  assert.match(app, /Drag to rotate, wheel to zoom, Shift-drag to pan/);
  assert.match(app, /外观层/);
  assert.match(app, /元器件层/);
  assert.match(app, /Appearance/);
  assert.match(app, /Components/);
  assert.match(app, /opacity: componentsVisible \? 0\.18 : 1/);
  assert.match(app, /transparent: componentsVisible/);
  assert.match(app, /the components layer makes the shell transparent/);
  assert.match(app, /生成模型/);
  assert.match(app, /demoConversationTurns/);
  assert.match(app, /可以了，生成模型。/);
  assert.match(app, /Ready, generate model\./);
  assert.match(app, /waiting for generation/);
  assert.match(app, /placed parts/);
  assert.match(app, /只读 3D 预览/);
  assert.match(app, /3D 模型已生成/);
  assert.match(app, /read-only 3D preview/);
  assert.match(app, /3D model generated/);
  assert.match(app, /continue the conversation and generate a new revision/);
  assert.doesNotMatch(app, /爆炸视图|Exploded/);
  assert.doesNotMatch(app, /非最终 CAD|not final CAD|SolidWorks handoff|SolidWorks 后处理|STEP is for internal engineering|GLB \/ STL \/ STEP/);
  assert.match(app, /SUPPORTED_LANGUAGES|langZh/);
});

test("demo transcript creates multiple revisions before generating the 3D model", () => {
  const demoTurns = [
    "我想做一个小型木纹桌面屏，可以显示家庭照片、天气和明天日程，3.5 英寸，USB-C 供电。",
    "加一个环境光传感器，夜间自动变暗，还是保持桌面 USB-C 供电。",
    "结构上先用标准 3D 打印外壳，前面要屏幕开孔，后面留 USB-C 开口。",
    "可以了，生成模型。"
  ];
  let { productPlan } = createProductPlan({
    initialMessage: demoTurns[0],
    language: "zh"
  });
  let result = null;
  for (const message of demoTurns.slice(1)) {
    result = addProductPlanTurn({
      planId: productPlan.planId,
      message
    });
    productPlan = result.productPlan;
  }

  assert.equal(productPlan.conversation.length, 8);
  assert.equal(productPlan.revisions.length, 4);
  assert.equal(result.revision.generationStatus, "generated");
  assert.equal(result.revision.modelArtifacts.status, "generated");
  assert.ok(result.revision.modelArtifacts.artifacts.glb.localPath);
  assert.ok(result.revision.modelArtifacts.artifacts.glb.url);
  assert.equal(result.revision.geometrySpec.modules.length >= 4, true);
  assert.doesNotMatch(
    productPlan.conversation.filter((turn) => turn.role === "assistant").map((turn) => turn.text).join("\n"),
    /GLB|STL|STEP|CAD|SolidWorks/
  );
});

test("ProductPlan creates revisions and preview outputs", () => {
  const { productPlan, revision, assistantMessage } = createProductPlan({
    initialMessage: "Small woodgrain desktop screen for weather and photos, 3.5 inch, USB-C powered.",
    language: "en"
  });

  assert.match(assistantMessage.text, /3D/);
  assert.doesNotMatch(assistantMessage.text, /GLB|STL|STEP|CAD|SolidWorks/);
  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED);
  assert.equal(productPlan.currentRevisionId, revision.revisionId);
  assert.equal(productPlan.revisions.length, 1);
  assert.ok(revision.modelPreview.viewerType);
  assert.ok(revision.geometrySpec);
  assert.equal(revision.geometrySpec.userViewer.disallowed.includes("drag_parts"), true);
  assert.equal(revision.geometryValidation.canGenerateArtifacts, true);
  assert.equal(revision.generationStatus, "pending_confirmation");
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
  assert.equal(revision.modelArtifacts.artifacts.glb, null);
  assert.equal(revision.modelArtifacts.artifacts.stl, null);
  assert.equal(revision.modelArtifacts.artifacts.step, null);
  assert.ok(revision.modelPreview.assets.preview.assetId);
  assert.ok(revision.electronicsLayout.placements.length > 0);
  assert.equal(revision.quoteEstimate.pricingModel, "pre_review_estimate_with_assumptions");
  assert.ok(!revision.quoteEstimate.tiers);

  const updated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Make the finish graphite and keep it 5 inch."
  });
  assert.equal(updated.productPlan.revisions.length, 2);
  assert.notEqual(updated.revision.revisionId, revision.revisionId);
  assert.equal(updated.revision.spec.enclosure.screen_size_in, 5);
  assert.equal(updated.revision.spec.enclosure.finish, "graphite");
  assert.equal(updated.revision.generationStatus, "pending_confirmation");
  assert.equal(updated.revision.modelArtifacts.artifacts.glb, null);

  const generated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Generate model"
  });
  assert.doesNotMatch(generated.assistantMessage.text, /GLB|STL|STEP|CAD|SolidWorks/);
  assert.equal(generated.revision.generationStatus, "generated");
  assert.equal(generated.revision.modelArtifacts.status, "generated");
  assert.ok(generated.revision.modelArtifacts.artifacts.glb.localPath);
  assert.ok(generated.revision.modelArtifacts.artifacts.stl.localPath);
  assert.ok(generated.revision.modelArtifacts.artifacts.step.localPath);
});

test("Chinese and English confirmation turns generate model artifacts", () => {
  const zh = createProductPlan({
    initialMessage: "小型木纹桌面屏，可以显示照片和天气，3.5 英寸，USB-C 供电。"
  });
  assert.equal(zh.revision.generationStatus, "pending_confirmation");
  const zhGenerated = addProductPlanTurn({
    planId: zh.productPlan.planId,
    message: "现在造一下，生成模型"
  });
  assert.equal(zhGenerated.revision.generationStatus, "generated");

  const en = createProductPlan({
    initialMessage: "Small graphite desktop display with weather, 5 inch.",
    language: "en"
  });
  assert.equal(en.revision.generationStatus, "pending_confirmation");
  const enGenerated = addProductPlanTurn({
    planId: en.productPlan.planId,
    message: "build it, this is ready"
  });
  assert.equal(enGenerated.revision.generationStatus, "generated");
});

test("Chinese ProductPlan updates use the latest explicit size and review risks", () => {
  const { productPlan } = createProductPlan({
    initialMessage: "小型木纹桌面屏，可以显示照片和天气，3.5 英寸，USB-C 供电。"
  });

  const updated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "改成石墨黑 5 英寸便携桌面屏，加入摄像头识别和电池供电。"
  });

  assert.equal(updated.productPlan.status, PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED);
  assert.equal(updated.revision.spec.enclosure.screen_size_in, 5);
  assert.equal(updated.revision.spec.enclosure.finish, "graphite");
  assert.ok(updated.revision.modules.some((module) => module.id === "vision.camera_request"));
  assert.ok(updated.revision.modules.some((module) => module.id === "power.battery_request"));
  assert.ok(updated.assistantMessage.text.includes("人工审核项"));
});

test("non-standard products become manual expansion drafts", () => {
  const { productPlan, revision } = createProductPlan({
    initialMessage: "I want a smart water bottle with reminders and a glowing cap."
  });

  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT);
  assert.equal(revision.productCategory, "manual_expansion");
});

test("camera and battery display plans remain standard with review risks", () => {
  const { productPlan, revision } = createProductPlan({
    initialMessage: "A portable 5 inch desktop screen with camera recognition and battery power."
  });

  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED);
  assert.equal(revision.productCategory, "standard_desktop_display");
  assert.ok(revision.riskReport.items.some((item) => item.level === "warn" && item.text.includes("Camera")));
  assert.ok(revision.riskReport.items.some((item) => item.level === "warn" && item.text.includes("Battery")));
  assert.ok(revision.electronicsLayout.conflicts.some((item) => item.level === "warn" && item.item === "Camera request"));
  assert.ok(revision.electronicsLayout.conflicts.some((item) => item.level === "warn" && item.item === "Battery request"));
  assert.equal(revision.geometryValidation.status, "passed_with_warnings");
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
  const generated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "生成模型"
  });
  assert.equal(generated.revision.geometryValidation.status, "passed_with_warnings");
  assert.equal(generated.revision.modelArtifacts.status, "generated");
});

test("generation jobs expose model, layout, and quote outputs", async () => {
  const draft = createDraft({
    requestText: "Small woodgrain desktop display with photos and weather, 3.5 inch."
  });
  const modelJob = createGenerationJob({
    capability: JOB_CAPABILITY.MODEL_GENERATION,
    input: {
      spec: draft.spec,
      modules: draft.modules
    }
  });
  assert.equal(modelJob.status, "succeeded");
  assert.equal(modelJob.output.modelPreview.viewerType, "interactive_glb_preview");
  assert.equal(modelJob.output.geometryValidation.canGenerateArtifacts, true);
  assert.ok(modelJob.output.geometrySpec.modules.some((module) => module.role === "front_display"));
  assert.ok(modelJob.output.modelArtifacts.artifacts.glb);
  assert.ok(modelJob.output.modelArtifacts.artifacts.stl);
  assert.ok(modelJob.output.modelArtifacts.artifacts.step);
  assert.equal((await readFile(modelJob.output.modelArtifacts.artifacts.glb.localPath)).slice(0, 4).toString("utf8"), "glTF");
  const glbJson = await readGlbJson(modelJob.output.modelArtifacts.artifacts.glb.localPath);
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.standard_desktop_display_shell"));
  assert.ok(glbJson.nodes.filter((node) => node.name?.startsWith("module.")).length >= 3);
  assert.ok(glbJson.nodes.some((node) => node.name?.startsWith("interface.")));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.coarse_cable_paths"));
  assert.equal(glbJson.extras.placedModuleCount >= 3, true);
  assert.equal(glbJson.extras.directEditingAllowed, false);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.stl.localPath, "utf8"), /solid forge_standard_shell/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.step.localPath, "utf8"), /ISO-10303-21/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.step.localPath, "utf8"), /module_placements/);

  const pendingModelJob = createGenerationJob({
    capability: JOB_CAPABILITY.MODEL_GENERATION,
    input: {
      spec: draft.spec,
      modules: draft.modules,
      generateArtifacts: false
    }
  });
  assert.equal(pendingModelJob.output.modelArtifacts.status, "pending_confirmation");
  assert.equal(pendingModelJob.output.modelArtifacts.artifacts.glb, null);

  const layoutJob = createGenerationJob({
    capability: JOB_CAPABILITY.ELECTRONICS_LAYOUT,
    input: {
      spec: draft.spec,
      modules: draft.modules,
      modelJob
    }
  });
  assert.ok(layoutJob.output.electronicsLayout.placements.some((item) => item.role === "front_display"));
  assert.ok(layoutJob.output.electronicsLayout.conflicts.length > 0);

  const quoteJob = createGenerationJob({
    capability: JOB_CAPABILITY.QUOTE_ESTIMATE,
    input: { draft }
  });
  assert.match(quoteJob.output.quoteEstimate.range, /^\$\d+-\$\d+$/);
  assert.equal(quoteJob.output.quoteEstimate.requiresHumanQuote, true);
});

test("geometry spec is deterministic and blocks missing module geometry", async () => {
  const draft = createDraft({
    requestText: "Small graphite 5 inch desktop display with weather."
  });
  const first = createGeometrySpec({
    spec: draft.spec,
    modules: draft.modules,
    riskReport: draft.riskReport
  });
  const second = createGeometrySpec({
    spec: draft.spec,
    modules: draft.modules,
    riskReport: draft.riskReport
  });
  assert.deepEqual(first, second);

  const blockedSpec = createGeometrySpec({
    spec: draft.spec,
    modules: [
      ...draft.modules,
      {
        id: "sensor.unmodeled",
        category: "Sensor",
        name: "Unmodeled sensor",
        capabilities: ["sensor"],
        status: "approved"
      }
    ],
    riskReport: draft.riskReport
  });
  const blocked = generateModelArtifacts({
    geometrySpec: blockedSpec,
    revisionId: "test-missing-geometry"
  });
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.validation.canGenerateArtifacts, false);
  assert.equal(blocked.artifacts.glb, null);
  assert.equal(blocked.artifacts.stl, null);
  assert.equal(blocked.artifacts.step, null);
  assert.match(await readFile(blocked.artifacts.validationReport.localPath, "utf8"), /missing_module_geometry/);
});

test("ProductPlan review submission writes a human review packet", async () => {
  const { productPlan } = createProductPlan({
    initialMessage: "Small woodgrain desktop screen for weather and photos, 3.5 inch, USB-C powered."
  });
  const { revision } = addProductPlanTurn({
    planId: productPlan.planId,
    message: "生成模型"
  });
  const { submission } = await submitProductPlanReview({
    planId: productPlan.planId,
    revisionId: revision.revisionId,
    contactInfo: {
      name: "Internal Tester",
      email: "tester@example.com"
    }
  });

  assert.equal(submission.accepted, true);
  assert.equal(submission.paymentStatus, "not_collected");
  assert.equal(submission.productionStatus, "not_started");
  assert.match(submission.humanReviewNotice, /人工审核/);

  const packet = JSON.parse(await readFile(`data/reviews/${submission.reviewId}.json`, "utf8"));
  assert.equal(packet.contactInfo.email, "tester@example.com");
  assert.equal(packet.revision.revisionId, revision.revisionId);
  assert.ok(packet.jobs.some((job) => job.capability === JOB_CAPABILITY.MODEL_GENERATION));
  assert.ok(packet.assets.length > 0);
  assert.ok(packet.geometrySpec);
  assert.equal(packet.geometryValidation.canGenerateArtifacts, true);
  assert.ok(packet.modelArtifacts.artifacts.glb.localPath);
  assert.ok(packet.modelArtifacts.artifacts.stl.localPath);
  assert.ok(packet.modelArtifacts.artifacts.step.localPath);
  assert.ok(packet.quote.range);
  assert.ok(packet.quoteAssumptions.length > 0);
  assert.ok(packet.riskReport.items.length > 0);
  assert.equal(packet.paymentStatus, "not_collected");
  assert.equal(packet.productionStatus, "not_started");
});
