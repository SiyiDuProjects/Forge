import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAsset } from "./assets.mjs";
import { createComponentAssetManifest } from "./component_asset_manifest.mjs";
import { selectComponents } from "./component_selection.mjs";
import { generateLayout } from "./layout_engine.mjs";
import { addProceduralProxyGeometry } from "./proxy_geometry_builder.mjs";
import { validatePrototypeGeometry } from "./validation_engine.mjs";
import { productPlanFromSpecModules } from "./workspace_state.mjs";

const modelRoot = fileURLToPath(new URL("../../data/models/", import.meta.url));

export function createGeometrySpec({ spec = {}, modules = [], riskReport = {}, productPlan: inputProductPlan = null } = {}) {
  const productPlan = inputProductPlan
    ? JSON.parse(JSON.stringify(inputProductPlan))
    : productPlanFromSpecModules({
      spec,
      modules,
      riskReport,
      requestText: spec.user_request
    });
  const componentSelection = selectComponents(productPlan);
  const componentAssetManifest = createComponentAssetManifest(componentSelection.componentDescriptors);
  const layout = generateLayout(productPlan, componentSelection.componentDescriptors);
  const prototypeValidation = validatePrototypeGeometry({
    productPlan,
    componentSelection,
    layout
  });
  const screenSize = Number(productPlan.requirements?.displaySizeInches || spec.enclosure?.screen_size_in || 3.5);
  const dimensionsMm = layout.enclosure.dimensionsMm;
  const screenOpeningFeature = layout.features.find((feature) => feature.type === "screen_opening");
  const usbOpeningFeature = layout.features.find((feature) => feature.type === "usb_cutout");
  const enclosure = {
    ...layout.enclosure,
    screenOpening: screenOpeningFeature
      ? {
        id: "screen_bezel",
        type: "display",
        side: "front",
        sizeIn: screenSize,
        sizeMm: { width: screenOpeningFeature.sizeMm[0], height: screenOpeningFeature.sizeMm[1] },
        positionMm: { x: 0, y: 0, z: "front_face" }
      }
      : screenOpening(screenSize),
    connectorOpenings: [
      {
        id: "usb_c_rear",
        type: "usb_c",
        side: "back",
        sizeMm: { width: usbOpeningFeature?.sizeMm?.[0] || 12, height: usbOpeningFeature?.sizeMm?.[1] || 5 },
        positionMm: pointArrayToObject(usbOpeningFeature?.positionMm || [0, -dimensionsMm.height / 2 + 14, -dimensionsMm.depth / 2])
      }
    ],
    mounting: {
      type: "standard_core_board_standoffs",
      standoffs: layout.features
        .filter((feature) => feature.type === "standoff")
        .map((feature) => ({
          id: feature.id,
          x: feature.positionMm[0],
          y: feature.positionMm[1],
          diameterMm: feature.outerDiameterMm,
          holeDiameterMm: feature.holeDiameterMm,
          heightMm: feature.heightMm
        }))
    }
  };
  const moduleGeometry = layout.placements.map((placement) => ({
    ...placement,
    placement: {
      ...placement.placement,
      positionMm: placement.positionMm
    }
  }));
  for (const module of modules.filter((item) => !isMappedInputModule(item))) {
    moduleGeometry.push(moduleToGeometry(module, moduleGeometry.length, enclosure));
  }
  const connectors = createSemanticConnectors(moduleGeometry, layout.features);
  const cableRoutes = layout.routes.map((route) => ({
    ...route,
    pointsMm: route.pathMm.map(([x, y, z]) => ({ x, y, z }))
  }));

  return {
    version: "geometry_spec_v1",
    source: "product_plan_revision",
    units: "mm",
    coordinateSystem: {
      x: "width",
      y: "height",
      z: "depth",
      front: "+z",
      origin: "enclosure_center"
    },
    cadKernel: {
      target: "CadQuery/OpenCascade",
      adapter: "cadquery_python",
      currentRuntime: "internal_parametric_v1",
      solidWorksRole: "internal_step_handoff_only"
    },
    userViewer: {
      mode: "interactive_glb_preview",
      allowed: ["orbit_rotate", "zoom", "pan", "view_mode_switch"],
      disallowed: ["drag_parts", "edit_holes", "edit_geometry", "cad_export_for_user"],
      modificationPath: "conversation_revision_only"
    },
    requiredArtifacts: ["component_descriptors", "component_asset_manifest", "glb", "stl", "step", "validation_report"],
    productPlan,
    componentSelections: {
      selectedComponentIds: componentSelection.selectedComponentIds,
      componentQuantities: componentSelection.componentQuantities || {},
      riskModuleIds: componentSelection.riskModuleIds,
      assumptions: componentSelection.assumptions,
      warnings: componentSelection.warnings
    },
    componentDescriptors: componentSelection.componentDescriptors,
    componentAssetManifest,
    enclosure,
    modules: moduleGeometry,
    placements: moduleGeometry,
    features: layout.features,
    connectors,
    cableRoutes,
    routes: cableRoutes,
    validationWarnings: prototypeValidation.warnings,
    validationErrors: prototypeValidation.errors,
    metadata: {
      placedModuleCount: moduleGeometry.length,
      riskModuleIds: componentSelection.riskModuleIds,
      shapeProfile: layout.enclosure.shapeProfile,
      placementPreferences: productPlan.geometryPreferences?.placements || {},
      componentDescriptorVersion: "component_descriptor_v2",
      assetQualitySummary: componentAssetManifest.components.map((component) => ({
        componentId: component.componentId,
        assetQuality: component.assetQuality,
        validationStatus: component.validationStatus,
        resolvedPreviewType: component.preview.resolvedType,
        resolvedMechanicalType: component.mechanical.resolvedType
      })),
      directEditingAllowed: false
    },
    riskReport: {
      blocked: Boolean(riskReport.blocked),
      reviewLevel: Number(riskReport.reviewLevel || 0),
      items: [
        ...(riskReport.items || []),
        ...prototypeValidation.warnings.map((warning) => ({
          level: warning.severity || "warn",
          text: warning.message,
          moduleId: warning.moduleId || ""
        }))
      ]
    }
  };
}

export function validateGeometrySpec(geometrySpec = {}) {
  const issues = [];
  const modules = geometrySpec.modules || [];
  const enclosure = geometrySpec.enclosure || {};
  const dimensions = enclosure.dimensionsMm || {};

  for (const error of geometrySpec.validationErrors || []) {
    issues.push({
      level: "block",
      code: error.type || "geometry_error",
      moduleId: error.moduleId || "",
      message: error.message || "Geometry validation blocked artifact generation."
    });
  }

  for (const warning of geometrySpec.validationWarnings || []) {
    issues.push({
      level: "warn",
      code: warning.type || "geometry_warning",
      moduleId: warning.moduleId || "",
      message: warning.message || "Geometry requires human validation."
    });
  }

  for (const module of modules) {
    if (module.category === "Shell") continue;
    if (module.geometryStatus === "missing_geometry") {
      issues.push({
        level: "block",
        code: "missing_module_geometry",
        moduleId: module.moduleId,
        message: `${module.name} is missing dimensions, mounting, or interface metadata.`
      });
    }
    if (module.status === "review") {
      issues.push({
        level: "warn",
        code: "human_review_required",
        moduleId: module.moduleId,
        message: `${module.name} can be previewed but must be checked by a human reviewer.`
      });
    }
    if (module.capabilities?.includes("servo_motion")) {
      issues.push({
        level: "block",
        code: "motion_outside_standard_path",
        moduleId: module.moduleId,
        message: "Motion structures are outside the standard 3D printed shell path."
      });
    }
    if (module.dimensionsMm && dimensions.width && dimensions.height) {
      const tooWide = module.dimensionsMm.width > dimensions.width - enclosure.wallThicknessMm * 2;
      const tooTall = module.dimensionsMm.height > dimensions.height - enclosure.wallThicknessMm * 2;
      if (tooWide || tooTall) {
        issues.push({
          level: "block",
          code: "module_exceeds_shell",
          moduleId: module.moduleId,
          message: `${module.name} exceeds the current shell envelope.`
        });
      }
    }
  }

  if (dimensions.depth && dimensions.depth < 34) {
    issues.push({
      level: "warn",
      code: "tight_shell_depth",
      message: "Shell depth is tight for standoffs and rear connector access."
    });
  }

  const blocked = issues.some((issue) => issue.level === "block") || Boolean(geometrySpec.riskReport?.blocked);
  return {
    status: blocked ? "blocked" : issues.some((issue) => issue.level === "warn") ? "passed_with_warnings" : "passed",
    canGenerateArtifacts: !blocked,
    issues,
    checks: [
      "component_descriptor_v2",
      "component_asset_manifest",
      "screen_opening",
      "usb_c_rear_opening",
      "board_standoffs",
      "module_volume_placeholders",
      "interface_directions",
      "coarse_cable_routes",
      "placed_module_nodes",
      "interface_markers",
      "descriptor_route_endpoints",
      "asset_quality_status",
      "semantic_shell_features",
      "shell_front_stl",
      "shell_back_stl"
    ],
    userEditingAllowed: false,
    note: blocked
      ? "No GLB/STL/STEP artifacts are emitted for blocked or incomplete geometry."
      : "GLB/STL/STEP artifacts are generated from ProductPlan and GeometrySpec, not from raw chat text or AI-generated mesh."
  };
}

export function generateModelArtifacts({ geometrySpec, planId = "", revisionId = "", jobId = "", generateArtifacts = true } = {}) {
  const validation = validateGeometrySpec(geometrySpec);
  const emptyArtifacts = {
    productPlan: null,
    geometrySpec: null,
    componentSelections: null,
    componentDescriptors: null,
    componentAssetManifest: null,
    validationReport: null,
    designSummary: null,
    cadqueryScript: null,
    glb: null,
    stl: null,
    shellFront: null,
    shellBack: null,
    step: null
  };
  if (!generateArtifacts) {
    return {
      status: validation.canGenerateArtifacts ? "pending_confirmation" : "blocked",
      provider: "internal_parametric_v1",
      targetProvider: "cadquery_open_cascade",
      artifactDir: "",
      artifacts: emptyArtifacts,
      validation,
      pendingReason: validation.canGenerateArtifacts
        ? "awaiting_user_confirmation"
        : "geometry_blocked"
    };
  }

  const artifactId = safeFileName(revisionId || jobId || "model");
  const outputDir = join(modelRoot, artifactId);
  mkdirSync(outputDir, { recursive: true });

  const productPlanPath = join(outputDir, "product_plan.json");
  const geometrySpecPath = join(outputDir, "geometry-spec.json");
  const componentSelectionsPath = join(outputDir, "component_selections.json");
  const componentDescriptorsPath = join(outputDir, "component_descriptors.json");
  const componentAssetManifestPath = join(outputDir, "component_asset_manifest.json");
  const validationPath = join(outputDir, "validation_report.json");
  const designSummaryPath = join(outputDir, "design_summary.md");
  const cadQueryPath = join(outputDir, "generate_model.py");
  writeFileSync(productPlanPath, JSON.stringify(geometrySpec.productPlan || {}, null, 2));
  writeFileSync(geometrySpecPath, JSON.stringify(geometrySpec, null, 2));
  writeFileSync(componentSelectionsPath, JSON.stringify(geometrySpec.componentSelections || {}, null, 2));
  writeFileSync(componentDescriptorsPath, JSON.stringify(geometrySpec.componentDescriptors || [], null, 2));
  writeFileSync(componentAssetManifestPath, JSON.stringify(geometrySpec.componentAssetManifest || {}, null, 2));
  writeFileSync(validationPath, JSON.stringify(validation, null, 2));
  writeFileSync(designSummaryPath, createDesignSummary(geometrySpec, validation));
  writeFileSync(cadQueryPath, cadQueryScript(geometrySpec));

  const assets = {
    productPlan: artifactAsset({
      type: "text",
      path: productPlanPath,
      url: `/data/models/${artifactId}/product_plan.json`,
      caption: "Structured ProductPlan used for this generated prototype revision"
    }),
    geometrySpec: artifactAsset({
      type: "geometry_spec",
      path: geometrySpecPath,
      url: `/data/models/${artifactId}/geometry-spec.json`,
      caption: "GeometrySpec source of truth for this ProductPlan revision"
    }),
    componentSelections: artifactAsset({
      type: "text",
      path: componentSelectionsPath,
      url: `/data/models/${artifactId}/component_selections.json`,
      caption: "Finite component selections resolved before descriptor-driven layout"
    }),
    componentDescriptors: artifactAsset({
      type: "component_descriptors",
      path: componentDescriptorsPath,
      url: `/data/models/${artifactId}/component_descriptors.json`,
      caption: "ComponentDescriptor v2 data used as the source for proxy geometry, shell features, connectors, and validation"
    }),
    componentAssetManifest: artifactAsset({
      type: "component_asset_manifest",
      path: componentAssetManifestPath,
      url: `/data/models/${artifactId}/component_asset_manifest.json`,
      caption: "Resolved component asset manifest with proxy/vendor status and validation status"
    }),
    validationReport: artifactAsset({
      type: "validation_report",
      path: validationPath,
      url: `/data/models/${artifactId}/validation_report.json`,
      caption: "Geometry validation report for generated shell, modules, interfaces, and routes"
    }),
    designSummary: artifactAsset({
      type: "text",
      path: designSummaryPath,
      url: `/data/models/${artifactId}/design_summary.md`,
      caption: "Human-readable design summary for the generated hardware prototype"
    }),
    cadqueryScript: artifactAsset({
      type: "cadquery_script",
      path: cadQueryPath,
      url: `/data/models/${artifactId}/generate_model.py`,
      caption: "CadQuery/OpenCascade adapter script for internal engineering handoff"
    })
  };

  if (!validation.canGenerateArtifacts) {
    return {
      status: "blocked",
      provider: "cadquery_adapter_reserved",
      artifactDir: outputDir,
      artifacts: {
        productPlan: assets.productPlan,
        geometrySpec: assets.geometrySpec,
        componentSelections: assets.componentSelections,
        componentDescriptors: assets.componentDescriptors,
        componentAssetManifest: assets.componentAssetManifest,
        validationReport: assets.validationReport,
        designSummary: assets.designSummary,
        cadqueryScript: assets.cadqueryScript,
        glb: null,
        stl: null,
        shellFront: null,
        shellBack: null,
        step: null
      },
      validation
    };
  }

  const glbPath = join(outputDir, "model.glb");
  const stlPath = join(outputDir, "model.stl");
  const shellFrontPath = join(outputDir, "shell_front.stl");
  const shellBackPath = join(outputDir, "shell_back.stl");
  const stepPath = join(outputDir, "model.step");
  writeFileSync(glbPath, createGlb(geometrySpec));
  const shellFrontStl = createShellFrontStl(geometrySpec);
  const shellBackStl = createShellBackStl(geometrySpec);
  writeFileSync(stlPath, `${shellFrontStl}\n${shellBackStl}`);
  writeFileSync(shellFrontPath, shellFrontStl);
  writeFileSync(shellBackPath, shellBackStl);
  writeFileSync(stepPath, createStepHandoff(geometrySpec));

  assets.glb = artifactAsset({
    type: "glb",
    path: glbPath,
    url: `/data/models/${artifactId}/model.glb`,
    caption: "Interactive user preview model; viewer supports rotate, zoom, and pan only"
  });
  assets.stl = artifactAsset({
    type: "stl",
    path: stlPath,
    url: `/data/models/${artifactId}/model.stl`,
    caption: "Shell-only 3D print prototype artifact; electronics are excluded"
  });
  assets.shellFront = artifactAsset({
    type: "stl",
    path: shellFrontPath,
    url: `/data/models/${artifactId}/shell_front.stl`,
    caption: "Shell-only 3D print prototype: front bezel shell"
  });
  assets.shellBack = artifactAsset({
    type: "stl",
    path: shellBackPath,
    url: `/data/models/${artifactId}/shell_back.stl`,
    caption: "Shell-only 3D print prototype: rear tray shell"
  });
  assets.step = artifactAsset({
    type: "step",
    path: stepPath,
    url: `/data/models/${artifactId}/model.step`,
    caption: "Internal STEP handoff target for engineering and SolidWorks review"
  });

  return {
    status: "generated",
    provider: "internal_parametric_v1",
    targetProvider: "cadquery_open_cascade",
    artifactDir: outputDir,
    artifacts: assets,
    validation
  };
}

function shellDimensions(screenSize) {
  return {
    width: Math.round(screenSize * 25.4 * 1.48),
    height: Math.round(screenSize * 25.4 * 0.94),
    depth: screenSize >= 7 ? 42 : 36
  };
}

function screenOpening(screenSize) {
  return {
    id: "screen_bezel",
    type: "display",
    side: "front",
    sizeIn: screenSize,
    sizeMm: {
      width: Math.round(screenSize * 25.4 * 1.2),
      height: Math.round(screenSize * 25.4 * 0.76)
    },
    positionMm: { x: 0, y: 0, z: "front_face" }
  };
}

function standardMounting(dimensions) {
  const insetX = Math.max(18, Math.round(dimensions.width * 0.19));
  const insetY = Math.max(14, Math.round(dimensions.height * 0.22));
  return {
    type: "standard_core_board_standoffs",
    standoffs: [
      { id: "standoff_top_left", x: -insetX, y: insetY, diameterMm: 5, holeDiameterMm: 2.4 },
      { id: "standoff_top_right", x: insetX, y: insetY, diameterMm: 5, holeDiameterMm: 2.4 },
      { id: "standoff_bottom_left", x: -insetX, y: -insetY, diameterMm: 5, holeDiameterMm: 2.4 },
      { id: "standoff_bottom_right", x: insetX, y: -insetY, diameterMm: 5, holeDiameterMm: 2.4 }
    ]
  };
}

function moduleToGeometry(module, index, enclosure) {
  const geometry = module.geometry || null;
  const base = {
    moduleId: module.id,
    name: module.name,
    category: module.category,
    status: module.status,
    capabilities: module.capabilities || [],
    riskTags: geometry?.riskTags || [],
    placement: modulePlacement(module, index, enclosure),
    interfaces: geometry?.interfaces || [],
    clearanceMm: geometry?.clearanceMm || {},
    mounting: geometry?.mounting || null
  };

  if (module.category === "Shell") {
    return {
      ...base,
      role: "enclosure_finish",
      geometryStatus: "ready",
      dimensionsMm: enclosure.dimensionsMm
    };
  }

  if (!geometry?.dimensionsMm || !geometry?.mounting || !Array.isArray(geometry?.interfaces)) {
    return {
      ...base,
      role: "module_placeholder",
      geometryStatus: "missing_geometry",
      dimensionsMm: null
    };
  }

  return {
    ...base,
    role: roleForModule(module),
    geometryStatus: "ready",
    dimensionsMm: geometry.dimensionsMm
  };
}

function modulePlacement(module, index, enclosure) {
  const dimensions = enclosure.dimensionsMm;
  const moduleDimensions = module.geometry?.dimensionsMm || {};
  if (module.category === "Core" || module.id === "core.y_core_lite") {
    return {
      positionMm: { x: 0, y: 0, z: -dimensions.depth / 2 + 12 },
      orientation: "internal",
      interfaceDirection: "internal_to_front_display"
    };
  }
  if (module.category === "Display") {
    return {
      positionMm: { x: 0, y: 0, z: dimensions.depth / 2 - (moduleDimensions.depth || 5) / 2 },
      orientation: "front",
      interfaceDirection: "ribbon_to_core_board"
    };
  }
  if (module.capabilities?.includes("usb_c_power")) {
    return {
      positionMm: { x: 0, y: -dimensions.height / 2 + 14, z: -dimensions.depth / 2 + 5 },
      orientation: "back",
      interfaceDirection: "rear_usb_c_cutout"
    };
  }
  if (module.capabilities?.includes("ambient_light_sensor")) {
    return {
      positionMm: { x: -dimensions.width / 2 + 22, y: dimensions.height / 2 - 18, z: dimensions.depth / 2 - (moduleDimensions.depth || 3) / 2 },
      orientation: "front",
      interfaceDirection: "front_sensor_window"
    };
  }
  if (module.capabilities?.includes("speaker")) {
    return {
      positionMm: { x: dimensions.width / 2 - 28, y: -dimensions.height / 2 + 18, z: 0 },
      orientation: "down",
      interfaceDirection: "speaker_grille"
    };
  }
  if (module.capabilities?.includes("camera")) {
    return {
      positionMm: { x: 0, y: dimensions.height / 2 - 16, z: dimensions.depth / 2 - (moduleDimensions.depth || 6) / 2 },
      orientation: "front",
      interfaceDirection: "front_camera_window"
    };
  }
  if (module.capabilities?.includes("battery")) {
    return {
      positionMm: { x: 0, y: -dimensions.height / 2 + 28, z: -dimensions.depth / 2 + 10 },
      orientation: "back",
      interfaceDirection: "internal_power_leads"
    };
  }
  if (module.capabilities?.includes("servo_motion")) {
    return {
      positionMm: { x: dimensions.width / 2 - 28, y: 0, z: 0 },
      orientation: "internal",
      interfaceDirection: "manual_expansion_motion"
    };
  }
  return {
    positionMm: { x: 0, y: 0, z: -dimensions.depth / 2 + 11 + index * 2 },
    orientation: "back",
    interfaceDirection: "internal"
  };
}

function roleForModule(module) {
  if (module.category === "Core" || module.id === "core.y_core_lite") return "core_board";
  if (module.capabilities?.includes("screen")) return "front_display";
  if (module.capabilities?.includes("usb_c_power")) return "rear_power_input";
  if (module.capabilities?.includes("camera")) return "front_camera_review";
  if (module.capabilities?.includes("battery")) return "battery_review_volume";
  if (module.capabilities?.includes("servo_motion")) return "blocked_motion_volume";
  if (module.capabilities?.includes("ambient_light_sensor")) return "front_sensor";
  if (module.capabilities?.includes("speaker")) return "speaker_volume";
  return "support_module";
}

function createConnectors(modules, enclosure) {
  const connectors = [
    {
      id: "usb_c_rear",
      type: "usb_c",
      fromModuleId: "power.usb_c_low_voltage",
      side: "back",
      openingId: "usb_c_rear",
      positionMm: enclosure.connectorOpenings[0].positionMm,
      direction: "rear"
    }
  ];
  const displayModule = modules.find((module) => module.category === "Display");
  if (displayModule) {
    connectors.push({
      id: "display_ribbon",
      type: "fpc",
      fromModuleId: displayModule.moduleId,
      toModuleId: "core.y_core_lite",
      side: "internal",
      direction: "front_to_back"
    });
  }
  for (const module of modules) {
    if (module.status === "review" && !module.capabilities?.includes("servo_motion")) {
      connectors.push({
        id: `${module.moduleId}.review_interface`,
        type: module.interfaces?.[0]?.type || "review_interface",
        fromModuleId: module.moduleId,
        side: module.interfaces?.[0]?.side || "internal",
        direction: module.placement.interfaceDirection
      });
    }
  }
  return connectors;
}

function createSemanticConnectors(modules, features = []) {
  const connectors = [];
  for (const module of modules) {
    const componentId = module.componentId || module.moduleId;
    const placement = module.placement?.positionMm || module.positionMm || {};
    for (const connector of module.connectors || module.interfaces || []) {
      if (!connector.id) continue;
      const positionMm = localPointToWorld(placement, connector.positionLocalMm || [0, 0, 0]);
      connectors.push({
        id: connector.requiresExternalAccess || connector.type === "usb_c" && componentId === "usb_c_breakout"
          ? "usb_c_rear"
          : `${componentId}.${connector.id}`,
        connectorId: connector.id,
        type: connector.type,
        fromModuleId: componentId,
        targetModuleId: componentId,
        componentId,
        side: connector.requiresExternalAccess ? "external" : "internal",
        openingId: connector.requiresExternalAccess
          ? features.find((feature) => feature.targetComponentId === componentId && feature.targetConnectorId === connector.id)?.id
          : "",
        positionMm,
        direction: connector.orientation || module.placement?.interfaceDirection || "internal",
        assetQuality: module.assetQuality,
        validationStatus: module.validationStatus,
        source: {
          kind: "componentDescriptor.connectors",
          componentId,
          connectorId: connector.id,
          descriptorPath: module.descriptorPath
        }
      });
    }
  }
  return connectors;
}

function localPointToWorld(origin = {}, local = [0, 0, 0]) {
  return {
    x: Number(origin.x || 0) + Number(local[0] || 0),
    y: Number(origin.y || 0) + Number(local[1] || 0),
    z: Number(origin.z || 0) + Number(local[2] || 0)
  };
}

function isMappedInputModule(module = {}) {
  if (module.category === "Shell") return true;
  return [
    "core.y_core_lite",
    "display.tft_3_5",
    "display.tft_5",
    "display.tft_7",
    "power.usb_c_low_voltage",
    "sensor.ambient_light",
    "audio.micro_speaker",
    "vision.camera_request",
    "power.battery_request",
    "motion.mini_servo"
  ].includes(module.id);
}

function createCableRoutes(connectors, enclosure) {
  const center = { x: 0, y: 0, z: -enclosure.dimensionsMm.depth / 2 + 12 };
  return connectors
    .filter((connector) => connector.id !== "usb_c_rear")
    .map((connector, index) => ({
      id: `${connector.id}.route`,
      connectorId: connector.id,
      routeType: "coarse_internal_path",
      pointsMm: [
        center,
        { x: index * 8 - 8, y: 0, z: 0 },
        { x: index * 10 - 10, y: enclosure.dimensionsMm.height / 2 - 18, z: enclosure.dimensionsMm.depth / 2 - 5 }
      ],
      clearanceMm: 4,
      validation: "human_fit_review"
    }));
}

function artifactAsset({ type, path, url, caption }) {
  return registerAsset({
    type,
    source: "generated",
    url,
    localPath: path,
    caption
  });
}

function safeFileName(value) {
  return String(value || "model").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function cadQueryScript(geometrySpec) {
  const compactSpec = JSON.stringify(geometrySpec, null, 2);
  return `# Forge CadQuery/OpenCascade adapter target.
# This script is emitted from geometrySpec and can replace the internal
# parametric v1 artifact writer when CadQuery is installed in the generation runtime.
#
# Expected runtime:
#   pip install cadquery
#   python generate_model.py

GEOMETRY_SPEC = ${compactSpec}

def build_model(spec):
    import cadquery as cq
    shell = spec["enclosure"]
    dims = shell["dimensionsMm"]
    body = cq.Workplane("XY").box(dims["width"], dims["height"], dims["depth"])
    return body

if __name__ == "__main__":
    model = build_model(GEOMETRY_SPEC)
    model.val().exportStep("model.step")
`;
}

function createGlb(geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const placedModules = placeableModules(geometrySpec);
  const riskModuleIds = placedModules
    .filter((module) => module.status === "review")
    .map((module) => module.moduleId);
  const builder = createGltfBuilder();
  builder.addEmptyNode("shell.standard_desktop_display_shell", {
    role: "standard_3d_printed_shell",
    finish: geometrySpec.enclosure.finish,
    directEditingAllowed: false
  });
  addShellPreviewGeometry(builder, geometrySpec);
  addFeaturePreviewGeometry(builder, geometrySpec);
  for (const module of placedModules) {
    addProceduralProxyGeometry(builder, module);
  }
  addInterfacePreviewGeometry(builder, geometrySpec, placedModules);
  for (const route of geometrySpec.routes || geometrySpec.cableRoutes || []) {
    const points = route.pathMm || (route.pointsMm || []).map((point) => [point.x, point.y, point.z]);
    if (points.length < 2) continue;
    const routeName = route.id || `route.${safeNodeName(route.connectorId)}`;
    builder.addLineNode({
      name: routeName,
      pointsMm: points,
      material: 8,
      extras: {
        routeType: route.routeType || "coarse_internal_path",
        type: route.type || "signal",
        editable: false
      }
    });
    addRoutePreviewGeometry(builder, routeName, points, route);
  }
  if ((geometrySpec.routes || geometrySpec.cableRoutes || []).length > 0) {
    builder.addEmptyNode("route.coarse_cable_paths", {
      routeType: "coarse_internal_path",
      editable: false
    });
  }

  const json = {
    asset: { version: "2.0", generator: "Forge internal_parametric_v1" },
    scene: 0,
    scenes: [{ nodes: builder.nodes.map((_, index) => index) }],
    nodes: builder.nodes,
    meshes: builder.meshes,
    materials: glbMaterials(geometrySpec.enclosure.finish),
    buffers: [{ byteLength: builder.binary.length }],
    bufferViews: builder.bufferViews,
    accessors: builder.accessors,
    extras: {
      geometrySpecVersion: geometrySpec.version,
      userInteraction: geometrySpec.userViewer.allowed,
      placedModuleCount: placedModules.length,
      riskModuleIds,
      componentAssetManifest: geometrySpec.componentAssetManifest,
      moduleNodeNames: placedModules.map((module) => `module.${safeNodeName(module.moduleId)}`),
      featureNodeNames: (geometrySpec.features || []).map((feature) => feature.id),
      directEditingAllowed: false
    }
  };
  return glbFromJsonAndBinary(json, builder.binary);
}

function createGltfBuilder() {
  const chunks = [];
  const builder = {
    bufferViews: [],
    accessors: [],
    meshes: [],
    nodes: [],
    binary: Buffer.alloc(0),
    addEmptyNode(name, extras = {}) {
      this.nodes.push({ name, extras });
      this.binary = Buffer.concat(chunks);
      return this.nodes.length - 1;
    },
    addBoxNode({ name, sizeMm, centerMm = { x: 0, y: 0, z: 0 }, material = 0, extras = {} }) {
      const geometry = boxGeometry(sizeMm);
      return this.addTriangleNode({ name, geometry, centerMm, material, extras });
    },
    addCylinderNode({ name, radiusMm, heightMm, centerMm = { x: 0, y: 0, z: 0 }, material = 11, extras = {}, segments = 16 }) {
      const geometry = cylinderGeometry(radiusMm, heightMm, segments);
      return this.addTriangleNode({ name, geometry, centerMm, material, extras });
    },
    addTriangleNode({ name, geometry, centerMm = { x: 0, y: 0, z: 0 }, material = 0, extras = {} }) {
      const positionAccessor = this.addPositionAccessor(geometry.positions);
      const indexAccessor = this.addIndexAccessor(geometry.indices);
      const meshIndex = this.meshes.length;
      this.meshes.push({
        name: `${name}.mesh`,
        primitives: [{
          attributes: { POSITION: positionAccessor },
          indices: indexAccessor,
          material,
          mode: 4
        }]
      });
      this.nodes.push({
        name,
        mesh: meshIndex,
        translation: mmVector(centerMm),
        extras
      });
      this.binary = Buffer.concat(chunks);
      return this.nodes.length - 1;
    },
    addLineNode({ name, pointsMm, material = 8, extras = {} }) {
      const positions = pointsMm.flatMap((point) => Array.isArray(point) ? point.map((value) => Number(value) / 100) : mmVector(point));
      const positionAccessor = this.addPositionAccessor(positions);
      const meshIndex = this.meshes.length;
      this.meshes.push({
        name: `${name}.mesh`,
        primitives: [{
          attributes: { POSITION: positionAccessor },
          material,
          mode: 1
        }]
      });
      this.nodes.push({ name, mesh: meshIndex, extras });
      this.binary = Buffer.concat(chunks);
      return this.nodes.length - 1;
    },
    addPositionAccessor(values) {
      const buffer = Buffer.from(new Float32Array(values).buffer);
      const bufferView = this.addBufferView(buffer, 34962);
      this.accessors.push({
        bufferView,
        componentType: 5126,
        count: values.length / 3,
        type: "VEC3",
        ...vectorMinMax(values)
      });
      return this.accessors.length - 1;
    },
    addIndexAccessor(values) {
      const buffer = Buffer.from(new Uint16Array(values).buffer);
      const bufferView = this.addBufferView(buffer, 34963);
      this.accessors.push({
        bufferView,
        componentType: 5123,
        count: values.length,
        type: "SCALAR"
      });
      return this.accessors.length - 1;
    },
    addBufferView(buffer, target) {
      const byteOffset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      chunks.push(buffer);
      chunks.push(padBuffer(buffer));
      this.bufferViews.push({
        buffer: 0,
        byteOffset,
        byteLength: buffer.length,
        target
      });
      return this.bufferViews.length - 1;
    }
  };
  return builder;
}

function addShellPreviewGeometry(builder, geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const wall = Number(geometrySpec.enclosure.wallThicknessMm || 2.4);
  const halfZ = dimensions.depth / 2;
  const opening = geometrySpec.features?.find((feature) => feature.type === "screen_opening");
  const openingWidth = opening?.sizeMm?.[0] || dimensions.width * 0.68;
  const openingHeight = opening?.sizeMm?.[1] || dimensions.height * 0.62;
  const sideRailWidth = Math.max(wall * 2, (dimensions.width - openingWidth) / 2);
  const topRailHeight = Math.max(wall * 2, (dimensions.height - openingHeight) / 2);
  const frontZ = halfZ - wall / 2;
  builder.addEmptyNode("shell.front", { role: "front_shell_bezel", finish: geometrySpec.enclosure.finish });
  builder.addEmptyNode("shell.bezel.screen", { role: "screen_bezel_frame", targetFeature: "feature.opening.screen" });
  builder.addBoxNode({
    name: "shell.front.rail.top",
    sizeMm: { width: dimensions.width, height: topRailHeight, depth: wall },
    centerMm: { x: 0, y: dimensions.height / 2 - topRailHeight / 2, z: frontZ },
    material: 0,
    extras: { role: "front_shell_rail" }
  });
  builder.addBoxNode({
    name: "shell.front.rail.bottom",
    sizeMm: { width: dimensions.width, height: topRailHeight, depth: wall },
    centerMm: { x: 0, y: -dimensions.height / 2 + topRailHeight / 2, z: frontZ },
    material: 0,
    extras: { role: "front_shell_rail" }
  });
  builder.addBoxNode({
    name: "shell.front.rail.left",
    sizeMm: { width: sideRailWidth, height: openingHeight, depth: wall },
    centerMm: { x: -dimensions.width / 2 + sideRailWidth / 2, y: 0, z: frontZ },
    material: 0,
    extras: { role: "front_shell_rail" }
  });
  builder.addBoxNode({
    name: "shell.front.rail.right",
    sizeMm: { width: sideRailWidth, height: openingHeight, depth: wall },
    centerMm: { x: dimensions.width / 2 - sideRailWidth / 2, y: 0, z: frontZ },
    material: 0,
    extras: { role: "front_shell_rail" }
  });
  builder.addEmptyNode("shell.back", { role: "rear_tray_frame", finish: geometrySpec.enclosure.finish });
  const rearOpeningWidth = dimensions.width * 0.62;
  const rearOpeningHeight = dimensions.height * 0.48;
  const rearSideRailWidth = Math.max(wall * 2.2, (dimensions.width - rearOpeningWidth) / 2);
  const rearTopRailHeight = Math.max(wall * 2.2, (dimensions.height - rearOpeningHeight) / 2);
  const rearZ = -halfZ + wall / 2;
  builder.addBoxNode({
    name: "shell.back.rail.top",
    sizeMm: { width: dimensions.width, height: rearTopRailHeight, depth: wall },
    centerMm: { x: 0, y: dimensions.height / 2 - rearTopRailHeight / 2, z: rearZ },
    material: 0,
    extras: { role: "rear_tray_rail" }
  });
  builder.addBoxNode({
    name: "shell.back.rail.bottom",
    sizeMm: { width: dimensions.width, height: rearTopRailHeight, depth: wall },
    centerMm: { x: 0, y: -dimensions.height / 2 + rearTopRailHeight / 2, z: rearZ },
    material: 0,
    extras: { role: "rear_tray_rail" }
  });
  builder.addBoxNode({
    name: "shell.back.rail.left",
    sizeMm: { width: rearSideRailWidth, height: rearOpeningHeight, depth: wall },
    centerMm: { x: -dimensions.width / 2 + rearSideRailWidth / 2, y: 0, z: rearZ },
    material: 0,
    extras: { role: "rear_tray_rail" }
  });
  builder.addBoxNode({
    name: "shell.back.rail.right",
    sizeMm: { width: rearSideRailWidth, height: rearOpeningHeight, depth: wall },
    centerMm: { x: dimensions.width / 2 - rearSideRailWidth / 2, y: 0, z: rearZ },
    material: 0,
    extras: { role: "rear_tray_rail" }
  });
  builder.addBoxNode({
    name: "shell.side.left",
    sizeMm: { width: wall, height: dimensions.height, depth: dimensions.depth },
    centerMm: { x: -dimensions.width / 2 + wall / 2, y: 0, z: 0 },
    material: 0,
    extras: { role: "left_side_wall" }
  });
  builder.addBoxNode({
    name: "shell.side.right",
    sizeMm: { width: wall, height: dimensions.height, depth: dimensions.depth },
    centerMm: { x: dimensions.width / 2 - wall / 2, y: 0, z: 0 },
    material: 0,
    extras: { role: "right_side_wall" }
  });
  builder.addBoxNode({
    name: "shell.side.top",
    sizeMm: { width: dimensions.width, height: wall, depth: dimensions.depth },
    centerMm: { x: 0, y: dimensions.height / 2 - wall / 2, z: 0 },
    material: 0,
    extras: { role: "top_side_wall" }
  });
  builder.addBoxNode({
    name: "shell.side.bottom",
    sizeMm: { width: dimensions.width, height: wall, depth: dimensions.depth },
    centerMm: { x: 0, y: -dimensions.height / 2 + wall / 2, z: 0 },
    material: 0,
    extras: { role: "bottom_side_wall" }
  });
}

function addFeaturePreviewGeometry(builder, geometrySpec) {
  for (const feature of geometrySpec.features || []) {
    const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
    if (feature.type === "screen_opening") {
      builder.addBoxNode({
        name: "feature.opening.screen",
        sizeMm: { width: feature.sizeMm[0], height: feature.sizeMm[1], depth: 0.8 },
        centerMm: { ...position, z: Number(position.z || 0) + 0.45 },
        material: 12,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "usb_cutout") {
      builder.addBoxNode({
        name: "feature.opening.usb_c",
        sizeMm: { width: feature.sizeMm[0] + 3, height: feature.sizeMm[1] + 3, depth: 1.2 },
        centerMm: { ...position, z: Number(position.z || 0) - 0.7 },
        material: 7,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "sensor_window") {
      builder.addCylinderNode({
        name: "feature.opening.ambient_sensor",
        radiusMm: 3.8,
        heightMm: 1.2,
        centerMm: { ...position, z: Number(position.z || 0) + 0.7 },
        material: 9,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "camera_window") {
      builder.addCylinderNode({
        name: "feature.opening.camera",
        radiusMm: 5,
        heightMm: 1.2,
        centerMm: { ...position, z: Number(position.z || 0) + 0.7 },
        material: 4,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "speaker_vents") {
      const ventCount = Number(feature.ventCount || 5);
      for (let index = 0; index < ventCount; index += 1) {
        builder.addBoxNode({
          name: `feature.opening.speaker_vents.${index + 1}`,
          sizeMm: { width: 2, height: 10, depth: 1.2 },
          centerMm: { x: position.x - 8 + index * 4, y: position.y, z: position.z - 0.7 },
          material: 12,
          extras: featureExtras(feature)
        });
      }
      continue;
    }
    if (feature.type === "button_hole") {
      builder.addCylinderNode({
        name: feature.id,
        radiusMm: Number(feature.sizeMm?.[0] || 6) / 2,
        heightMm: 1.4,
        centerMm: position,
        material: 7,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "decorative_cat_ear") {
      builder.addBoxNode({
        name: feature.id,
        sizeMm: { width: feature.sizeMm?.[0] || 20, height: feature.sizeMm?.[1] || 16, depth: 2.4 },
        centerMm: position,
        material: 0,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "standoff") {
      builder.addCylinderNode({
        name: feature.id,
        radiusMm: Number(feature.outerDiameterMm || 5) / 2,
        heightMm: Number(feature.heightMm || 8),
        centerMm: {
          x: position.x,
          y: position.y,
          z: position.z + Number(feature.heightMm || 8) / 2
        },
        material: 11,
        extras: featureExtras(feature)
      });
      builder.addCylinderNode({
        name: `${feature.id}.screw_marker`,
        radiusMm: Number(feature.holeDiameterMm || 2.4) / 2,
        heightMm: 0.8,
        centerMm: {
          x: position.x,
          y: position.y,
          z: position.z + Number(feature.heightMm || 8) + 0.45
        },
        material: 14,
        extras: { ...featureExtras(feature), role: "screw_marker" }
      });
      continue;
    }
    if (feature.type === "battery_bay") {
      builder.addBoxNode({
        name: "feature.battery_bay",
        sizeMm: { width: feature.sizeMm[0], height: feature.sizeMm[1], depth: 1.2 },
        centerMm: position,
        material: 12,
        extras: featureExtras(feature)
      });
    }
  }
}

function addModulePreviewGeometry(builder, module) {
  const position = module.placement.positionMm || {};
  const dimensions = module.dimensionsMm || { width: 10, height: 10, depth: 4 };
  const name = `module.${safeNodeName(module.moduleId)}`;
  const extras = {
    moduleId: module.moduleId,
    role: module.role,
    status: module.status,
    riskTags: module.riskTags || [],
    directEditingAllowed: false
  };
  if (module.type === "display" || module.category === "Display") {
    builder.addBoxNode({
      name,
      sizeMm: { ...dimensions, depth: Math.max(2, dimensions.depth) },
      centerMm: position,
      material: 2,
      extras
    });
    builder.addBoxNode({
      name: `${name}.glass`,
      sizeMm: { width: dimensions.width - 5, height: dimensions.height - 5, depth: 0.8 },
      centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 0.45 },
      material: 9,
      extras: { ...extras, role: "screen_glass" }
    });
    return;
  }
  if (module.type === "core_board" || module.category === "Core") {
    const boardDepth = 1.6;
    builder.addBoxNode({
      name,
      sizeMm: { ...dimensions, depth: boardDepth },
      centerMm: position,
      material: 1,
      extras
    });
    const rearFaceZ = Number(position.z || 0) - boardDepth / 2;
    [
      { x: -12, y: 0, width: 10, height: 8 },
      { x: 8, y: 6, width: 8, height: 6 },
      { x: 12, y: -7, width: 12, height: 4 }
    ].forEach((chip, index) => {
      builder.addBoxNode({
        name: `${name}.chip.${index + 1}`,
        sizeMm: { width: chip.width, height: chip.height, depth: 1.8 },
        centerMm: { x: Number(position.x || 0) + chip.x, y: Number(position.y || 0) + chip.y, z: rearFaceZ - 0.9 },
        material: 10,
        extras: { ...extras, role: "pcb_component" }
      });
    });
    [
      { x: -20, y: -10 },
      { x: 20, y: -10 },
      { x: -20, y: 10 },
      { x: 20, y: 10 }
    ].forEach((mount, index) => {
      builder.addCylinderNode({
        name: `${name}.mount.${index + 1}`,
        radiusMm: 1.8,
        heightMm: 0.7,
        centerMm: { x: Number(position.x || 0) + mount.x, y: Number(position.y || 0) + mount.y, z: rearFaceZ - 0.45 },
        material: 14,
        extras: { ...extras, role: "pcb_mount_marker" }
      });
    });
    return;
  }
  if (module.moduleId === "usb_c_breakout" || module.capabilities?.includes("usb_c_power")) {
    builder.addBoxNode({
      name,
      sizeMm: dimensions,
      centerMm: position,
      material: 3,
      extras
    });
    return;
  }
  if (module.type === "sensor" || module.capabilities?.includes("ambient_light_sensor")) {
    builder.addBoxNode({
      name,
      sizeMm: dimensions,
      centerMm: position,
      material: 5,
      extras
    });
    builder.addCylinderNode({
      name: `${name}.lens`,
      radiusMm: 2.2,
      heightMm: 1,
      centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 0.5 },
      material: 9,
      extras: { ...extras, role: "sensor_lens" }
    });
    return;
  }
  if (module.type === "speaker" || module.capabilities?.includes("speaker")) {
    builder.addCylinderNode({
      name,
      radiusMm: Math.min(dimensions.width, dimensions.height) / 2,
      heightMm: dimensions.depth,
      centerMm: position,
      material: 6,
      extras
    });
    return;
  }
  if (module.type === "camera" || module.capabilities?.includes("camera")) {
    builder.addBoxNode({
      name,
      sizeMm: dimensions,
      centerMm: position,
      material: 4,
      extras
    });
    builder.addCylinderNode({
      name: `${name}.lens`,
      radiusMm: 4,
      heightMm: 2,
      centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 1 },
      material: 10,
      extras: { ...extras, role: "camera_lens" }
    });
    return;
  }
  if (module.type === "battery" || module.capabilities?.includes("battery")) {
    builder.addBoxNode({
      name,
      sizeMm: dimensions,
      centerMm: position,
      material: 13,
      extras
    });
    return;
  }
  builder.addBoxNode({
    name,
    sizeMm: dimensions,
    centerMm: position,
    material: materialIndexForModule(module),
    extras
  });
}

function addInterfacePreviewGeometry(builder, geometrySpec, placedModules) {
  const moduleById = new Map(placedModules.map((module) => [module.moduleId, module]));
  for (const connector of geometrySpec.connectors || []) {
    const module = moduleById.get(connector.fromModuleId) || moduleById.get(connector.targetModuleId);
    const position = connector.positionMm || module?.placement?.positionMm;
    if (!position) continue;
    const name = connector.id === "usb_c_rear" || connector.type === "usb_c"
      ? "interface.usb_c.port"
      : `interface.${safeNodeName(connector.id)}`;
    builder.addBoxNode({
      name,
      sizeMm: connector.type === "usb_c" ? { width: 9, height: 3, depth: 2.6 } : { width: 4, height: 4, depth: 4 },
      centerMm: pointArrayToObject(position),
      material: 7,
      extras: {
        connectorId: connector.id,
        type: connector.type,
        direction: connector.direction,
        directEditingAllowed: false
      }
    });
  }
}

function addRoutePreviewGeometry(builder, routeName, points, route) {
  points.forEach((point, index) => {
    builder.addCylinderNode({
      name: `${routeName}.node.${index + 1}`,
      radiusMm: route.type === "power" ? 1.9 : 1.35,
      heightMm: 1.2,
      centerMm: pointArrayToObject(point),
      material: 8,
      extras: {
        routeType: route.routeType || "coarse_internal_path",
        type: route.type || "signal",
        editable: false
      }
    });
  });
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = pointArrayToObject(points[index]);
    const end = pointArrayToObject(points[index + 1]);
    builder.addBoxNode({
      name: `${routeName}.segment.${index + 1}`,
      sizeMm: {
        width: Math.max(Math.abs(end.x - start.x), 2.2),
        height: Math.max(Math.abs(end.y - start.y), 2.2),
        depth: Math.max(Math.abs(end.z - start.z), route.type === "power" ? 2.4 : 1.8)
      },
      centerMm: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        z: (start.z + end.z) / 2
      },
      material: 8,
      extras: {
        routeType: route.routeType || "coarse_internal_path",
        type: route.type || "signal",
        editable: false
      }
    });
  }
}

function featureExtras(feature) {
  return {
    featureId: feature.id,
    featureType: feature.type,
    role: feature.role,
    targetModuleId: feature.targetModuleId,
    targetComponentId: feature.targetComponentId,
    targetConnectorId: feature.targetConnectorId,
    targetFeatureId: feature.targetFeatureId,
    targetMountId: feature.targetMountId,
    source: feature.source,
    directEditingAllowed: false
  };
}

function boxGeometry(sizeMm = {}) {
  const x = Number(sizeMm.width || 1) / 200;
  const y = Number(sizeMm.height || 1) / 200;
  const z = Number(sizeMm.depth || 1) / 200;
  return {
    positions: [
      -x, -y, -z, x, -y, -z, x, y, -z, -x, y, -z,
      -x, -y, z, x, -y, z, x, y, z, -x, y, z
    ],
    indices: [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      1, 5, 6, 1, 6, 2,
      2, 6, 7, 2, 7, 3,
      3, 7, 4, 3, 4, 0
    ]
  };
}

function cylinderGeometry(radiusMm = 2.5, heightMm = 6, segments = 16) {
  const radius = Number(radiusMm || 2.5) / 100;
  const z = Number(heightMm || 6) / 200;
  const positions = [0, 0, -z, 0, 0, z];
  for (let index = 0; index < segments; index += 1) {
    const angle = (Math.PI * 2 * index) / segments;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    positions.push(x, y, -z, x, y, z);
  }
  const indices = [];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    const bottom = 2 + index * 2;
    const top = bottom + 1;
    const nextBottom = 2 + next * 2;
    const nextTop = nextBottom + 1;
    indices.push(0, nextBottom, bottom);
    indices.push(1, top, nextTop);
    indices.push(bottom, nextBottom, nextTop, bottom, nextTop, top);
  }
  return { positions, indices };
}

function vectorMinMax(values) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let index = 0; index < values.length; index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = Number(values[index + axis] || 0);
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }
  return {
    min: min.map((value) => Number(value.toFixed(6))),
    max: max.map((value) => Number(value.toFixed(6)))
  };
}

function placeableModules(geometrySpec) {
  return (geometrySpec.modules || []).filter((module) => {
    if (module.category === "Shell") return false;
    if (module.geometryStatus !== "ready") return false;
    if (module.capabilities?.includes("servo_motion")) return false;
    return Boolean(module.dimensionsMm && module.placement?.positionMm);
  });
}

function routeLinePositions(geometrySpec) {
  const values = [];
  for (const route of geometrySpec.cableRoutes || []) {
    const points = route.pointsMm || [];
    for (let index = 0; index < points.length - 1; index += 1) {
      values.push(...mmVector(points[index]), ...mmVector(points[index + 1]));
    }
  }
  return values;
}

function pointArrayToObject(point = [0, 0, 0]) {
  if (!Array.isArray(point)) return point || { x: 0, y: 0, z: 0 };
  return {
    x: Number(point[0] || 0),
    y: Number(point[1] || 0),
    z: Number(point[2] || 0)
  };
}

function mmVector(point = {}) {
  if (Array.isArray(point)) {
    return [
      Number(point[0] || 0) / 100,
      Number(point[1] || 0) / 100,
      Number(point[2] || 0) / 100
    ];
  }
  return [
    Number(point.x || 0) / 100,
    Number(point.y || 0) / 100,
    Number(point.z || 0) / 100
  ];
}

function materialIndexForModule(module) {
  if (module.status === "review") return 4;
  if (module.category === "Display") return 2;
  if (module.category === "Core") return 1;
  if (module.category === "Power") return 3;
  if (module.category === "Sensor") return 5;
  if (module.category === "Audio") return 6;
  return 1;
}

function glbMaterials(finish) {
  const shellColor = {
    woodgrain: [0.68, 0.48, 0.29, 1],
    graphite: [0.18, 0.2, 0.21, 1],
    sage: [0.46, 0.58, 0.43, 1],
    coral: [0.78, 0.36, 0.28, 1]
  }[finish] || [0.68, 0.48, 0.29, 1];
  return [
    material("shell_finish", shellColor),
    material("core_board", [0.08, 0.56, 0.32, 1]),
    material("display_module", [0.06, 0.08, 0.08, 1]),
    material("power_module", [0.18, 0.32, 0.58, 1]),
    material("human_review_module", [0.92, 0.58, 0.18, 1]),
    material("sensor_module", [0.48, 0.68, 0.62, 1]),
    material("audio_module", [0.5, 0.48, 0.6, 1]),
    material("interface_marker", [0.95, 0.86, 0.18, 1]),
    material("cable_route", [0.12, 0.38, 0.88, 1]),
    material("screen_glass", [0.02, 0.03, 0.035, 1]),
    material("pcb_chip", [0.04, 0.06, 0.055, 1]),
    material("standoff_plastic", [0.78, 0.73, 0.64, 1]),
    material("opening_marker", [0.05, 0.05, 0.045, 0.78], "BLEND"),
    material("battery_review", [0.86, 0.62, 0.22, 1]),
    material("screw_marker", [0.12, 0.12, 0.12, 1])
  ];
}

function material(name, color, alphaMode = "OPAQUE") {
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: 0,
      roughnessFactor: 0.72
    },
    alphaMode
  };
}

function safeNodeName(value) {
  return String(value || "node").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function createDesignSummary(geometrySpec, validation) {
  const productPlan = geometrySpec.productPlan || {};
  const selected = geometrySpec.componentDescriptors || [];
  const modules = selected.map((descriptor) => `- ${descriptor.displayName}`).join("\n");
  const warningLines = (validation.issues || [])
    .filter((issue) => issue.level === "warn")
    .map((issue) => `- ${issue.message}`)
    .join("\n");
  return `# ${titleForProductPlan(productPlan)}

## Selected Components
${modules || "- No components selected"}

## Enclosure
- FDM 3D printed rounded rectangular desktop enclosure
- Front shell and back shell
- Screen opening with bezel
- Sensor window on front when selected
- USB-C opening on back

## Internal Layout
- Display mounted behind the front opening
- Core board mounted on internal standoffs
- USB-C interface exposed through the rear cutout
- Sensor/camera/speaker/battery modules appear only when selected
- Simple visual cable routes show semantic connections

## Generated Artifacts
- component_descriptors.json
- component_asset_manifest.json
- model.glb
- shell_front.stl
- shell_back.stl
- geometry-spec.json
- product_plan.json
- component_selections.json
- validation_report.json

## Mechanical Proxy Notice
- Component bodies, connectors, keepouts, access volumes, openings, and standoffs are generated from ComponentDescriptor v2 proxy data.
- Asset quality and validation status are preserved in GeometrySpec and component_asset_manifest.json.
- This is not production ready until the selected real components and their supplier mechanical assets are reviewed.

## Warnings
${warningLines || "- Prototype preview. Electrical, mechanical, thermal, and safety validation are required before real manufacturing."}
`;
}

function titleForProductPlan(productPlan) {
  const size = productPlan.requirements?.displaySizeInches || 3.5;
  return `${size} inch Desktop Smart Display`;
}

function createShellFrontStl(geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const wall = Number(geometrySpec.enclosure.wallThicknessMm || 2.4);
  const opening = geometrySpec.features?.find((feature) => feature.type === "screen_opening");
  const openingWidth = opening?.sizeMm?.[0] || dimensions.width * 0.68;
  const openingHeight = opening?.sizeMm?.[1] || dimensions.height * 0.62;
  const sideRailWidth = Math.max(wall * 2, (dimensions.width - openingWidth) / 2);
  const topRailHeight = Math.max(wall * 2, (dimensions.height - openingHeight) / 2);
  const z = dimensions.depth / 2 - wall / 2;
  const primitives = [
    stlBox("front_top_screen_rail", { width: dimensions.width, height: topRailHeight, depth: wall }, { x: 0, y: dimensions.height / 2 - topRailHeight / 2, z }),
    stlBox("front_bottom_screen_rail", { width: dimensions.width, height: topRailHeight, depth: wall }, { x: 0, y: -dimensions.height / 2 + topRailHeight / 2, z }),
    stlBox("front_left_screen_rail", { width: sideRailWidth, height: openingHeight, depth: wall }, { x: -dimensions.width / 2 + sideRailWidth / 2, y: 0, z }),
    stlBox("front_right_screen_rail", { width: sideRailWidth, height: openingHeight, depth: wall }, { x: dimensions.width / 2 - sideRailWidth / 2, y: 0, z })
  ];
  for (const feature of geometrySpec.features || []) {
    if (feature.type !== "sensor_window" && feature.type !== "camera_window") continue;
    const position = pointArrayToObject(feature.positionMm);
    const size = feature.type === "camera_window" ? 10 : 7;
    primitives.push(stlBox(`${feature.type}_top_frame`, { width: size, height: 1.2, depth: wall }, { x: position.x, y: position.y + size / 2, z }));
    primitives.push(stlBox(`${feature.type}_bottom_frame`, { width: size, height: 1.2, depth: wall }, { x: position.x, y: position.y - size / 2, z }));
    primitives.push(stlBox(`${feature.type}_left_frame`, { width: 1.2, height: size, depth: wall }, { x: position.x - size / 2, y: position.y, z }));
    primitives.push(stlBox(`${feature.type}_right_frame`, { width: 1.2, height: size, depth: wall }, { x: position.x + size / 2, y: position.y, z }));
  }
  return stlFromPrimitives("forge_shell_front", primitives);
}

function createShellBackStl(geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const wall = Number(geometrySpec.enclosure.wallThicknessMm || 2.4);
  const z = -dimensions.depth / 2 + wall / 2;
  const primitives = [];
  primitives.push(...backPlatePieces(geometrySpec, wall, z));
  primitives.push(stlBox("left_wall", { width: wall, height: dimensions.height, depth: dimensions.depth }, { x: -dimensions.width / 2 + wall / 2, y: 0, z: 0 }));
  primitives.push(stlBox("right_wall", { width: wall, height: dimensions.height, depth: dimensions.depth }, { x: dimensions.width / 2 - wall / 2, y: 0, z: 0 }));
  primitives.push(stlBox("top_wall", { width: dimensions.width, height: wall, depth: dimensions.depth }, { x: 0, y: dimensions.height / 2 - wall / 2, z: 0 }));
  primitives.push(stlBox("bottom_wall", { width: dimensions.width, height: wall, depth: dimensions.depth }, { x: 0, y: -dimensions.height / 2 + wall / 2, z: 0 }));
  for (const feature of geometrySpec.features || []) {
    if (feature.type !== "standoff") continue;
    const position = pointArrayToObject(feature.positionMm);
    primitives.push(stlCylinder(feature.id, Number(feature.outerDiameterMm || 5) / 2, Number(feature.heightMm || 8), {
      x: position.x,
      y: position.y,
      z: position.z + Number(feature.heightMm || 8) / 2
    }));
  }
  return stlFromPrimitives("forge_shell_back", primitives);
}

function backPlatePieces(geometrySpec, wall, z) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const usb = geometrySpec.features?.find((feature) => feature.type === "usb_cutout");
  if (!usb) {
    return [stlBox("back_plate", { width: dimensions.width, height: dimensions.height, depth: wall }, { x: 0, y: 0, z })];
  }
  const position = pointArrayToObject(usb.positionMm);
  const openingWidth = Number(usb.sizeMm?.[0] || 11) + 3;
  const openingHeight = Number(usb.sizeMm?.[1] || 5) + 3;
  const leftWidth = Math.max(wall, dimensions.width / 2 + position.x - openingWidth / 2);
  const rightWidth = Math.max(wall, dimensions.width / 2 - position.x - openingWidth / 2);
  const bottomHeight = Math.max(wall, position.y - openingHeight / 2 + dimensions.height / 2);
  const topHeight = Math.max(wall, dimensions.height / 2 - position.y - openingHeight / 2);
  return [
    stlBox("back_plate_top", { width: dimensions.width, height: topHeight, depth: wall }, { x: 0, y: dimensions.height / 2 - topHeight / 2, z }),
    stlBox("back_plate_bottom", { width: dimensions.width, height: bottomHeight, depth: wall }, { x: 0, y: -dimensions.height / 2 + bottomHeight / 2, z }),
    stlBox("back_plate_usb_left", { width: leftWidth, height: openingHeight, depth: wall }, { x: -dimensions.width / 2 + leftWidth / 2, y: position.y, z }),
    stlBox("back_plate_usb_right", { width: rightWidth, height: openingHeight, depth: wall }, { x: dimensions.width / 2 - rightWidth / 2, y: position.y, z })
  ];
}

function stlBox(name, size, center) {
  const x = Number(size.width || 1) / 2;
  const y = Number(size.height || 1) / 2;
  const z = Number(size.depth || 1) / 2;
  const cx = Number(center.x || 0);
  const cy = Number(center.y || 0);
  const cz = Number(center.z || 0);
  const vertices = [
    [cx - x, cy - y, cz - z], [cx + x, cy - y, cz - z], [cx + x, cy + y, cz - z], [cx - x, cy + y, cz - z],
    [cx - x, cy - y, cz + z], [cx + x, cy - y, cz + z], [cx + x, cy + y, cz + z], [cx - x, cy + y, cz + z]
  ];
  return {
    name,
    triangles: [
      [vertices[0], vertices[1], vertices[2]], [vertices[0], vertices[2], vertices[3]],
      [vertices[4], vertices[6], vertices[5]], [vertices[4], vertices[7], vertices[6]],
      [vertices[0], vertices[4], vertices[5]], [vertices[0], vertices[5], vertices[1]],
      [vertices[1], vertices[5], vertices[6]], [vertices[1], vertices[6], vertices[2]],
      [vertices[2], vertices[6], vertices[7]], [vertices[2], vertices[7], vertices[3]],
      [vertices[3], vertices[7], vertices[4]], [vertices[3], vertices[4], vertices[0]]
    ]
  };
}

function stlCylinder(name, radius, height, center, segments = 18) {
  const triangles = [];
  const bottomCenter = [center.x, center.y, center.z - height / 2];
  const topCenter = [center.x, center.y, center.z + height / 2];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    const a0 = (Math.PI * 2 * index) / segments;
    const a1 = (Math.PI * 2 * next) / segments;
    const bottom0 = [center.x + Math.cos(a0) * radius, center.y + Math.sin(a0) * radius, bottomCenter[2]];
    const bottom1 = [center.x + Math.cos(a1) * radius, center.y + Math.sin(a1) * radius, bottomCenter[2]];
    const top0 = [bottom0[0], bottom0[1], topCenter[2]];
    const top1 = [bottom1[0], bottom1[1], topCenter[2]];
    triangles.push([bottomCenter, bottom1, bottom0]);
    triangles.push([topCenter, top0, top1]);
    triangles.push([bottom0, bottom1, top1]);
    triangles.push([bottom0, top1, top0]);
  }
  return { name, triangles };
}

function stlFromPrimitives(name, primitives) {
  const facets = primitives.flatMap((primitive) => primitive.triangles.map(([a, b, c]) => `  facet normal 0 0 0
    outer loop
      vertex ${a.join(" ")}
      vertex ${b.join(" ")}
      vertex ${c.join(" ")}
    endloop
  endfacet`));
  return `solid ${name}
${facets.join("\n")}
endsolid ${name}
`;
}

function createAsciiStl(geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const x = dimensions.width / 2;
  const y = dimensions.height / 2;
  const z = dimensions.depth / 2;
  const vertices = [
    [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
    [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]
  ];
  const triangles = [
    [0, 1, 2], [0, 2, 3],
    [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1],
    [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3],
    [3, 7, 4], [3, 4, 0]
  ];
  const facets = triangles.map((triangle) => {
    const [a, b, c] = triangle.map((index) => vertices[index]);
    return `  facet normal 0 0 0
    outer loop
      vertex ${a.join(" ")}
      vertex ${b.join(" ")}
      vertex ${c.join(" ")}
    endloop
  endfacet`;
  });
  return `solid forge_standard_shell
${facets.join("\n")}
endsolid forge_standard_shell
`;
}

function createStepHandoff(geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const moduleNames = geometrySpec.modules.map((module) => module.name).join(", ");
  const assetSummary = (geometrySpec.componentAssetManifest?.components || [])
    .map((component) => `${component.componentId}:${component.assetQuality}/${component.validationStatus}/${component.preview.resolvedType}`)
    .join("; ");
  const placementSummary = placeableModules(geometrySpec)
    .map((module) => {
      const position = module.placement.positionMm;
      return `${module.moduleId}@${position.x},${position.y},${position.z}:${module.role}:${module.assetQuality}/${module.validationStatus}`;
    })
    .join("; ");
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Forge internal STEP handoff skeleton generated from GeometrySpec'),'2;1');
FILE_NAME('model.step','${new Date(0).toISOString()}',('Forge'),('Forge'),'internal_parametric_v1','Forge','');
FILE_SCHEMA(('CONFIG_CONTROL_DESIGN'));
ENDSEC;
DATA;
#10 = PRODUCT('FORGE_STANDARD_SHELL','Forge standard 3D printed shell','${moduleNames}',());
#20 = PRODUCT_DEFINITION_FORMATION('1','GeometrySpec descriptor-driven proxy',#10);
#30 = CARTESIAN_POINT('shell_dimensions_mm',(${dimensions.width},${dimensions.height},${dimensions.depth}));
#40 = PROPERTY_DEFINITION('user_viewer','orbit/zoom/pan only; no direct geometry editing',#20);
#50 = PROPERTY_DEFINITION('solidworks_role','internal STEP handoff target',#20);
#60 = PROPERTY_DEFINITION('module_placements','${stepString(placementSummary)}',#20);
#70 = PROPERTY_DEFINITION('component_asset_manifest','${stepString(assetSummary)}',#20);
ENDSEC;
END-ISO-10303-21;
`;
}

function stepString(value) {
  return String(value || "").replaceAll("'", "''");
}

function glbFromJsonAndBinary(json, binary) {
  const jsonText = JSON.stringify(json);
  const jsonBuffer = Buffer.from(jsonText, "utf8");
  const paddedJson = Buffer.concat([jsonBuffer, padBuffer(jsonBuffer, 0x20)]);
  const length = 12 + 8 + paddedJson.length + 8 + binary.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(length, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(paddedJson.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binary.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, paddedJson, binHeader, binary]);
}

function padBuffer(buffer, value = 0) {
  const padding = (4 - (buffer.length % 4)) % 4;
  return Buffer.alloc(padding, value);
}
