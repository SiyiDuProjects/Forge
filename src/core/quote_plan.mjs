export function createQuoteEstimate({ draft = {}, spec = {}, modules = [], riskReport = {}, quote = {} } = {}) {
  const sourceQuote = quote.range ? quote : draft.quote || {};
  const sourceModules = modules.length ? modules : draft.modules || [];
  const sourceSpec = spec.product_type ? spec : draft.spec || {};
  const sourceRisk = riskReport.items ? riskReport : draft.riskReport || {};
  const hardware = Number(sourceQuote.hardware ?? sourceQuote.bom ?? sourceQuote.low ?? 0);
  const build = Number(sourceQuote.build ?? sourceQuote.print_and_assembly ?? 0);
  const review = Number(sourceQuote.review ?? 0);

  return {
    pricingModel: "pre_review_estimate_with_assumptions",
    range: sourceQuote.range || "$0-$0",
    lineItems: [
      {
        label: "approved_modules",
        amountUsd: hardware,
        assumption: "Estimated from the internal standard module catalog."
      },
      {
        label: "print_and_assembly",
        amountUsd: build,
        assumption: "Assumes the standardized 3D printed desktop display shell."
      },
      {
        label: "human_review",
        amountUsd: review,
        assumption: "Final quote waits for internal human review."
      }
    ],
    assumptions: [
      "This is an internal pre-review estimate, not a payment price.",
      "No economy/standard/premium tiers are shown in v1 because alternate suppliers and cheaper part substitutions are not connected.",
      "Finish requests are treated as surface color or texture on the same standard 3D printed enclosure path.",
      `Product type: ${sourceSpec.product_type || "unknown"}`,
      `Approved module count: ${sourceModules.filter((module) => module.status === "approved").length}`
    ],
    riskNotes: (sourceRisk.items || []).map((item) => item.text),
    requiresHumanQuote: true
  };
}
