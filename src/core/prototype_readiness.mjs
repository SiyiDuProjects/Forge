import { clone } from "./workspace_state.mjs";

export const ELECTRONICS_DESCRIPTOR_VERSION = "electronics_descriptor_v1";
export const ELECTRONICS_SPEC_VERSION = "electronics_spec_v1";
export const ELECTRONICS_VALIDATION_VERSION = "electronics_validation_v1";
export const ASSEMBLY_PLAN_VERSION = "assembly_plan_v1";
export const DEVELOPMENT_BOARD_SCAFFOLD_VERSION = "development_board_scaffold_v1";
export const PROTOTYPE_READINESS_REPORT_VERSION = "prototype_readiness_report_v1";

const CORE_V1 = "Core V1";
const SUPPORTING_V1 = "Supporting V1";
const FUTURE_V2 = "Future V2";

const DEFAULT_BOARD_PINS = Object.freeze({
  display_spi: {
    sck: "GPIO12",
    mosi: "GPIO11",
    cs: "GPIO10",
    dc: "GPIO9",
    reset: "GPIO8",
    backlight: "GPIO7"
  },
  i2c0: {
    sda: "GPIO4",
    scl: "GPIO5"
  },
  buttons: ["GPIO1", "GPIO2", "GPIO3", "GPIO6"],
  speakerPwm: "GPIO13",
  camera: {
    pclk: "GPIO14",
    vsync: "GPIO15",
    href: "GPIO16",
    xclk: "GPIO17",
    data: ["GPIO18", "GPIO19", "GPIO20", "GPIO21"]
  }
});

const SEED_ELECTRONICS_DESCRIPTORS = Object.freeze({
  core_board_esp32_s3: {
    componentId: "core_board_esp32_s3",
    componentType: "core_board",
    displayName: "ESP32-S3 core board",
    mpn: "ESP32-S3-DevKitC controlled proxy",
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "ESP32-S3-WROOM reference datasheet",
      url: "controlled-source:esp32-s3-wroom",
      status: "datasheet_verified"
    },
    internalMeasurements: {
      available: false,
      note: "Proxy current budget; bench measurement is a future evidence upgrade."
    },
    version: "2026-06-07",
    trustLevel: "datasheet_verified",
    reviewStatus: "reviewable",
    forgeApproved: true,
    power: {
      role: "controller",
      inputRail: "5v_usb",
      operatingVoltage: 5,
      nominalCurrentMa: 180,
      peakCurrentMa: 320,
      outputRails: [
        { rail: "3v3", voltage: 3.3, maxCurrentMa: 500 }
      ]
    },
    board: {
      family: "esp32_s3",
      pinMap: DEFAULT_BOARD_PINS,
      supportedInterfaces: ["gpio", "i2c", "spi", "i2s", "usb", "camera_parallel"]
    },
    connectors: [
      { connectorId: "usb_c", interfaceType: "usb", rail: "5v_usb" },
      { connectorId: "display_port", interfaceType: "spi", bus: "display_spi" },
      { connectorId: "i2c", interfaceType: "i2c", bus: "i2c0" },
      { connectorId: "speaker", interfaceType: "gpio_pwm" },
      { connectorId: "gpio", interfaceType: "gpio" }
    ]
  },
  display_3_5_tft: displayDescriptor({
    componentId: "display_3_5_tft",
    displayName: "3.5 inch TFT display",
    nominalCurrentMa: 150,
    peakCurrentMa: 240
  }),
  display_5_tft: displayDescriptor({
    componentId: "display_5_tft",
    displayName: "5 inch TFT display",
    nominalCurrentMa: 220,
    peakCurrentMa: 360
  }),
  usb_c_breakout: {
    componentId: "usb_c_breakout",
    componentType: "interface",
    displayName: "USB-C power breakout",
    mpn: "USB-C-5V-breakout controlled proxy",
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "USB-C breakout controlled bench spec",
      url: "controlled-source:usb-c-breakout",
      status: "internal_spec"
    },
    internalMeasurements: {
      available: false,
      note: "Bench stock source is controlled; full load test remains review evidence."
    },
    version: "2026-06-07",
    trustLevel: "datasheet_verified",
    reviewStatus: "reviewable",
    forgeApproved: true,
    power: {
      role: "power_input",
      outputRail: "5v_usb",
      operatingVoltage: 5,
      maxCurrentMa: 1500,
      nominalCurrentMa: 0,
      peakCurrentMa: 0
    },
    connectors: [
      { connectorId: "usb_c", interfaceType: "usb_power_input", rail: "5v_usb" },
      { connectorId: "power_out", interfaceType: "power_leads", rail: "5v_usb" }
    ]
  },
  ambient_sensor_basic: {
    componentId: "ambient_sensor_basic",
    componentType: "sensor",
    displayName: "Ambient light sensor",
    mpn: "BH1750-class controlled proxy",
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "Ambient I2C light sensor controlled proxy spec",
      url: "controlled-source:ambient-sensor",
      status: "datasheet_verified"
    },
    internalMeasurements: {
      available: false,
      note: "Low-current I2C sensor proxy."
    },
    version: "2026-06-07",
    trustLevel: "datasheet_verified",
    reviewStatus: "reviewable",
    forgeApproved: true,
    power: {
      role: "load",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa: 2,
      peakCurrentMa: 5
    },
    interfaces: [
      { id: "ambient_i2c", type: "i2c", bus: "i2c0", connectorId: "signal" }
    ]
  },
  button_6mm: {
    componentId: "button_6mm",
    componentType: "button",
    displayName: "6 mm panel button",
    mpn: "BTN-6MM controlled proxy",
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "Panel button controlled proxy spec",
      url: "controlled-source:button-6mm",
      status: "internal_spec"
    },
    internalMeasurements: {
      available: false,
      note: "Switch continuity only; no active current load."
    },
    version: "2026-06-07",
    trustLevel: "datasheet_verified",
    reviewStatus: "reviewable",
    forgeApproved: true,
    power: {
      role: "passive",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa: 0,
      peakCurrentMa: 1
    },
    interfaces: [
      { id: "button_gpio", type: "gpio", connectorId: "signal" }
    ]
  },
  speaker_20mm: {
    componentId: "speaker_20mm",
    componentType: "speaker",
    displayName: "20 mm speaker",
    mpn: "SPK-20MM controlled proxy",
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "Small speaker controlled proxy spec",
      url: "controlled-source:speaker-20mm",
      status: "internal_spec"
    },
    internalMeasurements: {
      available: false,
      note: "Audio output path is prototype-level only."
    },
    version: "2026-06-07",
    trustLevel: "reviewable_proxy",
    reviewStatus: "reviewable",
    forgeApproved: true,
    requiresHumanReview: true,
    power: {
      role: "load",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa: 60,
      peakCurrentMa: 120
    },
    interfaces: [
      { id: "speaker_pwm", type: "gpio_pwm", connectorId: "signal" }
    ]
  },
  camera_module_basic: {
    componentId: "camera_module_basic",
    componentType: "camera",
    displayName: "Camera module",
    mpn: "CAM-basic controlled review proxy",
    supplier: {
      name: "Forge review stock only",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: "Camera module review proxy spec",
      url: "controlled-source:camera-module",
      status: "review_required"
    },
    internalMeasurements: {
      available: false,
      note: "Camera requests remain human-review risk items."
    },
    version: "2026-06-07",
    trustLevel: "reviewable_proxy",
    reviewStatus: "human_review_required",
    forgeApproved: false,
    requiresHumanReview: true,
    power: {
      role: "load",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa: 120,
      peakCurrentMa: 220
    },
    interfaces: [
      { id: "camera_parallel", type: "camera_parallel", connectorId: "signal" }
    ]
  },
  battery_lipo_2000: batteryDescriptor({
    componentId: "battery_lipo_2000",
    displayName: "2000 mAh LiPo battery"
  }),
  battery_18650_holder: batteryDescriptor({
    componentId: "battery_18650_holder",
    displayName: "18650 battery holder"
  })
});

function displayDescriptor({ componentId, displayName, nominalCurrentMa, peakCurrentMa }) {
  return {
    componentId,
    componentType: "display",
    displayName,
    mpn: `${componentId} controlled proxy`,
    supplier: {
      name: "Forge controlled bench stock",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: `${displayName} controlled proxy spec`,
      url: `controlled-source:${componentId}`,
      status: "datasheet_verified"
    },
    internalMeasurements: {
      available: false,
      note: "Display current budget is datasheet-level prototype evidence."
    },
    version: "2026-06-07",
    trustLevel: "datasheet_verified",
    reviewStatus: "reviewable",
    forgeApproved: true,
    power: {
      role: "load",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa,
      peakCurrentMa
    },
    interfaces: [
      { id: "display_spi", type: "spi", bus: "display_spi", connectorId: "fpc" }
    ]
  };
}

function batteryDescriptor({ componentId, displayName }) {
  return {
    componentId,
    componentType: "battery",
    displayName,
    mpn: `${componentId} controlled review proxy`,
    supplier: {
      name: "Forge review stock only",
      url: "",
      status: "vetted_internal_source"
    },
    datasheet: {
      title: `${displayName} review proxy spec`,
      url: `controlled-source:${componentId}`,
      status: "review_required"
    },
    internalMeasurements: {
      available: false,
      note: "Battery path requires human risk review before prototype build."
    },
    version: "2026-06-07",
    trustLevel: "reviewable_proxy",
    reviewStatus: "human_review_required",
    forgeApproved: false,
    requiresHumanReview: true,
    power: {
      role: "battery_source",
      outputRail: "battery",
      operatingVoltage: 3.7,
      nominalCurrentMa: 0,
      peakCurrentMa: 0
    },
    interfaces: [
      { id: "battery_power", type: "power", connectorId: componentId === "battery_18650_holder" ? "power_leads" : "power_lead" }
    ]
  };
}

export function listElectronicsDescriptors() {
  return Object.values(SEED_ELECTRONICS_DESCRIPTORS).map((descriptor) => clone(descriptor));
}

export function getElectronicsDescriptor(componentId) {
  const descriptor = SEED_ELECTRONICS_DESCRIPTORS[componentId];
  return descriptor ? clone(descriptor) : null;
}

export function createPrototypeReadinessPackage({
  productPlan = {},
  geometrySpec = {},
  electronicsLayout = null,
  revisionId = ""
} = {}) {
  const electronicsSpec = createElectronicsSpec({
    productPlan,
    geometrySpec,
    revisionId
  });
  const electronicsValidation = validateElectronicsSpec({
    electronicsSpec,
    geometrySpec
  });
  const assemblyPlan = createAssemblyPlan({
    productPlan,
    geometrySpec,
    electronicsSpec,
    electronicsValidation
  });
  const developmentBoardScaffold = createDevelopmentBoardScaffold({
    productPlan,
    electronicsSpec,
    electronicsValidation
  });
  const prototypeReadinessReport = createPrototypeReadinessReport({
    productPlan,
    geometrySpec,
    electronicsLayout,
    electronicsSpec,
    electronicsValidation,
    assemblyPlan,
    developmentBoardScaffold,
    revisionId
  });
  return {
    electronicsSpec,
    electronicsValidation,
    assemblyPlan,
    developmentBoardScaffold,
    prototypeReadinessReport
  };
}

export function createElectronicsSpec({ productPlan = {}, geometrySpec = {}, revisionId = "" } = {}) {
  const componentDescriptors = Array.isArray(geometrySpec.componentDescriptors)
    ? geometrySpec.componentDescriptors
    : [];
  const selectedComponentIds = selectedComponentIdsFor(geometrySpec, componentDescriptors);
  const componentQuantities = geometrySpec.componentSelections?.componentQuantities || {};
  const electronicsDescriptors = selectedComponentIds.map((componentId) => {
    const componentDescriptor = componentDescriptors.find((descriptor) => descriptor.id === componentId);
    return descriptorForComponent(componentId, componentDescriptor);
  });
  const mainController = electronicsDescriptors.find((descriptor) => descriptor.componentType === "core_board") || null;
  const powerInputs = electronicsDescriptors
    .filter((descriptor) => ["power_input", "battery_source"].includes(descriptor.power?.role))
    .map(powerInputRecord);
  const peripherals = electronicsDescriptors
    .filter((descriptor) => !["core_board", "interface"].includes(descriptor.componentType))
    .map((descriptor) => peripheralRecord(descriptor, componentQuantities));
  const powerBudget = powerBudgetFor({ mainController, electronicsDescriptors, componentQuantities });
  const interfaceAssignments = interfaceAssignmentsFor({
    mainController,
    electronicsDescriptors,
    componentQuantities
  });
  const cableLinks = cableLinksFor({
    geometrySpec,
    electronicsDescriptors
  });

  return {
    version: ELECTRONICS_SPEC_VERSION,
    scopeClassification: CORE_V1,
    revisionId,
    source: "product_plan_component_descriptors_and_electronics_descriptors",
    sourceOfTruth: {
      productPlan: "ProductPlan",
      componentDescriptors: "ComponentDescriptor v2",
      electronicsDescriptors: "ElectronicsDescriptor v1",
      geometrySpec: "GeometrySpec for route and placement linkage",
      electronicsSpecDerived: true,
      directEditingAllowed: false
    },
    productPlan: {
      productType: productPlan.productType || "",
      userIntent: productPlan.userIntent || "",
      requirements: clone(productPlan.requirements || {})
    },
    selectedComponentIds,
    componentTrust: electronicsDescriptors.map(componentTrustRecord),
    electronicsDescriptors: electronicsDescriptors.map(compactElectronicsDescriptor),
    mainController: mainController
      ? {
        componentId: mainController.componentId,
        boardFamily: mainController.board?.family || "",
        supportedInterfaces: mainController.board?.supportedInterfaces || [],
        outputRails: mainController.power?.outputRails || []
      }
      : null,
    powerInputs,
    peripherals,
    powerBudget,
    interfaceAssignments,
    cableLinks,
    assumptions: [
      "Core V1 checks modular prototype readiness only.",
      "ElectronicsSpec is derived from ProductPlan, ComponentDescriptor, ElectronicsDescriptor, and GeometrySpec; it is not a new source of truth.",
      "Current pin maps are bring-up scaffolds, not production firmware assignments.",
      "Custom PCB, production certification, supplier ordering, OTA, and full firmware runtime are Future V2 or out of scope."
    ],
    futureV2: [
      {
        item: "custom_pcb_readiness",
        classification: FUTURE_V2,
        reason: "Prototype Readiness V1 uses modular dev-board wiring only."
      },
      {
        item: "full_firmware_runtime",
        classification: FUTURE_V2,
        reason: "V1 emits bring-up scaffold and checklists only."
      }
    ],
    directEditingAllowed: false
  };
}

export function validateElectronicsSpec({ electronicsSpec = {}, geometrySpec = {} } = {}) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const addCheck = (name, status, detail = {}) => checks.push({ name, status, ...detail });

  if (!electronicsSpec.mainController?.componentId) {
    errors.push(issue("missing_main_controller", "ElectronicsSpec requires a Forge-controlled main controller."));
  }

  const trustWarnings = electronicsSpec.componentTrust
    .filter((item) => item.trustLevel === "reviewable_proxy" || item.forgeApproved === false || item.reviewStatus === "human_review_required")
    .map((item) => issue("component_requires_review", `${item.componentId} is not fully Forge-approved for unattended prototype build.`, {
      componentId: item.componentId,
      trustLevel: item.trustLevel,
      reviewStatus: item.reviewStatus
    }));
  warnings.push(...trustWarnings);
  addCheck("component_trust", trustWarnings.length ? "warning" : "pass", {
    componentCount: electronicsSpec.componentTrust.length,
    reviewItemCount: trustWarnings.length
  });

  const powerInput = electronicsSpec.powerInputs.find((input) => input.rail === "5v_usb");
  if (!powerInput && !electronicsSpec.powerInputs.find((input) => input.rail === "battery")) {
    errors.push(issue("power_input_missing", "No controlled USB-C or battery power input is selected."));
  }
  const powerErrors = [];
  for (const rail of electronicsSpec.powerBudget.rails || []) {
    if (rail.availableMa > 0 && rail.peakLoadMa > rail.availableMa) {
      powerErrors.push(issue("rail_current_exceeded", `${rail.rail} peak current exceeds available prototype budget.`, {
        rail: rail.rail,
        peakLoadMa: rail.peakLoadMa,
        availableMa: rail.availableMa
      }));
    }
  }
  errors.push(...powerErrors);
  addCheck("power_budget", powerErrors.length ? "blocked" : "pass", {
    rails: electronicsSpec.powerBudget.rails || []
  });

  const assignmentErrors = [];
  for (const assignment of electronicsSpec.interfaceAssignments || []) {
    if (assignment.status === "blocked") {
      assignmentErrors.push(issue("interface_assignment_blocked", assignment.note || `${assignment.componentId} interface assignment is blocked.`, {
        componentId: assignment.componentId,
        interfaceType: assignment.interfaceType
      }));
    }
  }
  errors.push(...assignmentErrors);
  addCheck("interface_assignment", assignmentErrors.length ? "blocked" : "pass", {
    assignmentCount: (electronicsSpec.interfaceAssignments || []).length
  });

  const pinConflicts = pinConflictRecords(electronicsSpec.interfaceAssignments || []);
  errors.push(...pinConflicts.map((conflict) => issue("pin_conflict", `${conflict.pin} is assigned to multiple non-shared signals.`, conflict)));
  addCheck("pin_conflicts", pinConflicts.length ? "blocked" : "pass", {
    conflictCount: pinConflicts.length
  });

  const missingRoutes = routeWarnings(electronicsSpec, geometrySpec);
  warnings.push(...missingRoutes);
  addCheck("geometry_route_alignment", missingRoutes.length ? "warning" : "pass", {
    missingRouteCount: missingRoutes.length
  });

  const status = errors.length ? "blocked" : warnings.length ? "warning" : "pass";
  return {
    version: ELECTRONICS_VALIDATION_VERSION,
    scopeClassification: CORE_V1,
    status,
    canEnterPrototypeBuild: status !== "blocked",
    checks,
    errors,
    warnings,
    fixSuggestions: [
      ...errors.map(fixSuggestionForIssue),
      ...warnings.filter((warning) => warning.type === "component_requires_review").map(fixSuggestionForIssue)
    ],
    boundaries: {
      customPcb: false,
      emiValidation: false,
      highSpeedSignalIntegrity: false,
      certification: false,
      precisionPowerSimulation: false,
      productionReadinessClaim: false
    },
    directEditingAllowed: false
  };
}

export function createAssemblyPlan({
  productPlan = {},
  geometrySpec = {},
  electronicsSpec = {},
  electronicsValidation = {}
} = {}) {
  const placements = Array.isArray(geometrySpec.placements) ? geometrySpec.placements : [];
  const routes = Array.isArray(geometrySpec.routes) ? geometrySpec.routes : [];
  const features = Array.isArray(geometrySpec.features) ? geometrySpec.features : [];
  const selectedComponentIds = electronicsSpec.selectedComponentIds || [];
  const steps = [
    step("prep_shell_back", "Inspect printed rear tray, standoffs, and cable exits.", {
      geometryRefs: featureIds(features, ["standoff", "usb_cutout", "split_line"])
    }),
    step("install_core_board", "Install the core board on descriptor-backed standoffs before plugging external modules.", {
      componentId: "core_board_esp32_s3",
      geometryRefs: placementIds(placements, ["core_board_esp32_s3"])
    }),
    step("connect_display", "Connect the display ribbon before closing the front shell.", {
      componentId: displayComponentId(selectedComponentIds),
      routeRefs: routeIdsFor(routes, displayComponentId(selectedComponentIds))
    }),
    step("seat_display", "Seat the display against the captured-panel retention geometry.", {
      componentId: displayComponentId(selectedComponentIds),
      geometryRefs: featureIds(features, ["captured_panel_retention", "screen_opening"])
    }),
    step("install_usb_c", "Install USB-C breakout and verify rear plug insertion clearance.", {
      componentId: "usb_c_breakout",
      routeRefs: routeIdsFor(routes, "usb_c_breakout"),
      geometryRefs: featureIds(features, ["usb_cutout", "edge_capture_retention"])
    }),
    ...optionalAssemblySteps({ selectedComponentIds, placements, routes, features }),
    step("close_shell", "Close front and rear shells only after cable slack and service access are checked.", {
      geometryRefs: featureIds(features, ["split_line"])
    }),
    step("bring_up_check", "Run development-board bring-up tests before any internal review handoff.", {
      electronicsRefs: (electronicsSpec.interfaceAssignments || []).map((assignment) => assignment.assignmentId)
    })
  ];
  const riskItems = [
    ...routeWarnings(electronicsSpec, geometrySpec).map((warning) => ({
      type: warning.type,
      level: "warning",
      message: warning.message,
      componentId: warning.componentId || ""
    })),
    ...((electronicsValidation.warnings || []).filter((warning) => warning.type === "component_requires_review").map((warning) => ({
      type: warning.type,
      level: "warning",
      message: warning.message,
      componentId: warning.componentId || ""
    }))),
    ...((electronicsValidation.errors || []).map((error) => ({
      type: error.type,
      level: "blocked",
      message: error.message,
      componentId: error.componentId || ""
    })))
  ];
  return {
    version: ASSEMBLY_PLAN_VERSION,
    scopeClassification: CORE_V1,
    status: electronicsValidation.status === "blocked"
      ? "blocked"
      : riskItems.length ? "needs_review" : "feasible",
    sourceOfTruth: {
      productPlan: "ProductPlan",
      geometrySpec: "GeometrySpec placements, features, routes, cable exits, and access volumes",
      electronicsSpec: "ElectronicsSpec interface and power assignments",
      directEditingAllowed: false
    },
    productType: productPlan.productType || "desktop_display",
    geometryLinkage: {
      placementCount: placements.length,
      routeCount: routes.length,
      featureCount: features.length,
      routeIds: routes.map((route) => route.id).filter(Boolean)
    },
    steps,
    riskItems,
    boundaries: {
      fullDfa: false,
      injectionMolding: false,
      snapLifecycleAnalysis: false,
      productionAssemblyOptimization: false,
      roboticAssembly: false
    },
    directEditingAllowed: false
  };
}

export function createDevelopmentBoardScaffold({ electronicsSpec = {}, electronicsValidation = {} } = {}) {
  const board = electronicsSpec.mainController || {};
  const assignments = electronicsSpec.interfaceAssignments || [];
  const status = electronicsValidation.status === "blocked" || !board.componentId
    ? "missing_information"
    : "generated";
  return {
    version: DEVELOPMENT_BOARD_SCAFFOLD_VERSION,
    scopeClassification: SUPPORTING_V1,
    status,
    targetBoard: {
      componentId: board.componentId || "",
      boardFamily: board.boardFamily || "",
      productionFirmware: false
    },
    pinMap: assignments.flatMap((assignment) => assignment.pins || []),
    interfaceMap: assignments.map((assignment) => ({
      assignmentId: assignment.assignmentId,
      componentId: assignment.componentId,
      interfaceType: assignment.interfaceType,
      bus: assignment.bus || "",
      status: assignment.status
    })),
    files: [
      {
        path: "firmware/bringup/pin_map.json",
        purpose: "Pin and interface map for internal bring-up only."
      },
      {
        path: "firmware/bringup/main.cpp",
        purpose: "Module init scaffold and smoke-test entrypoint."
      },
      {
        path: "firmware/bringup/bringup_checklist.md",
        purpose: "Manual bench checklist for power-on and module tests."
      }
    ],
    moduleInitScaffold: assignments.map((assignment) => moduleInitForAssignment(assignment)),
    testEntrypoints: [
      "boot_serial_log",
      "display_test_pattern",
      "button_gpio_event",
      "ambient_sensor_read",
      "usb_power_stability_check"
    ],
    checklist: [
      "Power board from current-limited USB-C bench supply.",
      "Confirm 3.3V rail before attaching display or sensor modules.",
      "Flash bring-up scaffold and read serial boot log.",
      "Run display test pattern and button event smoke tests.",
      "Record any pin or cable-route mismatch back into ProductPlan evidence."
    ],
    boundaries: {
      fullFirmwareRuntime: false,
      ota: false,
      deviceRuntime: false,
      longTermUserProgramming: false,
      productionReadyCode: false
    },
    directEditingAllowed: false
  };
}

export function createPrototypeReadinessReport({
  productPlan = {},
  geometrySpec = {},
  electronicsLayout = null,
  electronicsSpec = {},
  electronicsValidation = {},
  assemblyPlan = {},
  developmentBoardScaffold = {},
  revisionId = ""
} = {}) {
  const blockingIssues = [
    ...(electronicsValidation.errors || []),
    ...((assemblyPlan.riskItems || []).filter((item) => item.level === "blocked"))
  ];
  const warnings = [
    ...(electronicsValidation.warnings || []),
    ...((assemblyPlan.riskItems || []).filter((item) => item.level === "warning"))
  ];
  const status = blockingIssues.length
    ? "Blocked"
    : warnings.length ? "Needs Review" : "Ready";
  return {
    version: PROTOTYPE_READINESS_REPORT_VERSION,
    scopeClassification: CORE_V1,
    revisionId,
    status,
    productType: productPlan.productType || "desktop_display",
    sourceChain: [
      "ProductPlan",
      "Forge-controlled ComponentDescriptor v2",
      "ElectronicsDescriptor v1",
      "ElectronicsSpec",
      "Electronics Validation",
      "GeometrySpec-linked AssemblyPlan",
      "Development Board bring-up scaffold"
    ],
    sourceOfTruth: {
      productPlan: "product_plan.json",
      geometrySpec: "geometry-spec.json",
      componentDescriptors: "component_descriptors.json",
      electronicsSpec: "electronics_spec.json",
      electronicsValidation: "electronics_validation_report.json",
      assemblyPlan: "assembly_plan.json",
      developmentBoardScaffold: "development_board_scaffold.json",
      directEditingAllowed: false
    },
    componentTrustSummary: {
      componentCount: (electronicsSpec.componentTrust || []).length,
      forgeApprovedCount: (electronicsSpec.componentTrust || []).filter((item) => item.forgeApproved).length,
      reviewRequiredCount: (electronicsSpec.componentTrust || []).filter((item) => item.reviewStatus === "human_review_required" || item.forgeApproved === false).length,
      trustLevels: [...new Set((electronicsSpec.componentTrust || []).map((item) => item.trustLevel).filter(Boolean))]
    },
    electronicsSpecSummary: {
      selectedComponentIds: electronicsSpec.selectedComponentIds || [],
      powerInputCount: (electronicsSpec.powerInputs || []).length,
      interfaceAssignmentCount: (electronicsSpec.interfaceAssignments || []).length,
      cableLinkCount: (electronicsSpec.cableLinks || []).length
    },
    electronicsValidation: {
      status: electronicsValidation.status || "unknown",
      errorCount: (electronicsValidation.errors || []).length,
      warningCount: (electronicsValidation.warnings || []).length,
      canEnterPrototypeBuild: electronicsValidation.canEnterPrototypeBuild === true
    },
    assemblyPlan: {
      status: assemblyPlan.status || "",
      stepCount: (assemblyPlan.steps || []).length,
      riskItemCount: (assemblyPlan.riskItems || []).length,
      geometryLinked: Boolean(geometrySpec?.version)
    },
    developmentBoardScaffold: {
      status: developmentBoardScaffold.status || "",
      targetBoard: developmentBoardScaffold.targetBoard || {},
      fileCount: (developmentBoardScaffold.files || []).length
    },
    electronicsLayoutSummary: electronicsLayout
      ? {
        layoutType: electronicsLayout.layoutType || "",
        placementCount: (electronicsLayout.placements || []).length,
        conflictCount: (electronicsLayout.conflicts || []).length
      }
      : null,
    blockingIssues,
    warnings,
    humanReviewRequired: warnings.some((warning) => warning.type === "component_requires_review"),
    evidenceReferences: {
      productPlan: "product_plan.json",
      geometrySpec: "geometry-spec.json",
      componentDescriptors: "component_descriptors.json",
      electronicsSpec: "electronics_spec.json",
      electronicsValidation: "electronics_validation_report.json",
      assemblyPlan: "assembly_plan.json",
      developmentBoardScaffold: "development_board_scaffold.json"
    },
    boundaries: {
      prototypeReadinessOnly: true,
      manufacturingReadiness: false,
      customPcb: false,
      supplierOrdering: false,
      ota: false,
      fullFirmwareRuntime: false,
      arbitraryUserComponentImport: false,
      productionCertification: false,
      frontendRedesign: false
    },
    directEditingAllowed: false
  };
}

function selectedComponentIdsFor(geometrySpec, componentDescriptors) {
  const fromSelection = geometrySpec.componentSelections?.selectedComponentIds || [];
  if (fromSelection.length > 0) return [...fromSelection];
  return componentDescriptors.map((descriptor) => descriptor.id).filter(Boolean);
}

function descriptorForComponent(componentId, componentDescriptor = null) {
  const seed = getElectronicsDescriptor(componentId);
  if (seed) return seed;
  const type = componentDescriptor?.type || componentDescriptor?.identity?.category || "unknown";
  const sameTypeSeed = listElectronicsDescriptors().find((descriptor) => descriptor.componentType === type);
  const base = sameTypeSeed || {
    componentType: type,
    power: {
      role: "unknown",
      rail: "3v3",
      operatingVoltage: 3.3,
      nominalCurrentMa: 0,
      peakCurrentMa: 0
    },
    interfaces: []
  };
  return {
    ...clone(base),
    componentId,
    componentType: type,
    displayName: componentDescriptor?.displayName || componentDescriptor?.identity?.displayName || componentId,
    mpn: componentDescriptor?.sourceEvidence?.partNumber || "",
    supplier: {
      name: "ProductPlan-scoped controlled draft",
      url: "",
      status: componentDescriptor?.sourceEvidence?.sourceType || "workspace_draft"
    },
    datasheet: {
      title: "ProductPlan-scoped source notes",
      url: componentDescriptor?.sourcesPath || "",
      status: "review_required"
    },
    internalMeasurements: {
      available: false,
      note: "Promoted same-type descriptor inherits electronics proxy until a dedicated ElectronicsDescriptor is approved."
    },
    trustLevel: "reviewable_proxy",
    reviewStatus: "reviewable",
    forgeApproved: false,
    requiresHumanReview: true,
    derivedFromSameTypeSeed: base.componentId || "",
    directEditingAllowed: false
  };
}

function compactElectronicsDescriptor(descriptor) {
  return {
    version: ELECTRONICS_DESCRIPTOR_VERSION,
    componentId: descriptor.componentId,
    componentType: descriptor.componentType,
    displayName: descriptor.displayName,
    mpn: descriptor.mpn || "",
    supplier: descriptor.supplier || {},
    datasheet: descriptor.datasheet || {},
    internalMeasurements: descriptor.internalMeasurements || {},
    descriptorVersion: descriptor.version || "",
    trustLevel: descriptor.trustLevel || "",
    reviewStatus: descriptor.reviewStatus || "",
    forgeApproved: descriptor.forgeApproved === true,
    requiresHumanReview: descriptor.requiresHumanReview === true,
    power: descriptor.power || {},
    interfaces: descriptor.interfaces || [],
    connectors: descriptor.connectors || [],
    directEditingAllowed: false
  };
}

function componentTrustRecord(descriptor) {
  return {
    componentId: descriptor.componentId,
    componentType: descriptor.componentType,
    mpn: descriptor.mpn || "",
    supplierStatus: descriptor.supplier?.status || "",
    datasheetStatus: descriptor.datasheet?.status || "",
    internalMeasurementAvailable: descriptor.internalMeasurements?.available === true,
    trustLevel: descriptor.trustLevel || "blocked",
    reviewStatus: descriptor.reviewStatus || "unknown",
    forgeApproved: descriptor.forgeApproved === true,
    requiresHumanReview: descriptor.requiresHumanReview === true,
    evidence: {
      supplier: descriptor.supplier?.name || "",
      datasheet: descriptor.datasheet?.title || "",
      internalMeasurements: descriptor.internalMeasurements?.note || ""
    },
    directEditingAllowed: false
  };
}

function powerInputRecord(descriptor) {
  return {
    componentId: descriptor.componentId,
    rail: descriptor.power?.outputRail || descriptor.power?.rail || "",
    voltage: Number(descriptor.power?.operatingVoltage || 0),
    availableMa: Number(descriptor.power?.maxCurrentMa || 0),
    trustLevel: descriptor.trustLevel || "",
    reviewStatus: descriptor.reviewStatus || ""
  };
}

function peripheralRecord(descriptor, quantities = {}) {
  const quantity = Number(quantities[descriptor.componentId] || 1);
  return {
    componentId: descriptor.componentId,
    componentType: descriptor.componentType,
    quantity,
    rail: descriptor.power?.rail || descriptor.power?.outputRail || "",
    operatingVoltage: Number(descriptor.power?.operatingVoltage || 0),
    peakCurrentMa: Number(descriptor.power?.peakCurrentMa || 0) * quantity,
    interfaces: descriptor.interfaces || [],
    trustLevel: descriptor.trustLevel || "",
    reviewStatus: descriptor.reviewStatus || ""
  };
}

function powerBudgetFor({ mainController = null, electronicsDescriptors = [], componentQuantities = {} }) {
  const rails = [];
  const controllerLoads = [];
  const usbInput = electronicsDescriptors.find((descriptor) => descriptor.power?.role === "power_input");
  const controller = mainController || {};
  const controllerCurrent = Number(controller.power?.peakCurrentMa || 0);
  if (usbInput || controllerCurrent > 0) {
    rails.push({
      rail: "5v_usb",
      voltage: 5,
      availableMa: Number(usbInput?.power?.maxCurrentMa || 0),
      peakLoadMa: controllerCurrent,
      loads: controller.componentId
        ? [{ componentId: controller.componentId, peakCurrentMa: controllerCurrent }]
        : []
    });
  }
  for (const outputRail of controller.power?.outputRails || []) {
    const railLoads = electronicsDescriptors
      .filter((descriptor) => descriptor.power?.rail === outputRail.rail)
      .map((descriptor) => ({
        componentId: descriptor.componentId,
        quantity: Number(componentQuantities[descriptor.componentId] || 1),
        peakCurrentMa: Number(descriptor.power?.peakCurrentMa || 0) * Number(componentQuantities[descriptor.componentId] || 1)
      }));
    rails.push({
      rail: outputRail.rail,
      voltage: Number(outputRail.voltage || 0),
      availableMa: Number(outputRail.maxCurrentMa || 0),
      peakLoadMa: railLoads.reduce((sum, load) => sum + load.peakCurrentMa, 0),
      loads: railLoads
    });
  }
  return {
    rails,
    controllerLoads,
    directEditingAllowed: false
  };
}

function interfaceAssignmentsFor({ mainController = null, electronicsDescriptors = [], componentQuantities = {} }) {
  if (!mainController?.board?.pinMap) {
    return electronicsDescriptors
      .filter((descriptor) => descriptor.componentType !== "core_board")
      .map((descriptor) => ({
        assignmentId: `assignment.${descriptor.componentId}.missing_controller`,
        componentId: descriptor.componentId,
        interfaceType: "unknown",
        status: "blocked",
        note: "No Forge-controlled main controller pin map is available.",
        pins: []
      }));
  }
  const assignments = [];
  for (const descriptor of electronicsDescriptors) {
    if (["core_board", "interface", "battery"].includes(descriptor.componentType)) continue;
    const quantity = Number(componentQuantities[descriptor.componentId] || 1);
    for (const iface of descriptor.interfaces || []) {
      if (iface.type === "spi") {
        assignments.push(assignment({
          componentId: descriptor.componentId,
          interfaceType: "spi",
          bus: iface.bus || "display_spi",
          connectorId: iface.connectorId,
          pins: pinRecords(mainController.board.pinMap.display_spi, descriptor.componentId, iface.id),
          sharedBus: false
        }));
      } else if (iface.type === "i2c") {
        assignments.push(assignment({
          componentId: descriptor.componentId,
          interfaceType: "i2c",
          bus: iface.bus || "i2c0",
          connectorId: iface.connectorId,
          pins: pinRecords(mainController.board.pinMap.i2c0, descriptor.componentId, iface.id),
          sharedBus: true
        }));
      } else if (iface.type === "gpio") {
        for (let index = 0; index < quantity; index += 1) {
          const pin = mainController.board.pinMap.buttons[index];
          assignments.push(assignment({
            assignmentId: `assignment.${descriptor.componentId}.${iface.id}.${index + 1}`,
            componentId: descriptor.componentId,
            interfaceType: "gpio",
            connectorId: iface.connectorId,
            pins: pin ? [{ signal: `button_${index + 1}`, pin, componentId: descriptor.componentId }] : [],
            status: pin ? "assigned" : "blocked",
            note: pin ? "GPIO button pin assigned for bring-up." : "Not enough GPIO pins in the V1 button pool.",
            sharedBus: false
          }));
        }
      } else if (iface.type === "gpio_pwm") {
        assignments.push(assignment({
          componentId: descriptor.componentId,
          interfaceType: "gpio_pwm",
          connectorId: iface.connectorId,
          pins: [{ signal: "speaker_pwm", pin: mainController.board.pinMap.speakerPwm, componentId: descriptor.componentId }],
          sharedBus: false
        }));
      } else if (iface.type === "camera_parallel") {
        assignments.push(assignment({
          componentId: descriptor.componentId,
          interfaceType: "camera_parallel",
          connectorId: iface.connectorId,
          pins: pinRecords(mainController.board.pinMap.camera, descriptor.componentId, iface.id),
          sharedBus: false,
          status: "assigned_with_review",
          note: "Camera interface is assigned only for human-reviewed prototype bring-up."
        }));
      } else {
        assignments.push(assignment({
          componentId: descriptor.componentId,
          interfaceType: iface.type || "unknown",
          connectorId: iface.connectorId,
          status: "blocked",
          note: `Unsupported V1 interface type: ${iface.type || "unknown"}.`,
          pins: []
        }));
      }
    }
  }
  return assignments;
}

function assignment({
  assignmentId = "",
  componentId,
  interfaceType,
  bus = "",
  connectorId = "",
  pins = [],
  sharedBus = false,
  status = "assigned",
  note = ""
}) {
  return {
    assignmentId: assignmentId || `assignment.${componentId}.${interfaceType}`,
    componentId,
    interfaceType,
    bus,
    connectorId,
    pins: pins.filter((pin) => pin.pin),
    sharedBus,
    status,
    note: note || `${interfaceType} assigned for prototype bring-up.`,
    directEditingAllowed: false
  };
}

function pinRecords(pinMap = {}, componentId, interfaceId) {
  if (Array.isArray(pinMap)) {
    return pinMap.map((pin, index) => ({ signal: `${interfaceId || "pin"}_${index + 1}`, pin, componentId }));
  }
  return Object.entries(pinMap || {}).flatMap(([signal, pin]) => (
    Array.isArray(pin)
      ? pin.map((item, index) => ({ signal: `${signal}${index}`, pin: item, componentId }))
      : [{ signal, pin, componentId }]
  ));
}

function cableLinksFor({ geometrySpec = {}, electronicsDescriptors = [] }) {
  const routes = Array.isArray(geometrySpec.routes) ? geometrySpec.routes : [];
  return electronicsDescriptors
    .filter((descriptor) => !["core_board", "interface"].includes(descriptor.componentType))
    .map((descriptor) => {
      const linkedRoutes = routes.filter((route) => (
        route.from?.componentId === descriptor.componentId
        || route.to?.componentId === descriptor.componentId
      ));
      return {
        componentId: descriptor.componentId,
        routeIds: linkedRoutes.map((route) => route.id).filter(Boolean),
        connectorIds: (descriptor.interfaces || []).map((iface) => iface.connectorId).filter(Boolean),
        geometryLinked: linkedRoutes.length > 0,
        directEditingAllowed: false
      };
    });
}

function pinConflictRecords(assignments = []) {
  const byPin = new Map();
  for (const assignment of assignments) {
    if (assignment.status === "blocked") continue;
    for (const pin of assignment.pins || []) {
      if (assignment.sharedBus) continue;
      if (!byPin.has(pin.pin)) byPin.set(pin.pin, []);
      byPin.get(pin.pin).push({
        assignmentId: assignment.assignmentId,
        componentId: assignment.componentId,
        signal: pin.signal
      });
    }
  }
  return [...byPin.entries()]
    .filter(([, uses]) => uses.length > 1)
    .map(([pin, uses]) => ({ pin, uses }));
}

function routeWarnings(electronicsSpec = {}, geometrySpec = {}) {
  if (!geometrySpec?.version) {
    return [issue("geometry_spec_missing", "Assembly and cable route checks require a GeometrySpec.")];
  }
  return (electronicsSpec.cableLinks || [])
    .filter((link) => !link.geometryLinked && !["battery_lipo_2000", "battery_18650_holder"].includes(link.componentId))
    .map((link) => issue("geometry_route_missing", `${link.componentId} has no GeometrySpec cable route link.`, {
      componentId: link.componentId
    }));
}

function issue(type, message, extra = {}) {
  return {
    type,
    message,
    ...extra
  };
}

function fixSuggestionForIssue(issueRecord = {}) {
  const suggestions = {
    missing_main_controller: "Select a Forge-approved core board before prototype bring-up.",
    component_requires_review: "Keep the component in human review or replace it with a Forge-approved descriptor.",
    rail_current_exceeded: "Reduce module load, choose a lower-current display/module, or move this to a future reviewed power design.",
    interface_assignment_blocked: "Choose a supported same-type component or extend ElectronicsDescriptor/layout support in a future goal.",
    pin_conflict: "Move one assignment to an unused board pin in the controlled pin map.",
    power_input_missing: "Restore a controlled USB-C power input or approved reviewed battery path."
  };
  return {
    issueType: issueRecord.type || "",
    suggestion: suggestions[issueRecord.type] || "Record this as an internal prototype review item before build."
  };
}

function step(stepId, instruction, refs = {}) {
  return {
    stepId,
    instruction,
    ...refs,
    directEditingAllowed: false
  };
}

function displayComponentId(selectedComponentIds = []) {
  return selectedComponentIds.find((componentId) => componentId.startsWith("display_")) || "";
}

function optionalAssemblySteps({ selectedComponentIds = [], placements = [], routes = [], features = [] } = {}) {
  const steps = [];
  if (selectedComponentIds.includes("ambient_sensor_basic")) {
    steps.push(step("install_ambient_sensor", "Install ambient sensor behind the front window and route I2C cable to the core board.", {
      componentId: "ambient_sensor_basic",
      routeRefs: routeIdsFor(routes, "ambient_sensor_basic"),
      geometryRefs: [
        ...placementIds(placements, ["ambient_sensor_basic"]),
        ...featureIds(features, ["sensor_window"])
      ]
    }));
  }
  if (selectedComponentIds.includes("speaker_20mm")) {
    steps.push(step("install_speaker", "Install speaker against grille clearance and keep wires away from USB-C strain relief.", {
      componentId: "speaker_20mm",
      routeRefs: routeIdsFor(routes, "speaker_20mm"),
      geometryRefs: [
        ...placementIds(placements, ["speaker_20mm"]),
        ...featureIds(features, ["speaker_vents", "grille_mount_retention"])
      ]
    }));
  }
  if (selectedComponentIds.includes("button_6mm") || selectedComponentIds.some((id) => id.includes("button"))) {
    const buttonId = selectedComponentIds.find((id) => id.includes("button"));
    steps.push(step("install_buttons", "Install panel buttons and confirm each switch travel is clear before shell closure.", {
      componentId: buttonId,
      routeRefs: routeIdsFor(routes, buttonId),
      geometryRefs: [
        ...placementIds(placements, [buttonId]),
        ...featureIds(features, ["button_hole", "panel_button_retention"])
      ]
    }));
  }
  if (selectedComponentIds.includes("camera_module_basic")) {
    steps.push(step("install_camera_review", "Camera module installation is review-only; confirm field of view, privacy risk, and FPC service access.", {
      componentId: "camera_module_basic",
      routeRefs: routeIdsFor(routes, "camera_module_basic"),
      geometryRefs: [
        ...placementIds(placements, ["camera_module_basic"]),
        ...featureIds(features, ["camera_window", "optical_window_retention"])
      ],
      humanReviewRequired: true
    }));
  }
  if (selectedComponentIds.includes("battery_lipo_2000") || selectedComponentIds.includes("battery_18650_holder")) {
    const batteryId = selectedComponentIds.find((id) => id.startsWith("battery_"));
    steps.push(step("install_battery_review", "Battery installation is review-only; confirm retention, service access, and safety clearance.", {
      componentId: batteryId,
      routeRefs: routeIdsFor(routes, batteryId),
      geometryRefs: [
        ...placementIds(placements, [batteryId]),
        ...featureIds(features, ["review_battery_bay", "battery_access_and_thermal"])
      ],
      humanReviewRequired: true
    }));
  }
  return steps;
}

function placementIds(placements = [], componentIds = []) {
  const ids = new Set(componentIds.filter(Boolean));
  return placements
    .filter((placement) => ids.has(placement.componentId || placement.moduleId))
    .map((placement) => placement.id || placement.placementId || placement.componentId || placement.moduleId)
    .filter(Boolean);
}

function routeIdsFor(routes = [], componentId = "") {
  if (!componentId) return [];
  return routes
    .filter((route) => route.from?.componentId === componentId || route.to?.componentId === componentId)
    .map((route) => route.id)
    .filter(Boolean);
}

function featureIds(features = [], typeTokens = []) {
  return features
    .filter((feature) => typeTokens.some((token) => (
      String(feature.type || "").includes(token) || String(feature.id || "").includes(token)
    )))
    .map((feature) => feature.id)
    .filter(Boolean);
}

function moduleInitForAssignment(assignment = {}) {
  const names = {
    spi: "init_display_spi",
    i2c: "init_i2c_sensor_bus",
    gpio: "init_button_gpio",
    gpio_pwm: "init_speaker_pwm",
    camera_parallel: "init_camera_review_bus"
  };
  return {
    assignmentId: assignment.assignmentId || "",
    componentId: assignment.componentId || "",
    functionName: names[assignment.interfaceType] || `init_${assignment.interfaceType || "module"}`,
    status: assignment.status === "blocked" ? "blocked" : "stub",
    productionReady: false
  };
}
