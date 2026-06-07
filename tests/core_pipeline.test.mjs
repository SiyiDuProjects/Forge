import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
import { projectWorkspacePath } from "../src/core/project_workspace.mjs";
import { validatePrototypeGeometry } from "../src/core/validation_engine.mjs";
import { applyUserMessageToPlan, applyWorkspacePatches, createEmptyProductPlan } from "../src/core/workspace_state.mjs";

async function readGlbJson(localPath) {
  const buffer = await readFile(localPath);
  assert.equal(buffer.slice(0, 4).toString("utf8"), "glTF");
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  assert.equal(jsonType, 0x4e4f534a);
  return JSON.parse(buffer.slice(20, 20 + jsonLength).toString("utf8"));
}

function glbMeshSummaries(glbJson) {
  const rows = [];
  for (const node of glbJson.nodes || []) {
    if (node.mesh === undefined || node.mesh === null) continue;
    const mesh = glbJson.meshes?.[node.mesh];
    for (const primitive of mesh?.primitives || []) {
      const positionAccessor = glbJson.accessors?.[primitive.attributes?.POSITION];
      const spanMm = positionAccessor?.min && positionAccessor?.max
        ? positionAccessor.max.map((value, index) => Number(((value - positionAccessor.min[index]) * 100).toFixed(3)))
        : [];
      rows.push({
        nodeName: node.name,
        mode: primitive.mode ?? 4,
        spanMm
      });
    }
  }
  return rows;
}

function assertNoZeroThicknessPreviewMeshes(glbJson) {
  const summaries = glbMeshSummaries(glbJson);
  assert.equal(
    summaries.some((summary) => summary.mode === 1),
    false,
    "3D preview should use thick semantic route meshes instead of zero-width GL_LINES"
  );
  const thin = summaries.filter((summary) => summary.spanMm.some((span) => span < 1.15));
  assert.deepEqual(thin, [], "visible GLB preview meshes should keep a non-zero physical thickness");
}

function assertNodeHasPhysicalSpan(glbJson, nodeName, minSpanMm = 1.15) {
  const summaries = glbMeshSummaries(glbJson).filter((summary) => summary.nodeName === nodeName);
  assert.ok(summaries.length > 0, `${nodeName} should exist as a visible GLB mesh`);
  const thin = summaries.filter((summary) => summary.spanMm.some((span) => span < minSpanMm));
  assert.deepEqual(thin, [], `${nodeName} should keep physical thickness on every axis`);
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

test("server mutation routes use shared policy or internal-only guards", async () => {
  const server = await readFile("server.mjs", "utf8");
  assert.match(server, /import \{ executeForgeToolWithPolicy \} from "\.\/src\/core\/tool_executor\.mjs"/);
  assert.match(server, /async function sendToolActionJson/);
  assert.match(server, /executeForgeToolWithPolicy\(\{/);
  assert.match(server, /toolName: "submitReviewPacket"/);
  assert.match(server, /function internalRouteAllowed/);
  assert.match(server, /FORGE_ENABLE_INTERNAL_API_MUTATIONS/);
  assert.match(server, /code: "INTERNAL_ROUTE_ONLY"/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/plans\/:planId\/turns"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/jobs"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/model\/generate"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/geometry\/generate"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/layout\/electronics"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/quote\/estimate"\)/);
  assert.match(server, /sendInternalOnlyJson\(response, "\/api\/review\/submit without planId"\)/);
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
    assert.equal(descriptor.mechanicalConstraints.trustLevel, "proxy_seed");
    assert.equal(descriptor.mechanicalConstraints.requiresHumanValidation, true);
    assert.ok(descriptor.mechanicalConstraints.mounting.method);
  }

  const descriptorValidation = listComponentDescriptorValidation();
  assert.ok(descriptorValidation.every((item) => item.valid));
  assert.equal(descriptorValidation.every((item) => item.errors.length === 0), true);
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

test("ComponentDescriptor intake blocks invalid package references", () => {
  const descriptors = listComponentDescriptors();
  const connectorMap = new Map(descriptors.map((descriptor) => [
    descriptor.id,
    new Set((descriptor.connectors || []).map((connector) => connector.id))
  ]));
  const display = descriptors.find((descriptor) => descriptor.id === "display_3_5_tft");
  const invalid = JSON.parse(JSON.stringify(display));
  invalid.connectors[0].mating = ["core_board_esp32_s3.nope"];
  invalid.interfaces[0].connectorId = "missing_fpc";
  invalid.accessVolumes[0].connectorId = "missing_fpc";
  invalid.cableExitDirections[0].connectorId = "missing_fpc";

  const validation = validateComponentDescriptorV2(invalid, {
    expectedId: "display_3_5_tft",
    knownConnectorIdsByComponentId: connectorMap,
    sourcesFileExists: false
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("mates with missing connector core_board_esp32_s3.nope")));
  assert.ok(validation.errors.some((error) => error.includes("display_ribbon references missing connector missing_fpc")));
  assert.ok(validation.errors.some((error) => error.includes("fpc_bend_volume references missing connector missing_fpc")));
  assert.ok(validation.errors.some((error) => error.includes("cableExitDirection references missing connector missing_fpc")));
  assert.ok(validation.errors.some((error) => error.includes("companion source notes file is missing")));
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

test("component selection honors same-type ComponentDescriptor preferences", async () => {
  const productPlan = createEmptyProductPlan();
  productPlan.requirements.display = true;
  productPlan.requirements.displaySizeInches = 3.5;
  productPlan.requirements.usbC = true;
  productPlan.requirements.battery = true;
  productPlan.requirements.portable = true;
  productPlan.componentPreferences = {
    battery: "battery_18650_holder"
  };

  const selection = selectComponents(productPlan);
  assert.ok(selection.selectedComponentIds.includes("battery_18650_holder"));
  assert.equal(selection.selectedComponentIds.includes("battery_lipo_2000"), false);
  assert.ok(selection.riskModuleIds.includes("battery_18650_holder"));

  const geometrySpec = createGeometrySpec({ productPlan });
  assert.ok(geometrySpec.componentSelections.selectedComponentIds.includes("battery_18650_holder"));
  assert.equal(geometrySpec.componentSelections.selectedComponentIds.includes("battery_lipo_2000"), false);
  const batteryRoute = geometrySpec.routes.find((route) => route.id === "route.battery_to_core_board");
  assert.equal(batteryRoute.from.componentId, "battery_18650_holder");
  assert.equal(batteryRoute.from.connectorId, "power_leads");
  assert.equal(batteryRoute.to.componentId, "core_board_esp32_s3");
  assert.equal(batteryRoute.to.connectorId, "usb_c");
  assert.equal(geometrySpec.validationErrors.length, 0);

  const generated = generateModelArtifacts({
    geometrySpec,
    revisionId: "test-descriptor-preferred-battery"
  });
  assert.equal(generated.status, "generated");
  const glbJson = await readGlbJson(generated.artifacts.glb.localPath);
  assert.ok(glbJson.nodes.some((node) => node.name === "module.battery_18650_holder"));
  assertNodeHasPhysicalSpan(glbJson, "route.battery_to_core_board.segment.1");
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
  assert.match(packageJson, /--import \.\/tests\/setup_test_environment\.mjs --test tests\/\*\.test\.mjs/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /"three": "\/vendor\/three\/three\.module\.js"/);
  assert.match(html, /type="module" src="app\.js/);
  assert.match(html, /id="languageSelect"/);
  assert.match(html, /id="runtimeProviderSelect"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="en"/);
  assert.match(html, /<option value="codex" selected>Codex<\/option>/);
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
  assert.match(html, /id="previewSnapshot"/);
  assert.match(html, /data-dialog="prototypeSnapshot"/);
  assert.doesNotMatch(html, /id="openThreadMenu"/);
  assert.doesNotMatch(html, /project-menu-button/);
  assert.doesNotMatch(html, /topbar-menu/);
  assert.doesNotMatch(html, /data-view="(?:chat|history|review)"/);
  assert.doesNotMatch(html, /toolbar-chip|openAttach|openScope|openBom|openGuardrails|openDfm|模拟原型输入框|运行模拟原型链路/);
  assert.doesNotMatch(html, /data-dialog="(?:attach|scope|bom|guardrails)"/);
  assert.match(styles, /\.project-row-menu-button/);
  assert.match(styles, /\.thread-row:hover \.project-row-menu-button/);
  assert.doesNotMatch(styles, /\.project-menu-button/);
  assert.match(styles, /\.new-project-button\s*{\s*background: transparent;\s*box-shadow: none;\s*}/);
  assert.doesNotMatch(styles, /\.new-project-button\.active,\s*\.thread-row\.active/);
  assert.match(html, /data-dialog="reviewContact"/);
  assert.match(html, /data-dialog="modelFullscreen"/);
  assert.match(html, /data-device-canvas="fullscreen"/);
  assert.match(app, /data-sidebar-project/);
  assert.match(app, /data-project-menu/);
  assert.match(app, /openProjectMenu/);
  assert.match(app, /removeProjectFromList/);
  assert.match(app, /const RUNTIME_PROVIDER_VALUES = \["mock", "forge-query-engine", "codex"\]/);
  assert.match(app, /const DEFAULT_RUNTIME_PROVIDER = "codex"/);
  assert.match(app, /const LEGACY_RUNTIME_PROVIDER_KEY = "forgeRuntimeProvider"/);
  assert.match(app, /const EXPLICIT_RUNTIME_PROVIDER_KEY = "forgeRuntimeProviderExplicit"/);
  assert.match(app, /legacyChoice && legacyChoice !== "mock"/);
  assert.match(app, /window\.localStorage\.setItem\(EXPLICIT_RUNTIME_PROVIDER_KEY, value\)/);
  assert.match(app, /本地 Forge（降级）/);
  assert.match(app, /function currentRuntimeProvider/);
  assert.match(app, /async function apiPostStream/);
  assert.match(app, /processSseBuffer/);
  assert.match(app, /applyStreamTraceEvent/);
  assert.match(app, /\/api\/workspaces\/\$\{state\.productPlan\.planId\}\/chat\/turn\/stream/);
  assert.match(app, /"\/api\/plans\/stream"/);
  assert.match(app, /async function restorePersistedProjects/);
  assert.match(app, /compactRestoredProjectList\(\(response\.workspaces \|\| \[\]\)/);
  assert.match(app, /function compactRestoredProjectList/);
  assert.match(app, /function normalizeProjectTitle/);
  assert.match(app, /async function restoreActiveChatSession/);
  assert.match(app, /async function restoreActiveChatSession\(\{ renderAfter = true, scrollConversationToBottom = true \} = \{\}\)/);
  assert.match(app, /mergeConversationFromSession/);
  assert.match(app, /restoredTurnFromChatSession/);
  assert.match(app, /traceEventFromWorkspaceEvent/);
  assert.match(app, /recentEvents: payload\.recentEvents/);
  assert.match(app, /runtimeProviderForRestoredWorkspace/);
  assert.match(app, /runtimeBindingForWorkspace/);
  assert.match(app, /runtimeBindingForWorkspace\(workspace\)\?\.provider === "codex"/);
  assert.match(app, /"\/api\/workspaces\?limit=12"/);
  assert.match(app, /\/api\/workspaces\/\$\{encodeURIComponent\(planId\)\}\/chat\/\$\{encodeURIComponent\(sessionId\)\}\?limit=80/);
  assert.match(app, /if \(!restored\) createDraftProject\(\);/);
  assert.match(app, /conversation: document\.querySelector/);
  assert.match(app, /"\.conversation"/);
  assert.match(app, /function scheduleConversationScrollToBottom/);
  assert.match(app, /if \(scrollConversationToBottom\) scheduleConversationScrollToBottom\(\);/);
  assert.match(app, /dom\.conversation\.scrollTop = dom\.conversation\.scrollHeight/);
  assert.match(app, /render\(\{ scrollConversationToBottom: true \}\)/);
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
  assert.match(app, /renderTranscriptSection/);
  assert.match(app, /transcript-panel/);
  assert.doesNotMatch(app, /sections\.push\(\["runtime"/);
  assert.match(app, /const sections = \[\["model"/);
  assert.match(app, /expandedProcessedTurns: new Set\(\)/);
  assert.match(app, /expandedProcessedDetails: new Set\(\)/);
  assert.match(app, /state\.pendingConfirmation/);
  assert.match(app, /renderTranscriptSection\(processedTranscript\)/);
  assert.match(app, /processedTranscriptViewModel/);
  assert.match(app, /renderProcessedTranscriptHeader/);
  assert.match(app, /renderProcessedWorkDetails/);
  assert.match(app, /renderProcessedTodoList/);
  assert.match(app, /renderProcessedPending/);
  assert.match(app, /data-processed-toggle/);
  assert.match(app, /toggleProcessedTranscript/);
  assert.match(app, /data-processed-detail-toggle/);
  assert.match(app, /toggleProcessedDetail/);
  assert.match(app, /processedDetailKey/);
  assert.match(app, /redactProcessedText/);
  assert.match(app, /function formatProcessedDuration/);
  assert.match(app, /function processedTranscriptExpanded/);
  assert.match(app, /function isExplorationCommand/);
  assert.match(app, /processedRunning: "处理中"/);
  assert.match(app, /processedDone: "已处理"/);
  assert.match(app, /processedExplored: "已探索"/);
  assert.match(app, /processedRan: "已运行"/);
  assert.match(app, /processedEdited: "已编辑"/);
  assert.match(app, /processedRunning: "Processing"/);
  assert.match(app, /processedDone: "Processed"/);
  assert.match(app, /processedExplored: "Explored"/);
  assert.match(app, /processedRan: "Ran"/);
  assert.match(app, /processedEdited: "Edited"/);
  assert.match(app, /compactTraceEvents/);
  assert.match(app, /TRANSCRIPT_EVENT_LIMIT = 96/);
  assert.match(app, /function normalizeTranscriptTurn/);
  assert.match(app, /function mergeTranscriptEvents/);
  assert.match(app, /function transcriptEventsFromWorkspaceEvents/);
  assert.match(app, /function transcriptEventKey/);
  assert.match(app, /event\.hasFinalMessage === undefined \? "" : event\.hasFinalMessage/);
  assert.match(app, /turnsWithCodexAgentMessage/);
  assert.match(app, /event\.type === "assistant_message" && turnsWithCodexAgentMessage\.has/);
  assert.match(app, /normalizeTranscriptTurn\(\s*hasRealPlan \? response : planCreationTrace/);
  assert.match(app, /normalizeTranscriptTurn\(response, \{\s*workspaceEvents: response\.eventsAppended \|\| \[\]/);
  assert.match(app, /mergeTranscriptEvents\(\s*state\.activeTrace\.traceEvents \|\| \[\]/);
  assert.match(app, /Codex 工作流/);
  assert.match(app, /Codex transcript/);
  assert.match(app, /processedNoWork/);
  assert.doesNotMatch(app, /function renderTraceTimeline/);
  assert.doesNotMatch(app, /function traceRows/);
  assert.doesNotMatch(app, /function traceEventRows/);
  assert.doesNotMatch(app, /function renderCodexNativeItem/);
  assert.doesNotMatch(app, /data-trace-toggle/);
  assert.doesNotMatch(app, /data-trace-copy/);
  assert.doesNotMatch(app, /label: t\("traceRuntimeBinding"\)/);
  assert.doesNotMatch(app, /label: t\("traceModelRequest"\)/);
  assert.doesNotMatch(app, /label: t\("traceToolSelected"\)/);
  assert.doesNotMatch(app, /modelProvider \? `modelProvider:/);
  assert.match(app, /运行模式/);
  assert.match(app, /Runtime mode/);
  assert.match(app, /Forge QueryEngine/);
  assert.match(app, /codexDisplayText/);
  assert.match(app, /codex_item_started/);
  assert.match(app, /codex_item_completed/);
  assert.match(app, /new AbortController/);
  assert.match(app, /cancelActiveTurn/);
  assert.match(app, /cancelRunAria/);
  assert.match(app, /sendCancelled/);
  assert.match(app, /dataset\.running/);
  assert.match(html, /id="runChain"[^>]+data-running="false"/);
  assert.match(styles, /\.transcript-panel/);
  assert.match(styles, /\.processed-transcript/);
  assert.match(styles, /\.processed-transcript-head/);
  assert.match(styles, /\.processed-work-details/);
  assert.match(styles, /\.processed-action-list/);
  assert.match(styles, /\.processed-action-row span/);
  assert.match(styles, /\.processed-detail-list/);
  assert.match(styles, /button\.processed-action-row/);
  assert.match(styles, /\.processed-todo-list/);
  assert.match(styles, /\.processed-confirmation/);
  assert.doesNotMatch(styles, /\.trace-timeline/);
  assert.doesNotMatch(styles, /\.trace-row\.codex-native/);
  assert.doesNotMatch(styles, /\.codex-native-/);
  assert.match(styles, /\.conversation\s*{\s*min-height: 0;\s*overflow: auto;\s*padding: 31px 36px 22px;/);
  assert.doesNotMatch(styles, /padding: 31px 36px 168px/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /\.runtime-status-note/);
  assert.match(styles, /\.send-button\[data-running="true"\]/);
  assert.match(styles, /\.send-button span::before/);
  assert.match(styles, /\.send-button span::after/);
  assert.match(styles, /\.send-button\[data-running="true"\] span::before/);
  assert.match(app, /function submitComposer/);
  assert.match(app, /dom\.runChain\.addEventListener\("click", submitComposer\)/);
  assert.match(app, /emptyComposer: "请先输入硬件需求"/);
  assert.match(app, /emptyComposer: "Enter a hardware request first"/);
  assert.match(html, /<form id="promptForm" class="composer" aria-label="硬件需求输入框">/);
  assert.match(html, /<textarea id="ideaInput" rows="3" spellcheck="true"><\/textarea>/);
  assert.doesNotMatch(html, /composerSummary/);
  assert.doesNotMatch(html, /scopeLevel/);
  assert.doesNotMatch(html, /goal-strip/);
  assert.doesNotMatch(app, /composerCodexReady/);
  assert.doesNotMatch(app, /composerSummaryText/);
  assert.doesNotMatch(app, /composerMetaText/);
  assert.doesNotMatch(app, /runtimeQuickAria/);
  assert.match(app, /function openRuntimeSettings/);
  assert.match(app, /function focusRuntimeProviderSelect/);
  assert.match(app, /dom\.openSettings\.addEventListener\("click", openRuntimeSettings\)/);
  assert.match(app, /dom\.runtimeProviderSelect\?\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(app, /dom\.scopeLevel/);
  assert.doesNotMatch(styles, /\.goal-/);
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
  assert.match(app, /生成模型/);
  assert.match(app, /waiting for generation/);
  assert.match(app, /placed parts/);
  assert.match(app, /只读 3D 预览/);
  assert.match(app, /3D 模型已生成/);
  assert.match(app, /生成自检通过/);
  assert.match(app, /生成自检未通过/);
  assert.match(app, /read-only 3D preview/);
  assert.match(app, /3D model generated/);
  assert.match(app, /Generation audit passed/);
  assert.match(app, /Generation audit failed/);
  assert.match(app, /artifactTrustForRevision/);
  assert.match(app, /modelFitChecks/);
  assert.match(app, /<span>\$\{escapeHtml\(t\("modelArtifacts"\)\)\} <strong>\$\{escapeHtml\(artifactSummary\(revision\)\)\}<\/strong><\/span>/);
  assert.doesNotMatch(app, /componentAssetsTitle/);
  assert.doesNotMatch(app, /proxyComponentNotice/);
  assert.doesNotMatch(app, /renderComponentAssetList/);
  assert.doesNotMatch(app, /renderArtifactLinks/);
  assert.doesNotMatch(app, /modelViewerHint/);
  assert.doesNotMatch(styles, /component-assets|artifact-links|artifact-link|proxy-notice/);
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

test("ProductPlan creates revisions and preview outputs", async () => {
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
  assert.ok(generated.revision.modelArtifacts.artifacts.generationEvidenceReport.localPath);
  assert.ok(generated.productPlan.assets.some((asset) => asset.type === "generation_evidence_report"));
  const workspacePath = projectWorkspacePath(generated.productPlan.planId);
  const revisionPath = join(workspacePath, "revisions", generated.revision.revisionId);
  const persistedEvidence = JSON.parse(await readFile(join(revisionPath, "generation_evidence_report.json"), "utf8"));
  assert.equal(persistedEvidence.version, "generation_evidence_report_v1");
  assert.equal(persistedEvidence.status, "generated");
  assert.equal(persistedEvidence.sourceOfTruth.geometrySpec, "geometry-spec.json");
  assert.equal(persistedEvidence.generatedArtifactsPresent, true);
  assert.equal(persistedEvidence.artifactIntegrity.glb.present, true);
  assert.equal(persistedEvidence.artifactAudit.status, "passed");
  assert.equal(persistedEvidence.artifactAudit.checks.glb.passed, true);
  const revisionManifest = JSON.parse(await readFile(join(revisionPath, "revision_manifest.json"), "utf8"));
  assert.equal(revisionManifest.derivedArtifacts.generationEvidenceReport, "generation_evidence_report.json");
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
  const buttonDescriptorFeature = clock.revision.geometrySpec.componentDescriptors
    .find((descriptor) => descriptor.id === "button_6mm")
    .externalFeatures.find((feature) => feature.id === "button_hole");
  assert.deepEqual(
    clock.revision.geometrySpec.features.find((feature) => feature.id === "feature.opening.button_1").sizeMm,
    buttonDescriptorFeature.openingSizeMm
  );
  const buttonRetentions = clock.revision.geometrySpec.features.filter((feature) => feature.type === "panel_button_retention");
  assert.equal(buttonRetentions.length, 2);
  assert.ok(buttonRetentions.every((feature) => (
    feature.mountingMethod === "panel_button"
    && feature.face === "right"
    && Number(feature.collarWidthMm) >= 1.2
    && Number(feature.buttonTravelMm) >= 5
  )));
  const missingButtonRetentionValidation = validatePrototypeGeometry({
    productPlan: clock.revision.geometrySpec.productPlan,
    componentSelection: {
      ...clock.revision.geometrySpec.componentSelections,
      componentDescriptors: clock.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: clock.revision.geometrySpec.enclosure,
      placements: clock.revision.geometrySpec.placements,
      routes: clock.revision.geometrySpec.routes,
      features: clock.revision.geometrySpec.features.filter((feature) => feature.type !== "panel_button_retention")
    }
  });
  assert.equal(missingButtonRetentionValidation.canGenerateArtifacts, false);
  assert.ok(missingButtonRetentionValidation.errors.some((error) => (
    error.type === "missing_panel_button_retention"
    && error.componentId === "button_6mm"
  )));

  const catEar = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Add a small buzzer, make it look like a photo frame with cat ears, and move USB-C to the back-left."
  });
  assert.equal(catEar.revision.productPlanSnapshot.requirements.buzzer, true);
  assert.equal(catEar.revision.productPlanSnapshot.geometryPreferences.enclosure.shapeProfile, "cat_ear_photo_frame");
  assert.equal(catEar.revision.productPlanSnapshot.geometryPreferences.placements.usb_c.semanticPosition, "back_left");
  assert.ok(catEar.revision.geometrySpec.componentSelections.selectedComponentIds.includes("speaker_20mm"));
  assert.ok(catEar.revision.geometrySpec.features.some((feature) => feature.type === "decorative_cat_ear"));
  const speakerDescriptorFeature = catEar.revision.geometrySpec.componentDescriptors
    .find((descriptor) => descriptor.id === "speaker_20mm")
    .externalFeatures.find((feature) => feature.id === "speaker_vents");
  assert.deepEqual(
    catEar.revision.geometrySpec.features.find((feature) => feature.id === "feature.opening.speaker_vents").sizeMm,
    speakerDescriptorFeature.openingSizeMm
  );
  const speakerRetention = catEar.revision.geometrySpec.features.find((feature) => feature.id === "feature.retention.speaker_20mm.grille_mount");
  assert.equal(speakerRetention.mountingMethod, "grille_mount");
  assert.equal(speakerRetention.ventCount, speakerDescriptorFeature.ventCount);
  assert.ok(Number(speakerRetention.rimWidthMm) >= 1.2);
  const speakerRoute = catEar.revision.geometrySpec.routes.find((route) => route.id === "route.speaker_to_core_board");
  assert.equal(speakerRoute.from.componentId, "speaker_20mm");
  assert.equal(speakerRoute.from.connectorId, "signal");
  assert.equal(speakerRoute.to.componentId, "core_board_esp32_s3");
  assert.equal(speakerRoute.to.connectorId, "speaker");
  const missingSpeakerRetentionValidation = validatePrototypeGeometry({
    productPlan: catEar.revision.geometrySpec.productPlan,
    componentSelection: {
      ...catEar.revision.geometrySpec.componentSelections,
      componentDescriptors: catEar.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: catEar.revision.geometrySpec.enclosure,
      placements: catEar.revision.geometrySpec.placements,
      routes: catEar.revision.geometrySpec.routes,
      features: catEar.revision.geometrySpec.features.filter((feature) => feature.type !== "grille_mount_retention")
    }
  });
  assert.equal(missingSpeakerRetentionValidation.canGenerateArtifacts, false);
  assert.ok(missingSpeakerRetentionValidation.errors.some((error) => (
    error.type === "missing_grille_mount_retention"
    && error.componentId === "speaker_20mm"
  )));
  const missingSpeakerRouteValidation = validatePrototypeGeometry({
    productPlan: catEar.revision.geometrySpec.productPlan,
    componentSelection: {
      ...catEar.revision.geometrySpec.componentSelections,
      componentDescriptors: catEar.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: catEar.revision.geometrySpec.enclosure,
      placements: catEar.revision.geometrySpec.placements,
      routes: catEar.revision.geometrySpec.routes.filter((route) => route.id !== "route.speaker_to_core_board"),
      features: catEar.revision.geometrySpec.features
    }
  });
  assert.equal(missingSpeakerRouteValidation.canGenerateArtifacts, false);
  assert.ok(missingSpeakerRouteValidation.errors.some((error) => (
    error.type === "missing_descriptor_connector_route"
    && error.componentId === "speaker_20mm"
    && error.to.connectorId === "speaker"
  )));
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
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.button_1_panel_button.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.button_1_panel_button.top");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.speaker_20mm_grille_mount.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.speaker_20mm_grille_mount.top");
  assertNodeHasPhysicalSpan(glbJson, "module.button_6mm.access.button_wire_access");
  assertNodeHasPhysicalSpan(glbJson, "module.speaker_20mm.access.speaker_wire_access");
  assertNodeHasPhysicalSpan(glbJson, "route.speaker_to_core_board.segment.1");
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.decorative.cat_ear_left"));
  assertNoZeroThicknessPreviewMeshes(glbJson);

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

test("camera and battery display plans remain standard with review risks", async () => {
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
  const cameraDescriptorFeature = generated.revision.geometrySpec.componentDescriptors
    .find((descriptor) => descriptor.id === "camera_module_basic")
    .externalFeatures.find((feature) => feature.id === "camera_window");
  assert.deepEqual(
    generated.revision.geometrySpec.features.find((feature) => feature.id === "feature.opening.camera").sizeMm,
    cameraDescriptorFeature.openingSizeMm
  );
  const cameraRetention = generated.revision.geometrySpec.features.find((feature) => feature.id === "feature.retention.camera_module_basic.front_window_review");
  assert.equal(cameraRetention.mountingMethod, "front_window_review");
  assert.equal(cameraRetention.reviewOnly, true);
  assert.equal(cameraRetention.humanReviewRequired, true);
  assert.equal(cameraRetention.privacyReviewRequired, true);
  const batteryDescriptor = generated.revision.geometrySpec.componentDescriptors
    .find((descriptor) => descriptor.id === "battery_lipo_2000");
  const batteryBay = generated.revision.geometrySpec.features.find((feature) => feature.id === "feature.battery_bay");
  assert.equal(batteryBay.mountingMethod, batteryDescriptor.mechanicalProxy.mountingMethod);
  assert.equal(batteryBay.reviewOnly, true);
  assert.equal(batteryBay.humanReviewRequired, true);
  assert.ok(Number(batteryBay.retentionLipMm) >= 1.8);
  const cameraRoute = generated.revision.geometrySpec.routes.find((route) => route.id === "route.camera_to_core_board");
  assert.equal(cameraRoute.from.componentId, "camera_module_basic");
  assert.equal(cameraRoute.to.componentId, "core_board_esp32_s3");
  assert.equal(cameraRoute.to.connectorId, "gpio");
  const batteryRoute = generated.revision.geometrySpec.routes.find((route) => route.id === "route.battery_to_core_board");
  assert.equal(batteryRoute.from.componentId, "battery_lipo_2000");
  assert.equal(batteryRoute.from.connectorId, "power_lead");
  assert.equal(batteryRoute.to.componentId, "core_board_esp32_s3");
  assert.equal(batteryRoute.to.connectorId, "usb_c");
  const missingBatteryBayValidation = validatePrototypeGeometry({
    productPlan: generated.revision.geometrySpec.productPlan,
    componentSelection: {
      ...generated.revision.geometrySpec.componentSelections,
      componentDescriptors: generated.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: generated.revision.geometrySpec.enclosure,
      placements: generated.revision.geometrySpec.placements,
      routes: generated.revision.geometrySpec.routes,
      features: generated.revision.geometrySpec.features.filter((feature) => feature.type !== "battery_bay")
    }
  });
  assert.equal(missingBatteryBayValidation.canGenerateArtifacts, false);
  assert.ok(missingBatteryBayValidation.errors.some((error) => (
    error.type === "missing_review_battery_bay"
    && error.componentId === "battery_lipo_2000"
  )));
  const missingCameraRetentionValidation = validatePrototypeGeometry({
    productPlan: generated.revision.geometrySpec.productPlan,
    componentSelection: {
      ...generated.revision.geometrySpec.componentSelections,
      componentDescriptors: generated.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: generated.revision.geometrySpec.enclosure,
      placements: generated.revision.geometrySpec.placements,
      routes: generated.revision.geometrySpec.routes,
      features: generated.revision.geometrySpec.features.filter((feature) => feature.type !== "optical_window_retention")
    }
  });
  assert.equal(missingCameraRetentionValidation.canGenerateArtifacts, false);
  assert.ok(missingCameraRetentionValidation.errors.some((error) => (
    error.type === "missing_optical_window_retention"
    && error.componentId === "camera_module_basic"
  )));
  const missingReviewRiskRouteValidation = validatePrototypeGeometry({
    productPlan: generated.revision.geometrySpec.productPlan,
    componentSelection: {
      ...generated.revision.geometrySpec.componentSelections,
      componentDescriptors: generated.revision.geometrySpec.componentDescriptors
    },
    layout: {
      enclosure: generated.revision.geometrySpec.enclosure,
      placements: generated.revision.geometrySpec.placements,
      routes: generated.revision.geometrySpec.routes.filter((route) => (
        route.id !== "route.camera_to_core_board" && route.id !== "route.battery_to_core_board"
      )),
      features: generated.revision.geometrySpec.features
    }
  });
  assert.equal(missingReviewRiskRouteValidation.canGenerateArtifacts, false);
  assert.ok(missingReviewRiskRouteValidation.errors.some((error) => (
    error.type === "missing_descriptor_connector_route"
    && error.componentId === "camera_module_basic"
    && error.to.connectorId === "gpio"
  )));
  assert.ok(missingReviewRiskRouteValidation.errors.some((error) => (
    error.type === "missing_descriptor_connector_route"
    && error.componentId === "battery_lipo_2000"
    && error.to.connectorId === "usb_c"
  )));
  const glbJson = await readGlbJson(generated.revision.modelArtifacts.artifacts.glb.localPath);
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.camera_module_basic_front_window_review.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.camera_module_basic_front_window_review.top");
  assertNodeHasPhysicalSpan(glbJson, "feature.battery_bay");
  assertNodeHasPhysicalSpan(glbJson, "feature.battery_bay.rail.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.battery_bay.rail.top");
  assertNodeHasPhysicalSpan(glbJson, "route.camera_to_core_board.segment.1");
  assertNodeHasPhysicalSpan(glbJson, "route.battery_to_core_board.segment.1");
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
  assert.equal(modelJob.output.modelPreview.artifactTrust.generated, true);
  assert.equal(modelJob.output.modelPreview.artifactTrust.trustedGenerated, true);
  assert.equal(modelJob.output.modelPreview.artifactTrust.auditStatus, "passed");
  assert.equal(modelJob.output.modelPreview.artifactTrust.auditPassed, true);
  assert.equal(modelJob.output.modelPreview.artifactTrust.findingCount, 0);
  assert.equal(modelJob.output.geometryValidation.canGenerateArtifacts, true);
  assert.ok(modelJob.output.geometryValidation.checks.includes("mechanical_constraints_report"));
  assert.ok(modelJob.output.geometryValidation.checks.includes("layout_explanation_report"));
  assert.ok(modelJob.output.geometrySpec.requiredArtifacts.includes("generation_evidence_report"));
  assert.ok(modelJob.output.geometrySpec.modules.some((module) => module.role === "front_display"));
  assert.equal(modelJob.output.geometrySpec.mechanicalConstraints.version, "mechanical_constraints_v1");
  assert.equal(modelJob.output.geometrySpec.mechanicalConstraints.coverage.proxyComponentCount >= 3, true);
  assert.ok(modelJob.output.geometrySpec.mechanicalConstraints.components.some((component) => (
    component.componentId === "usb_c_breakout"
    && component.interfaces.requiredExternalAccessConnectorIds.includes("usb_c")
    && component.shellFeatures.maxInsertionClearanceMm >= 8
  )));
  assert.equal(modelJob.output.geometrySpec.layoutExplanation.version, "layout_explanation_v1");
  assert.equal(modelJob.output.geometrySpec.layoutExplanation.coverage.placementCount, modelJob.output.geometrySpec.placements.length);
  assert.equal(modelJob.output.geometrySpec.layoutExplanation.coverage.featureCount, modelJob.output.geometrySpec.features.length);
  assert.equal(modelJob.output.geometrySpec.layoutExplanation.coverage.routeCount, modelJob.output.geometrySpec.routes.length);
  const descriptorFeatureById = new Map(modelJob.output.geometrySpec.componentDescriptors.flatMap((descriptor) => (
    (descriptor.externalFeatures || []).map((feature) => [`${descriptor.id}.${feature.id}`, feature])
  )));
  const screenOpening = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.opening.screen");
  const usbOpening = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.opening.usb_c");
  const sensorOpening = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.opening.ambient_sensor");
  const sensorRetention = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.retention.ambient_sensor_basic.front_window");
  const displayRetention = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.retention.display_3_5_tft.captured_panel");
  const displayDescriptor = modelJob.output.geometrySpec.componentDescriptors.find((descriptor) => descriptor.id === "display_3_5_tft");
  const sensorDescriptorFeature = descriptorFeatureById.get("ambient_sensor_basic.ambient_sensor_window");
  const usbRetention = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.retention.usb_c_breakout.edge_capture");
  const usbDescriptor = modelJob.output.geometrySpec.componentDescriptors.find((descriptor) => descriptor.id === "usb_c_breakout");
  assert.deepEqual(screenOpening.sizeMm, descriptorFeatureById.get("display_3_5_tft.screen_opening").openingSizeMm);
  assert.deepEqual(usbOpening.sizeMm, descriptorFeatureById.get("usb_c_breakout.usb_c_cutout").openingSizeMm);
  assert.deepEqual(sensorOpening.sizeMm, sensorDescriptorFeature.openingSizeMm);
  assert.equal(sensorRetention.mountingMethod, "front_window");
  assert.equal(sensorRetention.visibilityConeDeg, sensorDescriptorFeature.visibilityConeDeg);
  assert.equal(displayRetention.mountingMethod, "captured_panel");
  assert.equal(displayRetention.bezelMm, displayDescriptor.mechanicalProxy.bezelMm);
  assert.equal(displayRetention.retainerWidthMm >= 1.8, true);
  assert.equal(usbRetention.mountingMethod, "edge_capture");
  assert.equal(usbRetention.retentionLipMm, usbDescriptor.mechanicalProxy.retentionLipMm);
  assert.ok(modelJob.output.geometrySpec.layoutExplanation.placements.some((item) => (
    item.componentId === "usb_c_breakout"
    && item.reason.includes("USB-C connector")
  )));
  assert.ok(modelJob.output.geometrySpec.layoutExplanation.routes.some((item) => (
    item.routeId === "route.display_to_core_board"
    && item.reason.includes("descriptor connector metadata")
  )));
  const coreBoard = modelJob.output.geometrySpec.modules.find((module) => module.componentId === "core_board_esp32_s3");
  const firstStandoff = modelJob.output.geometrySpec.features.find((feature) => feature.id === "feature.standoff.core_board.1");
  assert.ok(coreBoard);
  assert.ok(firstStandoff);
  assert.ok(
    Math.abs((firstStandoff.positionMm[2] + firstStandoff.heightMm) - (coreBoard.positionMm.z - 1.6 / 2)) < 0.001,
    "core board standoffs should reach the PCB underside in the generated GeometrySpec"
  );
  assert.ok(modelJob.output.modelArtifacts.artifacts.glb);
  assert.ok(modelJob.output.modelArtifacts.artifacts.stl);
  assert.ok(modelJob.output.modelArtifacts.artifacts.shellFront);
  assert.ok(modelJob.output.modelArtifacts.artifacts.shellBack);
  assert.ok(modelJob.output.modelArtifacts.artifacts.step);
  assert.ok(modelJob.output.modelArtifacts.artifacts.componentDescriptors);
  assert.ok(modelJob.output.modelArtifacts.artifacts.componentAssetManifest);
  assert.ok(modelJob.output.modelArtifacts.artifacts.generationEvidenceReport);
  assert.equal((await readFile(modelJob.output.modelArtifacts.artifacts.glb.localPath)).slice(0, 4).toString("utf8"), "glTF");
  const glbJson = await readGlbJson(modelJob.output.modelArtifacts.artifacts.glb.localPath);
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.standard_desktop_display_shell"));
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.front"));
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.back"));
  assert.ok(glbJson.nodes.some((node) => node.name === "shell.join.front_back_overlap"));
  assertNodeHasPhysicalSpan(glbJson, "shell.join.lip.left");
  assertNodeHasPhysicalSpan(glbJson, "shell.join.front_seat.left");
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.screen"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.usb_c"));
  assert.ok(glbJson.nodes.some((node) => node.name === "feature.opening.ambient_sensor"));
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.screen.top");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.screen.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.ambient_sensor_basic_front_window.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.ambient_sensor_basic_front_window.top");
  assertNodeHasPhysicalSpan(glbJson, "feature.clearance.usb_c_plug_access");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.usb_c_breakout_edge_capture.left");
  assertNodeHasPhysicalSpan(glbJson, "feature.retention.usb_c_breakout_edge_capture.top");
  assert.ok(glbJson.nodes.some((node) => node.name?.startsWith("feature.standoff.core_board.")));
  assertNodeHasPhysicalSpan(glbJson, "feature.standoff.core_board.1.board_contact");
  assert.ok(glbJson.nodes.some((node) => node.name === "module.display_3_5_tft"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.core_board_esp32_s3"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.usb_c_breakout"));
  assert.ok(glbJson.nodes.some((node) => node.name === "module.ambient_sensor_basic"));
  assert.ok(glbJson.nodes.filter((node) => node.name?.startsWith("module.")).length >= 3);
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.usb_c.port"));
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.display_3_5_tft.fpc"));
  assert.ok(glbJson.nodes.some((node) => node.name === "interface.ambient_sensor_basic.signal"));
  assertNodeHasPhysicalSpan(glbJson, "module.display_3_5_tft.keepout.front_viewing_clearance");
  assertNodeHasPhysicalSpan(glbJson, "module.display_3_5_tft.access.fpc_bend_volume");
  assertNodeHasPhysicalSpan(glbJson, "module.core_board_esp32_s3.access.usb_c_service_access");
  assertNodeHasPhysicalSpan(glbJson, "module.ambient_sensor_basic.access.sensor_wire_access");
  const displayAccess = glbJson.nodes.find((node) => node.name === "module.display_3_5_tft.access.fpc_bend_volume");
  assert.equal(displayAccess.extras.role, "access_volume_marker");
  assert.equal(displayAccess.extras.constraintSource, "component_descriptor_v2.accessVolumes");
  assert.match(displayAccess.extras.descriptorPath, /src\/core\/component_assets\/display_3_5_tft\/descriptor\.json/);
  assert.match(displayAccess.extras.sourcesPath, /src\/core\/component_assets\/display_3_5_tft\/sources\.md/);
  assert.ok(glbJson.nodes.some((node) => node.name === "route.coarse_cable_paths"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.display_to_core_board"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.sensor_to_core_board"));
  assert.ok(glbJson.nodes.some((node) => node.name === "route.display_to_core_board.segment.1"));
  assertNoZeroThicknessPreviewMeshes(glbJson);
  assert.equal(glbJson.extras.placedModuleCount >= 3, true);
  assert.ok(glbJson.extras.componentAssetManifest.components.some((component) => component.componentId === "display_3_5_tft"));
  assert.equal(glbJson.extras.mechanicalConstraintCoverage.proxyComponentCount >= 3, true);
  assert.equal(glbJson.extras.layoutExplanationCoverage.placementCount, modelJob.output.geometrySpec.placements.length);
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
  const assetManifest = JSON.parse(await readFile(modelJob.output.modelArtifacts.artifacts.componentAssetManifest.localPath, "utf8"));
  assert.equal(assetManifest.mechanicalConstraintCoverage.proxyComponentCount >= 3, true);
  assert.equal(assetManifest.components.find((component) => component.componentId === "display_3_5_tft").mechanicalConstraints.mounting.method, "captured_panel");
  assert.match(JSON.stringify(assetManifest), /procedural_visual_proxy/);
  const validationReport = JSON.parse(await readFile(modelJob.output.modelArtifacts.artifacts.validationReport.localPath, "utf8"));
  assert.equal(validationReport.mechanicalConstraints.version, "mechanical_constraints_v1");
  assert.equal(validationReport.layoutExplanation.version, "layout_explanation_v1");
  assert.ok(validationReport.issues.some((issue) => issue.code === "mechanical_constraint_trust_not_verified"));
  const generationEvidence = JSON.parse(await readFile(modelJob.output.modelArtifacts.artifacts.generationEvidenceReport.localPath, "utf8"));
  assert.equal(generationEvidence.version, "generation_evidence_report_v1");
  assert.equal(generationEvidence.status, "generated");
  assert.equal(generationEvidence.sourceOfTruth.generatedFromRawChat, false);
  assert.equal(generationEvidence.directEditingAllowed, false);
  assert.equal(generationEvidence.generatedArtifactsPresent, true);
  assert.equal(generationEvidence.layoutEvidence.coverage.placementCount, modelJob.output.geometrySpec.placements.length);
  assert.equal(generationEvidence.descriptorEvidence.mechanicalConstraintCoverage.proxyComponentCount >= 3, true);
  assert.equal(generationEvidence.artifactIntegrity.glb.present, true);
  assert.equal(generationEvidence.artifactIntegrity.glb.bytes, (await readFile(modelJob.output.modelArtifacts.artifacts.glb.localPath)).length);
  assert.equal(generationEvidence.artifactIntegrity.step.sha256.length, 64);
  assert.equal(generationEvidence.artifactAudit.version, "artifact_post_write_audit_v1");
  assert.equal(generationEvidence.artifactAudit.status, "passed");
  assert.equal(generationEvidence.artifactAudit.passed, true);
  assert.equal(generationEvidence.artifactAudit.checks.glb.format.glbMagic, true);
  assert.equal(generationEvidence.artifactAudit.checks.glb.format.version, 2);
  assert.equal(generationEvidence.artifactAudit.checks.glb.linePrimitiveCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.glb.thinMeshPrimitiveCount, 0);
  assert.deepEqual(generationEvidence.artifactAudit.checks.glb.thinMeshPrimitiveSamples, []);
  assert.equal(generationEvidence.artifactAudit.checks.glb.vec3AccessorMissingBoundsCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.glb.semanticNodePrefixes["shell."] >= 1, true);
  assert.equal(generationEvidence.artifactAudit.checks.glb.semanticNodePrefixes["module."] >= 3, true);
  assert.equal(generationEvidence.artifactAudit.checks.glb.semanticNodePrefixes["feature."] >= 1, true);
  assert.equal(generationEvidence.artifactAudit.checks.glb.semanticNodePrefixes["route."] >= 1, true);
  assert.equal(generationEvidence.artifactAudit.checks.stl.format.startsWithSolid, true);
  assert.equal(generationEvidence.artifactAudit.checks.stl.format.hasEndSolid, true);
  assert.equal(generationEvidence.artifactAudit.checks.stl.geometry.degenerateFacetCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.stl.geometry.thinAxisCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.shellFront.format.facetCount > 0, true);
  assert.equal(generationEvidence.artifactAudit.checks.shellFront.geometry.degenerateFacetCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.shellFront.geometry.thinAxisCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.shellBack.format.facetCount > 0, true);
  assert.equal(generationEvidence.artifactAudit.checks.shellBack.geometry.degenerateFacetCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.shellBack.geometry.thinAxisCount, 0);
  assert.equal(generationEvidence.artifactAudit.checks.step.format.hasStepHeader, true);
  assert.equal(generationEvidence.artifactAudit.checks.step.format.hasShellDimensions, true);
  assert.equal(generationEvidence.artifactAudit.checks.step.format.hasComponentAssetManifest, true);
  assert.equal(generationEvidence.artifactAudit.checks.step.format.hasModulePlacements, true);
  assert.equal(generationEvidence.artifactAudit.checks.step.metadata.shellDimensionsPositive, true);
  assert.equal(generationEvidence.artifactAudit.checks.step.metadata.directEditingBoundaryPresent, true);
  assert.equal(generationEvidence.artifactAudit.findings.length, 0);
  assert.ok(generationEvidence.artifactGroups.generated.includes("step"));
  const stepHandoff = await readFile(modelJob.output.modelArtifacts.artifacts.step.localPath, "utf8");
  assert.match(stepHandoff, /ISO-10303-21/);
  assert.match(stepHandoff, /module_placements/);
  assert.match(stepHandoff, /mechanical_constraints/);
  assert.match(stepHandoff, /layout_explanation/);
  const designSummary = await readFile(modelJob.output.modelArtifacts.artifacts.designSummary.localPath, "utf8");
  assert.match(designSummary, /Mechanical Proxy Notice/);
  assert.match(designSummary, /Mechanical Constraint Evidence/);
  assert.match(designSummary, /Layout Explanation Evidence/);

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
  assert.equal(pendingModelJob.output.modelArtifacts.artifacts.generationEvidenceReport, null);
  assert.equal(pendingModelJob.output.modelPreview.artifactTrust.generated, false);
  assert.equal(pendingModelJob.output.modelPreview.artifactTrust.trustedGenerated, false);

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
  assert.equal(first.mechanicalConstraints.version, "mechanical_constraints_v1");
  assert.equal(first.mechanicalConstraints.coverage.unverifiedProxyCount, first.componentDescriptors.length);
  assert.ok(first.mechanicalConstraints.components.some((component) => component.componentId === "core_board_esp32_s3" && component.mounting.holeCount === 4));
  assert.equal(first.layoutExplanation.version, "layout_explanation_v1");
  assert.equal(first.layoutExplanation.coverage.explainedPlacementCount, first.layoutExplanation.coverage.placementCount);
  assert.equal(first.layoutExplanation.coverage.explainedFeatureCount, first.layoutExplanation.coverage.featureCount);
  assert.equal(first.layoutExplanation.coverage.explainedRouteCount, first.layoutExplanation.coverage.routeCount);
  assert.ok(first.placements.length >= 3);
  assert.ok(first.features.some((feature) => feature.type === "screen_opening"));
  assert.ok(first.features.some((feature) => feature.type === "captured_panel_retention"));
  assert.ok(first.features.some((feature) => feature.type === "usb_cutout"));
  assert.ok(first.features.every((feature) => feature.source || feature.type === "split_line"));
  assert.ok(first.features.filter((feature) => feature.type === "standoff").length >= 4);
  assert.ok(first.routes.some((route) => route.id === "route.display_to_core_board"));
  assert.ok(first.routes.every((route) => route.from?.componentId && route.from?.connectorId && route.to?.componentId && route.to?.connectorId));
  assert.equal(first.metadata.placedModuleCount >= 3, true);
  assert.deepEqual(first.metadata.riskModuleIds, []);
  assert.equal(first.metadata.directEditingAllowed, false);
  assert.ok(first.metadata.assetQualitySummary.some((item) => item.assetQuality === "mechanical_proxy"));
  assert.equal(first.metadata.mechanicalConstraintSummary.proxyComponentCount, first.componentDescriptors.length);
  assert.equal(first.metadata.layoutExplanationSummary.routeCount, first.routes.length);
  const mismatchedOpeningValidation = validatePrototypeGeometry({
    productPlan: first.productPlan,
    componentSelection: {
      ...first.componentSelections,
      componentDescriptors: first.componentDescriptors
    },
    layout: {
      enclosure: first.enclosure,
      placements: first.placements,
      routes: first.routes,
      features: first.features.map((feature) => (
        feature.id === "feature.opening.usb_c"
          ? { ...feature, sizeMm: [1, 1] }
          : feature
      ))
    }
  });
  assert.equal(mismatchedOpeningValidation.canGenerateArtifacts, false);
  assert.ok(mismatchedOpeningValidation.errors.some((error) => (
    error.type === "external_feature_opening_size_mismatch"
    && error.componentId === "usb_c_breakout"
    && error.featureId === "usb_c_cutout"
  )));
  const missingCapturedPanelValidation = validatePrototypeGeometry({
    productPlan: first.productPlan,
    componentSelection: {
      ...first.componentSelections,
      componentDescriptors: first.componentDescriptors
    },
    layout: {
      enclosure: first.enclosure,
      placements: first.placements,
      routes: first.routes,
      features: first.features.filter((feature) => feature.type !== "captured_panel_retention")
    }
  });
  assert.equal(missingCapturedPanelValidation.canGenerateArtifacts, false);
  assert.ok(missingCapturedPanelValidation.errors.some((error) => (
    error.type === "missing_captured_panel_retention"
    && error.componentId === "display_5_tft"
  )));
  const missingEdgeCaptureValidation = validatePrototypeGeometry({
    productPlan: first.productPlan,
    componentSelection: {
      ...first.componentSelections,
      componentDescriptors: first.componentDescriptors
    },
    layout: {
      enclosure: first.enclosure,
      placements: first.placements,
      routes: first.routes,
      features: first.features.filter((feature) => feature.type !== "edge_capture_retention")
    }
  });
  assert.equal(missingEdgeCaptureValidation.canGenerateArtifacts, false);
  assert.ok(missingEdgeCaptureValidation.errors.some((error) => (
    error.type === "missing_edge_capture_retention"
    && error.componentId === "usb_c_breakout"
  )));

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
  assert.equal(blocked.artifacts.generationEvidenceReport.type, "generation_evidence_report");
  const blockedEvidence = JSON.parse(await readFile(blocked.artifacts.generationEvidenceReport.localPath, "utf8"));
  assert.equal(blockedEvidence.status, "blocked");
  assert.equal(blockedEvidence.generatedArtifactsPresent, false);
  assert.equal(blockedEvidence.validation.canGenerateArtifacts, false);
  assert.equal(blockedEvidence.artifactIntegrity.geometrySpec.present, true);
  assert.equal(blockedEvidence.artifactAudit.status, "not_required_blocked");
  assert.equal(blockedEvidence.artifactAudit.generatedArtifactKeys.length, 0);
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
