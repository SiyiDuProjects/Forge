import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAsset } from "./assets.mjs";
import { createComponentAssetManifest } from "./component_asset_manifest.mjs";
import { createLayoutExplanationReport } from "./layout_explanation.mjs";
import { selectComponents } from "./component_selection.mjs";
import { generateLayout } from "./layout_engine.mjs";
import { addProceduralProxyGeometry } from "./proxy_geometry_builder.mjs";
import {
  MIN_PREVIEW_SOLID_THICKNESS_MM,
  collectPreviewSolidDimensionErrors,
  validatePrototypeGeometry
} from "./validation_engine.mjs";
import { productPlanFromSpecModules } from "./workspace_state.mjs";

const modelRoot = fileURLToPath(new URL("../../data/models/", import.meta.url));
const PREVIEW_SURFACE_THICKNESS_MM = 1.8;
const PREVIEW_MARKER_THICKNESS_MM = 1.2;
const ROUTE_PREVIEW_RADIUS_MM = 1.15;

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
  const mechanicalConstraints = prototypeValidation.mechanicalConstraintReport;
  const layoutExplanation = createLayoutExplanationReport({
    productPlan,
    componentDescriptors: componentSelection.componentDescriptors,
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
    requiredArtifacts: ["component_descriptors", "component_asset_manifest", "glb", "stl", "step", "validation_report", "generation_evidence_report"],
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
    mechanicalConstraints,
    layoutExplanation,
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
        trustLevel: component.mechanicalConstraints?.trustLevel || "unknown",
        resolvedPreviewType: component.preview.resolvedType,
        resolvedMechanicalType: component.mechanical.resolvedType
      })),
      mechanicalConstraintSummary: mechanicalConstraints?.coverage || {},
      layoutExplanationSummary: layoutExplanation?.coverage || {},
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
  const previewSolidDimensionErrors = collectPreviewSolidDimensionErrors({
    enclosure,
    placements: geometrySpec.placements || modules,
    features: geometrySpec.features || [],
    routes: geometrySpec.routes || geometrySpec.cableRoutes || []
  });

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

  for (const error of previewSolidDimensionErrors) {
    issues.push({
      level: "block",
      code: error.type || "preview_solid_dimension_error",
      moduleId: error.moduleId || error.componentId || "",
      componentId: error.componentId || "",
      featureId: error.featureId || "",
      routeId: error.routeId || "",
      axis: error.axis || "",
      actualMm: error.actualMm ?? null,
      minimumMm: error.minimumMm ?? MIN_PREVIEW_SOLID_THICKNESS_MM,
      message: error.message || "Preview geometry contains a zero-thickness or near-zero-thickness solid."
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
      "mechanical_constraints_report",
      "mechanical_constraint_trust_status",
      "layout_explanation_report",
      "layout_explanation_coverage",
      "preview_solid_dimensions",
      "semantic_shell_features",
      "shell_front_stl",
      "shell_back_stl"
    ],
    mechanicalConstraints: geometrySpec.mechanicalConstraints || null,
    layoutExplanation: geometrySpec.layoutExplanation || null,
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
    generationEvidenceReport: null,
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
  const generationEvidenceReportPath = join(outputDir, "generation_evidence_report.json");
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
    const generationEvidence = createGenerationEvidenceReport({
      artifactId,
      status: "blocked",
      provider: "cadquery_adapter_reserved",
      targetProvider: "cadquery_open_cascade",
      geometrySpec,
      validation,
      artifactAssets: assets,
      generatedArtifactKeys: []
    });
    writeFileSync(generationEvidenceReportPath, JSON.stringify(generationEvidence, null, 2));
    assets.generationEvidenceReport = artifactAsset({
      type: "generation_evidence_report",
      path: generationEvidenceReportPath,
      url: `/data/models/${artifactId}/generation_evidence_report.json`,
      caption: "Generation evidence report linking source inputs, validation, and generated artifact integrity"
    });
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
        generationEvidenceReport: assets.generationEvidenceReport,
        designSummary: assets.designSummary,
        cadqueryScript: assets.cadqueryScript,
        glb: null,
        stl: null,
        shellFront: null,
        shellBack: null,
        step: null
      },
      generationEvidence,
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
  const generationEvidence = createGenerationEvidenceReport({
    artifactId,
    status: "generated",
    provider: "internal_parametric_v1",
    targetProvider: "cadquery_open_cascade",
    geometrySpec,
    validation,
    artifactAssets: assets,
    generatedArtifactKeys: ["glb", "stl", "shellFront", "shellBack", "step"]
  });
  writeFileSync(generationEvidenceReportPath, JSON.stringify(generationEvidence, null, 2));
  assets.generationEvidenceReport = artifactAsset({
    type: "generation_evidence_report",
    path: generationEvidenceReportPath,
    url: `/data/models/${artifactId}/generation_evidence_report.json`,
    caption: "Generation evidence report linking source inputs, validation, and generated artifact integrity"
  });

  return {
    status: "generated",
    provider: "internal_parametric_v1",
    targetProvider: "cadquery_open_cascade",
    artifactDir: outputDir,
    artifacts: assets,
    generationEvidence,
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

function createGenerationEvidenceReport({
  artifactId,
  status,
  provider,
  targetProvider,
  geometrySpec,
  validation,
  artifactAssets = {},
  generatedArtifactKeys = []
} = {}) {
  const issueCounts = (validation.issues || []).reduce((counts, issue) => {
    const level = issue.level || issue.severity || "info";
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {});
  const sourceArtifactKeys = [
    "productPlan",
    "geometrySpec",
    "componentSelections",
    "componentDescriptors"
  ];
  const evidenceArtifactKeys = [
    "componentAssetManifest",
    "validationReport",
    "designSummary",
    "cadqueryScript"
  ];
  const artifactIntegrity = Object.fromEntries(
    [...sourceArtifactKeys, ...evidenceArtifactKeys, ...generatedArtifactKeys]
      .filter((key, index, keys) => keys.indexOf(key) === index)
      .map((key) => [key, artifactIntegrityForAsset(artifactAssets[key])])
  );
  const generatedArtifactsPresent = generatedArtifactKeys.length > 0
    && generatedArtifactKeys.every((key) => artifactIntegrity[key]?.present);
  const artifactAudit = auditGeneratedArtifacts({
    status,
    artifactAssets,
    artifactIntegrity,
    generatedArtifactKeys,
    geometrySpec
  });
  return {
    version: "generation_evidence_report_v1",
    artifactId,
    status,
    provider,
    targetProvider,
    source: "product_plan_revision_and_geometry_spec",
    sourceChain: [
      "ProductPlan revision",
      "ComponentDescriptor v2 selection",
      "mechanical constraint report",
      "layout explanation report",
      "GeometrySpec validation",
      "confirmed deterministic artifact writer"
    ],
    sourceOfTruth: {
      productPlan: "product_plan.json",
      geometrySpec: "geometry-spec.json",
      componentSelections: "component_selections.json",
      componentDescriptors: "component_descriptors.json",
      generatedFromRawChat: false,
      directEditingAllowed: false
    },
    productPlan: {
      planId: geometrySpec.productPlan?.planId || "",
      productName: geometrySpec.productPlan?.productName || geometrySpec.productPlan?.title || "",
      productCategory: geometrySpec.productPlan?.productCategory || "",
      revisionSource: geometrySpec.source || ""
    },
    geometry: {
      version: geometrySpec.version,
      units: geometrySpec.units,
      coordinateSystem: geometrySpec.coordinateSystem,
      requiredArtifacts: geometrySpec.requiredArtifacts || [],
      placedModuleCount: geometrySpec.metadata?.placedModuleCount || 0,
      featureCount: (geometrySpec.features || []).length,
      routeCount: (geometrySpec.routes || geometrySpec.cableRoutes || []).length
    },
    descriptorEvidence: {
      descriptorVersion: geometrySpec.metadata?.componentDescriptorVersion || "component_descriptor_v2",
      selectedComponentIds: geometrySpec.componentSelections?.selectedComponentIds || [],
      componentOrigins: componentOriginsForEvidence(geometrySpec.componentDescriptors || []),
      assetQualitySummary: geometrySpec.metadata?.assetQualitySummary || [],
      mechanicalConstraintCoverage: geometrySpec.mechanicalConstraints?.coverage || {},
      componentAssetManifestCoverage: geometrySpec.componentAssetManifest?.mechanicalConstraintCoverage || {}
    },
    layoutEvidence: {
      version: geometrySpec.layoutExplanation?.version || "",
      coverage: geometrySpec.layoutExplanation?.coverage || {},
      directEditingAllowed: geometrySpec.layoutExplanation?.directEditingAllowed === true
    },
    validation: {
      status: validation.status || "",
      canGenerateArtifacts: Boolean(validation.canGenerateArtifacts),
      checks: validation.checks || [],
      issueCounts
    },
    artifactGroups: {
      sourceOfTruth: sourceArtifactKeys,
      evidence: evidenceArtifactKeys,
      generated: generatedArtifactKeys
    },
    artifactIntegrity,
    artifactAudit,
    generatedArtifactsPresent,
    directEditingAllowed: false,
    userFacingCadExport: false,
    note: "This report links Forge source-of-truth inputs, descriptor/layout/validation evidence, and generated artifact file integrity. It is review evidence, not an editable CAD model."
  };
}

function componentOriginsForEvidence(componentDescriptors = []) {
  return componentDescriptors.map((descriptor) => ({
    componentId: descriptor.id || descriptor.identity?.id || "",
    descriptorPath: descriptor.descriptorPath || "",
    sourcesPath: descriptor.sourcesPath || "",
    libraryScope: descriptor.libraryScope || "",
    sourceType: descriptor.librarySource?.type || descriptor.sourceEvidence?.sourceType || "",
    workspaceDraft: descriptor.librarySource?.workspaceDraft
      ? {
        draftId: descriptor.librarySource.workspaceDraft.draftId || "",
        packagePath: descriptor.librarySource.workspaceDraft.packagePath || "",
        descriptorPath: descriptor.librarySource.workspaceDraft.descriptorPath || "",
        sourcesPath: descriptor.librarySource.workspaceDraft.sourcesPath || "",
        descriptorSha256: descriptor.librarySource.workspaceDraft.descriptorSha256 || "",
        sourcesSha256: descriptor.librarySource.workspaceDraft.sourcesSha256 || "",
        descriptorBytes: Number(descriptor.librarySource.workspaceDraft.descriptorBytes || 0),
        sourcesBytes: Number(descriptor.librarySource.workspaceDraft.sourcesBytes || 0),
        specPatch: compactSpecPatch(descriptor.librarySource.workspaceDraft.specPatch)
      }
      : null,
    replacement: compactDescriptorReplacement(descriptor.libraryReplacement),
    replacementHistory: compactDescriptorReplacementHistory(descriptor.libraryReplacementHistory)
  })).filter((item) => item.componentId);
}

function compactDescriptorReplacement(replacement = null) {
  if (!replacement) {
    return {
      replacedExisting: false,
      replacementCount: 0,
      directEditingAllowed: false
    };
  }
  return {
    replacedExisting: replacement.replacedExisting === true,
    replacedAt: replacement.replacedAt || "",
    replacementCount: Number(replacement.replacementCount || 0),
    previous: compactDescriptorReplacementPrevious(replacement.previous),
    directEditingAllowed: false
  };
}

function compactDescriptorReplacementHistory(history = []) {
  return Array.isArray(history)
    ? history.map((item) => ({
      replacedAt: item.replacedAt || "",
      previous: compactDescriptorReplacementPrevious(item.previous),
      directEditingAllowed: false
    }))
    : [];
}

function compactDescriptorReplacementPrevious(previous = null) {
  if (!previous) return null;
  return {
    componentId: previous.componentId || "",
    componentType: previous.componentType || "",
    displayName: previous.displayName || "",
    descriptorVersion: previous.descriptorVersion || "",
    status: previous.status || "",
    active: previous.active === true,
    promotedAt: previous.promotedAt || "",
    sourceType: previous.sourceType || "",
    workspaceDraft: previous.workspaceDraft
      ? {
        draftId: previous.workspaceDraft.draftId || "",
        packagePath: previous.workspaceDraft.packagePath || "",
        descriptorPath: previous.workspaceDraft.descriptorPath || "",
        sourcesPath: previous.workspaceDraft.sourcesPath || "",
        descriptorSha256: previous.workspaceDraft.descriptorSha256 || "",
        sourcesSha256: previous.workspaceDraft.sourcesSha256 || "",
        descriptorBytes: Number(previous.workspaceDraft.descriptorBytes || 0),
        sourcesBytes: Number(previous.workspaceDraft.sourcesBytes || 0),
        specPatch: compactSpecPatch(previous.workspaceDraft.specPatch)
      }
      : null,
    directEditingAllowed: false
  };
}

function compactSpecPatch(specPatch = null) {
  if (!specPatch) {
    return {
      applied: false
    };
  }
  return {
    applied: specPatch.applied === true,
    eventId: specPatch.eventId || "",
    timestamp: specPatch.timestamp || "",
    draftId: specPatch.draftId || "",
    componentId: specPatch.componentId || "",
    componentType: specPatch.componentType || "",
    baseComponentId: specPatch.baseComponentId || "",
    specsSourcePath: specPatch.specsSourcePath || "",
    extractedFields: Array.isArray(specPatch.extractedFields) ? [...specPatch.extractedFields] : [],
    readyForLibraryPromotion: specPatch.readyForLibraryPromotion === true,
    blockingIssueCount: Number(specPatch.blockingIssueCount || 0),
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

function artifactIntegrityForAsset(asset) {
  if (!asset?.localPath) {
    return {
      present: false,
      type: asset?.type || "",
      url: asset?.url || "",
      bytes: 0,
      sha256: ""
    };
  }
  try {
    const buffer = readFileSync(asset.localPath);
    const stats = statSync(asset.localPath);
    return {
      present: true,
      type: asset.type || "",
      url: asset.url || "",
      bytes: stats.size,
      sha256: createHash("sha256").update(buffer).digest("hex")
    };
  } catch {
    return {
      present: false,
      type: asset.type || "",
      url: asset.url || "",
      bytes: 0,
      sha256: ""
    };
  }
}

function auditGeneratedArtifacts({
  status = "",
  artifactAssets = {},
  artifactIntegrity = {},
  generatedArtifactKeys = [],
  geometrySpec = {}
} = {}) {
  if (generatedArtifactKeys.length === 0) {
    return {
      version: "artifact_post_write_audit_v1",
      status: status === "blocked" ? "not_required_blocked" : "not_required",
      passed: status !== "generated",
      generatedArtifactKeys: [],
      checks: {},
      findings: []
    };
  }

  const checks = {};
  for (const key of generatedArtifactKeys) {
    if (key === "glb") checks[key] = auditGlbArtifact(artifactAssets[key], artifactIntegrity[key], geometrySpec);
    else if (key === "stl" || key === "shellFront" || key === "shellBack") checks[key] = auditStlArtifact(artifactAssets[key], artifactIntegrity[key]);
    else if (key === "step") checks[key] = auditStepArtifact(artifactAssets[key], artifactIntegrity[key]);
    else checks[key] = auditGenericArtifact(artifactAssets[key], artifactIntegrity[key]);
  }

  const findings = Object.entries(checks).flatMap(([artifactKey, check]) => (
    check.findings || []
  ).map((finding) => ({ artifactKey, ...finding })));
  const failed = findings.some((finding) => finding.level === "error")
    || generatedArtifactKeys.some((key) => checks[key]?.passed !== true);
  return {
    version: "artifact_post_write_audit_v1",
    status: failed ? "failed" : "passed",
    passed: !failed,
    generatedArtifactKeys: [...generatedArtifactKeys],
    checks,
    findings
  };
}

function auditGenericArtifact(asset, integrity) {
  const findings = [];
  const base = baseArtifactAudit(asset, integrity, findings);
  return {
    ...base,
    passed: findings.length === 0,
    findings
  };
}

function auditGlbArtifact(asset, integrity, geometrySpec) {
  const findings = [];
  const base = baseArtifactAudit(asset, integrity, findings);
  const result = {
    ...base,
    format: {
      glbMagic: false,
      version: 0,
      jsonChunkPresent: false,
      binaryChunkPresent: false,
      parsedJson: false
    },
    semanticNodePrefixes: {},
    requiredNodePrefixes: requiredGlbNodePrefixes(geometrySpec),
    linePrimitiveCount: 0,
    vec3AccessorMissingBoundsCount: 0,
    thinMeshPrimitiveCount: 0,
    minimumMeshSpanMm: MIN_PREVIEW_SOLID_THICKNESS_MM,
    meshPrimitiveCount: 0,
    passed: false,
    findings
  };

  if (!asset?.localPath) {
    result.passed = false;
    return result;
  }

  try {
    const buffer = readFileSync(asset.localPath);
    result.format.glbMagic = buffer.slice(0, 4).toString("utf8") === "glTF";
    result.format.version = buffer.length >= 8 ? buffer.readUInt32LE(4) : 0;
    const jsonLength = buffer.length >= 16 ? buffer.readUInt32LE(12) : 0;
    const jsonType = buffer.length >= 20 ? buffer.readUInt32LE(16) : 0;
    result.format.jsonChunkPresent = jsonType === 0x4e4f534a && jsonLength > 0;
    if (!result.format.glbMagic) findings.push(errorFinding("glb_magic_missing", "GLB file does not start with glTF magic."));
    if (result.format.version !== 2) findings.push(errorFinding("glb_version_invalid", "GLB file is not version 2."));
    if (!result.format.jsonChunkPresent) findings.push(errorFinding("glb_json_missing", "GLB JSON chunk is missing."));
    if (result.format.jsonChunkPresent) {
      const jsonEnd = 20 + jsonLength;
      const glbJson = JSON.parse(buffer.slice(20, jsonEnd).toString("utf8"));
      result.format.parsedJson = true;
      const nextChunkType = buffer.length >= jsonEnd + 8 ? buffer.readUInt32LE(jsonEnd + 4) : 0;
      result.format.binaryChunkPresent = nextChunkType === 0x004e4942;
      result.semanticNodePrefixes = countGlbNodePrefixes(glbJson);
      result.linePrimitiveCount = countLinePrimitives(glbJson);
      result.thinMeshPrimitiveCount = countThinMeshPrimitives(glbJson, MIN_PREVIEW_SOLID_THICKNESS_MM);
      result.vec3AccessorMissingBoundsCount = (glbJson.accessors || [])
        .filter((accessor) => accessor.type === "VEC3" && (!Array.isArray(accessor.min) || !Array.isArray(accessor.max)))
        .length;
      result.meshPrimitiveCount = (glbJson.meshes || [])
        .reduce((count, mesh) => count + (mesh.primitives || []).length, 0);
      for (const prefix of result.requiredNodePrefixes) {
        if (!result.semanticNodePrefixes[prefix]) {
          findings.push(errorFinding("glb_semantic_prefix_missing", `GLB is missing required semantic node prefix ${prefix}.`));
        }
      }
      if (result.linePrimitiveCount > 0) {
        findings.push(errorFinding("glb_line_primitives_present", "GLB preview must use non-zero-thickness meshes instead of GL_LINES."));
      }
      if (result.vec3AccessorMissingBoundsCount > 0) {
        findings.push(errorFinding("glb_accessor_bounds_missing", "GLB VEC3 accessors must include min/max bounds for auditability."));
      }
      if (result.thinMeshPrimitiveCount > 0) {
        findings.push(errorFinding("glb_thin_mesh_primitives_present", `GLB preview meshes must keep every visible axis at least ${MIN_PREVIEW_SOLID_THICKNESS_MM} mm thick.`));
      }
      if (result.meshPrimitiveCount === 0) {
        findings.push(errorFinding("glb_meshes_missing", "GLB contains no mesh primitives."));
      }
    }
  } catch (error) {
    findings.push(errorFinding("glb_parse_failed", error instanceof Error ? error.message : "Could not parse GLB."));
  }

  result.passed = findings.every((finding) => finding.level !== "error");
  return result;
}

function auditStlArtifact(asset, integrity) {
  const findings = [];
  const base = baseArtifactAudit(asset, integrity, findings);
  const result = {
    ...base,
    format: {
      startsWithSolid: false,
      hasEndSolid: false,
      facetCount: 0
    },
    geometry: {
      vertexCount: 0,
      degenerateFacetCount: 0,
      bounds: null,
      spanMm: null,
      thinAxisCount: 0,
      minimumSpanMm: MIN_PREVIEW_SOLID_THICKNESS_MM
    },
    passed: false,
    findings
  };
  if (!asset?.localPath) {
    result.passed = false;
    return result;
  }
  try {
    const text = readFileSync(asset.localPath, "utf8");
    result.format.startsWithSolid = text.startsWith("solid ");
    result.format.hasEndSolid = text.includes("endsolid ");
    result.format.facetCount = (text.match(/facet normal/g) || []).length;
    const geometryAudit = auditAsciiStlGeometry(text, MIN_PREVIEW_SOLID_THICKNESS_MM);
    result.geometry = geometryAudit.geometry;
    if (!result.format.startsWithSolid) findings.push(errorFinding("stl_solid_header_missing", "STL file is missing a solid header."));
    if (!result.format.hasEndSolid) findings.push(errorFinding("stl_endsolid_missing", "STL file is missing an endsolid footer."));
    if (result.format.facetCount <= 0) findings.push(errorFinding("stl_facets_missing", "STL file contains no facets."));
    if (geometryAudit.geometry.vertexCount <= 0) findings.push(errorFinding("stl_vertices_missing", "STL file contains no parseable vertices."));
    if (geometryAudit.geometry.degenerateFacetCount > 0) findings.push(errorFinding("stl_degenerate_facets_present", "STL file contains degenerate facets that suggest collapsed or zero-thickness geometry."));
    if (geometryAudit.geometry.thinAxisCount > 0) findings.push(errorFinding("stl_thin_bounds_present", `STL shell artifact bounds must span at least ${MIN_PREVIEW_SOLID_THICKNESS_MM} mm on every axis.`));
  } catch (error) {
    findings.push(errorFinding("stl_read_failed", error instanceof Error ? error.message : "Could not read STL."));
  }
  result.passed = findings.every((finding) => finding.level !== "error");
  return result;
}

function auditStepArtifact(asset, integrity) {
  const findings = [];
  const base = baseArtifactAudit(asset, integrity, findings);
  const result = {
    ...base,
    format: {
      hasStepHeader: false,
      hasStepFooter: false,
      hasShellDimensions: false,
      hasModulePlacements: false,
      hasComponentAssetManifest: false,
      hasMechanicalConstraints: false,
      hasLayoutExplanation: false
    },
    metadata: {
      shellDimensionsMm: null,
      shellDimensionsPositive: false,
      directEditingBoundaryPresent: false
    },
    passed: false,
    findings
  };
  if (!asset?.localPath) {
    result.passed = false;
    return result;
  }
  try {
    const text = readFileSync(asset.localPath, "utf8");
    result.format.hasStepHeader = text.includes("ISO-10303-21");
    result.format.hasStepFooter = text.includes("END-ISO-10303-21");
    result.format.hasShellDimensions = text.includes("shell_dimensions_mm");
    result.format.hasModulePlacements = text.includes("module_placements");
    result.format.hasComponentAssetManifest = text.includes("component_asset_manifest");
    result.format.hasMechanicalConstraints = text.includes("mechanical_constraints");
    result.format.hasLayoutExplanation = text.includes("layout_explanation");
    result.metadata.shellDimensionsMm = parseStepShellDimensions(text);
    result.metadata.shellDimensionsPositive = hasPositiveStepDimensions(result.metadata.shellDimensionsMm);
    result.metadata.directEditingBoundaryPresent = text.includes("no direct geometry editing");
    if (!result.format.hasStepHeader) findings.push(errorFinding("step_header_missing", "STEP handoff is missing ISO-10303-21 header."));
    if (!result.format.hasStepFooter) findings.push(errorFinding("step_footer_missing", "STEP handoff is missing END-ISO-10303-21 footer."));
    if (!result.format.hasShellDimensions) findings.push(errorFinding("step_shell_dimensions_missing", "STEP handoff is missing shell dimension metadata."));
    if (!result.format.hasModulePlacements) findings.push(errorFinding("step_module_placements_missing", "STEP handoff is missing module placement metadata."));
    if (!result.format.hasComponentAssetManifest) findings.push(errorFinding("step_component_asset_manifest_missing", "STEP handoff is missing component asset manifest metadata."));
    if (!result.format.hasMechanicalConstraints) findings.push(errorFinding("step_mechanical_constraints_missing", "STEP handoff is missing mechanical constraint metadata."));
    if (!result.format.hasLayoutExplanation) findings.push(errorFinding("step_layout_explanation_missing", "STEP handoff is missing layout explanation metadata."));
    if (!result.metadata.shellDimensionsPositive) findings.push(errorFinding("step_shell_dimensions_invalid", "STEP handoff shell dimensions must be positive."));
    if (!result.metadata.directEditingBoundaryPresent) findings.push(errorFinding("step_direct_editing_boundary_missing", "STEP handoff must preserve the no-direct-geometry-editing boundary."));
  } catch (error) {
    findings.push(errorFinding("step_read_failed", error instanceof Error ? error.message : "Could not read STEP."));
  }
  result.passed = findings.every((finding) => finding.level !== "error");
  return result;
}

function auditAsciiStlGeometry(text = "", minimumSpanMm = MIN_PREVIEW_SOLID_THICKNESS_MM) {
  const vertices = [];
  const vertexPattern = /^\s*vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/gim;
  let match;
  while ((match = vertexPattern.exec(text))) {
    vertices.push([
      Number(match[1]),
      Number(match[2]),
      Number(match[3])
    ]);
  }
  const bounds = boundsForVertices(vertices);
  const spanMm = bounds
    ? {
      width: Number((bounds.max[0] - bounds.min[0]).toFixed(3)),
      height: Number((bounds.max[1] - bounds.min[1]).toFixed(3)),
      depth: Number((bounds.max[2] - bounds.min[2]).toFixed(3))
    }
    : null;
  const thinAxisCount = spanMm
    ? ["width", "height", "depth"].filter((axis) => Number(spanMm[axis]) < minimumSpanMm).length
    : 0;
  return {
    geometry: {
      vertexCount: vertices.length,
      degenerateFacetCount: countDegenerateStlFacets(vertices),
      bounds: bounds
        ? {
          min: bounds.min.map((value) => Number(value.toFixed(3))),
          max: bounds.max.map((value) => Number(value.toFixed(3)))
        }
        : null,
      spanMm,
      thinAxisCount,
      minimumSpanMm
    }
  };
}

function boundsForVertices(vertices = []) {
  if (!vertices.length) return null;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const vertex of vertices) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = Number(vertex[axis]);
      min[axis] = Math.min(min[axis], value);
      max[axis] = Math.max(max[axis], value);
    }
  }
  return { min, max };
}

function countDegenerateStlFacets(vertices = []) {
  let count = 0;
  for (let index = 0; index < vertices.length; index += 3) {
    const a = vertices[index];
    const b = vertices[index + 1];
    const c = vertices[index + 2];
    if (!a || !b || !c || triangleArea(a, b, c) < 0.000001) count += 1;
  }
  return count;
}

function triangleArea(a, b, c) {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const crossProduct = [
    ab[1] * ac[2] - ab[2] * ac[1],
    ab[2] * ac[0] - ab[0] * ac[2],
    ab[0] * ac[1] - ab[1] * ac[0]
  ];
  return Math.hypot(crossProduct[0], crossProduct[1], crossProduct[2]) / 2;
}

function parseStepShellDimensions(text = "") {
  const match = text.match(/CARTESIAN_POINT\('shell_dimensions_mm',\(([^,]+),([^,]+),([^)]+)\)\)/);
  if (!match) return null;
  return {
    width: Number(match[1]),
    height: Number(match[2]),
    depth: Number(match[3])
  };
}

function hasPositiveStepDimensions(dimensions = null) {
  return Number(dimensions?.width) > 0
    && Number(dimensions?.height) > 0
    && Number(dimensions?.depth) > 0;
}

function baseArtifactAudit(asset, integrity = {}, findings = []) {
  const present = Boolean(integrity?.present);
  const bytes = Number(integrity?.bytes || 0);
  const sha256 = String(integrity?.sha256 || "");
  if (!present) findings.push(errorFinding("artifact_missing", "Artifact file is missing."));
  if (present && bytes <= 0) findings.push(errorFinding("artifact_empty", "Artifact file is empty."));
  if (present && !/^[a-f0-9]{64}$/.test(sha256)) {
    findings.push(errorFinding("artifact_sha256_invalid", "Artifact SHA-256 hash is missing or invalid."));
  }
  return {
    present,
    type: asset?.type || integrity?.type || "",
    bytes,
    sha256,
    sha256Recorded: /^[a-f0-9]{64}$/.test(sha256),
    directEditingAllowed: false
  };
}

function requiredGlbNodePrefixes(geometrySpec = {}) {
  const prefixes = ["shell.", "module.", "feature.", "interface."];
  if ((geometrySpec.routes || geometrySpec.cableRoutes || []).length > 0) prefixes.push("route.");
  return prefixes;
}

function countGlbNodePrefixes(glbJson = {}) {
  const prefixes = ["shell.", "module.", "feature.", "interface.", "route."];
  const counts = Object.fromEntries(prefixes.map((prefix) => [prefix, 0]));
  for (const node of glbJson.nodes || []) {
    for (const prefix of prefixes) {
      if (String(node.name || "").startsWith(prefix)) counts[prefix] += 1;
    }
  }
  return counts;
}

function countLinePrimitives(glbJson = {}) {
  let count = 0;
  for (const mesh of glbJson.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      if ((primitive.mode ?? 4) === 1) count += 1;
    }
  }
  return count;
}

function countThinMeshPrimitives(glbJson = {}, minimumSpanMm = MIN_PREVIEW_SOLID_THICKNESS_MM) {
  let count = 0;
  for (const mesh of glbJson.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      if ((primitive.mode ?? 4) !== 4) continue;
      const accessor = glbJson.accessors?.[primitive.attributes?.POSITION];
      if (!Array.isArray(accessor?.min) || !Array.isArray(accessor?.max)) continue;
      const thin = accessor.max.some((max, index) => {
        const spanMm = (Number(max) - Number(accessor.min[index])) * 100;
        return spanMm < minimumSpanMm;
      });
      if (thin) count += 1;
    }
  }
  return count;
}

function errorFinding(code, message) {
  return {
    level: "error",
    code,
    message
  };
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
    builder.addEmptyNode(routeName, {
      pointCount: points.length,
      visiblePreview: "thick_route_segments",
      routeType: route.routeType || "coarse_internal_path",
      type: route.type || "signal",
      editable: false,
      directEditingAllowed: false
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
      mechanicalConstraintCoverage: geometrySpec.mechanicalConstraints?.coverage || {},
      layoutExplanationCoverage: geometrySpec.layoutExplanation?.coverage || {},
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
    addTubeNode({ name, startMm, endMm, radiusMm, material = 8, extras = {}, segments = 12 }) {
      const start = pointArrayToObject(startMm);
      const end = pointArrayToObject(endMm);
      const centerMm = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        z: (start.z + end.z) / 2
      };
      const geometry = tubeGeometryBetween(start, end, radiusMm, segments);
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
  addShellJoinOverlapGeometry(builder, geometrySpec);
}

function addShellJoinOverlapGeometry(builder, geometrySpec) {
  const dimensions = geometrySpec.enclosure.dimensionsMm;
  const wall = Number(geometrySpec.enclosure.wallThicknessMm || 2.4);
  const halfZ = dimensions.depth / 2;
  const lipDepth = Math.max(4, wall * 1.7);
  const lipWidth = Math.max(1.6, wall * 0.72);
  const rearLipZ = -halfZ + wall + lipDepth / 2;
  const frontSeatDepth = Math.max(PREVIEW_SURFACE_THICKNESS_MM, wall * 0.9);
  const frontSeatZ = halfZ - wall - frontSeatDepth / 2;
  const railHeight = Math.max(1, dimensions.height - wall * 4);
  const railWidth = Math.max(1, dimensions.width - wall * 4);

  builder.addEmptyNode("shell.join.front_back_overlap", {
    role: "front_back_shell_overlap",
    overlapDepthMm: lipDepth,
    clearanceMm: geometrySpec.enclosure.manufacturing?.clearanceMm ?? 0.5,
    directEditingAllowed: false
  });
  [
    {
      name: "left",
      sizeMm: { width: lipWidth, height: railHeight, depth: lipDepth },
      centerMm: { x: -dimensions.width / 2 + wall + lipWidth / 2, y: 0, z: rearLipZ }
    },
    {
      name: "right",
      sizeMm: { width: lipWidth, height: railHeight, depth: lipDepth },
      centerMm: { x: dimensions.width / 2 - wall - lipWidth / 2, y: 0, z: rearLipZ }
    },
    {
      name: "top",
      sizeMm: { width: railWidth, height: lipWidth, depth: lipDepth },
      centerMm: { x: 0, y: dimensions.height / 2 - wall - lipWidth / 2, z: rearLipZ }
    },
    {
      name: "bottom",
      sizeMm: { width: railWidth, height: lipWidth, depth: lipDepth },
      centerMm: { x: 0, y: -dimensions.height / 2 + wall + lipWidth / 2, z: rearLipZ }
    }
  ].forEach((lip) => {
    builder.addBoxNode({
      name: `shell.join.lip.${lip.name}`,
      sizeMm: lip.sizeMm,
      centerMm: lip.centerMm,
      material: 0,
      extras: {
        role: "rear_tray_overlap_lip",
        overlapDepthMm: lipDepth,
        directEditingAllowed: false
      }
    });
  });
  [
    {
      name: "left",
      sizeMm: { width: lipWidth, height: railHeight, depth: frontSeatDepth },
      centerMm: { x: -dimensions.width / 2 + wall + lipWidth / 2, y: 0, z: frontSeatZ }
    },
    {
      name: "right",
      sizeMm: { width: lipWidth, height: railHeight, depth: frontSeatDepth },
      centerMm: { x: dimensions.width / 2 - wall - lipWidth / 2, y: 0, z: frontSeatZ }
    },
    {
      name: "top",
      sizeMm: { width: railWidth, height: lipWidth, depth: frontSeatDepth },
      centerMm: { x: 0, y: dimensions.height / 2 - wall - lipWidth / 2, z: frontSeatZ }
    },
    {
      name: "bottom",
      sizeMm: { width: railWidth, height: lipWidth, depth: frontSeatDepth },
      centerMm: { x: 0, y: -dimensions.height / 2 + wall + lipWidth / 2, z: frontSeatZ }
    }
  ].forEach((seat) => {
    builder.addBoxNode({
      name: `shell.join.front_seat.${seat.name}`,
      sizeMm: seat.sizeMm,
      centerMm: seat.centerMm,
      material: 11,
      extras: {
        role: "front_shell_overlap_seat",
        overlapDepthMm: frontSeatDepth,
        directEditingAllowed: false
      }
    });
  });
}

function addFeaturePreviewGeometry(builder, geometrySpec) {
  for (const feature of geometrySpec.features || []) {
    const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
    if (feature.type === "screen_opening") {
      addFaceBoxNode(builder, {
        name: "feature.opening.screen",
        face: feature.face,
        position,
        sizeMm: { width: feature.sizeMm[0], height: feature.sizeMm[1] },
        thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
        material: 12,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "captured_panel_retention") {
      addScreenRetentionFrame(builder, geometrySpec, feature);
      continue;
    }
    if (feature.type === "usb_cutout") {
      addFaceBoxNode(builder, {
        name: "feature.opening.usb_c",
        face: feature.face,
        position,
        sizeMm: { width: feature.sizeMm[0] + 3, height: feature.sizeMm[1] + 3 },
        thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
        material: 7,
        extras: featureExtras(feature)
      });
      addUsbInsertionClearance(builder, geometrySpec, feature);
      continue;
    }
    if (feature.type === "sensor_window") {
      addFaceCylinderNode(builder, {
        name: "feature.opening.ambient_sensor",
        face: feature.face,
        position,
        radiusMm: Math.max(Number(feature.sizeMm?.[0] || 6), Number(feature.sizeMm?.[1] || 4)) / 2,
        thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
        material: 9,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "camera_window") {
      addFaceCylinderNode(builder, {
        name: "feature.opening.camera",
        face: feature.face,
        position,
        radiusMm: Math.max(Number(feature.sizeMm?.[0] || 8), Number(feature.sizeMm?.[1] || 8)) / 2,
        thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
        material: 4,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "optical_window_retention") {
      addOpticalWindowRetention(builder, feature);
      continue;
    }
    if (feature.type === "speaker_vents") {
      const ventCount = Number(feature.ventCount || 5);
      const ventWidthMm = Number(feature.sizeMm?.[0] || 24);
      const ventHeightMm = Number(feature.sizeMm?.[1] || 12);
      const slotWidthMm = Math.max(1.5, Math.min(3, ventWidthMm / Math.max(ventCount * 2, 1)));
      const spacingMm = ventCount > 1 ? ventWidthMm / (ventCount - 1) : 0;
      for (let index = 0; index < ventCount; index += 1) {
        addFaceBoxNode(builder, {
          name: `feature.opening.speaker_vents.${index + 1}`,
          face: feature.face,
          position: offsetPointOnFace(position, feature.face, -ventWidthMm / 2 + index * spacingMm, 0),
          sizeMm: { width: slotWidthMm, height: ventHeightMm },
          thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
          material: 12,
          extras: featureExtras(feature)
        });
      }
      continue;
    }
    if (feature.type === "grille_mount_retention") {
      addGrilleMountRetention(builder, feature);
      continue;
    }
    if (feature.type === "button_hole") {
      addFaceCylinderNode(builder, {
        name: feature.id,
        face: feature.face,
        position,
        radiusMm: Number(feature.sizeMm?.[0] || 6) / 2,
        thicknessMm: PREVIEW_SURFACE_THICKNESS_MM,
        material: 7,
        extras: featureExtras(feature)
      });
      continue;
    }
    if (feature.type === "panel_button_retention") {
      addPanelButtonRetention(builder, feature);
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
      const heightMm = Number(feature.heightMm || 8);
      builder.addCylinderNode({
        name: feature.id,
        radiusMm: Number(feature.outerDiameterMm || 5) / 2,
        heightMm,
        centerMm: {
          x: position.x,
          y: position.y,
          z: position.z + heightMm / 2
        },
        material: 11,
        extras: featureExtras(feature)
      });
      builder.addCylinderNode({
        name: `${feature.id}.board_contact`,
        radiusMm: Number(feature.outerDiameterMm || 5) / 2 + 0.6,
        heightMm: PREVIEW_MARKER_THICKNESS_MM,
        centerMm: {
          x: position.x,
          y: position.y,
          z: position.z + heightMm + PREVIEW_MARKER_THICKNESS_MM / 2
        },
        material: 11,
        extras: { ...featureExtras(feature), role: "pcb_standoff_board_contact" }
      });
      builder.addCylinderNode({
        name: `${feature.id}.screw_marker`,
        radiusMm: Number(feature.holeDiameterMm || 2.4) / 2,
        heightMm: PREVIEW_MARKER_THICKNESS_MM,
        centerMm: {
          x: position.x,
          y: position.y,
          z: position.z + heightMm + PREVIEW_MARKER_THICKNESS_MM * 1.5
        },
        material: 14,
        extras: { ...featureExtras(feature), role: "screw_marker" }
      });
      continue;
    }
    if (feature.type === "edge_capture_retention") {
      addEdgeCaptureRetention(builder, geometrySpec, feature);
      continue;
    }
    if (feature.type === "battery_bay") {
      addBatteryReviewBay(builder, feature);
      continue;
    }
  }
}

function addEdgeCaptureRetention(builder, geometrySpec, feature) {
  const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
  const module = findPlacedModule(geometrySpec, (item) => {
    const componentId = item.componentId || item.moduleId;
    return componentId === feature.targetComponentId || componentId === feature.targetModuleId;
  });
  const dimensions = module?.dimensionsMm || {};
  const width = Number(feature.sizeMm?.[0] || dimensions.width || 14);
  const height = Number(feature.sizeMm?.[1] || dimensions.height || 9);
  const depth = Number(feature.depthMm || dimensions.depth || 7);
  const lip = Number(feature.retentionLipMm || 1.2);
  const railDepth = Math.max(PREVIEW_SURFACE_THICKNESS_MM, depth + lip);
  const extras = {
    ...featureExtras(feature),
    role: "edge_capture_retention_lip",
    mountingMethod: feature.mountingMethod || "edge_capture",
    retentionLipMm: lip,
    directEditingAllowed: false
  };
  [
    {
      name: "left",
      sizeMm: { width: lip, height: height + lip * 2, depth: railDepth },
      centerMm: { x: position.x - width / 2 - lip / 2, y: position.y, z: position.z }
    },
    {
      name: "right",
      sizeMm: { width: lip, height: height + lip * 2, depth: railDepth },
      centerMm: { x: position.x + width / 2 + lip / 2, y: position.y, z: position.z }
    },
    {
      name: "top",
      sizeMm: { width: width + lip * 2, height: lip, depth: railDepth },
      centerMm: { x: position.x, y: position.y + height / 2 + lip / 2, z: position.z }
    },
    {
      name: "bottom",
      sizeMm: { width: width + lip * 2, height: lip, depth: railDepth },
      centerMm: { x: position.x, y: position.y - height / 2 - lip / 2, z: position.z }
    }
  ].forEach((rail) => {
    builder.addBoxNode({
      name: `feature.retention.${safeNodeName(feature.targetComponentId || feature.targetModuleId || "component")}_edge_capture.${rail.name}`,
      sizeMm: rail.sizeMm,
      centerMm: rail.centerMm,
      material: 11,
      extras
    });
  });
}

function addGrilleMountRetention(builder, feature) {
  addFaceRetentionRails(builder, feature, {
    nodeBaseName: `feature.retention.${safeNodeName(feature.targetComponentId || feature.targetModuleId || "speaker")}_grille_mount`,
    width: Number(feature.sizeMm?.[0] || 24),
    height: Number(feature.sizeMm?.[1] || 12),
    railWidth: Number(feature.rimWidthMm || 1.8),
    depth: Number(feature.depthMm || 4),
    material: 11,
    extras: {
      ...featureExtras(feature),
      role: "speaker_grille_mount_rim",
      mountingMethod: feature.mountingMethod || "grille_mount",
      rimWidthMm: feature.rimWidthMm,
      directEditingAllowed: false
    }
  });
}

function addPanelButtonRetention(builder, feature) {
  addFaceRetentionRails(builder, feature, {
    nodeBaseName: `feature.retention.${safeNodeName(feature.targetInstanceLabel || feature.id || "button")}_panel_button`,
    width: Number(feature.sizeMm?.[0] || 6),
    height: Number(feature.sizeMm?.[1] || 6),
    railWidth: Number(feature.collarWidthMm || 1.2),
    depth: Number(feature.depthMm || feature.buttonTravelMm || 5),
    material: 11,
    extras: {
      ...featureExtras(feature),
      role: "panel_button_retention_collar",
      mountingMethod: feature.mountingMethod || "panel_button",
      collarWidthMm: feature.collarWidthMm,
      buttonTravelMm: feature.buttonTravelMm,
      directEditingAllowed: false
    }
  });
}

function addOpticalWindowRetention(builder, feature) {
  addFaceRetentionRails(builder, feature, {
    nodeBaseName: `feature.retention.${safeNodeName(feature.targetComponentId || feature.targetModuleId || "optical")}_${safeNodeName(feature.mountingMethod || "front_window")}`,
    width: Number(feature.sizeMm?.[0] || 8),
    height: Number(feature.sizeMm?.[1] || 8),
    railWidth: Number(feature.rimWidthMm || 1.2),
    depth: Number(feature.depthMm || 3),
    material: feature.reviewOnly ? 4 : 11,
    extras: {
      ...featureExtras(feature),
      role: "optical_window_retention_frame",
      mountingMethod: feature.mountingMethod || "front_window",
      visibilityConeDeg: feature.visibilityConeDeg,
      privacyReviewRequired: Boolean(feature.privacyReviewRequired),
      reviewOnly: Boolean(feature.reviewOnly),
      humanReviewRequired: Boolean(feature.humanReviewRequired),
      rimWidthMm: feature.rimWidthMm,
      directEditingAllowed: false
    }
  });
}

function addBatteryReviewBay(builder, feature) {
  const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
  const width = Number(feature.sizeMm?.[0] || 64);
  const height = Number(feature.sizeMm?.[1] || 42);
  const lip = Math.max(1.8, Number(feature.retentionLipMm || 1.8));
  const depth = Math.max(PREVIEW_SURFACE_THICKNESS_MM, Number(feature.depthMm || 8));
  const extras = {
    ...featureExtras(feature),
    role: "review_only_battery_bay",
    mountingMethod: feature.mountingMethod || "review_only_retained_bay",
    reviewOnly: true,
    humanReviewRequired: true,
    retentionLipMm: lip,
    bayClearanceMm: feature.bayClearanceMm,
    directEditingAllowed: false
  };
  builder.addBoxNode({
    name: "feature.battery_bay",
    sizeMm: { width, height, depth: PREVIEW_SURFACE_THICKNESS_MM },
    centerMm: position,
    material: 12,
    extras: {
      ...extras,
      role: "review_only_battery_bay_base"
    }
  });
  addFaceRetentionRails(builder, feature, {
    nodeBaseName: "feature.battery_bay.rail",
    width,
    height,
    railWidth: lip,
    depth,
    material: 11,
    extras: {
      ...extras,
      role: "review_only_battery_bay_retention_lip"
    }
  });
}

function addFaceRetentionRails(builder, feature, { nodeBaseName, width, height, railWidth, depth, material, extras }) {
  const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
  const rail = Math.max(1.2, Number(railWidth || 1.2));
  const thicknessMm = Math.max(PREVIEW_SURFACE_THICKNESS_MM, Number(depth || PREVIEW_SURFACE_THICKNESS_MM));
  [
    {
      name: "left",
      offsetHorizontalMm: -width / 2 - rail / 2,
      offsetVerticalMm: 0,
      sizeMm: { width: rail, height: height + rail * 2 }
    },
    {
      name: "right",
      offsetHorizontalMm: width / 2 + rail / 2,
      offsetVerticalMm: 0,
      sizeMm: { width: rail, height: height + rail * 2 }
    },
    {
      name: "top",
      offsetHorizontalMm: 0,
      offsetVerticalMm: height / 2 + rail / 2,
      sizeMm: { width: width + rail * 2, height: rail }
    },
    {
      name: "bottom",
      offsetHorizontalMm: 0,
      offsetVerticalMm: -height / 2 - rail / 2,
      sizeMm: { width: width + rail * 2, height: rail }
    }
  ].forEach((item) => {
    addFaceBoxNode(builder, {
      name: `${nodeBaseName}.${item.name}`,
      face: feature.face,
      position: offsetPointOnFace(position, feature.face, item.offsetHorizontalMm, item.offsetVerticalMm),
      sizeMm: item.sizeMm,
      thicknessMm,
      material,
      extras
    });
  });
}

function addScreenRetentionFrame(builder, geometrySpec, feature) {
  const display = findPlacedModule(geometrySpec, (module) => {
    const componentId = module.componentId || module.moduleId;
    return componentId === feature.targetComponentId || module.category === "Display" || module.descriptorCategory === "display";
  });
  if (!display?.dimensionsMm) return;
  const position = pointArrayToObject(display.placement?.positionMm || display.positionMm || [0, 0, 0]);
  const dimensions = display.dimensionsMm;
  const descriptor = findComponentDescriptor(geometrySpec, display.componentId || display.moduleId);
  const bezelMm = Number(feature.bezelMm || descriptor?.mechanicalProxy?.bezelMm || 4);
  const retainerWidth = Number(feature.retainerWidthMm || Math.max(1.8, bezelMm * 0.55));
  const retainerDepth = Math.max(PREVIEW_SURFACE_THICKNESS_MM, Number(geometrySpec.enclosure.wallThicknessMm || 2.4) * 0.75);
  const z = Number(position.z || 0) - Number(dimensions.depth || 4) / 2 - retainerDepth / 2;
  const outerWidth = Number(dimensions.width || 1) + retainerWidth * 2;
  const outerHeight = Number(dimensions.height || 1) + retainerWidth * 2;
  [
    {
      name: "top",
      sizeMm: { width: outerWidth, height: retainerWidth, depth: retainerDepth },
      centerMm: { x: position.x, y: Number(position.y || 0) + Number(dimensions.height || 1) / 2 + retainerWidth / 2, z }
    },
    {
      name: "bottom",
      sizeMm: { width: outerWidth, height: retainerWidth, depth: retainerDepth },
      centerMm: { x: position.x, y: Number(position.y || 0) - Number(dimensions.height || 1) / 2 - retainerWidth / 2, z }
    },
    {
      name: "left",
      sizeMm: { width: retainerWidth, height: Number(dimensions.height || 1), depth: retainerDepth },
      centerMm: { x: Number(position.x || 0) - Number(dimensions.width || 1) / 2 - retainerWidth / 2, y: position.y, z }
    },
    {
      name: "right",
      sizeMm: { width: retainerWidth, height: Number(dimensions.height || 1), depth: retainerDepth },
      centerMm: { x: Number(position.x || 0) + Number(dimensions.width || 1) / 2 + retainerWidth / 2, y: position.y, z }
    }
  ].forEach((rail) => {
    builder.addBoxNode({
      name: `feature.retention.screen.${rail.name}`,
      sizeMm: rail.sizeMm,
      centerMm: rail.centerMm,
      material: 11,
      extras: {
        ...featureExtras(feature),
        role: "screen_retention_frame",
        mountingMethod: feature.mountingMethod || descriptor?.mechanicalProxy?.mountingMethod || "captured_panel",
        bezelMm,
        retainerWidthMm: retainerWidth,
        directEditingAllowed: false
      }
    });
  });
}

function addUsbInsertionClearance(builder, geometrySpec, feature) {
  const position = pointArrayToObject(feature.positionMm || [0, 0, 0]);
  const descriptor = findComponentDescriptor(geometrySpec, feature.targetComponentId || feature.targetModuleId || "usb_c_breakout");
  const descriptorFeature = (descriptor?.externalFeatures || []).find((item) => {
    return item.id === feature.targetFeatureId || item.type === "usb_cutout";
  });
  const insertionClearanceMm = Number(descriptorFeature?.insertionClearanceMm || 8);
  addFaceBoxNode(builder, {
    name: "feature.clearance.usb_c_plug_access",
    face: feature.face,
    position,
    sizeMm: {
      width: Number(feature.sizeMm?.[0] || descriptorFeature?.openingSizeMm?.[0] || 11) + 7,
      height: Number(feature.sizeMm?.[1] || descriptorFeature?.openingSizeMm?.[1] || 5) + 7
    },
    thicknessMm: insertionClearanceMm + PREVIEW_SURFACE_THICKNESS_MM,
    material: 15,
    extras: {
      ...featureExtras(feature),
      role: "usb_c_plug_insertion_clearance",
      clearanceType: "external_plug_insertion",
      insertionClearanceMm,
      directEditingAllowed: false
    }
  });
}

function findPlacedModule(geometrySpec, predicate) {
  return (geometrySpec.modules || geometrySpec.placements || []).find(predicate);
}

function findComponentDescriptor(geometrySpec, componentId) {
  return (geometrySpec.componentDescriptors || []).find((descriptor) => descriptor.id === componentId);
}

function addFaceBoxNode(builder, {
  name,
  face = "front",
  position,
  sizeMm,
  thicknessMm = PREVIEW_SURFACE_THICKNESS_MM,
  material,
  extras = {}
}) {
  const normal = faceNormal(face);
  const centerMm = offsetPoint(position, normal, thicknessMm / 2);
  builder.addBoxNode({
    name,
    sizeMm: faceBoxSize(face, sizeMm, thicknessMm),
    centerMm,
    material,
    extras: {
      ...extras,
      previewThicknessMm: thicknessMm,
      previewNormal: normalFace(face)
    }
  });
}

function addFaceCylinderNode(builder, {
  name,
  face = "front",
  position,
  radiusMm,
  thicknessMm = PREVIEW_SURFACE_THICKNESS_MM,
  material,
  extras = {}
}) {
  const normal = faceNormal(face);
  const center = offsetPoint(position, normal, thicknessMm / 2);
  builder.addTubeNode({
    name,
    startMm: offsetPoint(center, normal, -thicknessMm / 2),
    endMm: offsetPoint(center, normal, thicknessMm / 2),
    radiusMm,
    material,
    extras: {
      ...extras,
      previewThicknessMm: thicknessMm,
      previewNormal: normalFace(face)
    },
    segments: 18
  });
}

function faceBoxSize(face, sizeMm = {}, thicknessMm = PREVIEW_SURFACE_THICKNESS_MM) {
  const width = Number(sizeMm.width || sizeMm[0] || 1);
  const height = Number(sizeMm.height || sizeMm[1] || 1);
  const normalized = normalFace(face);
  if (normalized === "left" || normalized === "right") {
    return { width: thicknessMm, height, depth: width };
  }
  if (normalized === "top" || normalized === "bottom") {
    return { width, height: thicknessMm, depth: height };
  }
  return { width, height, depth: thicknessMm };
}

function offsetPointOnFace(position, face = "front", horizontalMm = 0, verticalMm = 0) {
  const normalized = normalFace(face);
  if (normalized === "left" || normalized === "right") {
    return {
      ...position,
      y: Number(position.y || 0) + verticalMm,
      z: Number(position.z || 0) + horizontalMm
    };
  }
  if (normalized === "top" || normalized === "bottom") {
    return {
      ...position,
      x: Number(position.x || 0) + horizontalMm,
      z: Number(position.z || 0) + verticalMm
    };
  }
  return {
    ...position,
    x: Number(position.x || 0) + horizontalMm,
    y: Number(position.y || 0) + verticalMm
  };
}

function faceNormal(face = "front") {
  const map = {
    front: { x: 0, y: 0, z: 1 },
    back: { x: 0, y: 0, z: -1 },
    left: { x: -1, y: 0, z: 0 },
    right: { x: 1, y: 0, z: 0 },
    top: { x: 0, y: 1, z: 0 },
    bottom: { x: 0, y: -1, z: 0 }
  };
  return map[normalFace(face)] || map.front;
}

function normalFace(face = "front") {
  const value = String(face || "front");
  if (value.startsWith("front")) return "front";
  if (value.startsWith("back") || value.includes("internal_back")) return "back";
  if (value === "left" || value.startsWith("left_") || value.endsWith("_left")) return "left";
  if (value === "right" || value.startsWith("right_") || value.endsWith("_right")) return "right";
  if (value === "top" || value.startsWith("top_")) return "top";
  if (value === "bottom" || value.startsWith("bottom_")) return "bottom";
  return "front";
}

function offsetPoint(point = {}, normal = { x: 0, y: 0, z: 1 }, distanceMm = 0) {
  return {
    x: Number(point.x || 0) + normal.x * distanceMm,
    y: Number(point.y || 0) + normal.y * distanceMm,
    z: Number(point.z || 0) + normal.z * distanceMm
  };
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
  const radiusMm = route.type === "power" ? ROUTE_PREVIEW_RADIUS_MM * 1.25 : ROUTE_PREVIEW_RADIUS_MM;
  points.forEach((point, index) => {
    const diameterMm = radiusMm * 2;
    builder.addBoxNode({
      name: `${routeName}.node.${index + 1}`,
      sizeMm: { width: diameterMm, height: diameterMm, depth: diameterMm },
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
    builder.addTubeNode({
      name: `${routeName}.segment.${index + 1}`,
      startMm: points[index],
      endMm: points[index + 1],
      radiusMm,
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

function tubeGeometryBetween(startMm, endMm, radiusMm = 1.2, segments = 12) {
  const start = pointArrayToObject(startMm);
  const end = pointArrayToObject(endMm);
  const axisMm = {
    x: end.x - start.x,
    y: end.y - start.y,
    z: end.z - start.z
  };
  const lengthMm = Math.hypot(axisMm.x, axisMm.y, axisMm.z);
  if (lengthMm < 0.001) {
    return cylinderGeometry(radiusMm, radiusMm * 2, segments);
  }
  const axis = {
    x: axisMm.x / lengthMm,
    y: axisMm.y / lengthMm,
    z: axisMm.z / lengthMm
  };
  const reference = Math.abs(axis.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const radialA = normalizeVector(cross(axis, reference));
  const radialB = normalizeVector(cross(axis, radialA));
  const radius = Number(radiusMm || 1.2) / 100;
  const bottomCenter = scaleVector(axis, -lengthMm / 200);
  const topCenter = scaleVector(axis, lengthMm / 200);
  const positions = [bottomCenter.x, bottomCenter.y, bottomCenter.z, topCenter.x, topCenter.y, topCenter.z];
  for (let index = 0; index < segments; index += 1) {
    const angle = (Math.PI * 2 * index) / segments;
    const radial = addVector(scaleVector(radialA, Math.cos(angle) * radius), scaleVector(radialB, Math.sin(angle) * radius));
    positions.push(
      bottomCenter.x + radial.x,
      bottomCenter.y + radial.y,
      bottomCenter.z + radial.z,
      topCenter.x + radial.x,
      topCenter.y + radial.y,
      topCenter.z + radial.z
    );
  }
  const indices = [];
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    const bottom = 2 + index * 2;
    const top = bottom + 1;
    const nextBottom = 2 + next * 2;
    const nextTop = nextBottom + 1;
    indices.push(0, bottom, nextBottom);
    indices.push(1, nextTop, top);
    indices.push(bottom, top, nextTop, bottom, nextTop, nextBottom);
  }
  return { positions, indices };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
}

function scaleVector(vector, amount) {
  return {
    x: vector.x * amount,
    y: vector.y * amount,
    z: vector.z * amount
  };
}

function addVector(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
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
    material("screw_marker", [0.12, 0.12, 0.12, 1]),
    material("clearance_volume", [0.35, 0.64, 0.92, 0.28], "BLEND")
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
  const mechanicalCoverage = geometrySpec.mechanicalConstraints?.coverage || {};
  const layoutCoverage = geometrySpec.layoutExplanation?.coverage || {};
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
- Layout explanation evidence records why placements, shell features, and cable routes were selected.

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

## Mechanical Constraint Evidence
- Constraint report: ${geometrySpec.mechanicalConstraints?.version || "not_available"}
- Components covered: ${mechanicalCoverage.componentCount ?? 0}
- Connectors covered: ${mechanicalCoverage.connectorCount ?? 0}
- External features covered: ${mechanicalCoverage.externalFeatureCount ?? 0}
- Keepout/access volumes covered: ${(mechanicalCoverage.keepoutVolumeCount ?? 0) + (mechanicalCoverage.accessVolumeCount ?? 0)}
- Vendor asset components: ${mechanicalCoverage.vendorAssetCount ?? 0}
- Proxy components requiring review: ${mechanicalCoverage.unverifiedProxyCount ?? 0}

## Layout Explanation Evidence
- Layout report: ${geometrySpec.layoutExplanation?.version || "not_available"}
- Placements explained: ${layoutCoverage.explainedPlacementCount ?? 0}/${layoutCoverage.placementCount ?? 0}
- Features explained: ${layoutCoverage.explainedFeatureCount ?? 0}/${layoutCoverage.featureCount ?? 0}
- Routes explained: ${layoutCoverage.explainedRouteCount ?? 0}/${layoutCoverage.routeCount ?? 0}
- Descriptor-driven shell features: ${layoutCoverage.descriptorDrivenFeatureCount ?? 0}
- Preference-driven placements: ${layoutCoverage.preferenceDrivenPlacementCount ?? 0}

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
  const constraintCoverage = geometrySpec.mechanicalConstraints?.coverage || {};
  const layoutCoverage = geometrySpec.layoutExplanation?.coverage || {};
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
#80 = PROPERTY_DEFINITION('mechanical_constraints','${stepString(JSON.stringify(constraintCoverage))}',#20);
#90 = PROPERTY_DEFINITION('layout_explanation','${stepString(JSON.stringify(layoutCoverage))}',#20);
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
