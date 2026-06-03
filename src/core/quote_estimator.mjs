export function estimateQuote(interpreted, modules, riskReport) {
  const hardware = modules.reduce((sum, module) => sum + Number(module.unitCost || 0), 0);
  let build = 78 + Math.round(Number(interpreted.screenSize || 5) * 4);
  let review = 24 + riskReport.reviewLevel * 22;

  if (interpreted.options.motor) build += 32;
  if (interpreted.productType === "prototype") {
    build += 58;
    review += 70;
  }
  if (interpreted.options.camera) review += 90;
  if (interpreted.options.battery) review += 120;

  const low = hardware + build + review;
  const high = Math.round(low * 1.26);

  return {
    hardware,
    build,
    review,
    low,
    high,
    range: `$${low}-$${high}`
  };
}
