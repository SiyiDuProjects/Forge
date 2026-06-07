import { clone } from "./workspace_state.mjs";

export const ELECTRONICS_DESCRIPTOR_VERSION = "electronics_descriptor_v1";
export const ELECTRONICS_DESCRIPTOR_TRUST_REPORT_VERSION = "electronics_descriptor_trust_report_v1";
export const ELECTRONICS_SPEC_VERSION = "electronics_spec_v1";
export const ELECTRONICS_VALIDATION_VERSION = "electronics_validation_v1";
export const ASSEMBLY_PLAN_VERSION = "assembly_plan_v1";
export const DEVELOPMENT_BOARD_SCAFFOLD_VERSION = "development_board_scaffold_v1";
export const PROTOTYPE_READINESS_REPORT_VERSION = "prototype_readiness_report_v1";
export const PROTOTYPE_READINESS_GATE_VERSION = "prototype_readiness_gate_v1";

const CORE_V1 = "Core V1";
const SUPPORTING_V1 = "Supporting V1";
const FUTURE_V2 = "Future V2";

const BLOCKING_REVIEW_STATUSES = Object.freeze(["draft", "blocked", "retired"]);

const REQUIRED_ELECTRONICS_DESCRIPTOR_FIELDS = Object.freeze([
  "componentId",
  "mpn",
  "supplier.name",
  "supplier.status",
  "datasheet.title",
  "datasheet.url",
  "datasheet.status",
  "internalMeasurements.available",
  "internalMeasurements.note",
  "descriptorVersion",
  "alternatives.componentIds",
  "alternatives.note",
  "trustLevel",
  "reviewStatus",
  "forgeApproved"
]);

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
    alternatives: alternatives("esp32_s3_core_board", [], "No approved same-family controller substitute in Core V1."),
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
    alternatives: alternatives("usb_c_power_input", [], "No approved power-input substitute in Core V1."),
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
    alternatives: alternatives("ambient_light_sensor", [], "No approved ambient-sensor substitute in Core V1."),
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
    alternatives: alternatives("panel_button_6mm", [], "No approved same-footprint button substitute in Core V1."),
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
    alternatives: alternatives("small_speaker", [], "Speaker remains a reviewable proxy; substitutes require human review."),
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
    alternatives: alternatives("camera_module_review", [], "Camera substitutes are review-only in Core V1."),
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

function alternatives(replacementGroup, componentIds = [], note = "") {
  return {
    replacementGroup,
    componentIds: [...componentIds],
    note,
    directEditingAllowed: false
  };
}

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
    alternatives: alternatives(
      "display_tft_spi",
      ["display_3_5_tft", "display_5_tft"].filter((id) => id !== componentId),
      "Same-family display substitutions require matching mechanical opening and SPI power budget checks."
    ),
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
    alternatives: alternatives(
      "review_battery_source",
      ["battery_lipo_2000", "battery_18650_holder"].filter((id) => id !== componentId),
      "Battery substitutes remain human-review-only in Core V1."
    ),
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
  const electronicsDescriptorTrustReport = createElectronicsDescriptorTrustReport({
    electronicsSpec
  });
  const electronicsValidation = validateElectronicsSpec({
    electronicsSpec,
    electronicsDescriptorTrustReport,
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
    electronicsDescriptorTrustReport,
    electronicsValidation,
    assemblyPlan,
    developmentBoardScaffold,
    revisionId
  });
  return {
    electronicsDescriptorTrustReport,
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
  const powerPath = powerPathFor({
    mainController,
    electronicsDescriptors,
    geometrySpec
  });
  const connectionRequirements = connectionRequirementsFor({
    mainController,
    interfaceAssignments,
    geometrySpec
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
    powerPath,
    interfaceAssignments,
    connectionRequirements,
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

export function createElectronicsDescriptorTrustReport({ electronicsSpec = {}, electronicsDescriptors = null } = {}) {
  const descriptors = Array.isArray(electronicsDescriptors)
    ? electronicsDescriptors
    : Array.isArray(electronicsSpec.electronicsDescriptors) ? electronicsSpec.electronicsDescriptors : [];
  const entries = descriptors.map(electronicsDescriptorTrustEntry);
  const blockedEntries = entries.filter((entry) => entry.status === "blocked");
  const reviewEntries = entries.filter((entry) => entry.status === "warning");
  const status = blockedEntries.length ? "blocked" : reviewEntries.length ? "warning" : "pass";
  return {
    version: ELECTRONICS_DESCRIPTOR_TRUST_REPORT_VERSION,
    scopeClassification: CORE_V1,
    status,
    source: "ElectronicsDescriptor v1 controlled evidence lint",
    componentCount: entries.length,
    entries,
    checks: [
      {
        name: "required_evidence_fields",
        status: blockedEntries.some((entry) => entry.missingFields.length > 0) ? "blocked" : "pass",
        missingFieldCount: entries.reduce((sum, entry) => sum + entry.missingFields.length, 0)
      },
      {
        name: "forge_approval_and_review_state",
        status: blockedEntries.length ? "blocked" : reviewEntries.length ? "warning" : "pass",
        forgeApprovedCount: entries.filter((entry) => entry.forgeApproved).length,
        reviewRequiredCount: entries.filter((entry) => entry.requiresHumanReview || entry.forgeApproved === false).length
      },
      {
        name: "alternative_relationships",
        status: entries.every((entry) => entry.alternatives?.recordPresent) ? "pass" : "blocked",
        replacementGroups: [...new Set(entries.map((entry) => entry.alternatives?.replacementGroup).filter(Boolean))]
      }
    ],
    summary: {
      approvedCount: entries.filter((entry) => entry.forgeApproved && entry.status === "pass").length,
      reviewRequiredCount: reviewEntries.length,
      blockedCount: blockedEntries.length,
      missingRequiredEvidenceCount: entries.reduce((sum, entry) => sum + entry.missingFields.length, 0),
      trustLevels: [...new Set(entries.map((entry) => entry.trustLevel).filter(Boolean))],
      reviewStatuses: [...new Set(entries.map((entry) => entry.reviewStatus).filter(Boolean))]
    },
    boundaries: {
      controlledForgeLibraryOnly: true,
      arbitraryUserComponentImport: false,
      supplierCrawler: false,
      datasheetAutoImport: false,
      approvalByUserLink: false,
      manufacturingReadinessClaim: false
    },
    directEditingAllowed: false
  };
}

export function validateElectronicsSpec({
  electronicsSpec = {},
  electronicsDescriptorTrustReport = null,
  geometrySpec = {}
} = {}) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const addCheck = (name, status, detail = {}) => checks.push({ name, status, ...detail });

  if (!electronicsSpec.mainController?.componentId) {
    errors.push(issue("missing_main_controller", "ElectronicsSpec requires a Forge-controlled main controller."));
  }

  const trustReport = electronicsDescriptorTrustReport || createElectronicsDescriptorTrustReport({ electronicsSpec });
  const trustErrors = (trustReport.entries || [])
    .filter((entry) => entry.status === "blocked")
    .map((entry) => issue("electronics_descriptor_evidence_incomplete", `${entry.componentId} is missing required controlled ElectronicsDescriptor evidence.`, {
      componentId: entry.componentId,
      missingFields: entry.missingFields,
      reviewStatus: entry.reviewStatus,
      trustLevel: entry.trustLevel
    }));
  errors.push(...trustErrors);

  const trustWarnings = (trustReport.entries || [])
    .filter((entry) => entry.status === "warning")
    .map((entry) => issue("component_requires_review", `${entry.componentId} is not fully Forge-approved for unattended prototype build.`, {
      componentId: entry.componentId,
      trustLevel: entry.trustLevel,
      reviewStatus: entry.reviewStatus,
      forgeApproved: entry.forgeApproved
    }));
  warnings.push(...trustWarnings);
  addCheck("component_trust", trustErrors.length ? "blocked" : trustWarnings.length ? "warning" : "pass", {
    componentCount: (electronicsSpec.componentTrust || []).length,
    reviewItemCount: trustWarnings.length,
    missingRequiredEvidenceCount: trustErrors.reduce((sum, error) => sum + (error.missingFields || []).length, 0),
    trustReportStatus: trustReport.status || "unknown"
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

  const voltageErrors = voltageCompatibilityIssues(electronicsSpec);
  errors.push(...voltageErrors);
  addCheck("voltage_compatibility", voltageErrors.length ? "blocked" : "pass", {
    issueCount: voltageErrors.length,
    toleranceVolts: 0.15
  });

  const powerPathErrors = powerPathIssues(electronicsSpec);
  errors.push(...powerPathErrors);
  addCheck("power_path", powerPathErrors.length ? "blocked" : "pass", {
    controllerInputRail: electronicsSpec.powerPath?.controllerInputRail || "",
    sourceComponentId: electronicsSpec.powerPath?.sourceComponentId || "",
    routeId: electronicsSpec.powerPath?.routeId || "",
    issueCount: powerPathErrors.length
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

  const connectionErrors = connectionRequirementIssues(electronicsSpec);
  errors.push(...connectionErrors);
  addCheck("interface_route_alignment", connectionErrors.length ? "blocked" : "pass", {
    requirementCount: (electronicsSpec.connectionRequirements || []).length,
    issueCount: connectionErrors.length
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
  const componentDescriptors = Array.isArray(geometrySpec.componentDescriptors) ? geometrySpec.componentDescriptors : [];
  const selectedComponentIds = electronicsSpec.selectedComponentIds || [];
  const steps = withAssemblyStepMetadata([
    step("prep_shell_back", "Inspect printed rear tray, standoffs, and cable exits.", {
      geometryRefs: featureIds(features, ["standoff", "usb_cutout", "split_line"])
    }),
    step("install_core_board", "Install the core board on descriptor-backed standoffs before plugging external modules.", {
      componentId: "core_board_esp32_s3",
      geometryRefs: placementIds(placements, ["core_board_esp32_s3"]),
      accessRefs: accessVolumeIds(placements, componentDescriptors, ["core_board_esp32_s3"])
    }),
    step("connect_display", "Connect the display ribbon before closing the front shell.", {
      componentId: displayComponentId(selectedComponentIds),
      routeRefs: routeIdsFor(routes, displayComponentId(selectedComponentIds)),
      accessRefs: accessVolumeIds(placements, componentDescriptors, [displayComponentId(selectedComponentIds), "core_board_esp32_s3"])
    }),
    step("seat_display", "Seat the display against the captured-panel retention geometry.", {
      componentId: displayComponentId(selectedComponentIds),
      geometryRefs: featureIds(features, ["captured_panel_retention", "screen_opening"])
    }),
    step("install_usb_c", "Install USB-C breakout and verify rear plug insertion clearance.", {
      componentId: "usb_c_breakout",
      routeRefs: routeIdsFor(routes, "usb_c_breakout"),
      geometryRefs: featureIds(features, ["usb_cutout", "edge_capture_retention"]),
      accessRefs: accessVolumeIds(placements, componentDescriptors, ["usb_c_breakout", "core_board_esp32_s3"])
    }),
    ...optionalAssemblySteps({ selectedComponentIds, placements, routes, features, componentDescriptors }),
    step("close_shell", "Close front and rear shells only after cable slack and service access are checked.", {
      geometryRefs: featureIds(features, ["split_line"])
    }),
    step("bring_up_check", "Run development-board bring-up tests before any internal review handoff.", {
      electronicsRefs: (electronicsSpec.interfaceAssignments || []).map((assignment) => assignment.assignmentId)
    })
  ]);
  const assemblyChecks = assemblyChecksFor({
    steps,
    placements,
    routes,
    features,
    componentDescriptors,
    selectedComponentIds,
    geometrySpec
  });
  const riskItems = [
    ...assemblyChecks.flatMap((check) => check.riskItems || []),
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
    status: electronicsValidation.status === "blocked" || riskItems.some((item) => item.level === "blocked")
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
      accessVolumeCount: countAccessVolumes(placements, componentDescriptors),
      routeIds: routes.map((route) => route.id).filter(Boolean)
    },
    steps,
    checks: assemblyChecks,
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

export function createDevelopmentBoardScaffold({
  productPlan = {},
  electronicsSpec = {},
  electronicsValidation = {}
} = {}) {
  const board = electronicsSpec.mainController || {};
  const assignments = Array.isArray(electronicsSpec.interfaceAssignments)
    ? electronicsSpec.interfaceAssignments
    : [];
  const moduleInitScaffold = uniqueModuleInitScaffold(assignments.map((assignment) => moduleInitForAssignment(assignment)));
  const testEntrypoints = testEntrypointsFor(assignments);
  const behaviorRules = behaviorRulePlaceholders(productPlan, assignments);
  const checklist = bringUpChecklistFor({ electronicsSpec, assignments, behaviorRules });
  const bringUpConfig = createBringUpConfig({
    productPlan,
    electronicsSpec,
    board,
    assignments,
    moduleInitScaffold,
    testEntrypoints,
    behaviorRules
  });
  const status = electronicsValidation.status === "blocked" || !board.componentId
    ? "missing_information"
    : "generated";
  const files = bringUpFileManifest();
  const generatedFiles = status === "generated"
    ? generatedBringUpFiles({ bringUpConfig, checklist })
    : [];
  const checks = scaffoldChecksFor({
    board,
    assignments,
    electronicsSpec,
    electronicsValidation,
    generatedFiles
  });
  const blockedReasons = scaffoldBlockedReasons({
    board,
    assignments,
    electronicsValidation,
    checks
  });
  return {
    version: DEVELOPMENT_BOARD_SCAFFOLD_VERSION,
    scopeClassification: SUPPORTING_V1,
    status,
    sourceOfTruth: {
      productPlan: "ProductPlan behavior intent",
      electronicsSpec: "ElectronicsSpec pin/interface/power assignments",
      electronicsValidation: "Electronics Validation block/warning state",
      directEditingAllowed: false
    },
    targetBoard: {
      componentId: board.componentId || "",
      boardFamily: board.boardFamily || "",
      productionFirmware: false
    },
    pinMap: bringUpConfig.pinMap,
    interfaceMap: bringUpConfig.interfaceMap,
    powerPath: bringUpConfig.powerPath,
    bringUpConfig,
    files,
    generatedFiles,
    moduleInitScaffold,
    testEntrypoints,
    behaviorRules,
    checklist,
    checks,
    blockedReasons,
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
  electronicsDescriptorTrustReport = {},
  electronicsValidation = {},
  assemblyPlan = {},
  developmentBoardScaffold = {},
  revisionId = ""
} = {}) {
  const evidenceReferences = {
    productPlan: "product_plan.json",
    geometrySpec: "geometry-spec.json",
    componentDescriptors: "component_descriptors.json",
    electronicsDescriptorTrustReport: "electronics_descriptor_trust_report.json",
    electronicsSpec: "electronics_spec.json",
    electronicsValidation: "electronics_validation_report.json",
    assemblyPlan: "assembly_plan.json",
    developmentBoardScaffold: "development_board_scaffold.json",
    prototypeReadinessReport: "prototype_readiness_report.json"
  };
  const boundaries = {
    prototypeReadinessOnly: true,
    manufacturingReadiness: false,
    customPcb: false,
    supplierOrdering: false,
    ota: false,
    fullFirmwareRuntime: false,
    arbitraryUserComponentImport: false,
    productionCertification: false,
    frontendRedesign: false
  };
  const readinessGate = createPrototypeReadinessGate({
    electronicsDescriptorTrustReport,
    electronicsSpec,
    electronicsValidation,
    assemblyPlan,
    developmentBoardScaffold,
    evidenceReferences,
    boundaries
  });
  const blockingIssues = [
    ...(electronicsValidation.errors || []),
    ...((assemblyPlan.riskItems || []).filter((item) => item.level === "blocked")),
    ...((developmentBoardScaffold.blockedReasons || []).map((reason) => issue(
      reason.type || "development_board_scaffold_blocked",
      reason.message || "Development board scaffold is blocked.",
      {
        componentId: reason.componentId || "",
        assignmentId: reason.assignmentId || ""
      }
    )))
  ];
  const warnings = [
    ...(electronicsValidation.warnings || []),
    ...((assemblyPlan.riskItems || []).filter((item) => item.level === "warning"))
  ];
  const status = readinessGate.decision === "blocked" || blockingIssues.length
    ? "Blocked"
    : readinessGate.decision === "needs_review" || warnings.length ? "Needs Review" : "Ready";
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
      electronicsDescriptorTrustReport: "electronics_descriptor_trust_report.json",
      electronicsSpec: "electronics_spec.json",
      electronicsValidation: "electronics_validation_report.json",
      assemblyPlan: "assembly_plan.json",
      developmentBoardScaffold: "development_board_scaffold.json",
      directEditingAllowed: false
    },
    readinessGate,
    componentTrustSummary: {
      componentCount: electronicsDescriptorTrustReport.componentCount || (electronicsSpec.componentTrust || []).length,
      forgeApprovedCount: (electronicsDescriptorTrustReport.entries || []).filter((item) => item.forgeApproved).length
        || (electronicsSpec.componentTrust || []).filter((item) => item.forgeApproved).length,
      reviewRequiredCount: electronicsDescriptorTrustReport.summary?.reviewRequiredCount
        ?? (electronicsSpec.componentTrust || []).filter((item) => item.reviewStatus === "human_review_required" || item.forgeApproved === false).length,
      blockedCount: electronicsDescriptorTrustReport.summary?.blockedCount || 0,
      missingRequiredEvidenceCount: electronicsDescriptorTrustReport.summary?.missingRequiredEvidenceCount || 0,
      trustLevels: electronicsDescriptorTrustReport.summary?.trustLevels
        || [...new Set((electronicsSpec.componentTrust || []).map((item) => item.trustLevel).filter(Boolean))],
      reviewStatuses: electronicsDescriptorTrustReport.summary?.reviewStatuses || []
    },
    electronicsDescriptorTrust: {
      version: electronicsDescriptorTrustReport.version || "",
      status: electronicsDescriptorTrustReport.status || "unknown",
      componentCount: electronicsDescriptorTrustReport.componentCount || 0,
      checks: electronicsDescriptorTrustReport.checks || [],
      boundaries: electronicsDescriptorTrustReport.boundaries || {}
    },
    electronicsSpecSummary: {
      selectedComponentIds: electronicsSpec.selectedComponentIds || [],
      powerInputCount: (electronicsSpec.powerInputs || []).length,
      powerPath: {
        controllerInputRail: electronicsSpec.powerPath?.controllerInputRail || "",
        sourceComponentId: electronicsSpec.powerPath?.sourceComponentId || "",
        routeId: electronicsSpec.powerPath?.routeId || ""
      },
      interfaceAssignmentCount: (electronicsSpec.interfaceAssignments || []).length,
      connectionRequirementCount: (electronicsSpec.connectionRequirements || []).length,
      cableLinkCount: (electronicsSpec.cableLinks || []).length
    },
    electronicsValidation: {
      status: electronicsValidation.status || "unknown",
      errorCount: (electronicsValidation.errors || []).length,
      warningCount: (electronicsValidation.warnings || []).length,
      checkStatuses: Object.fromEntries((electronicsValidation.checks || []).map((check) => [check.name, check.status])),
      canEnterPrototypeBuild: electronicsValidation.canEnterPrototypeBuild === true
    },
    assemblyPlan: {
      status: assemblyPlan.status || "",
      stepCount: (assemblyPlan.steps || []).length,
      checkStatuses: Object.fromEntries((assemblyPlan.checks || []).map((check) => [check.name, check.status])),
      riskItemCount: (assemblyPlan.riskItems || []).length,
      geometryLinked: Boolean(geometrySpec?.version)
    },
    developmentBoardScaffold: {
      status: developmentBoardScaffold.status || "",
      targetBoard: developmentBoardScaffold.targetBoard || {},
      fileCount: (developmentBoardScaffold.files || []).length,
      generatedFileCount: (developmentBoardScaffold.generatedFiles || []).length,
      checkStatuses: Object.fromEntries((developmentBoardScaffold.checks || []).map((check) => [check.name, check.status])),
      testEntrypointCount: (developmentBoardScaffold.testEntrypoints || []).length,
      behaviorPlaceholderCount: (developmentBoardScaffold.behaviorRules || []).length,
      blockedReasonCount: (developmentBoardScaffold.blockedReasons || []).length
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
    humanReviewRequired: warnings.some((warning) => warning.type === "component_requires_review")
      || readinessGate.warningItemCount > 0,
    evidenceReferences,
    boundaries,
    directEditingAllowed: false
  };
}

export function createPrototypeReadinessGate({
  electronicsDescriptorTrustReport = {},
  electronicsSpec = {},
  electronicsValidation = {},
  assemblyPlan = {},
  developmentBoardScaffold = {},
  evidenceReferences = {},
  boundaries = {}
} = {}) {
  const items = [
    gateItem("component_trust", trustGateStatus(electronicsDescriptorTrustReport), {
      requirement: "Selected electronic components have Forge-controlled source evidence and trust level.",
      evidenceRef: evidenceReferences.electronicsDescriptorTrustReport || "electronics_descriptor_trust_report.json",
      componentCount: electronicsDescriptorTrustReport.componentCount || 0,
      missingRequiredEvidenceCount: electronicsDescriptorTrustReport.summary?.missingRequiredEvidenceCount || 0,
      reviewRequiredCount: electronicsDescriptorTrustReport.summary?.reviewRequiredCount || 0
    }),
    gateItem("electronics_spec", electronicsSpecGateStatus(electronicsSpec), {
      requirement: "ProductPlan derives an ElectronicsSpec without becoming a new source of truth.",
      evidenceRef: evidenceReferences.electronicsSpec || "electronics_spec.json",
      selectedComponentCount: (electronicsSpec.selectedComponentIds || []).length,
      interfaceAssignmentCount: (electronicsSpec.interfaceAssignments || []).length,
      powerInputCount: (electronicsSpec.powerInputs || []).length,
      mainControllerPresent: Boolean(electronicsSpec.mainController?.componentId)
    }),
    gateItem("electronics_validation", validationGateStatus(electronicsValidation), {
      requirement: "Prototype-level electronics checks cover obvious power, pin, and interface conflicts.",
      evidenceRef: evidenceReferences.electronicsValidation || "electronics_validation_report.json",
      errorCount: (electronicsValidation.errors || []).length,
      warningCount: (electronicsValidation.warnings || []).length,
      checkStatuses: Object.fromEntries((electronicsValidation.checks || []).map((check) => [check.name, check.status])),
      canEnterPrototypeBuild: electronicsValidation.canEnterPrototypeBuild === true
    }),
    gateItem("assembly_plan", assemblyGateStatus(assemblyPlan), {
      requirement: "AssemblyPlan is linked to GeometrySpec evidence and blocks missing assembly refs.",
      evidenceRef: evidenceReferences.assemblyPlan || "assembly_plan.json",
      status: assemblyPlan.status || "",
      stepCount: (assemblyPlan.steps || []).length,
      riskItemCount: (assemblyPlan.riskItems || []).length,
      checkStatuses: Object.fromEntries((assemblyPlan.checks || []).map((check) => [check.name, check.status]))
    }),
    gateItem("development_board_scaffold", scaffoldGateStatus(developmentBoardScaffold), {
      requirement: "Development-board bring-up scaffold is generated or explicitly blocked with reasons.",
      evidenceRef: evidenceReferences.developmentBoardScaffold || "development_board_scaffold.json",
      status: developmentBoardScaffold.status || "",
      generatedFileCount: (developmentBoardScaffold.generatedFiles || []).length,
      blockedReasonCount: (developmentBoardScaffold.blockedReasons || []).length,
      checkStatuses: Object.fromEntries((developmentBoardScaffold.checks || []).map((check) => [check.name, check.status]))
    }),
    gateItem("evidence_revision_context", evidenceGateStatus(evidenceReferences), {
      requirement: "Readiness outputs are persisted as revision evidence/context references.",
      evidenceRef: evidenceReferences.prototypeReadinessReport || "prototype_readiness_report.json",
      requiredRefs: requiredPrototypeReadinessEvidenceRefs(),
      presentRefs: Object.keys(evidenceReferences).filter((key) => evidenceReferences[key])
    }),
    gateItem("prototype_boundaries", boundaryGateStatus(boundaries), {
      requirement: "V1 remains prototype readiness only and excludes manufacturing/PCB/runtime expansion.",
      evidenceRef: evidenceReferences.prototypeReadinessReport || "prototype_readiness_report.json",
      boundaries: clone(boundaries)
    })
  ];
  const blockingItemCount = items.filter((item) => item.status === "blocked").length;
  const warningItemCount = items.filter((item) => item.status === "warning").length;
  const decision = blockingItemCount
    ? "blocked"
    : warningItemCount ? "needs_review" : "ready";
  return {
    version: PROTOTYPE_READINESS_GATE_VERSION,
    scopeClassification: CORE_V1,
    decision,
    canEnterInternalPrototypeBuild: decision === "ready",
    items,
    blockingItemCount,
    warningItemCount,
    completionStandard: "Ready means every V1 gate item passed; Needs Review or Blocked must not enter unattended internal prototype build.",
    directEditingAllowed: false
  };
}

function gateItem(name, status, detail = {}) {
  return {
    name,
    ...detail,
    status,
    directEditingAllowed: false
  };
}

function trustGateStatus(report = {}) {
  if (report.status === "blocked") return "blocked";
  if (report.status === "warning") return "warning";
  if (report.status === "pass" && report.componentCount > 0) return "pass";
  return "blocked";
}

function electronicsSpecGateStatus(spec = {}) {
  if (
    spec.version === ELECTRONICS_SPEC_VERSION
    && spec.sourceOfTruth?.electronicsSpecDerived === true
    && spec.sourceOfTruth?.directEditingAllowed === false
    && spec.mainController?.componentId
    && (spec.selectedComponentIds || []).length > 0
  ) {
    return "pass";
  }
  return "blocked";
}

function validationGateStatus(validation = {}) {
  if (validation.status === "blocked") return "blocked";
  if (validation.status === "warning") return "warning";
  if (validation.status === "pass" && validation.canEnterPrototypeBuild === true) return "pass";
  return "blocked";
}

function assemblyGateStatus(assemblyPlan = {}) {
  const checkStatuses = (assemblyPlan.checks || []).map((check) => check.status);
  if (assemblyPlan.status === "blocked" || checkStatuses.includes("blocked")) return "blocked";
  if (assemblyPlan.status === "needs_review" || (assemblyPlan.riskItems || []).some((item) => item.level === "warning")) return "warning";
  if (assemblyPlan.status === "feasible" && (assemblyPlan.steps || []).length > 0) return "pass";
  return "blocked";
}

function scaffoldGateStatus(scaffold = {}) {
  const checkStatuses = (scaffold.checks || []).map((check) => check.status);
  if (scaffold.status === "missing_information" || checkStatuses.includes("blocked")) return "blocked";
  if (scaffold.status === "generated" && (scaffold.generatedFiles || []).length > 0) return "pass";
  return "blocked";
}

function evidenceGateStatus(evidenceReferences = {}) {
  const missingRefs = requiredPrototypeReadinessEvidenceRefs().filter((key) => !evidenceReferences[key]);
  return missingRefs.length ? "blocked" : "pass";
}

function boundaryGateStatus(boundaries = {}) {
  const blocked = boundaries.prototypeReadinessOnly !== true
    || boundaries.manufacturingReadiness !== false
    || boundaries.customPcb !== false
    || boundaries.supplierOrdering !== false
    || boundaries.ota !== false
    || boundaries.fullFirmwareRuntime !== false
    || boundaries.arbitraryUserComponentImport !== false
    || boundaries.productionCertification !== false
    || boundaries.frontendRedesign !== false;
  return blocked ? "blocked" : "pass";
}

function requiredPrototypeReadinessEvidenceRefs() {
  return [
    "productPlan",
    "geometrySpec",
    "componentDescriptors",
    "electronicsDescriptorTrustReport",
    "electronicsSpec",
    "electronicsValidation",
    "assemblyPlan",
    "developmentBoardScaffold",
    "prototypeReadinessReport"
  ];
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
    version: componentDescriptor?.versioning?.descriptorVersion || componentDescriptor?.descriptorVersion || "product_plan_scoped_proxy",
    alternatives: alternatives(
      `${type}_product_plan_scoped_proxy`,
      base.componentId ? [base.componentId] : [],
      "ProductPlan-scoped same-type replacement requires a dedicated ElectronicsDescriptor before unattended prototype build."
    ),
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
    alternatives: descriptor.alternatives || alternatives(`${descriptor.componentType || "component"}_untracked`, [], "Alternative relationship has not been reviewed."),
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

function electronicsDescriptorTrustEntry(descriptor = {}) {
  const missingFields = missingElectronicsDescriptorFields(descriptor);
  const reviewBlocked = BLOCKING_REVIEW_STATUSES.includes(descriptor.reviewStatus || "")
    || descriptor.trustLevel === "blocked";
  const reviewRequired = descriptor.requiresHumanReview === true
    || descriptor.forgeApproved === false
    || descriptor.reviewStatus === "human_review_required"
    || descriptor.trustLevel === "reviewable_proxy";
  const status = missingFields.length || reviewBlocked
    ? "blocked"
    : reviewRequired ? "warning" : "pass";
  return {
    componentId: descriptor.componentId || "",
    internalComponentId: descriptor.componentId || "",
    componentType: descriptor.componentType || "",
    displayName: descriptor.displayName || "",
    mpn: descriptor.mpn || "",
    supplier: {
      name: descriptor.supplier?.name || "",
      status: descriptor.supplier?.status || "",
      procurementSourceControlled: descriptor.supplier?.status === "vetted_internal_source"
    },
    datasheet: {
      title: descriptor.datasheet?.title || "",
      url: descriptor.datasheet?.url || "",
      status: descriptor.datasheet?.status || ""
    },
    internalMeasurements: {
      recordPresent: descriptor.internalMeasurements && typeof descriptor.internalMeasurements.available === "boolean",
      available: descriptor.internalMeasurements?.available === true,
      note: descriptor.internalMeasurements?.note || ""
    },
    descriptorVersion: descriptor.descriptorVersion || descriptor.version || "",
    alternatives: {
      recordPresent: Array.isArray(descriptor.alternatives?.componentIds) && Boolean(descriptor.alternatives?.note),
      replacementGroup: descriptor.alternatives?.replacementGroup || "",
      componentIds: Array.isArray(descriptor.alternatives?.componentIds) ? [...descriptor.alternatives.componentIds] : [],
      note: descriptor.alternatives?.note || ""
    },
    trustLevel: descriptor.trustLevel || "blocked",
    reviewStatus: descriptor.reviewStatus || "unknown",
    forgeApproved: descriptor.forgeApproved === true,
    requiresHumanReview: descriptor.requiresHumanReview === true,
    requiredEvidenceComplete: missingFields.length === 0,
    missingFields,
    status,
    issues: trustEntryIssues({ descriptor, missingFields, reviewBlocked, reviewRequired }),
    directEditingAllowed: false
  };
}

function missingElectronicsDescriptorFields(descriptor = {}) {
  return REQUIRED_ELECTRONICS_DESCRIPTOR_FIELDS.filter((fieldPath) => isMissingEvidenceField(descriptor, fieldPath));
}

function isMissingEvidenceField(source = {}, fieldPath = "") {
  const parts = fieldPath.split(".");
  let value = source;
  for (const part of parts) {
    if (value == null || typeof value !== "object" || !(part in value)) return true;
    value = value[part];
  }
  if (typeof value === "boolean") return false;
  if (Array.isArray(value)) return false;
  if (typeof value === "number") return Number.isNaN(value);
  return value === null || value === undefined || value === "";
}

function trustEntryIssues({ descriptor = {}, missingFields = [], reviewBlocked = false, reviewRequired = false } = {}) {
  const issues = [];
  if (missingFields.length) {
    issues.push({
      type: "missing_required_electronics_descriptor_evidence",
      severity: "blocked",
      missingFields
    });
  }
  if (reviewBlocked) {
    issues.push({
      type: "electronics_descriptor_review_blocked",
      severity: "blocked",
      reviewStatus: descriptor.reviewStatus || "",
      trustLevel: descriptor.trustLevel || ""
    });
  }
  if (!missingFields.length && !reviewBlocked && reviewRequired) {
    issues.push({
      type: "component_requires_human_review",
      severity: "warning",
      reviewStatus: descriptor.reviewStatus || "",
      trustLevel: descriptor.trustLevel || "",
      forgeApproved: descriptor.forgeApproved === true
    });
  }
  return issues;
}

function componentTrustRecord(descriptor) {
  return {
    componentId: descriptor.componentId,
    componentType: descriptor.componentType,
    mpn: descriptor.mpn || "",
    supplierStatus: descriptor.supplier?.status || "",
    datasheetStatus: descriptor.datasheet?.status || "",
    internalMeasurementAvailable: descriptor.internalMeasurements?.available === true,
    descriptorVersion: descriptor.version || descriptor.descriptorVersion || "",
    alternativeComponentIds: Array.isArray(descriptor.alternatives?.componentIds) ? [...descriptor.alternatives.componentIds] : [],
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
    powerRole: descriptor.power?.role || "",
    quantity,
    rail: descriptor.power?.rail || descriptor.power?.outputRail || "",
    operatingVoltage: Number(descriptor.power?.operatingVoltage || 0),
    peakCurrentMa: Number(descriptor.power?.peakCurrentMa || 0) * quantity,
    interfaces: descriptor.interfaces || [],
    trustLevel: descriptor.trustLevel || "",
    reviewStatus: descriptor.reviewStatus || ""
  };
}

function powerPathFor({ mainController = null, electronicsDescriptors = [], geometrySpec = {} } = {}) {
  const routes = Array.isArray(geometrySpec.routes) ? geometrySpec.routes : [];
  const controllerInputRail = mainController?.power?.inputRail || "";
  const controllerVoltage = Number(mainController?.power?.operatingVoltage || 0);
  const inputSources = electronicsDescriptors
    .filter((descriptor) => ["power_input", "battery_source"].includes(descriptor.power?.role))
    .map((descriptor) => {
      const outputRail = descriptor.power?.outputRail || descriptor.power?.rail || "";
      const sourceConnectorId = powerSourceConnectorId(descriptor, outputRail);
      return {
        componentId: descriptor.componentId,
        role: descriptor.power?.role || "",
        rail: outputRail,
        voltage: Number(descriptor.power?.operatingVoltage || 0),
        availableMa: Number(descriptor.power?.maxCurrentMa || 0),
        sourceConnectorId,
        reviewStatus: descriptor.reviewStatus || "",
        trustLevel: descriptor.trustLevel || ""
      };
    });
  const activeInput = inputSources.find((source) => source.rail === controllerInputRail) || null;
  const controllerConnectorId = controllerPowerConnectorId(mainController, controllerInputRail);
  const route = activeInput && mainController?.componentId
    ? routeForConnection(
      routes,
      activeInput.componentId,
      activeInput.sourceConnectorId,
      mainController.componentId,
      controllerConnectorId
    )
    : null;
  return {
    controllerComponentId: mainController?.componentId || "",
    controllerInputRail,
    controllerVoltage,
    sourceComponentId: activeInput?.componentId || "",
    sourceRail: activeInput?.rail || "",
    sourceVoltage: Number(activeInput?.voltage || 0),
    sourceConnectorId: activeInput?.sourceConnectorId || "",
    controllerConnectorId,
    routeId: route?.id || "",
    inputSources,
    directEditingAllowed: false
  };
}

function connectionRequirementsFor({ mainController = null, interfaceAssignments = [], geometrySpec = {} } = {}) {
  const routes = Array.isArray(geometrySpec.routes) ? geometrySpec.routes : [];
  return interfaceAssignments
    .filter((assignmentRecord) => assignmentRecord.status !== "blocked")
    .map((assignmentRecord) => {
      const controllerConnectorId = expectedControllerConnectorForAssignment(assignmentRecord);
      const exactRoute = routeForConnection(
        routes,
        assignmentRecord.componentId,
        assignmentRecord.connectorId,
        mainController?.componentId || "",
        controllerConnectorId
      );
      const componentRoute = routes.find((route) => (
        route.from?.componentId === assignmentRecord.componentId
        || route.to?.componentId === assignmentRecord.componentId
      ));
      return {
        assignmentId: assignmentRecord.assignmentId,
        componentId: assignmentRecord.componentId,
        interfaceType: assignmentRecord.interfaceType,
        componentConnectorId: assignmentRecord.connectorId || "",
        controllerComponentId: mainController?.componentId || "",
        controllerConnectorId,
        routeId: exactRoute?.id || "",
        observedRouteId: componentRoute?.id || "",
        status: exactRoute ? "linked" : componentRoute ? "connector_mismatch" : "missing_route",
        reviewOnly: assignmentRecord.status === "assigned_with_review",
        directEditingAllowed: false
      };
    });
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

function powerSourceConnectorId(descriptor = {}, rail = "") {
  const connectors = descriptor.connectors || [];
  const railConnector = connectors.find((connector) => connector.rail === rail && connector.connectorId !== "usb_c");
  if (railConnector?.connectorId) return railConnector.connectorId;
  const outputConnector = connectors.find((connector) => ["power_out", "power_leads", "power_lead"].includes(connector.connectorId));
  if (outputConnector?.connectorId) return outputConnector.connectorId;
  const ifaceConnector = (descriptor.interfaces || []).find((iface) => iface.type === "power")?.connectorId;
  return ifaceConnector || connectors[0]?.connectorId || "";
}

function controllerPowerConnectorId(mainController = {}, rail = "") {
  const connector = (mainController.connectors || []).find((item) => item.rail === rail)
    || (mainController.connectors || []).find((item) => item.interfaceType === "usb");
  return connector?.connectorId || "";
}

function expectedControllerConnectorForAssignment(assignmentRecord = {}) {
  if (assignmentRecord.interfaceType === "spi") return "display_port";
  if (assignmentRecord.interfaceType === "i2c") return "i2c";
  if (assignmentRecord.interfaceType === "gpio") return "gpio";
  if (assignmentRecord.interfaceType === "gpio_pwm") return "speaker";
  if (assignmentRecord.interfaceType === "camera_parallel") return "gpio";
  return "";
}

function routeForConnection(routes = [], fromComponentId = "", fromConnectorId = "", toComponentId = "", toConnectorId = "") {
  return routes.find((route) => (
    endpointMatches(route.from, fromComponentId, fromConnectorId)
    && endpointMatches(route.to, toComponentId, toConnectorId)
  ) || (
    endpointMatches(route.to, fromComponentId, fromConnectorId)
    && endpointMatches(route.from, toComponentId, toConnectorId)
  )) || null;
}

function endpointMatches(endpoint = {}, componentId = "", connectorId = "") {
  if (!componentId || !connectorId) return false;
  return endpoint?.componentId === componentId && endpoint?.connectorId === connectorId;
}

function voltageCompatibilityIssues(electronicsSpec = {}) {
  const rails = new Map((electronicsSpec.powerBudget?.rails || []).map((rail) => [rail.rail, rail]));
  const toleranceVolts = 0.15;
  return (electronicsSpec.peripherals || [])
    .filter((peripheral) => !["battery_source", "power_input"].includes(peripheral.powerRole))
    .flatMap((peripheral) => {
      if (!peripheral.rail) {
        return [issue("voltage_rail_missing", `${peripheral.componentId} has no assigned power rail.`, {
          componentId: peripheral.componentId
        })];
      }
      const rail = rails.get(peripheral.rail);
      if (!rail) {
        return [issue("voltage_rail_missing", `${peripheral.componentId} references missing ${peripheral.rail} rail.`, {
          componentId: peripheral.componentId,
          rail: peripheral.rail
        })];
      }
      const operatingVoltage = Number(peripheral.operatingVoltage || 0);
      const railVoltage = Number(rail.voltage || 0);
      if (operatingVoltage > 0 && railVoltage > 0 && Math.abs(operatingVoltage - railVoltage) > toleranceVolts) {
        return [issue("voltage_mismatch", `${peripheral.componentId} expects ${operatingVoltage}V but ${peripheral.rail} is ${railVoltage}V.`, {
          componentId: peripheral.componentId,
          rail: peripheral.rail,
          operatingVoltage,
          railVoltage,
          toleranceVolts
        })];
      }
      return [];
    });
}

function powerPathIssues(electronicsSpec = {}) {
  const path = electronicsSpec.powerPath || {};
  const issues = [];
  if (!path.controllerComponentId) return issues;
  if (!path.controllerInputRail) {
    issues.push(issue("power_path_unresolved", `${path.controllerComponentId} has no declared controller input rail.`, {
      componentId: path.controllerComponentId
    }));
    return issues;
  }
  if (!path.sourceComponentId) {
    issues.push(issue("power_path_unresolved", `No controlled power source feeds ${path.controllerInputRail}.`, {
      rail: path.controllerInputRail
    }));
  }
  if (path.sourceComponentId && !path.routeId) {
    issues.push(issue("power_path_route_missing", `${path.sourceComponentId} has no GeometrySpec route to ${path.controllerComponentId}.`, {
      sourceComponentId: path.sourceComponentId,
      controllerComponentId: path.controllerComponentId,
      sourceConnectorId: path.sourceConnectorId || "",
      controllerConnectorId: path.controllerConnectorId || ""
    }));
  }
  const sourceVoltage = Number(path.sourceVoltage || 0);
  const controllerVoltage = Number(path.controllerVoltage || 0);
  if (sourceVoltage > 0 && controllerVoltage > 0 && Math.abs(sourceVoltage - controllerVoltage) > 0.15) {
    issues.push(issue("power_path_voltage_mismatch", `${path.sourceComponentId} provides ${sourceVoltage}V but ${path.controllerComponentId} expects ${controllerVoltage}V.`, {
      sourceComponentId: path.sourceComponentId || "",
      controllerComponentId: path.controllerComponentId || "",
      sourceVoltage,
      controllerVoltage
    }));
  }
  return issues;
}

function connectionRequirementIssues(electronicsSpec = {}) {
  return (electronicsSpec.connectionRequirements || [])
    .filter((requirement) => requirement.status !== "linked")
    .map((requirement) => issue(
      requirement.status === "connector_mismatch" ? "interface_connector_mismatch" : "interface_route_missing",
      `${requirement.componentId} ${requirement.interfaceType} requires ${requirement.componentConnectorId} -> ${requirement.controllerConnectorId} GeometrySpec route linkage.`,
      {
        assignmentId: requirement.assignmentId || "",
        componentId: requirement.componentId || "",
        interfaceType: requirement.interfaceType || "",
        componentConnectorId: requirement.componentConnectorId || "",
        controllerComponentId: requirement.controllerComponentId || "",
        controllerConnectorId: requirement.controllerConnectorId || "",
        observedRouteId: requirement.observedRouteId || "",
        reviewOnly: requirement.reviewOnly === true
      }
    ));
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
    electronics_descriptor_evidence_incomplete: "Complete the controlled ElectronicsDescriptor evidence before treating this part as build-ready.",
    component_requires_review: "Keep the component in human review or replace it with a Forge-approved descriptor.",
    rail_current_exceeded: "Reduce module load, choose a lower-current display/module, or move this to a future reviewed power design.",
    voltage_rail_missing: "Assign the component to a declared controller output rail before prototype bring-up.",
    voltage_mismatch: "Select a same-voltage module or add reviewed level-shifting/power conversion in a future goal.",
    power_path_unresolved: "Restore a controlled power source that feeds the selected controller input rail.",
    power_path_route_missing: "Restore the GeometrySpec route between the power source connector and controller power connector.",
    power_path_voltage_mismatch: "Use a controlled source that matches the controller input voltage or move conversion design to review.",
    interface_assignment_blocked: "Choose a supported same-type component or extend ElectronicsDescriptor/layout support in a future goal.",
    interface_connector_mismatch: "Align the ElectronicsSpec connector assignment with the descriptor-backed GeometrySpec route endpoints.",
    interface_route_missing: "Restore the descriptor-backed GeometrySpec cable route for this interface before bring-up.",
    pin_conflict: "Move one assignment to an unused board pin in the controlled pin map.",
    power_input_missing: "Restore a controlled USB-C power input or approved reviewed battery path."
  };
  return {
    issueType: issueRecord.type || "",
    suggestion: suggestions[issueRecord.type] || "Record this as an internal prototype review item before build."
  };
}

function withAssemblyStepMetadata(steps = []) {
  const stepIds = new Set(steps.map((item) => item.stepId));
  return steps.map((item, index) => {
    const dependsOn = assemblyDependenciesFor(item.stepId, stepIds);
    return {
      sequence: index + 1,
      dependsOn,
      manualConfirmationRequired: item.manualConfirmationRequired === true
        || item.humanReviewRequired === true
        || String(item.stepId || "").endsWith("_review"),
      ...item,
      dependsOn,
      directEditingAllowed: false
    };
  });
}

function assemblyDependenciesFor(stepId = "", stepIds = new Set()) {
  if (stepId === "prep_shell_back") return [];
  if (stepId === "install_core_board") return ["prep_shell_back"].filter((id) => stepIds.has(id));
  if (stepId === "connect_display") return ["install_core_board"].filter((id) => stepIds.has(id));
  if (stepId === "seat_display") return ["connect_display"].filter((id) => stepIds.has(id));
  if (stepId === "install_usb_c") return ["install_core_board"].filter((id) => stepIds.has(id));
  if (stepId === "close_shell") {
    return [
      "seat_display",
      "install_usb_c",
      "install_ambient_sensor",
      "install_buttons",
      "install_speaker",
      "install_camera_review",
      "install_battery_review"
    ].filter((id) => stepIds.has(id));
  }
  if (stepId === "bring_up_check") return ["close_shell"].filter((id) => stepIds.has(id));
  if (stepId.startsWith("install_")) return ["install_core_board"].filter((id) => stepIds.has(id));
  return [];
}

function assemblyChecksFor({
  steps = [],
  placements = [],
  routes = [],
  features = [],
  componentDescriptors = [],
  selectedComponentIds = [],
  geometrySpec = {}
} = {}) {
  const checks = [];
  checks.push(geometryLinkageCheck({ geometrySpec, placements, routes, features, componentDescriptors }));
  checks.push(assemblyDependencyCheck(steps));
  checks.push(assemblyEvidenceCheck(steps, selectedComponentIds));
  checks.push(manualConfirmationCheck(steps, selectedComponentIds));
  return checks;
}

function geometryLinkageCheck({ geometrySpec = {}, placements = [], routes = [], features = [], componentDescriptors = [] } = {}) {
  const riskItems = [];
  if (!geometrySpec?.version) {
    riskItems.push(assemblyRisk("assembly_geometry_spec_missing", "blocked", "AssemblyPlan requires a V3 GeometrySpec reference."));
  }
  if (placements.length === 0) {
    riskItems.push(assemblyRisk("assembly_placements_missing", "blocked", "AssemblyPlan requires descriptor-backed component placements."));
  }
  if (features.length === 0) {
    riskItems.push(assemblyRisk("assembly_features_missing", "blocked", "AssemblyPlan requires shell features and retention geometry."));
  }
  return {
    name: "geometry_linkage",
    status: riskItems.some((item) => item.level === "blocked") ? "blocked" : "pass",
    placementCount: placements.length,
    routeCount: routes.length,
    featureCount: features.length,
    accessVolumeCount: countAccessVolumes(placements, componentDescriptors),
    riskItems,
    directEditingAllowed: false
  };
}

function assemblyDependencyCheck(steps = []) {
  const sequenceById = new Map(steps.map((item) => [item.stepId, item.sequence]));
  const riskItems = [];
  for (const item of steps) {
    for (const dependency of item.dependsOn || []) {
      if (!sequenceById.has(dependency)) {
        riskItems.push(assemblyRisk("assembly_dependency_missing", "blocked", `${item.stepId} depends on missing ${dependency}.`, {
          stepId: item.stepId,
          dependency
        }));
      } else if (Number(sequenceById.get(dependency)) >= Number(item.sequence)) {
        riskItems.push(assemblyRisk("assembly_dependency_order_invalid", "blocked", `${item.stepId} must occur after ${dependency}.`, {
          stepId: item.stepId,
          dependency
        }));
      }
    }
  }
  return {
    name: "assembly_sequence_dependencies",
    status: riskItems.length ? "blocked" : "pass",
    stepCount: steps.length,
    dependencyCount: steps.reduce((sum, item) => sum + (item.dependsOn || []).length, 0),
    riskItems,
    directEditingAllowed: false
  };
}

function assemblyEvidenceCheck(steps = [], selectedComponentIds = []) {
  const riskItems = [];
  const addMissing = (item, field, level, message) => {
    if (!Array.isArray(item[field]) || item[field].length === 0) {
      riskItems.push(assemblyRisk(`assembly_${field}_missing`, level, message, {
        stepId: item.stepId,
        componentId: item.componentId || ""
      }));
    }
  };
  for (const item of steps) {
    if (["prep_shell_back", "install_core_board", "seat_display", "install_usb_c", "close_shell"].includes(item.stepId)) {
      addMissing(item, "geometryRefs", "blocked", `${item.stepId} requires GeometrySpec feature or placement refs.`);
    }
    if (["connect_display", "install_usb_c", "install_ambient_sensor", "install_buttons", "install_speaker", "install_camera_review", "install_battery_review"].includes(item.stepId)) {
      addMissing(item, "routeRefs", "blocked", `${item.stepId} requires a GeometrySpec cable route ref.`);
    }
    if (["install_core_board", "connect_display", "install_usb_c"].includes(item.stepId)) {
      addMissing(item, "accessRefs", "blocked", `${item.stepId} requires service/access-volume refs for internal prototype assembly.`);
    } else if (["install_ambient_sensor", "install_buttons", "install_speaker", "install_camera_review", "install_battery_review"].includes(item.stepId)) {
      addMissing(item, "accessRefs", "warning", `${item.stepId} should keep service/access-volume refs visible for manual build.`);
    }
    if (item.stepId === "bring_up_check") {
      addMissing(item, "electronicsRefs", "blocked", "bring_up_check requires ElectronicsSpec assignment refs.");
    }
  }
  if (selectedComponentIds.some((id) => id.startsWith("display_")) && !steps.some((item) => item.stepId === "connect_display")) {
    riskItems.push(assemblyRisk("assembly_display_connection_step_missing", "blocked", "Display builds require a display connection step."));
  }
  return {
    name: "step_evidence_refs",
    status: riskItems.some((item) => item.level === "blocked") ? "blocked" : riskItems.length ? "warning" : "pass",
    missingEvidenceCount: riskItems.length,
    riskItems,
    directEditingAllowed: false
  };
}

function manualConfirmationCheck(steps = [], selectedComponentIds = []) {
  const reviewSteps = steps.filter((item) => item.manualConfirmationRequired);
  const reviewComponents = selectedComponentIds.filter((id) => (
    id === "camera_module_basic"
    || id === "battery_lipo_2000"
    || id === "battery_18650_holder"
    || id === "speaker_20mm"
  ));
  const riskItems = [
    ...reviewSteps.map((item) => assemblyRisk("assembly_manual_confirmation_required", "warning", `${item.stepId} requires human confirmation during prototype assembly.`, {
      stepId: item.stepId,
      componentId: item.componentId || ""
    }))
  ];
  return {
    name: "manual_confirmation",
    status: riskItems.length ? "warning" : "pass",
    reviewStepCount: reviewSteps.length,
    reviewComponents,
    riskItems,
    directEditingAllowed: false
  };
}

function assemblyRisk(type, level, message, extra = {}) {
  return {
    type,
    level,
    message,
    ...extra
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

function optionalAssemblySteps({
  selectedComponentIds = [],
  placements = [],
  routes = [],
  features = [],
  componentDescriptors = []
} = {}) {
  const steps = [];
  if (selectedComponentIds.includes("ambient_sensor_basic")) {
    steps.push(step("install_ambient_sensor", "Install ambient sensor behind the front window and route I2C cable to the core board.", {
      componentId: "ambient_sensor_basic",
      routeRefs: routeIdsFor(routes, "ambient_sensor_basic"),
      geometryRefs: [
        ...placementIds(placements, ["ambient_sensor_basic"]),
        ...featureIds(features, ["sensor_window"])
      ],
      accessRefs: accessVolumeIds(placements, componentDescriptors, ["ambient_sensor_basic"])
    }));
  }
  if (selectedComponentIds.includes("speaker_20mm")) {
    steps.push(step("install_speaker", "Install speaker against grille clearance and keep wires away from USB-C strain relief.", {
      componentId: "speaker_20mm",
      routeRefs: routeIdsFor(routes, "speaker_20mm"),
      geometryRefs: [
        ...placementIds(placements, ["speaker_20mm"]),
        ...featureIds(features, ["speaker_vents", "grille_mount_retention"])
      ],
      accessRefs: accessVolumeIds(placements, componentDescriptors, ["speaker_20mm"]),
      manualConfirmationRequired: true
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
      ],
      accessRefs: accessVolumeIds(placements, componentDescriptors, [buttonId])
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
      accessRefs: accessVolumeIds(placements, componentDescriptors, ["camera_module_basic"]),
      manualConfirmationRequired: true,
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
      accessRefs: accessVolumeIds(placements, componentDescriptors, [batteryId]),
      manualConfirmationRequired: true,
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

function accessVolumeIds(placements = [], componentDescriptors = [], componentIds = []) {
  const ids = new Set(componentIds.filter(Boolean));
  const refs = [];
  for (const placement of placements) {
    const componentId = placement.componentId || placement.moduleId;
    if (!ids.has(componentId)) continue;
    for (const access of placement.accessVolumes || []) {
      refs.push(`${componentId}.${access.id || access.connectorId || "access"}`);
    }
  }
  for (const descriptor of componentDescriptors) {
    const componentId = descriptor.id || descriptor.identity?.id;
    if (!ids.has(componentId)) continue;
    for (const access of descriptor.accessVolumes || []) {
      refs.push(`${componentId}.${access.id || access.connectorId || "access"}`);
    }
  }
  return [...new Set(refs)].filter(Boolean);
}

function countAccessVolumes(placements = [], componentDescriptors = []) {
  const refs = accessVolumeIds(
    placements,
    componentDescriptors,
    [
      ...placements.map((placement) => placement.componentId || placement.moduleId),
      ...componentDescriptors.map((descriptor) => descriptor.id || descriptor.identity?.id)
    ]
  );
  return refs.length;
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

function createBringUpConfig({
  productPlan = {},
  electronicsSpec = {},
  board = {},
  assignments = [],
  moduleInitScaffold = [],
  testEntrypoints = [],
  behaviorRules = []
} = {}) {
  return {
    version: "bringup_config_v1",
    source: "ProductPlan and ElectronicsSpec derived bring-up scaffold",
    sourceOfTruth: {
      productPlan: "ProductPlan",
      electronicsSpec: "ElectronicsSpec",
      directEditingAllowed: false
    },
    productPlan: {
      productType: productPlan.productType || "",
      userIntent: productPlan.userIntent || electronicsSpec.productPlan?.userIntent || "",
      requirements: clone(productPlan.requirements || electronicsSpec.productPlan?.requirements || {})
    },
    targetBoard: {
      componentId: board.componentId || "",
      boardFamily: board.boardFamily || "",
      productionFirmware: false
    },
    powerPath: {
      sourceComponentId: electronicsSpec.powerPath?.sourceComponentId || "",
      controllerComponentId: electronicsSpec.powerPath?.controllerComponentId || "",
      controllerInputRail: electronicsSpec.powerPath?.controllerInputRail || "",
      routeId: electronicsSpec.powerPath?.routeId || "",
      status: electronicsSpec.powerPath?.status || ""
    },
    powerBudget: clone(electronicsSpec.powerBudget || {}),
    pinMap: assignments.flatMap((assignment) => (assignment.pins || []).map((pin) => ({
      assignmentId: assignment.assignmentId || "",
      componentId: pin.componentId || assignment.componentId || "",
      interfaceType: assignment.interfaceType || "",
      bus: assignment.bus || "",
      signal: pin.signal || "",
      pin: pin.pin || "",
      status: assignment.status || "",
      sharedBus: assignment.sharedBus === true
    }))),
    interfaceMap: assignments.map((assignment) => ({
      assignmentId: assignment.assignmentId || "",
      componentId: assignment.componentId || "",
      interfaceType: assignment.interfaceType || "",
      bus: assignment.bus || "",
      connectorId: assignment.connectorId || "",
      pinCount: (assignment.pins || []).length,
      status: assignment.status || "",
      note: assignment.note || ""
    })),
    moduleInit: clone(moduleInitScaffold),
    testEntrypoints: clone(testEntrypoints),
    behaviorRules: clone(behaviorRules),
    boundaries: {
      internalBringUpOnly: true,
      productionFirmware: false,
      fullFirmwareRuntime: false,
      ota: false,
      deviceRuntime: false,
      longTermUserProgramming: false
    },
    directEditingAllowed: false
  };
}

function bringUpFileManifest() {
  return [
    {
      path: "firmware/bringup/pin_map.json",
      kind: "config",
      purpose: "Pin and interface map for internal bring-up only."
    },
    {
      path: "firmware/bringup/main.cpp",
      kind: "source_stub",
      purpose: "Module init scaffold and smoke-test entrypoint."
    },
    {
      path: "firmware/bringup/bringup_checklist.md",
      kind: "checklist",
      purpose: "Manual bench checklist for power-on and module tests."
    },
    {
      path: "firmware/bringup/behavior_rules.placeholder.json",
      kind: "behavior_placeholder",
      purpose: "ProductPlan-derived behavior placeholders for internal bring-up."
    }
  ];
}

function generatedBringUpFiles({ bringUpConfig = {}, checklist = [] } = {}) {
  return [
    {
      path: "firmware/bringup/pin_map.json",
      kind: "config",
      status: "generated",
      contentEncoding: "utf8",
      content: pinMapJsonContent(bringUpConfig)
    },
    {
      path: "firmware/bringup/main.cpp",
      kind: "source_stub",
      status: "generated",
      contentEncoding: "utf8",
      content: mainCppContent(bringUpConfig)
    },
    {
      path: "firmware/bringup/bringup_checklist.md",
      kind: "checklist",
      status: "generated",
      contentEncoding: "utf8",
      content: checklistMarkdownContent({ bringUpConfig, checklist })
    },
    {
      path: "firmware/bringup/behavior_rules.placeholder.json",
      kind: "behavior_placeholder",
      status: "generated",
      contentEncoding: "utf8",
      content: behaviorRulesJsonContent(bringUpConfig)
    }
  ];
}

function pinMapJsonContent(bringUpConfig = {}) {
  return `${JSON.stringify({
    version: bringUpConfig.version || "bringup_config_v1",
    source: "ElectronicsSpec",
    productionReady: false,
    targetBoard: bringUpConfig.targetBoard || {},
    powerPath: bringUpConfig.powerPath || {},
    pinMap: bringUpConfig.pinMap || [],
    interfaceMap: bringUpConfig.interfaceMap || [],
    boundaries: bringUpConfig.boundaries || {}
  }, null, 2)}\n`;
}

function mainCppContent(bringUpConfig = {}) {
  const moduleInit = Array.isArray(bringUpConfig.moduleInit) ? bringUpConfig.moduleInit : [];
  const testEntrypoints = Array.isArray(bringUpConfig.testEntrypoints) ? bringUpConfig.testEntrypoints : [];
  const initCalls = moduleInit
    .filter((item) => item.status !== "blocked")
    .map((item) => sanitizeFunctionName(item.functionName))
    .filter(Boolean);
  const testCalls = testEntrypoints
    .map((item) => sanitizeFunctionName(item.functionName))
    .filter(Boolean);
  const functionNames = [...new Set([...initCalls, ...testCalls])];
  const prototypes = [
    ...functionNames.map((name) => `void ${name}();`),
    "void run_bringup_smoke_tests();"
  ];
  const stubs = functionNames.flatMap((name) => [
    `void ${name}() {`,
    `  Serial.println("stub:${escapeCString(name)}");`,
    "}",
    ""
  ]);
  return [
    "// Generated by Forge for internal prototype bring-up only.",
    "// This scaffold is not production firmware or a device runtime.",
    "#include <Arduino.h>",
    "",
    ...prototypes,
    "",
    "void setup() {",
    "  Serial.begin(115200);",
    "  delay(200);",
    `  Serial.println("Forge bring-up scaffold: ${escapeCString(bringUpConfig.targetBoard?.componentId || "unknown_board")}");`,
    ...(initCalls.length
      ? initCalls.map((name) => `  ${name}();`)
      : ["  Serial.println(\"No module init assignments are available.\");"]),
    "}",
    "",
    "void loop() {",
    "  run_bringup_smoke_tests();",
    "  delay(1000);",
    "}",
    "",
    ...stubs,
    "void run_bringup_smoke_tests() {",
    ...(testCalls.length
      ? testCalls.map((name) => `  ${name}();`)
      : ["  Serial.println(\"No smoke test entrypoints are available.\");"]),
    "}",
    ""
  ].join("\n");
}

function checklistMarkdownContent({ bringUpConfig = {}, checklist = [] } = {}) {
  const lines = [
    "# Forge internal bring-up checklist",
    "",
    "- Scope: internal prototype bring-up only.",
    `- Target board: ${bringUpConfig.targetBoard?.componentId || "missing"}`,
    `- Power path route: ${bringUpConfig.powerPath?.routeId || "missing"}`,
    "- Production firmware: false",
    ""
  ];
  for (const item of checklist) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function behaviorRulesJsonContent(bringUpConfig = {}) {
  return `${JSON.stringify({
    version: "behavior_rules_placeholder_v1",
    source: "ProductPlan behavior placeholder",
    productionReady: false,
    rules: bringUpConfig.behaviorRules || [],
    boundaries: {
      behaviorPlaceholderOnly: true,
      fullFirmwareRuntime: false,
      deviceRuntime: false,
      ota: false
    }
  }, null, 2)}\n`;
}

function uniqueModuleInitScaffold(records = []) {
  const seen = new Map();
  return records.map((record) => {
    const baseName = sanitizeFunctionName(record.functionName || "init_module");
    const count = (seen.get(baseName) || 0) + 1;
    seen.set(baseName, count);
    return {
      ...record,
      functionName: count === 1 ? baseName : `${baseName}_${count}`
    };
  });
}

function testEntrypointsFor(assignments = []) {
  const entrypoints = [
    testEntrypoint("boot_serial_log", "test_boot_serial_log", "Confirm serial boot log and board reset behavior."),
    testEntrypoint("usb_power_stability_check", "test_usb_power_stability_check", "Confirm current-limited USB-C power remains stable.")
  ];
  if (assignments.some((assignment) => assignment.interfaceType === "spi")) {
    entrypoints.push(testEntrypoint("display_test_pattern", "test_display_test_pattern", "Show a display test pattern."));
  }
  if (assignments.some((assignment) => assignment.interfaceType === "gpio")) {
    entrypoints.push(testEntrypoint("button_gpio_event", "test_button_gpio_event", "Log button GPIO transitions."));
  }
  if (assignments.some((assignment) => assignment.interfaceType === "i2c")) {
    entrypoints.push(testEntrypoint("ambient_sensor_read", "test_ambient_sensor_read", "Read one I2C ambient sensor sample."));
  }
  if (assignments.some((assignment) => assignment.interfaceType === "gpio_pwm")) {
    entrypoints.push(testEntrypoint("speaker_pwm_beep", "test_speaker_pwm_beep", "Emit a short PWM speaker test tone."));
  }
  if (assignments.some((assignment) => assignment.interfaceType === "camera_parallel")) {
    entrypoints.push(testEntrypoint(
      "camera_frame_probe_human_review",
      "test_camera_frame_probe_human_review",
      "Probe camera frame wiring only after human review approval."
    ));
  }
  return entrypoints;
}

function testEntrypoint(testId, functionName, purpose) {
  return {
    testId,
    functionName,
    purpose,
    status: "stub",
    productionReady: false
  };
}

function behaviorRulePlaceholders(productPlan = {}, assignments = []) {
  const requirements = productPlan.requirements || {};
  const hasDisplay = requirements.display === true || assignments.some((assignment) => assignment.interfaceType === "spi");
  const hasButton = Number(requirements.buttons || 0) > 0
    || assignments.some((assignment) => assignment.interfaceType === "gpio");
  const hasAmbientSensor = requirements.ambientSensor === true
    || assignments.some((assignment) => assignment.interfaceType === "i2c");
  const hasSpeaker = requirements.speaker === true
    || assignments.some((assignment) => assignment.interfaceType === "gpio_pwm");
  const rules = [
    behaviorRule("boot_ready_signal", "boot", hasDisplay ? "show_display_test_pattern" : "print_serial_ready_log")
  ];
  if (hasButton) {
    rules.push(behaviorRule("button_smoke_event", "button_press", "print_button_event_to_serial"));
  }
  if (hasAmbientSensor) {
    rules.push(behaviorRule("ambient_sensor_sample", "test_interval", "print_one_ambient_sensor_sample"));
  }
  if (hasSpeaker) {
    rules.push(behaviorRule("speaker_smoke_tone", "manual_test", "emit_short_pwm_test_tone"));
  }
  return rules;
}

function behaviorRule(ruleId, trigger, action) {
  return {
    ruleId,
    trigger,
    action,
    source: "ProductPlan behavior placeholder",
    status: "placeholder",
    productionReady: false
  };
}

function bringUpChecklistFor({ electronicsSpec = {}, assignments = [], behaviorRules = [] } = {}) {
  const checklist = [
    "Power board from current-limited USB-C bench supply.",
    "Confirm 3.3V rail before attaching display or sensor modules.",
    "Flash bring-up scaffold and read serial boot log."
  ];
  if (electronicsSpec.powerPath?.routeId) {
    checklist.push(`Verify power route ${electronicsSpec.powerPath.routeId} before closing the shell.`);
  } else {
    checklist.push("Confirm the USB-C to controller power route before flashing.");
  }
  if (assignments.some((assignment) => assignment.interfaceType === "spi")) {
    checklist.push("Run display test pattern and confirm screen orientation.");
  }
  if (assignments.some((assignment) => assignment.interfaceType === "gpio")) {
    checklist.push("Press each button and confirm one serial event per press.");
  }
  if (assignments.some((assignment) => assignment.interfaceType === "i2c")) {
    checklist.push("Read one I2C sensor sample and record the observed value.");
  }
  if (behaviorRules.length > 0) {
    checklist.push("Review behavior placeholder rules before any firmware expansion.");
  }
  checklist.push("Record any pin or cable-route mismatch back into ProductPlan evidence.");
  return checklist;
}

function scaffoldChecksFor({
  board = {},
  assignments = [],
  electronicsSpec = {},
  electronicsValidation = {},
  generatedFiles = []
} = {}) {
  const validationChecks = Object.fromEntries((electronicsValidation.checks || []).map((check) => [check.name, check.status]));
  const blockedAssignments = assignments.filter((assignment) => assignment.status === "blocked");
  const pinCount = assignments.reduce((sum, assignment) => sum + (assignment.pins || []).length, 0);
  const fileManifestCount = bringUpFileManifest().length;
  const generatedFileContentsReady = generatedFiles.length === fileManifestCount
    && generatedFiles.every((file) => typeof file.content === "string" && file.content.trim().length > 0);
  return [
    {
      name: "target_board_present",
      status: board.componentId ? "pass" : "blocked",
      componentId: board.componentId || ""
    },
    {
      name: "pin_map_available",
      status: pinCount > 0 && blockedAssignments.length === 0 ? "pass" : "blocked",
      pinCount,
      blockedAssignmentCount: blockedAssignments.length
    },
    {
      name: "interfaces_ready",
      status: blockedAssignments.length > 0
        || validationChecks.interface_assignment === "blocked"
        || validationChecks.interface_route_alignment === "blocked"
        || validationChecks.pin_conflicts === "blocked"
        ? "blocked"
        : "pass",
      assignmentCount: assignments.length,
      blockedAssignmentCount: blockedAssignments.length
    },
    {
      name: "power_path_ready",
      status: validationChecks.power_path === "blocked" || !electronicsSpec.powerPath?.routeId ? "blocked" : "pass",
      routeId: electronicsSpec.powerPath?.routeId || ""
    },
    {
      name: "generated_file_contents",
      status: generatedFileContentsReady ? "pass" : "blocked",
      generatedFileCount: generatedFiles.length,
      expectedFileCount: fileManifestCount
    }
  ];
}

function scaffoldBlockedReasons({
  board = {},
  assignments = [],
  electronicsValidation = {},
  checks = []
} = {}) {
  const reasons = [];
  if (!board.componentId) {
    reasons.push({
      type: "missing_target_board",
      message: "Development board scaffold requires a Forge-controlled main controller.",
      componentId: ""
    });
  }
  for (const error of electronicsValidation.errors || []) {
    reasons.push({
      type: error.type || "electronics_validation_error",
      message: error.message || "Electronics validation blocked bring-up scaffold generation.",
      componentId: error.componentId || "",
      assignmentId: error.assignmentId || ""
    });
  }
  for (const assignment of assignments.filter((item) => item.status === "blocked")) {
    reasons.push({
      type: "interface_assignment_blocked",
      message: assignment.note || "Interface assignment is blocked.",
      componentId: assignment.componentId || "",
      assignmentId: assignment.assignmentId || ""
    });
  }
  for (const check of checks.filter((item) => item.status === "blocked")) {
    reasons.push({
      type: `scaffold_check_${check.name}`,
      message: `${check.name} did not pass for development-board bring-up scaffold.`,
      componentId: check.componentId || "",
      assignmentId: ""
    });
  }
  const seen = new Set();
  return reasons.filter((reason) => {
    const key = `${reason.type}:${reason.componentId || ""}:${reason.assignmentId || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeFunctionName(value) {
  const name = String(value || "stub")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!name) return "stub";
  return /^[0-9]/.test(name) ? `_${name}` : name;
}

function escapeCString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"");
}
