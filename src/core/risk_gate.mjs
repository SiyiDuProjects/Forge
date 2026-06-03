import { RISK_STATUS } from "../contracts/workbench_contract.mjs";

export function evaluateRisk(interpreted, modules) {
  const items = [
    {
      level: "ok",
      text: "USB-C indoor low-voltage build fits the first MVP boundary."
    },
    {
      level: "ok",
      text: "Uses approved modules instead of free-form PCB generation."
    }
  ];

  let reviewLevel = 0;
  let blocked = false;

  if (interpreted.options.speaker || interpreted.options.ambient) {
    reviewLevel = Math.max(reviewLevel, 1);
    items.push({
      level: "ok",
      text: "Optional sensor or speaker needs a quick module fit check."
    });
  }

  if (interpreted.productType === "prototype") {
    reviewLevel = Math.max(reviewLevel, 2);
    items.push({
      level: "warn",
      text: "Founder prototype requires manual scope and pricing review."
    });
  }

  if (interpreted.options.motor) {
    reviewLevel = Math.max(reviewLevel, 3);
    items.push({
      level: "warn",
      text: "Motion adds mechanical tolerance and durability review."
    });
  }

  for (const module of modules) {
    if (module.status === "deferred") {
      reviewLevel = Math.max(reviewLevel, 4);
      blocked = true;
    }
  }

  if (interpreted.options.camera) {
    items.push({
      level: "block",
      text: "Camera or recognition is outside the first version scope."
    });
  }

  if (interpreted.options.battery) {
    items.push({
      level: "block",
      text: "Battery power is deferred because of safety, shipping, and support risk."
    });
  }

  return {
    reviewLevel,
    blocked,
    status: blocked ? RISK_STATUS.BLOCKED : RISK_STATUS.READY,
    items
  };
}
