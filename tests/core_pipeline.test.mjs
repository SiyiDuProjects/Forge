import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT, JOB_CAPABILITY, PRODUCT_PLAN_STATUS, RISK_STATUS, SUPPORTED_LANGUAGES, WORKBENCH_CHAIN } from "../src/contracts/workbench_contract.mjs";
import { createGenerationJob } from "../src/core/jobs.mjs";
import { createGeometrySpec, generateModelArtifacts } from "../src/core/geometry_generation.mjs";
import { createDeviceConfig, createDraft, listCatalogModules, submitReview } from "../src/core/pipeline.mjs";
import { addProductPlanTurn, createProductPlan, revertProductPlanRevision, submitProductPlanReview } from "../src/core/product_plan.mjs";
import { processUserTurn } from "../src/core/sparker_orchestrator.mjs";
import { resolveComponentAsset } from "../src/core/component_asset_resolver.mjs";
import { listComponentDescriptorValidation, listComponentDescriptors } from "../src/core/component_library.mjs";
import { validateComponentDescriptorV2 } from "../src/core/component_descriptor_schema.mjs";
import { selectComponents } from "../src/core/component_selection.mjs";
import { applyUserMessageToPlan, applyWorkspacePatches, createEmptyProductPlan } from "../src/core/workspace_state.mjs";

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
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/plans/:planId/revert"));
  assert.ok(API_CONTRACT.some((route) => route.method === "GET" && route.path === "/api/workspaces"));
  assert.ok(API_CONTRACT.some((route) => route.method === "GET" && route.path === "/api/workspaces/:workspaceId/plan"));
});

test("ComponentDescriptor v2 assets validate and resolve to proxy assets", async () => {
  const descriptors = listComponentDescriptors();
  const ids = descriptors.map((descriptor) => descriptor.id);
  for (const id of [
    "display_3_5_tft",
    "core_board_esp32_s3",
    "usb_c_breakout",
    "ambient_sensor_basic",
    "speaker_20mm",
    "camera_module_basic",
    "battery_lipo_2000",
    "battery_18650_holder",
    "button_6mm"
  ]) {
    assert.ok(ids.includes(id), `${id} descriptor should exist`);
    assert.match(await readFile(new URL(`../src/core/component_assets/${id}/sources.md`, import.meta.url), "utf8"), /proxy seed/);
  }

  for (const descriptor of descriptors) {
    const validation = validateComponentDescriptorV2(descriptor, { expectedId: descriptor.id });
    assert.equal(validation.valid, true, descriptor.id);
    assert.equal(descriptor.assetQuality, "mechanical_proxy");
    assert.equal(descriptor.validationStatus, "unverified_proxy");
    assert.ok(descriptor.dimensionsMm.width > 0);
    assert.ok(Array.isArray(descriptor.connectors));
  }

  const descriptorValidation = listComponentDescriptorValidation();
  assert.ok(descriptorValidation.every((item) => item.valid));
  assert.equal(descriptors.find((item) => item.id === "camera_module_basic").risk.requiresManualValidation, true);
  assert.equal(descriptors.find((item) => item.id === "battery_lipo_2000").risk.requiresManualValidation, true);

  const preview = resolveComponentAsset("display_3_5_tft", "preview");
  assert.equal(preview.resolvedType, "procedural_visual_proxy");
  assert.equal(preview.assetQuality, "mechanical_proxy");
  assert.equal(preview.validationStatus, "unverified_proxy");
  const mechanical = resolveComponentAsset("display_3_5_tft", "mechanical");
  assert.equal(mechanical.resolvedType, "procedural_mechanical_proxy");
  const validation = resolveComponentAsset("display_3_5_tft", "validation");
  assert.equal(validation.resolvedType, "descriptor_data");
  const manufacturing = resolveComponentAsset("display_3_5_tft", "manufacturing");
  assert.equal(manufacturing.resolvedType, "descriptor_driven_shell_features_only");
});

test("mock conversation patches ProductPlan and finite component selection", () => {
  let productPlan = createEmptyProductPlan();
  let result = applyUserMessageToPlan({
    currentProductPlan: productPlan,
    userMessage: "I want to make a small desktop smart display."
  });
  productPlan = result.productPlan;
  assert.equal(productPlan.requirements.display, true);
  assert.equal(productPlan.requirements.usbC, true);
  assert.equal(result.readyToGenerate, true);

  result = applyUserMessageToPlan({
    currentProductPlan: productPlan,
    userMessage: "Make it 3.5 inch with an ambient light sensor, USB-C power, no battery or camera."
  });
  productPlan = result.productPlan;
  assert.equal(productPlan.requirements.displaySizeInches, 3.5);
  assert.equal(productPlan.requirements.ambientSensor, true);
  assert.equal(productPlan.requirements.battery, false);
  assert.equal(productPlan.requirements.camera, false);
  assert.equal(result.readyToGenerate, true);

  const selection = selectComponents(productPlan);
  assert.ok(selection.selectedComponentIds.includes("display_3_5_tft"));
  assert.ok(selection.selectedComponentIds.includes("core_board_esp32_s3"));
  assert.ok(selection.selectedComponentIds.includes("usb_c_breakout"));
  assert.ok(selection.selectedComponentIds.includes("ambient_sensor_basic"));
  assert.deepEqual(selection.riskModuleIds, []);
});

test("Sparker creates structured component and geometry patches", () => {
  const currentProductPlan = createEmptyProductPlan();
  const result = processUserTurn({
    currentProductPlan,
    userMessage: "Turn this into a desktop clock, add two buttons on the right side, add a small buzzer, and move USB-C to the back-left."
  });

  assert.equal(result.unsupportedReasons.length, 0);
  assert.equal(result.rejectedPatches.length, 0);
  assert.ok(result.appliedPatches.some((patch) => patch.type === "plan_patch"));
  assert.ok(result.appliedPatches.some((patch) => patch.type === "component_patch"));
  assert.ok(result.appliedPatches.some((patch) => patch.type === "geometry_preference_patch"));
  assert.equal(result.productPlan.productType, "desk_clock");
  assert.equal(result.productPlan.requirements.buttons, 2);
  assert.equal(result.productPlan.requirements.buzzer, true);
  assert.equal(result.productPlan.geometryPreferences.placements.buttons.semanticPosition, "right_side");
  assert.equal(result.productPlan.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
});

test("Sparker preserves Chinese rear-left USB-C placement wording", () => {
  const result = processUserTurn({
    currentProductPlan: createEmptyProductPlan(),
    userMessage: "把 USB-C 移到后面左侧。"
  });

  assert.equal(result.unsupportedReasons.length, 0);
  assert.equal(result.rejectedPatches.length, 0);
  assert.equal(result.productPlan.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
});

test("workspace patches apply safely without mutating the previous plan", () => {
  const currentProductPlan = createEmptyProductPlan();
  const result = applyWorkspacePatches(currentProductPlan, [
    {
      type: "component_patch",
      add: [{ componentType: "button", quantity: 2 }]
    },
    {
      type: "geometry_preference_patch",
      set: {
        "enclosure.shapeProfile": "cat_ear_photo_frame",
        "placements.usb_c.semanticPosition": "back_left"
      }
    },
    {
      type: "plan_patch",
      set: {
        "__proto__.polluted": true
      }
    }
  ]);

  assert.equal(currentProductPlan.requirements.buttons, 0);
  assert.equal(result.productPlan.requirements.buttons, 2);
  assert.equal(result.productPlan.geometryPreferences.enclosure.shapeProfile, "cat_ear_photo_frame");
  assert.equal(result.productPlan.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
  assert.equal(result.rejectedPatches.length, 1);
  assert.equal({}.polluted, undefined);
});

test("frontend keeps Chinese and English language assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.match(packageJson, /"three"/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /"three": "\/vendor\/three\/three\.module\.js"/);
  assert.match(html, /type="module" src="app\.js/);
  assert.match(html, /id="languageSelect"/);
  assert.match(html, /id="runtimeProviderSelect"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="en"/);
  assert.match(html, /value="mock"/);
  assert.match(html, /value="forge-query-engine"/);
  assert.match(html, /value="codex"/);
  assert.match(app, /GLTFLoader/);
  assert.match(app, /OrbitControls/);
  assert.match(app, /data-preview-engine/);
  assert.match(app, /previewEngineForRevision/);
  assert.match(app, /正在加载 3D 模型/);
  assert.match(app, /真实 3D 预览已加载/);
  assert.match(app, /3D 模型加载失败/);
  assert.match(html, /新项目/);
  assert.match(html, /id="newProject"/);
  assert.match(html, /class="project-menu-button" id="openThreadMenu"/);
  assert.doesNotMatch(html, /topbar-menu/);
  assert.doesNotMatch(html, /data-view="(?:chat|history|review)"/);
  assert.doesNotMatch(html, /toolbar-chip|openAttach|openScope|openBom|openGuardrails|openDfm|模拟原型输入框|运行模拟原型链路/);
  assert.doesNotMatch(html, /data-dialog="(?:attach|scope|bom|guardrails)"/);
  assert.match(styles, /\.project-menu-button/);
  assert.match(styles, /\.new-project-button\s*{\s*background: transparent;\s*box-shadow: none;\s*}/);
  assert.doesNotMatch(styles, /\.new-project-button\.active,\s*\.thread-row\.active/);
  assert.match(html, /data-dialog="reviewContact"/);
  assert.match(html, /data-dialog="modelFullscreen"/);
  assert.match(html, /data-device-canvas="fullscreen"/);
  assert.match(app, /data-sidebar-project/);
  assert.match(app, /const RUNTIME_PROVIDER_VALUES = \["mock", "forge-query-engine", "codex"\]/);
  assert.match(app, /function currentRuntimeProvider/);
  assert.match(app, /async function apiPostStream/);
  assert.match(app, /processSseBuffer/);
  assert.match(app, /applyStreamTraceEvent/);
  assert.match(app, /\/api\/workspaces\/\$\{state\.productPlan\.planId\}\/chat\/turn\/stream/);
  assert.match(app, /"\/api\/plans\/stream"/);
  assert.match(app, /async function restorePersistedProjects/);
  assert.match(app, /async function restoreActiveChatSession/);
  assert.match(app, /mergeConversationFromSession/);
  assert.match(app, /restoredTurnFromChatSession/);
  assert.match(app, /traceEventFromWorkspaceEvent/);
  assert.match(app, /recentEvents: payload\.recentEvents/);
  assert.match(app, /runtimeProviderForRestoredWorkspace/);
  assert.match(app, /codexThreadIdForWorkspace/);
  assert.match(app, /codexThreadIdForWorkspace\(workspace\) \? "codex"/);
  assert.match(app, /"\/api\/workspaces\?limit=12"/);
  assert.match(app, /\/api\/workspaces\/\$\{encodeURIComponent\(planId\)\}\/chat\/\$\{encodeURIComponent\(sessionId\)\}\?limit=80/);
  assert.match(app, /if \(!restored\) createDraftProject\(\);/);
  assert.match(app, /wasDraft \? createSessionId\(productPlan\.planId\)/);
  assert.match(app, /restoreActiveChatSession\(\)\.catch\(\(\) => \{\}\);/);
  assert.match(app, /\/api\/runtime\/status/);
  assert.match(html, /id="runtimeStatus"/);
  assert.match(app, /runtimeProvider: currentRuntimeProvider\(\)/);
  assert.match(app, /modelProvider: currentRuntimeProvider\(\)/);
  assert.doesNotMatch(app, /DEMO_RUNTIME_PROVIDER|createInitialPlan|demoConversationTurns/);
  assert.match(app, /refreshRuntimeStatus/);
  assert.match(app, /function refreshRuntimeStatusForProjectBoundary/);
  assert.match(app, /refreshRuntimeStatusForProjectBoundary\(\);/);
  assert.match(app, /runtimeStatusCodexReady/);
  assert.match(app, /runtimeStatusCodexMissing/);
  assert.match(app, /activeTrace: null/);
  assert.match(app, /traceEvents: \[\]/);
  assert.match(app, /renderRuntimeStatusSection/);
  assert.match(app, /runtime-status-panel/);
  assert.match(app, /sections\.push\(\["runtime"/);
  assert.match(app, /function runtimeStatusShouldLead/);
  assert.match(app, /runtimeStatus && runtimeLeads/);
  assert.match(app, /state\.pendingConfirmation/);
  assert.doesNotMatch(app, /\$\{renderRuntimeStatusSection\(\)\}/);
  assert.match(app, /renderTraceTimeline/);
  assert.match(app, /traceEventRows/);
  assert.match(app, /traceRows/);
  assert.match(app, /执行状态/);
  assert.match(app, /Run status/);
  assert.match(app, /运行模式/);
  assert.match(app, /Runtime mode/);
  assert.match(app, /Forge QueryEngine/);
  assert.match(app, /traceCodexTurn/);
  assert.match(app, /traceRowForCodexItem/);
  assert.match(app, /codex_item_started/);
  assert.match(app, /codex_item_completed/);
  assert.match(app, /formatCodexUsage/);
  assert.match(app, /new AbortController/);
  assert.match(app, /cancelActiveTurn/);
  assert.match(app, /cancelRunAria/);
  assert.match(app, /sendCancelled/);
  assert.match(app, /dataset\.running/);
  assert.match(html, /id="runChain"[^>]+data-running="false"/);
  assert.match(styles, /\.trace-timeline/);
  assert.match(styles, /\.trace-row\.running strong/);
  assert.match(styles, /\.runtime-status-panel/);
  assert.match(styles, /\.runtime-status-note/);
  assert.match(styles, /\.send-button\[data-running="true"\]/);
  assert.match(styles, /\.send-button span::before/);
  assert.match(styles, /\.send-button span::after/);
  assert.match(styles, /\.send-button\[data-running="true"\] span::before/);
  assert.match(styles, /\.trace-row\.cancelled strong/);
  assert.match(app, /function submitComposer/);
  assert.match(app, /dom\.runChain\.addEventListener\("click", submitComposer\)/);
  assert.match(app, /emptyComposer: "请先输入硬件需求"/);
  assert.match(app, /emptyComposer: "Enter a hardware request first"/);
  assert.match(app, /composerCodexReady: "下一条由 Codex 接管，并通过 Forge 工具落盘"/);
  assert.match(app, /composerCodexReady: "Next turn will run through Codex and Forge tools"/);
  assert.match(app, /function composerSummaryText/);
  assert.match(app, /function composerMetaText/);
  assert.match(app, /dom\.scopeLevel\?\.classList\.toggle\("active"/);
  assert.match(app, /dom\.inspectorContent\.hidden = true/);
  assert.match(app, /dom\.inspectorContent\.hidden = false/);
  assert.match(styles, /\.inspector-content\[hidden\]\s*{\s*display: none;\s*}/);
  assert.match(app, /function currentTopbarTitle/);
  assert.match(app, /setText\("#topbarTitle", currentTopbarTitle\(\)\)/);
  assert.match(html, /<span id="draftStatus" hidden><\/span>/);
  assert.match(html, /<span id="apiStatus" class="api-status"><\/span>/);
  assert.match(html, /<span class="gear-icon" aria-hidden="true">⚙<\/span>/);
  assert.doesNotMatch(styles, /\.gear-icon\s*{\s*border:/);
  assert.match(app, /dom\.apiStatus\.textContent = state\.notice \|\| ""/);
  assert.match(app, /dom\.apiStatus\.textContent = ""/);
  assert.doesNotMatch(html, /ProductPlan 实时方案|完整界面流程/);
  assert.doesNotMatch(html, /界面原型|内部 MVP/);
  assert.match(app, /projects: \[\]/);
  assert.doesNotMatch(app, /fallbackProductPlan/);
  assert.doesNotMatch(app, /fallback-plan/);
  assert.doesNotMatch(app, /projectRevisionDetail/);
  assert.doesNotMatch(app, /<small>\$\{escapeHtml\(projectRevisionDetail/);
  assert.doesNotMatch(styles, /\.thread-row small|\.thread-row em/);
  assert.match(app, /function startNewProject/);
  assert.match(app, /workspaceToken/);
  assert.match(html, /提交审核下单/);
  assert.match(html, /ProductPlan/);
  assert.match(app, /标准 3D 打印外壳/);
  assert.match(app, /Standard 3D printed shell/);
  assert.match(app, /Parts list \(BOM\)/);
  assert.match(app, /Prototype structure preview \(3D\)/);
  assert.match(app, /Drag to rotate, wheel to zoom, Shift-drag to pan/);
  assert.match(app, /外观层/);
  assert.match(app, /元器件层/);
  assert.match(app, /Appearance/);
  assert.match(app, /Components/);
  assert.match(app, /preview-control-buttons/);
  assert.match(app, /data-preview-fullscreen/);
  assert.match(app, /modelFullscreenAria/);
  assert.match(app, /disposeThreePreview\("fullscreen"\)/);
  assert.match(styles, /\.preview-controls\s*{\s*display: grid;\s*grid-template-columns: 42px minmax\(0, 1fr\);/);
  assert.match(styles, /\.kv-list span\s*{\s*display: grid;\s*grid-template-columns: 76px minmax\(0, 1fr\);/);
  assert.match(styles, /\.model-fullscreen-dialog\s*{/);
  assert.match(styles, /\.model-fullscreen-canvas-wrap \[data-device-canvas\]\s*{\s*width: 100%;\s*height: 100%;/);
  assert.match(app, /opacity: 0\.12/);
  assert.match(app, /transparent: true/);
  assert.match(app, /initialCameraFramed/);
  assert.doesNotMatch(app, /setCameraPreset/);
  assert.match(app, /nodeHasMaterialName\(node, \["shell_finish"\]\)/);
  assert.match(app, /isShellFeatureNode/);
  assert.match(app, /syncPreviewModeUi/);
  assert.match(app, /applyPreviewModeToInstances/);
  assert.match(app, /the components layer makes the shell transparent/);
  assert.match(app, /生成模型/);
  assert.match(app, /waiting for generation/);
  assert.match(app, /placed parts/);
  assert.match(app, /只读 3D 预览/);
  assert.match(app, /3D 模型已生成/);
  assert.match(app, /read-only 3D preview/);
  assert.match(app, /3D model generated/);
  assert.match(app, /modelFitChecks/);
  assert.match(app, /componentAssetsTitle/);
  assert.match(app, /assetQuality/);
  assert.match(app, /validationStatus/);
  assert.match(app, /proxyComponentNotice/);
  assert.match(app, /renderComponentAssetList/);
  assert.match(app, /renderArtifactLinks/);
  assert.match(app, /componentAssetManifest/);
  assert.match(styles, /component-assets|artifact-links|artifact-link|proxy-notice/);
  assert.match(app, /<span>\$\{escapeHtml\(t\("modelArtifacts"\)\)\} <strong>\$\{escapeHtml\(artifactSummary\(revision\)\)\}<\/strong><\/span>/);
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

test("conversational revision engine evolves shape, components, placement, diff, and revert", async () => {
  const { productPlan } = createProductPlan({
    initialMessage: "I want a small desktop smart display, 3.5 inch, USB-C powered.",
    language: "en"
  });

  const clock = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Turn this into a desktop clock and add two buttons on the right side."
  });
  assert.equal(clock.revision.productPlanSnapshot.productType, "desk_clock");
  assert.equal(clock.revision.productPlanSnapshot.requirements.buttons, 2);
  assert.ok(clock.revision.patches.some((patch) => patch.type === "component_patch"));
  assert.ok(clock.revision.diff.changes.some((change) => change.type === "component_added" && change.componentType === "button"));
  assert.ok(clock.revision.geometrySpec.componentSelections.selectedComponentIds.includes("button_6mm"));
  assert.ok(clock.revision.geometrySpec.features.some((feature) => feature.type === "button_hole" && feature.face === "right"));

  const catEar = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Add a small buzzer, make it look like a photo frame with cat ears, and move USB-C to the back-left."
  });
  assert.equal(catEar.revision.productPlanSnapshot.requirements.buzzer, true);
  assert.equal(catEar.revision.productPlanSnapshot.geometryPreferences.enclosure.shapeProfile, "cat_ear_photo_frame");
  assert.equal(catEar.revision.productPlanSnapshot.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
  assert.ok(catEar.revision.geometrySpec.componentSelections.selectedComponentIds.includes("speaker_20mm"));
  assert.ok(catEar.revision.geometrySpec.features.some((feature) => feature.type === "decorative_cat_ear"));
  const usbCutout = catEar.revision.geometrySpec.features.find((feature) => feature.type === "usb_cutout");
  assert.ok(usbCutout.positionMm[0] < 0);
  assert.ok(catEar.revision.diff.changes.some((change) => change.type === "placement_changed" && change.target === "usb_c"));
  assert.ok(catEar.revision.diff.changes.some((change) => change.type === "shape_changed"));

  const generated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Ready, generate model."
  });
  assert.equal(generated.revision.generationStatus, "generated");
  assert.ok(generated.revision.modelArtifacts.artifacts.glb.localPath);
  const glbJson = await readGlbJson(generated.revision.modelArtifacts.artifacts.glb.localPath);
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.button_1"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.decorative.cat_ear_left"));

  const reverted = revertProductPlanRevision({
    planId: productPlan.planId,
    revisionId: clock.revision.revisionId
  });
  assert.equal(reverted.productPlan.currentRevisionId, clock.revision.revisionId);
  assert.equal(reverted.productPlan.workspaceState.productPlan.productType, "desk_clock");
  assert.equal(reverted.productPlan.workspaceState.productPlan.geometryPreferences.enclosure.shapeProfile, "rounded_rect");
  assert.equal(reverted.productPlan.revisions.length, 4);
});

test("unsupported conversational requests become explicit manual expansion drafts", () => {
  const { productPlan, revision, assistantMessage } = createProductPlan({
    initialMessage: "I want a drone with a battery charging circuit.",
    language: "en"
  });

  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT);
  assert.ok(revision.unsupportedReasons.length >= 2);
  assert.match(assistantMessage.text, /manual expansion validation/);
  assert.equal(revision.modelArtifacts.status, "pending_confirmation");
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
    requestText: "Small woodgrain desktop display with photos and weather, 3.5 inch, with an ambient light sensor."
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
  assert.ok(modelJob.output.modelArtifacts.artifacts.shellFront);
  assert.ok(modelJob.output.modelArtifacts.artifacts.shellBack);
  assert.ok(modelJob.output.modelArtifacts.artifacts.step);
  assert.ok(modelJob.output.modelArtifacts.artifacts.componentDescriptors);
  assert.ok(modelJob.output.modelArtifacts.artifacts.componentAssetManifest);
  assert.equal((await readFile(modelJob.output.modelArtifacts.artifacts.glb.localPath)).slice(0, 4).toString("utf8"), "glTF");
  const glbJson = await readGlbJson(modelJob.output.modelArtifacts.artifacts.glb.localPath);
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.standard_desktop_display_shell"));
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.front"));
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.back"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.screen"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.usb_c"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.ambient_sensor"));
  assert.ok(glbJson.nodes.some((node) => node.name?.startsWith("feature.standoff.core_board.")));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.display_3_5_tft"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.core_board_esp32_s3"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.usb_c_breakout"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.ambient_sensor_basic"));
  assert.ok(glbJson.nodes.filter((node) => node.name?.startsWith("module.")).length >= 3);
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.usb_c.port"));
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.display_3_5_tft.fpc"));
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.ambient_sensor_basic.signal"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.coarse_cable_paths"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.display_to_core_board"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.sensor_to_core_board"));
  assert.equal(glbJson.extras.placedModuleCount >= 3, true);
  assert.ok(glbJson.extras.componentAssetManifest.components.some((component) => component.componentId === "display_3_5_tft"));
  assert.equal(glbJson.extras.directEditingAllowed, false);
  for (const accessor of glbJson.accessors.filter((accessor) => accessor.type === "VEC3")) {
    assert.ok(Array.isArray(accessor.min), "POSITION accessor should expose min");
    assert.ok(Array.isArray(accessor.max), "POSITION accessor should expose max");
  }
  const frontStl = await readFile(modelJob.output.modelArtifacts.artifacts.shellFront.localPath, "utf8");
  const backStl = await readFile(modelJob.output.modelArtifacts.artifacts.shellBack.localPath, "utf8");
  assert.match(frontStl, /solid forge_shell_front/);
  assert.match(backStl, /solid forge_shell_back/);
  assert.doesNotMatch(frontStl, /display_3_5_tft|core_board_esp32_s3|ambient_sensor_basic/);
  assert.doesNotMatch(backStl, /display_3_5_tft|core_board_esp32_s3|ambient_sensor_basic/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.componentDescriptors.localPath, "utf8"), /component_descriptor_v2/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.componentAssetManifest.localPath, "utf8"), /procedural_visual_proxy/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.step.localPath, "utf8"), /ISO-10303-21/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.step.localPath, "utf8"), /module_placements/);
  assert.match(await readFile(modelJob.output.modelArtifacts.artifacts.designSummary.localPath, "utf8"), /Mechanical Proxy Notice/);

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
  assert.ok(first.productPlan);
  assert.ok(first.componentSelections.selectedComponentIds.includes("display_5_tft"));
  assert.ok(first.componentDescriptors.some((descriptor) => descriptor.id === "core_board_esp32_s3"));
  assert.ok(first.componentAssetManifest.components.some((component) => component.componentId === "display_5_tft"));
  assert.ok(first.componentAssetManifest.components.every((component) => component.validationStatus === "unverified_proxy"));
  assert.ok(first.placements.length >= 3);
  assert.ok(first.features.some((feature) => feature.type === "screen_opening"));
  assert.ok(first.features.some((feature) => feature.type === "usb_cutout"));
  assert.ok(first.features.every((feature) => feature.source || feature.type === "split_line"));
  assert.ok(first.features.filter((feature) => feature.type === "standoff").length >= 4);
  assert.ok(first.routes.some((route) => route.id === "route.display_to_core_board"));
  assert.ok(first.routes.every((route) => route.from?.componentId && route.from?.connectorId && route.to?.componentId && route.to?.connectorId));
  assert.equal(first.metadata.placedModuleCount >= 3, true);
  assert.deepEqual(first.metadata.riskModuleIds, []);
  assert.equal(first.metadata.directEditingAllowed, false);
  assert.ok(first.metadata.assetQualitySummary.some((item) => item.assetQuality === "mechanical_proxy"));

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
