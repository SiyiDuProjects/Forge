import { includesAny } from "./utils.mjs";

export function generateDeviceConfig({ spec, behaviorText }) {
  const text = String(behaviorText || "").trim().toLowerCase();
  const rules = [];

  if (includesAny(text, ["morning", "am", "weekday"])) {
    rules.push({
      window: "07:00-11:00",
      action: includesAny(text, ["weather"]) ? "display.weather_card" : "display.daily_summary"
    });
  }

  if (includesAny(text, ["afternoon", "photo", "album"])) {
    rules.push({
      window: "11:00-18:00",
      action: "display.photo_slideshow"
    });
  }

  if (includesAny(text, ["evening", "night", "calendar", "tomorrow"])) {
    rules.push({
      window: "18:00-23:00",
      action: includesAny(text, ["calendar", "tomorrow"])
        ? "display.calendar_tomorrow"
        : "display.low_brightness_mode"
    });
  }

  if (includesAny(text, ["github", "build", "ci"])) {
    rules.push({
      trigger: "github.build_failed",
      action: "display.status_alert",
      params: {
        color: "red",
        duration_min: 15
      }
    });
  }

  if (rules.length === 0) {
    rules.push({
      window: "default",
      action: "display.photo_slideshow"
    });
  }

  return {
    device_id: "Y-DEMO-001",
    version: "draft",
    capability_check: spec?.hardware_capabilities || [],
    rules
  };
}
