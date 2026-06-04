import { titleCase } from "./utils.mjs";

const catalog = [
  {
    id: "core.y_core_lite",
    category: "Core",
    name: "Y-Core Lite",
    detail: "ESP32-S3 class module",
    capabilities: ["screen", "wifi", "usb_c_power", "ota", "remote_config", "cloud_logs", "storage"],
    unitCost: 58,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 48, height: 38, depth: 7 },
      mounting: { type: "four_standoff", holePatternMm: { width: 40, height: 30 }, holeDiameterMm: 2.4 },
      interfaces: [
        { id: "usb_c_power", type: "usb_c", side: "back", direction: "rear" },
        { id: "display_ribbon", type: "fpc", side: "front", direction: "front" }
      ],
      clearanceMm: { board: 3, cable: 6 },
      riskTags: []
    }
  },
  {
    id: "display.tft_3_5",
    category: "Display",
    name: "3.5 inch TFT",
    detail: "Compact front bezel mount",
    capabilities: ["screen"],
    unitCost: 28,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 76, height: 50, depth: 5 },
      mounting: { type: "front_bezel", openingMarginMm: 4 },
      interfaces: [{ id: "display_ribbon", type: "fpc", side: "back", direction: "back" }],
      clearanceMm: { bezel: 2, cable: 5 },
      riskTags: []
    }
  },
  {
    id: "display.tft_5",
    category: "Display",
    name: "5 inch TFT",
    detail: "Standard front bezel mount",
    capabilities: ["screen"],
    unitCost: 42,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 112, height: 72, depth: 6 },
      mounting: { type: "front_bezel", openingMarginMm: 5 },
      interfaces: [{ id: "display_ribbon", type: "fpc", side: "back", direction: "back" }],
      clearanceMm: { bezel: 2, cable: 6 },
      riskTags: []
    }
  },
  {
    id: "display.tft_7",
    category: "Display",
    name: "7 inch TFT",
    detail: "Large front bezel mount",
    capabilities: ["screen"],
    unitCost: 66,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 156, height: 94, depth: 7 },
      mounting: { type: "front_bezel", openingMarginMm: 6 },
      interfaces: [{ id: "display_ribbon", type: "fpc", side: "back", direction: "back" }],
      clearanceMm: { bezel: 3, cable: 8 },
      riskTags: []
    }
  },
  {
    id: "power.usb_c_low_voltage",
    category: "Power",
    name: "USB-C low voltage",
    detail: "Default desktop power path",
    capabilities: ["usb_c_power"],
    unitCost: 12,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 14, height: 9, depth: 7 },
      mounting: { type: "edge_connector", openingMm: { width: 12, height: 5 } },
      interfaces: [{ id: "usb_c_rear", type: "usb_c", side: "back", direction: "rear" }],
      clearanceMm: { cable: 10 },
      riskTags: []
    }
  },
  {
    id: "sensor.ambient_light",
    category: "Sensor",
    name: "Ambient light",
    detail: "Night dimming",
    capabilities: ["ambient_light_sensor"],
    unitCost: 8,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 10, height: 8, depth: 3 },
      mounting: { type: "front_window", openingMm: { width: 6, height: 4 } },
      interfaces: [{ id: "sensor_jst", type: "jst", side: "back", direction: "internal" }],
      clearanceMm: { cable: 4 },
      riskTags: []
    }
  },
  {
    id: "audio.micro_speaker",
    category: "Audio",
    name: "Micro speaker",
    detail: "Short alerts",
    capabilities: ["speaker"],
    unitCost: 12,
    status: "approved",
    geometry: {
      dimensionsMm: { width: 22, height: 22, depth: 6 },
      mounting: { type: "grille_mount", openingMm: { width: 18, height: 4 } },
      interfaces: [{ id: "speaker_jst", type: "jst", side: "back", direction: "internal" }],
      clearanceMm: { cable: 5, acoustic: 3 },
      riskTags: ["fit_review"]
    }
  },
  {
    id: "motion.mini_servo",
    category: "Motion",
    name: "Mini servo",
    detail: "Level 3 review",
    capabilities: ["servo_motion"],
    unitCost: 18,
    status: "review",
    geometry: {
      dimensionsMm: { width: 23, height: 12, depth: 24 },
      mounting: { type: "motion_mount", holePatternMm: { width: 18, height: 8 }, holeDiameterMm: 2 },
      interfaces: [{ id: "servo_pwm", type: "pwm", side: "internal", direction: "internal" }],
      clearanceMm: { sweep: 20, cable: 5 },
      riskTags: ["motion_blocked", "manual_expansion"]
    }
  },
  {
    id: "vision.camera_request",
    category: "Vision",
    name: "Camera request",
    detail: "Human review required",
    capabilities: ["camera"],
    unitCost: 36,
    status: "review",
    geometry: {
      dimensionsMm: { width: 18, height: 18, depth: 6 },
      mounting: { type: "front_window", openingMm: { width: 8, height: 8 } },
      interfaces: [{ id: "camera_ribbon", type: "fpc", side: "back", direction: "internal" }],
      clearanceMm: { cable: 6, privacy: 0 },
      riskTags: ["human_review", "privacy_review"]
    }
  },
  {
    id: "power.battery_request",
    category: "Power",
    name: "Battery request",
    detail: "Human review required",
    capabilities: ["battery"],
    unitCost: 32,
    status: "review",
    geometry: {
      dimensionsMm: { width: 58, height: 36, depth: 8 },
      mounting: { type: "adhesive_tray", retentionLipMm: 1.2 },
      interfaces: [{ id: "battery_leads", type: "power_leads", side: "internal", direction: "internal" }],
      clearanceMm: { cable: 8, thermal: 4 },
      riskTags: ["human_review", "safety_review", "shipping_review"]
    }
  }
];

export function listCatalogModules() {
  return catalog;
}

export function matchModules(interpreted) {
  const modules = [
    findModule("core.y_core_lite"),
    findModule(`display.tft_${String(interpreted.screenSize).replace(".", "_")}`) || findModule("display.tft_5"),
    findModule("power.usb_c_low_voltage"),
    enclosureModule(interpreted.finish)
  ];

  if (interpreted.options.ambient) modules.push(findModule("sensor.ambient_light"));
  if (interpreted.options.speaker) modules.push(findModule("audio.micro_speaker"));
  if (interpreted.options.motor) modules.push(findModule("motion.mini_servo"));
  if (interpreted.options.camera) modules.push(findModule("vision.camera_request"));
  if (interpreted.options.battery) modules.push(findModule("power.battery_request"));

  return modules.filter(Boolean);
}

function findModule(id) {
  return catalog.find((module) => module.id === id);
}

function enclosureModule(finish) {
  return {
    id: `enclosure.${finish}`,
    category: "Shell",
    name: `${titleCase(finish)} 3D printed shell`,
    detail: "Standard parameterized enclosure; finish is color or texture only",
    capabilities: ["enclosure"],
    unitCost: 24,
    status: "approved",
    geometry: {
      dimensionsFrom: "spec.enclosure",
      mounting: { type: "standard_shell" },
      interfaces: [],
      clearanceMm: { wall: 2.4, assembly: 2 },
      riskTags: []
    }
  };
}
