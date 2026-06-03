export function createElectronicsLayout({ spec = {}, modules = [], modelPreview = {} } = {}) {
  const dimensions = modelPreview.modelParameters?.dimensionsMm || {
    width: 188,
    height: 120,
    depth: 38
  };
  const placements = modules
    .filter((module) => module.status !== "deferred")
    .map((module, index) => placementForModule(module, index, dimensions));
  const conflicts = conflictChecks(modules, dimensions);

  return {
    layoutType: "placeholder_electronics_fit",
    coordinateSystem: "enclosure_center_mm",
    enclosureDimensionsMm: dimensions,
    placements,
    connectorAccess: [
      {
        connector: "USB-C",
        side: "back",
        status: "reserved",
        note: "Rear cable access is reserved in the standard shell."
      }
    ],
    cableNotes: [
      "Use short screen ribbon path from core board to front display.",
      "Keep sensor and speaker wiring away from the USB-C strain relief.",
      "Final cable routing waits for human fit review."
    ],
    conflicts,
    notes: [
      "Layout is a v1 placeholder for electronic/mechanical fit review.",
      "It records positions and conflicts but is not a PCB or CAD placement file."
    ]
  };
}

function placementForModule(module, index, dimensions) {
  const byCapability = module.capabilities || [];
  if (byCapability.includes("screen")) {
    return {
      moduleId: module.id,
      name: module.name,
      role: "front_display",
      positionMm: { x: 0, y: 0, z: dimensions.depth / 2 - 5 },
      orientation: "front",
      interfaceDirection: "ribbon_to_core_board",
      fitStatus: "reserved"
    };
  }
  if (byCapability.includes("usb_c_power")) {
    return {
      moduleId: module.id,
      name: module.name,
      role: "power_input",
      positionMm: { x: 0, y: -dimensions.height / 2 + 14, z: -dimensions.depth / 2 + 5 },
      orientation: "back",
      interfaceDirection: "rear_usb_c_cutout",
      fitStatus: "reserved"
    };
  }
  if (byCapability.includes("ambient_light_sensor")) {
    return {
      moduleId: module.id,
      name: module.name,
      role: "ambient_sensor",
      positionMm: { x: -dimensions.width / 2 + 22, y: dimensions.height / 2 - 18, z: dimensions.depth / 2 - 4 },
      orientation: "front",
      interfaceDirection: "short_jst_to_core",
      fitStatus: "reserved"
    };
  }
  if (byCapability.includes("speaker")) {
    return {
      moduleId: module.id,
      name: module.name,
      role: "audio_alert",
      positionMm: { x: dimensions.width / 2 - 28, y: -dimensions.height / 2 + 18, z: 0 },
      orientation: "down",
      interfaceDirection: "speaker_grille",
      fitStatus: "needs_fit_review"
    };
  }
  return {
    moduleId: module.id,
    name: module.name,
    role: index === 0 ? "core_controller" : "support_module",
    positionMm: { x: 0, y: 0, z: -dimensions.depth / 2 + 11 + index * 2 },
    orientation: "back",
    interfaceDirection: "internal",
    fitStatus: "reserved"
  };
}

function conflictChecks(modules, dimensions) {
  const conflicts = [];
  if (dimensions.depth < 34) {
    conflicts.push({
      level: "warn",
      item: "enclosure_depth",
      note: "Depth is tight for core board standoffs and rear connector access."
    });
  }
  for (const module of modules) {
    if (module.status === "deferred") {
      conflicts.push({
        level: "block",
        item: module.name,
        note: "Deferred module cannot be placed in the v1 standard shell."
      });
    }
    if (module.capabilities?.includes("servo_motion")) {
      conflicts.push({
        level: "block",
        item: module.name,
        note: "Motion structure is outside the v1 no-mechanical-motion boundary."
      });
    }
  }
  if (conflicts.length === 0) {
    conflicts.push({
      level: "ok",
      item: "standard_shell_fit",
      note: "No placeholder collisions detected for approved modules."
    });
  }
  return conflicts;
}
