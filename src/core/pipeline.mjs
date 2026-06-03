import { generateDeviceConfig } from "./device_config.mjs";
import { listCatalogModules as readCatalogModules, matchModules } from "./module_catalog.mjs";
import { createProductSpec } from "./product_spec.mjs";
import { estimateQuote } from "./quote_estimator.mjs";
import { evaluateRisk } from "./risk_gate.mjs";
import { interpretRequest } from "./text_interpreter.mjs";
import { createReviewSubmission } from "./review_queue.mjs";

export function createDraft({ requestText, overrides = {} }) {
  const interpreted = interpretRequest(requestText, overrides);
  const modules = matchModules(interpreted);
  const riskReport = evaluateRisk(interpreted, modules);
  const quote = estimateQuote(interpreted, modules, riskReport);
  const spec = createProductSpec(interpreted, modules, riskReport, quote);

  return {
    requestText: interpreted.requestText,
    interpreted,
    modules,
    riskReport,
    quote,
    spec
  };
}

export function createDeviceConfig({ spec, behaviorText }) {
  return {
    config: generateDeviceConfig({ spec, behaviorText })
  };
}

export function listCatalogModules() {
  return readCatalogModules();
}

export async function submitReview({ draft, behaviorConfig }) {
  return createReviewSubmission({ draft, behaviorConfig });
}
