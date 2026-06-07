import { clone } from "./workspace_state.mjs";

export const ELECTRONICS_DESCRIPTOR_VERSION = "electronics_descriptor_v1";
export const ELECTRONICS_DESCRIPTOR_TRUST_REPORT_VERSION = "electronics_descriptor_trust_report_v1";
export const ELECTRONICS_SPEC_VERSION = "electronics_spec_v1";
export const ELECTRONICS_VALIDATION_VERSION = "electronics_validation_v1";
export const ASSEMBLY_PLAN_VERSION = "assembly_plan_v1";
export const DEVELOPMENT_BOARD_SCAFFOLD_VERSION = "development_board_scaffold_v1";
export const PROTOTYPE_READINESS_REPORT_VERSION = "prototype_readiness_report_v1";

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
  electronicsDescriptorTrustReport = {},
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
      electronicsDescriptorTrustReport: "electronics_descriptor_trust_report.json",
      electronicsSpec: "electronics_spec.json",
      electronicsValidation: "electronics_validation_report.json",
      assemblyPlan: "assembly_plan.json",
      developmentBoardScaffold: "development_board_scaffold.json",
      directEditingAllowed: false
    },
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
      electronicsDescriptorTrustReport: "electronics_descriptor_trust_report.json",
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
