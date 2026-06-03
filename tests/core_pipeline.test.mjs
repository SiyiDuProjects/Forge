import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { API_CONTRACT, RISK_STATUS, SUPPORTED_LANGUAGES, WORKBENCH_CHAIN } from "../src/contracts/workbench_contract.mjs";
import { createDeviceConfig, createDraft, listCatalogModules, submitReview } from "../src/core/pipeline.mjs";

test("draft pipeline creates a reviewable walnut desktop display packet", () => {
  const draft = createDraft({
    requestText:
      "Small retro walnut desktop screen with photos, weather, tomorrow calendar, GitHub build status, USB-C power, and night dimming."
  });

  assert.equal(draft.interpreted.productType, "display");
  assert.equal(draft.interpreted.screenSize, 3.5);
  assert.equal(draft.interpreted.finish, "walnut");
  assert.equal(draft.riskReport.blocked, false);
  assert.equal(draft.riskReport.status, RISK_STATUS.READY);
  assert.ok(draft.modules.some((module) => module.id === "core.y_core_lite"));
  assert.ok(draft.modules.some((module) => module.id === "sensor.ambient_light"));
  assert.equal(draft.spec.product_type, "ai_desktop_display");
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

test("servo motion remains reviewable but escalates to manufacturing check level 3", () => {
  const draft = createDraft({
    requestText: "A friendly companion display with weather, speaker alerts, and a small servo motion."
  });

  assert.equal(draft.interpreted.productType, "companion");
  assert.equal(draft.interpreted.options.motor, true);
  assert.equal(draft.riskReport.blocked, false);
  assert.equal(draft.riskReport.reviewLevel, 3);
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
  assert.ok(API_CONTRACT.some((route) => route.method === "POST" && route.path === "/api/pipeline/draft"));
});

test("frontend keeps Chinese and English language assets", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  assert.match(html, /id="languageSelect"/);
  assert.match(html, /value="zh"/);
  assert.match(html, /value="en"/);
  assert.match(html, /开始做原型/);
  assert.match(html, /零件清单（BOM）/);
  assert.match(html, /生产可行性（DFM）/);
  assert.match(app, /核桃木桌面屏/);
  assert.match(app, /Walnut desk display/);
  assert.match(app, /Parts list \(BOM\)/);
  assert.match(app, /Manufacturing check \(DFM\)/);
  assert.match(app, /SUPPORTED_LANGUAGES|langZh/);
});
