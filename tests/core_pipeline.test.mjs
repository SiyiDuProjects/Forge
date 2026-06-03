import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT, JOB_CAPABILITY, PRODUCT_PLAN_STATUS, RISK_STATUS, SUPPORTED_LANGUAGES, WORKBENCH_CHAIN } from "../src/contracts/workbench_contract.mjs";
import { createGenerationJob } from "../src/core/jobs.mjs";
import { createDeviceConfig, createDraft, listCatalogModules, submitReview } from "../src/core/pipeline.mjs";
import { addProductPlanTurn, createProductPlan, submitProductPlanReview } from "../src/core/product_plan.mjs";

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

test("camera and battery requests are blocked before manufacturing check queueing", async () => {
  const draft = createDraft({
    requestText: "A portable wireless display with camera recognition and battery power."
  });

  assert.equal(draft.interpreted.options.camera, true);
  assert.equal(draft.interpreted.options.battery, true);
  assert.equal(draft.riskReport.blocked, true);
  assert.equal(draft.riskReport.status, RISK_STATUS.BLOCKED);
  assert.ok(draft.riskReport.items.some((item) => item.level === "block" && item.text.includes("Camera")));
  assert.ok(draft.riskReport.items.some((item) => item.level === "block" && item.text.includes("Battery")));

  const submission = await submitReview({ draft, behaviorConfig: {} });
  assert.equal(submission.accepted, false);
  assert.equal(submission.reason, "Draft is blocked by risk gate");
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
  assert.ok(WORKBENCH_CHAIN.includes("draft_model_preview"));
  assert.ok(WORKBENCH_CHAIN.includes("draft_electronics_layout"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/pipeline/draft"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/plans"));
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/model/generate"));
});

test("frontend keeps Chinese and English language assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  assert.match(html, /id="languageSelect"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="en"/);
  assert.match(html, /对话生成/);
  assert.match(html, /提交审核下单/);
  assert.match(html, /ProductPlan/);
  assert.match(app, /木纹桌面屏/);
  assert.match(app, /Woodgrain desk display/);
  assert.match(app, /标准 3D 打印外壳/);
  assert.match(app, /Standard 3D printed shell/);
  assert.match(app, /Parts list \(BOM\)/);
  assert.match(app, /Structure \/ 3D placeholder/);
  assert.match(app, /SUPPORTED_LANGUAGES|langZh/);
});

test("ProductPlan creates revisions and generation placeholders", () => {
  const { productPlan, revision } = createProductPlan({
    initialMessage: "Small woodgrain desktop screen for weather and photos, 3.5 inch, USB-C powered.",
    language: "en"
  });

  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.STANDARD_SUPPORTED);
  assert.equal(productPlan.currentRevisionId, revision.revisionId);
  assert.equal(productPlan.revisions.length, 1);
  assert.ok(revision.modelPreview.viewerType);
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
});

test("non-standard products become manual expansion drafts", () => {
  const { productPlan, revision } = createProductPlan({
    initialMessage: "I want a smart water bottle with reminders and a glowing cap."
  });

  assert.equal(productPlan.status, PRODUCT_PLAN_STATUS.MANUAL_EXPANSION_DRAFT);
  assert.equal(revision.productCategory, "manual_expansion");
});

test("generation jobs expose model, layout, and quote outputs", () => {
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
  assert.equal(modelJob.output.modelPreview.viewerType, "placeholder_3d");
  assert.ok(modelJob.output.modelPreview.assets.glb);

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

test("ProductPlan review submission writes a human review packet", async () => {
  const { productPlan, revision } = createProductPlan({
    initialMessage: "Small woodgrain desktop screen for weather and photos, 3.5 inch, USB-C powered."
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
  assert.ok(packet.quote.range);
  assert.ok(packet.quoteAssumptions.length > 0);
  assert.ok(packet.riskReport.items.length > 0);
  assert.equal(packet.paymentStatus, "not_collected");
  assert.equal(packet.productionStatus, "not_started");
});
