import { titleCase } from "./utils.mjs";

const catalog = [
  {
    id: "core.y_core_lite",
    category: "Core",
    name: "Y-Core Lite",
    detail: "ESP32-S3 class module",
    capabilities: ["screen", "wifi", "usb_c_power", "ota", "remote_config", "cloud_logs", "storage"],
    unitCost: 58,
    status: "approved"
  },
  {
    id: "display.tft_3_5",
    category: "Display",
    name: "3.5 inch TFT",
    detail: "Compact front bezel mount",
    capabilities: ["screen"],
    unitCost: 28,
    status: "approved"
  },
  {
    id: "display.tft_5",
    category: "Display",
    name: "5 inch TFT",
    detail: "Standard front bezel mount",
    capabilities: ["screen"],
    unitCost: 42,
    status: "approved"
  },
  {
    id: "display.tft_7",
    category: "Display",
    name: "7 inch TFT",
    detail: "Large front bezel mount",
    capabilities: ["screen"],
    unitCost: 66,
    status: "approved"
  },
  {
    id: "power.usb_c_low_voltage",
    category: "Power",
    name: "USB-C low voltage",
    detail: "No battery in MVP",
    capabilities: ["usb_c_power"],
    unitCost: 12,
    status: "approved"
  },
  {
    id: "sensor.ambient_light",
    category: "Sensor",
    name: "Ambient light",
    detail: "Night dimming",
    capabilities: ["ambient_light_sensor"],
    unitCost: 8,
    status: "approved"
  },
  {
    id: "audio.micro_speaker",
    category: "Audio",
    name: "Micro speaker",
    detail: "Short alerts",
    capabilities: ["speaker"],
    unitCost: 12,
    status: "approved"
  },
  {
    id: "motion.mini_servo",
    category: "Motion",
    name: "Mini servo",
    detail: "Level 3 review",
    capabilities: ["servo_motion"],
    unitCost: 18,
    status: "review"
  },
  {
    id: "vision.camera_request",
    category: "Vision",
    name: "Camera request",
    detail: "Deferred",
    capabilities: ["camera"],
    unitCost: 36,
    status: "deferred"
  },
  {
    id: "power.battery_request",
    category: "Power",
    name: "Battery request",
    detail: "Deferred",
    capabilities: ["battery"],
    unitCost: 32,
    status: "deferred"
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
    name: `${titleCase(finish)} enclosure`,
    detail: "Parameterized 3D printed shell",
    capabilities: ["enclosure"],
    unitCost: 24,
    status: "approved"
  };
}
