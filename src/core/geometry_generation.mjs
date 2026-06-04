import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { registerAsset } from "./assets.mjs";

const modelRoot = fileURLToPath(new URL("../../data/models/", import.meta.url));

export function createGeometrySpec({ spec = {}, modules = [], riskReport = {} } = {}) {
  const screenSize = Number(spec.enclosure?.screen_size_in || 5);
  const finish = spec.enclosure?.finish || "woodgrain";
  const dimensionsMm = shellDimensions(screenSize);
  const enclosure = {
    family: "standard_desktop_display_shell",
    manufacturingPath: "standardized_3d_print",
    finish,
    dimensionsMm,
    wallThicknessMm: 2.4,
    cornerRadiusMm: screenSize >= 7 ? 8 : 6,
    screenOpening: screenOpening(screenSize),
    connectorOpenings: [
      {
        id: "usb_c_rear",
        type: "usb_c",
        side: "back",
        sizeMm: { width: 12, height: 5 },
        positionMm: { x: 0, y: -dimensionsMm.height / 2 + 14, z: -dimensionsMm.depth / 2 }
      }
    ],
    mounting: standardMounting(dimensionsMm)
  };
  const moduleGeometry = modules.map((module, index) => moduleToGeometry(module, index, enclosure));
  const connectors = createConnectors(moduleGeometry, enclosure);
  const cableRoutes = createCableRoutes(connectors, enclosure);

  return {
    version: "geometry_spec_v1",
    source: "product_plan_revision",
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
    requiredArtifacts: ["glb", "stl", "step", "validation_report"],
    enclosure,
    modules: moduleGeometry,
    connectors,
    cableRoutes,
    riskReport: {
      blocked: Boolean(riskReport.blocked),
      reviewLevel: Number(riskReport.reviewLevel || 0),
      items: riskReport.items || []
    }
  };
}

export function validateGeometrySpec(geometrySpec = {}) {
  const issues = [];
  const modules = geometrySpec.modules || [];
  const enclosure = geometrySpec.enclosure || {};
  const dimensions = enclosure.dimensionsMm || {};

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
      "screen_opening",
      "usb_c_rear_opening",
      "board_standoffs",
      "module_volume_placeholders",
      "interface_directions",
      "coarse_cable_routes",
      "placed_module_nodes",
      "interface_markers"
    ],
    userEditingAllowed: false,
    note: blocked
      ? "No GLB/STL/STEP artifacts are emitted for blocked or incomplete geometry."
      : "GLB/STL/STEP artifacts are generated from geometrySpec, not from raw chat text."
  };
}

export function generateModelArtifacts({ geometrySpec, planId = "", revisionId = "", jobId = "", generateArtifacts = true } = {}) {
  const validation = validateGeometrySpec(geometrySpec);
  const emptyArtifacts = {
    geometrySpec: null,
    validationReport: null,
    cadqueryScript: null,
    glb: null,
    stl: null,
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

  const geometrySpecPath = join(outputDir, "geometry-spec.json");
  const validationPath = join(outputDir, "geometry-validation.json");
  const cadQueryPath = join(outputDir, "generate_model.py");
  writeFileSync(geometrySpecPath, JSON.stringify(geometrySpec, null, 2));
  writeFileSync(validationPath, JSON.stringify(validation, null, 2));
  writeFileSync(cadQueryPath, cadQueryScript(geometrySpec));

  const assets = {
    geometrySpec: artifactAsset({
      type: "geometry_spec",
      path: geometrySpecPath,
      url: `/data/models/${artifactId}/geometry-spec.json`,
      caption: "GeometrySpec source of truth for this ProductPlan revision"
    }),
    validationReport: artifactAsset({
      type: "validation_report",
      path: validationPath,
      url: `/data/models/${artifactId}/geometry-validation.json`,
      caption: "Geometry validation report for generated shell, modules, interfaces, and routes"
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
        geometrySpec: assets.geometrySpec,
        validationReport: assets.validationReport,
        cadqueryScript: assets.cadqueryScript,
        glb: null,
        stl: null,
        step: null
      },
      validation
    };
  }

  const glbPath = join(outputDir, "model.glb");
  const stlPath = join(outputDir, "model.stl");
  const stepPath = join(outputDir, "model.step");
  writeFileSync(glbPath, createGlb(geometrySpec));
  writeFileSync(stlPath, createAsciiStl(geometrySpec));
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
    caption: "Internal 3D print and quote handoff artifact"
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
  const cubePositions = new Float32Array([
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,
    -0.5, 0.5, 0.5
  ]);
  const cubeIndices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    3, 7, 4, 3, 4, 0
  ]);
  const placedModules = placeableModules(geometrySpec);
  const riskModuleIds = placedModules
    .filter((module) => module.status === "review")
    .map((module) => module.moduleId);
  const routePositions = routeLinePositions(geometrySpec);

  const cubePositionBuffer = Buffer.from(cubePositions.buffer);
  const cubePositionPadding = padBuffer(cubePositionBuffer);
  const cubeIndexOffset = cubePositionBuffer.length + cubePositionPadding.length;
  const cubeIndexBuffer = Buffer.from(cubeIndices.buffer);
  const cubeIndexPadding = padBuffer(cubeIndexBuffer);
  const routeOffset = cubeIndexOffset + cubeIndexBuffer.length + cubeIndexPadding.length;
  const routeBuffer = Buffer.from(new Float32Array(routePositions).buffer);
  const routePadding = padBuffer(routeBuffer);
  const binary = Buffer.concat([
    cubePositionBuffer,
    cubePositionPadding,
    cubeIndexBuffer,
    cubeIndexPadding,
    routeBuffer,
    routePadding
  ]);
  const bufferViews = [
    { buffer: 0, byteOffset: 0, byteLength: cubePositionBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: cubeIndexOffset, byteLength: cubeIndexBuffer.length, target: 34963 }
  ];
  const accessors = [
    {
      bufferView: 0,
      componentType: 5126,
      count: 8,
      type: "VEC3",
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5]
    },
    {
      bufferView: 1,
      componentType: 5123,
      count: cubeIndices.length,
      type: "SCALAR"
    }
  ];
  let routeAccessor = null;
  if (routePositions.length > 0) {
    routeAccessor = accessors.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: routeOffset,
      byteLength: routeBuffer.length,
      target: 34962
    });
    accessors.push({
      bufferView: bufferViews.length - 1,
      componentType: 5126,
      count: routePositions.length / 3,
      type: "VEC3"
    });
  }

  const nodes = [];
  const meshes = [];
  const addCubeNode = ({ name, scaleMm, translationMm = { x: 0, y: 0, z: 0 }, material, extras = {} }) => {
    const meshIndex = meshes.length;
    meshes.push({
      name: `${name}.mesh`,
      primitives: [{
        attributes: { POSITION: 0 },
        indices: 1,
        material,
        mode: 4
      }]
    });
    nodes.push({
      name,
      mesh: meshIndex,
      translation: mmVector(translationMm),
      scale: [
        Number(scaleMm.width || 1) / 100,
        Number(scaleMm.height || 1) / 100,
        Number(scaleMm.depth || 1) / 100
      ],
      extras
    });
  };

  addCubeNode({
    name: "shell.standard_desktop_display_shell",
    scaleMm: dimensions,
    material: 0,
    extras: {
      role: "standard_3d_printed_shell",
      finish: geometrySpec.enclosure.finish
    }
  });
  for (const module of placedModules) {
    addCubeNode({
      name: `module.${safeNodeName(module.moduleId)}`,
      scaleMm: module.dimensionsMm,
      translationMm: module.placement.positionMm,
      material: materialIndexForModule(module),
      extras: {
        moduleId: module.moduleId,
        role: module.role,
        status: module.status,
        riskTags: module.riskTags || [],
        directEditingAllowed: false
      }
    });
  }
  for (const connector of geometrySpec.connectors || []) {
    const position = connector.positionMm || placedModules.find((module) => module.moduleId === connector.fromModuleId)?.placement?.positionMm;
    if (!position) continue;
    addCubeNode({
      name: `interface.${safeNodeName(connector.id)}`,
      scaleMm: { width: 5, height: 5, depth: 5 },
      translationMm: position,
      material: 7,
      extras: {
        connectorId: connector.id,
        type: connector.type,
        direction: connector.direction
      }
    });
  }
  if (routeAccessor !== null) {
    const meshIndex = meshes.length;
    meshes.push({
      name: "route.coarse_cable_paths.mesh",
      primitives: [{
        attributes: { POSITION: routeAccessor },
        material: 8,
        mode: 1
      }]
    });
    nodes.push({
      name: "route.coarse_cable_paths",
      mesh: meshIndex,
      extras: {
        routeType: "coarse_internal_path",
        editable: false
      }
    });
  }

  const json = {
    asset: { version: "2.0", generator: "Forge internal_parametric_v1" },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, index) => index) }],
    nodes,
    meshes,
    materials: glbMaterials(geometrySpec.enclosure.finish),
    buffers: [{ byteLength: binary.length }],
    bufferViews,
    accessors,
    extras: {
      geometrySpecVersion: geometrySpec.version,
      userInteraction: geometrySpec.userViewer.allowed,
      placedModuleCount: placedModules.length,
      riskModuleIds,
      moduleNodeNames: placedModules.map((module) => `module.${safeNodeName(module.moduleId)}`),
      directEditingAllowed: false
    }
  };
  return glbFromJsonAndBinary(json, binary);
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

function mmVector(point = {}) {
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
    woodgrain: [0.62, 0.38, 0.18, 0.38],
    graphite: [0.18, 0.2, 0.21, 0.42],
    sage: [0.46, 0.58, 0.43, 0.4],
    coral: [0.78, 0.36, 0.28, 0.4]
  }[finish] || [0.62, 0.38, 0.18, 0.38];
  return [
    material("shell_finish", shellColor, "BLEND"),
    material("core_board", [0.18, 0.42, 0.32, 1]),
    material("display_module", [0.06, 0.08, 0.08, 1]),
    material("power_module", [0.18, 0.32, 0.58, 1]),
    material("human_review_module", [0.92, 0.58, 0.18, 1]),
    material("sensor_module", [0.48, 0.68, 0.62, 1]),
    material("audio_module", [0.5, 0.48, 0.6, 1]),
    material("interface_marker", [0.95, 0.86, 0.18, 1]),
    material("cable_route", [0.32, 0.34, 0.36, 1])
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
  const placementSummary = placeableModules(geometrySpec)
    .map((module) => {
      const position = module.placement.positionMm;
      return `${module.moduleId}@${position.x},${position.y},${position.z}:${module.role}`;
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
#20 = PRODUCT_DEFINITION_FORMATION('1','GeometrySpec v1',#10);
#30 = CARTESIAN_POINT('shell_dimensions_mm',(${dimensions.width},${dimensions.height},${dimensions.depth}));
#40 = PROPERTY_DEFINITION('user_viewer','orbit/zoom/pan only; no direct geometry editing',#20);
#50 = PROPERTY_DEFINITION('solidworks_role','internal STEP handoff target',#20);
#60 = PROPERTY_DEFINITION('module_placements','${stepString(placementSummary)}',#20);
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
