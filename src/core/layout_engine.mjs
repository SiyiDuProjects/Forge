export function generateLayout(productPlan = {}, componentDescriptors = []) {
  const descriptorById = new Map(componentDescriptors.map((descriptor) => [descriptor.id, descriptor]));
  const enclosure = enclosureForProductPlan(productPlan, componentDescriptors);
  const placements = [];
  const features = [];
  const routes = [];
  const warnings = [];

  const display = firstDescriptor(componentDescriptors, "display");
  const core = descriptorById.get("core_board_esp32_s3");
  const usb = descriptorById.get("usb_c_breakout");
  const sensor = descriptorById.get("ambient_sensor_basic");
  const speaker = descriptorById.get("speaker_20mm");
  const button = descriptorById.get("button_6mm");
  const camera = descriptorById.get("camera_module_basic");
  const battery = descriptorById.get("battery_lipo_2000") || descriptorById.get("battery_18650_holder");
  const placementPreferences = productPlan.geometryPreferences?.placements || {};

  if (display) {
    placements.push(placement(display, {
      role: "front_display",
      face: "front",
      positionMm: { x: 0, y: 0, z: enclosure.dimensionsMm.depth / 2 - display.dimensionsMm.depth / 2 - 1 },
      orientation: "front"
    }));
    features.push(screenOpeningFeature(display, enclosure));
  }

  if (core) {
    const coreZ = -enclosure.dimensionsMm.depth / 2 + enclosure.wallThicknessMm + 7 + core.dimensionsMm.depth / 2;
    placements.push(placement(core, {
      role: "core_board",
      face: "internal_back",
      positionMm: { x: 0, y: -2, z: coreZ },
      orientation: "internal"
    }));
    features.push(...coreStandoffFeatures(core, { x: 0, y: -2, z: -enclosure.dimensionsMm.depth / 2 + enclosure.wallThicknessMm }, enclosure));
  }

  if (usb) {
    const usbPosition = semanticPosition({
      semanticPosition: placementPreferences.usb_c?.semanticPosition || "back",
      descriptor: usb,
      enclosure,
      defaultFace: "back",
      defaultRole: "rear_power_input"
    });
    placements.push(placement(usb, {
      role: "rear_power_input",
      face: usbPosition.face,
      positionMm: usbPosition.positionMm,
      orientation: usbPosition.orientation
    }));
    features.push({
      id: "feature.opening.usb_c",
      type: "usb_cutout",
      source: descriptorSource(usb, "externalFeatures", "usb_c_cutout"),
      targetModuleId: usb.id,
      targetComponentId: usb.id,
      targetFeatureId: "usb_c_cutout",
      targetConnectorId: "usb_c",
      face: usbPosition.face,
      positionMm: objectPointToArray(usbPosition.featurePositionMm),
      sizeMm: [11, 5],
      role: `${usbPosition.face}_usb_c_cutout`
    });
  }

  if (sensor) {
    const sensorPosition = semanticPosition({
      semanticPosition: placementPreferences.ambient_sensor?.semanticPosition || "front_right",
      descriptor: sensor,
      enclosure,
      defaultFace: "front",
      defaultRole: "front_sensor"
    });
    placements.push(placement(sensor, {
      role: "front_sensor",
      face: sensorPosition.face,
      positionMm: sensorPosition.positionMm,
      orientation: sensorPosition.orientation
    }));
    features.push({
      id: "feature.opening.ambient_sensor",
      type: "sensor_window",
      source: descriptorSource(sensor, "externalFeatures", "ambient_sensor_window"),
      targetModuleId: sensor.id,
      targetComponentId: sensor.id,
      targetFeatureId: "ambient_sensor_window",
      face: sensorPosition.face,
      positionMm: objectPointToArray(sensorPosition.featurePositionMm),
      sizeMm: [6, 4],
      role: `${sensorPosition.face}_ambient_sensor_window`
    });
  }

  if (speaker) {
    const speakerPosition = semanticPosition({
      semanticPosition: placementPreferences.speaker?.semanticPosition || "back_right",
      descriptor: speaker,
      enclosure,
      defaultFace: "back",
      defaultRole: "speaker_volume"
    });
    placements.push(placement(speaker, {
      role: "speaker_volume",
      face: speakerPosition.face,
      positionMm: speakerPosition.positionMm,
      orientation: speakerPosition.orientation
    }));
    features.push({
      id: "feature.opening.speaker_vents",
      type: "speaker_vents",
      source: descriptorSource(speaker, "externalFeatures", "speaker_vents"),
      targetModuleId: speaker.id,
      targetComponentId: speaker.id,
      targetFeatureId: "speaker_vents",
      face: speakerPosition.face,
      positionMm: objectPointToArray(speakerPosition.featurePositionMm),
      sizeMm: [24, 12],
      ventCount: 5,
      role: `speaker_${speakerPosition.face}_vents`
    });
  }

  if (button) {
    const buttonCount = Math.max(0, Math.min(4, Number(productPlan.requirements?.buttons || 0)));
    const buttonBase = semanticPosition({
      semanticPosition: placementPreferences.buttons?.semanticPosition || "front_bottom",
      descriptor: button,
      enclosure,
      defaultFace: "front",
      defaultRole: "button_input"
    });
    for (let index = 0; index < buttonCount; index += 1) {
      const offset = (index - (buttonCount - 1) / 2) * 14;
      const shifted = offsetOnFace(buttonBase, offset);
      placements.push(placement(button, {
        role: "button_input",
        face: shifted.face,
        positionMm: shifted.positionMm,
        orientation: shifted.orientation,
        instanceLabel: `button_${index + 1}`
      }));
      features.push({
        id: `feature.opening.button_${index + 1}`,
        type: "button_hole",
        source: descriptorSource(button, "externalFeatures", "button_hole"),
        targetModuleId: button.id,
        targetComponentId: button.id,
        targetFeatureId: "button_hole",
        face: shifted.face,
        positionMm: objectPointToArray(shifted.featurePositionMm),
        sizeMm: [6, 6],
        role: `${shifted.face}_button_hole`
      });
    }
  }

  if (camera) {
    const cameraY = enclosure.dimensionsMm.height / 2 - 16;
    placements.push(placement(camera, {
      role: "front_camera_review",
      face: "front",
      positionMm: { x: 0, y: cameraY, z: enclosure.dimensionsMm.depth / 2 - camera.dimensionsMm.depth / 2 - 0.6 },
      orientation: "front"
    }));
    features.push({
      id: "feature.opening.camera",
      type: "camera_window",
      source: descriptorSource(camera, "externalFeatures", "camera_window"),
      targetModuleId: camera.id,
      targetComponentId: camera.id,
      targetFeatureId: "camera_window",
      face: "front",
      positionMm: [0, cameraY, enclosure.dimensionsMm.depth / 2],
      sizeMm: [8, 8],
      role: "front_camera_window"
    });
    warnings.push({
      type: "manual_validation_required",
      moduleId: camera.id,
      severity: "warning",
      message: camera.risk?.reason || "Camera placement requires human review."
    });
  }

  if (battery) {
    placements.push(placement(battery, {
      role: "battery_review_volume",
      face: "internal_back",
      positionMm: { x: 0, y: -enclosure.dimensionsMm.height / 2 + 28, z: -enclosure.dimensionsMm.depth / 2 + 12 },
      orientation: "internal"
    }));
    features.push({
      id: "feature.battery_bay",
      type: "battery_bay",
      source: descriptorSource(battery, "mechanicalProxy", "mountingMethod"),
      targetModuleId: battery.id,
      targetComponentId: battery.id,
      targetFeatureId: "battery_bay",
      face: "internal_back",
      positionMm: [0, -enclosure.dimensionsMm.height / 2 + 28, -enclosure.dimensionsMm.depth / 2 + 7],
      sizeMm: [battery.dimensionsMm.width + 4, battery.dimensionsMm.height + 4],
      role: "battery_tray"
    });
    warnings.push({
      type: "manual_validation_required",
      moduleId: battery.id,
      severity: "warning",
      message: battery.risk?.reason || "Battery placement requires human review."
    });
  }

  if (display && core) {
    routes.push(route("route.display_to_core_board", `${display.id}.fpc`, "core_board_esp32_s3.display_port", [
      [0, -display.dimensionsMm.height / 2 + 4, enclosure.dimensionsMm.depth / 2 - 5],
      [0, -display.dimensionsMm.height / 2 - 6, 0],
      [0, -2, -enclosure.dimensionsMm.depth / 2 + 16]
    ], "fpc"));
  }
  if (sensor && core) {
    const sensorPlacement = placements.find((item) => item.componentId === sensor.id);
    routes.push(route("route.sensor_to_core_board", "ambient_sensor_basic.signal", "core_board_esp32_s3.i2c", [
      [sensorPlacement.positionMm.x, sensorPlacement.positionMm.y, enclosure.dimensionsMm.depth / 2 - 4],
      [sensorPlacement.positionMm.x - 14, sensorPlacement.positionMm.y - 18, 0],
      [0, -2, -enclosure.dimensionsMm.depth / 2 + 16]
    ], "i2c"));
  }
  if (button && core && Number(productPlan.requirements?.buttons || 0) > 0) {
    const buttonPlacement = placements.find((item) => item.componentId === button.id);
    routes.push(route("route.button_to_core_board", "button_6mm.signal", "core_board_esp32_s3.gpio", [
      [buttonPlacement.positionMm.x, buttonPlacement.positionMm.y, buttonPlacement.positionMm.z],
      [buttonPlacement.positionMm.x / 2, buttonPlacement.positionMm.y / 2, 0],
      [0, -2, -enclosure.dimensionsMm.depth / 2 + 16]
    ], "gpio"));
  }
  if (usb && core) {
    routes.push(route("route.usb_c_to_core_board", "usb_c_breakout.power_out", "core_board_esp32_s3.usb_c", [
      [0, -enclosure.dimensionsMm.height / 2 + 14, -enclosure.dimensionsMm.depth / 2 + 6],
      [0, -enclosure.dimensionsMm.height / 2 + 20, -6],
      [0, -2, -enclosure.dimensionsMm.depth / 2 + 16]
    ], "power"));
  }

  features.push(...decorativeShapeFeatures(enclosure));
  features.push({
    id: "feature.split_line.front_back_shell",
    type: "split_line",
    source: { kind: "enclosure.split", field: "front_back_shell" },
    face: "side",
    positionMm: [0, 0, 0],
    sizeMm: [enclosure.dimensionsMm.width, enclosure.dimensionsMm.height],
    role: "front_back_shell_split"
  });

  return {
    enclosure,
    placements,
    features,
    routes,
    warnings
  };
}

function enclosureForProductPlan(productPlan, componentDescriptors) {
  const requirements = productPlan.requirements || {};
  const geometryPreferences = productPlan.geometryPreferences || {};
  const display = firstDescriptor(componentDescriptors, "display");
  const screenSize = Number(requirements.displaySizeInches || 3.5);
  const displayWidth = display?.dimensionsMm?.width || Math.round(screenSize * 25.4 * 1.2);
  const displayHeight = display?.dimensionsMm?.height || Math.round(screenSize * 25.4 * 0.76);
  const shapeProfile = geometryPreferences.enclosure?.shapeProfile || productPlan.constraints?.preferredStyle || "rounded_rect";
  const shapeScale = shapeScaleFor(shapeProfile);
  const widthScale = Number(geometryPreferences.dimensions?.widthScale || 1) * shapeScale.width;
  const heightScale = Number(geometryPreferences.dimensions?.heightScale || 1) * shapeScale.height;
  const depthDeltaMm = Number(geometryPreferences.dimensions?.depthDeltaMm || 0) + shapeScale.depthDeltaMm;
  const width = Math.max(98, Math.round((displayWidth + 36) * widthScale));
  const height = Math.max(68, Math.round((displayHeight + 34) * heightScale));
  const depth = Math.max(26, (screenSize >= 7 ? 42 : screenSize >= 5 ? 36 : 32) + depthDeltaMm);
  return {
    archetype: productPlan.productType || "desktop_display",
    family: "standard_desktop_display_shell",
    shapeProfile,
    manufacturingPath: "standardized_3d_print",
    manufacturing: {
      method: "fdm_3d_printing",
      material: productPlan.constraints?.material || "pla",
      minimumWallMm: 2,
      clearanceMm: productPlan.constraints?.clearanceMm ?? 0.5
    },
    finish: productPlan.constraints?.finish || "woodgrain",
    split: "front_back_shell",
    dimensionsMm: { width, height, depth },
    outerDimensionsMm: { width, height, depth },
    wallThicknessMm: productPlan.constraints?.wallThicknessMm || 2.4,
    cornerRadiusMm: shapeProfile === "rounded_rect" ? (screenSize >= 7 ? 8 : 5) : 4
  };
}

function screenOpeningFeature(display, enclosure) {
  const openingFeature = display.externalFeatures?.find((feature) => feature.type === "screen_opening");
  const margin = openingFeature?.marginMm ?? 3;
  const bezel = openingFeature?.bezelMm ?? 4;
  return {
    id: "feature.opening.screen",
    type: "screen_opening",
    source: descriptorSource(display, "externalFeatures", openingFeature?.id || "screen_opening"),
    targetModuleId: display.id,
    targetComponentId: display.id,
    targetFeatureId: "screen_opening",
    face: "front",
    positionMm: [0, 0, enclosure.dimensionsMm.depth / 2],
    sizeMm: [display.dimensionsMm.width + margin * 2, display.dimensionsMm.height + margin * 2],
    bezelMm: bezel,
    role: "front_screen_opening"
  };
}

function coreStandoffFeatures(core, origin, enclosure) {
  const holes = core.mounting?.mountingHoles || [];
  return holes.map((hole, index) => {
    const position = Array.isArray(hole) ? hole : hole.positionLocalMm || [0, 0, 0];
    const [x, y] = position;
    return {
      id: `feature.standoff.core_board.${index + 1}`,
      type: "standoff",
      source: descriptorSource(core, "mountingHoles", hole.id || `mount_${index + 1}`),
      targetModuleId: core.id,
      targetComponentId: core.id,
      targetFeatureId: hole.id || `mount_${index + 1}`,
      targetMountId: hole.id || `mount_${index + 1}`,
      face: "internal_back",
      positionMm: [origin.x + x, origin.y + y, origin.z],
      outerDiameterMm: core.mounting?.standoffOuterDiameterMm || 5,
      holeDiameterMm: core.mounting?.holeDiameterMm || hole.diameterMm || 2.4,
      heightMm: Math.max(6, enclosure.dimensionsMm.depth / 2 - 10),
      role: "core_board_standoff"
    };
  });
}

function placement(descriptor, data) {
  return {
    componentId: descriptor.id,
    moduleId: descriptor.id,
    name: descriptor.displayName,
    category: descriptor.category,
    type: descriptor.type,
    status: descriptor.risk?.requiresManualValidation ? "review" : "approved",
    role: data.role,
    instanceLabel: data.instanceLabel || "",
    face: data.face,
    dimensionsMm: descriptor.dimensionsMm,
    placement: {
      positionMm: data.positionMm,
      orientation: data.orientation,
      interfaceDirection: data.face
    },
    positionMm: data.positionMm,
    orientation: data.orientation,
    interfaces: descriptor.connectors || [],
    mounting: descriptor.mounting || null,
    mountingHoles: descriptor.mountingHoles || [],
    connectors: descriptor.connectors || [],
    externalFeatures: descriptor.externalFeatures || [],
    keepouts: descriptor.keepouts || [],
    accessVolumes: descriptor.accessVolumes || [],
    assetQuality: descriptor.assetQuality,
    validationStatus: descriptor.validationStatus,
    componentDescriptorVersion: descriptor.versioning?.descriptorVersion,
    descriptorPath: descriptor.descriptorPath,
    mechanicalProxy: descriptor.mechanicalProxy || {},
    clearanceMm: descriptor.clearanceMm || {},
    capabilities: capabilitiesForDescriptor(descriptor),
    riskTags: descriptor.risk?.requiresManualValidation ? ["human_review"] : [],
    geometryStatus: "ready",
    visual: descriptor.visual || {}
  };
}

function semanticPosition({ semanticPosition, descriptor, enclosure, defaultFace, defaultRole }) {
  const dimensions = enclosure.dimensionsMm;
  const wall = Number(enclosure.wallThicknessMm || 2.4);
  const size = descriptor.dimensionsMm || { width: 10, height: 10, depth: 5 };
  const inset = {
    x: Math.max(14, size.width / 2 + wall + 3),
    y: Math.max(14, size.height / 2 + wall + 3)
  };
  const map = {
    front: { face: "front", x: 0, y: 0, z: dimensions.depth / 2 - size.depth / 2 - 0.8 },
    back: { face: "back", x: 0, y: -dimensions.height / 2 + inset.y, z: -dimensions.depth / 2 + size.depth / 2 + 0.8 },
    back_left: { face: "back", x: -dimensions.width / 2 + inset.x, y: -dimensions.height / 2 + inset.y, z: -dimensions.depth / 2 + size.depth / 2 + 0.8 },
    back_right: { face: "back", x: dimensions.width / 2 - inset.x, y: -dimensions.height / 2 + inset.y, z: -dimensions.depth / 2 + size.depth / 2 + 0.8 },
    front_top: { face: "front", x: 0, y: dimensions.height / 2 - inset.y, z: dimensions.depth / 2 - size.depth / 2 - 0.8 },
    front_bottom: { face: "front", x: 0, y: -dimensions.height / 2 + inset.y, z: dimensions.depth / 2 - size.depth / 2 - 0.8 },
    front_left: { face: "front", x: -dimensions.width / 2 + inset.x, y: dimensions.height / 2 - inset.y, z: dimensions.depth / 2 - size.depth / 2 - 0.8 },
    front_right: { face: "front", x: dimensions.width / 2 - inset.x, y: dimensions.height / 2 - inset.y, z: dimensions.depth / 2 - size.depth / 2 - 0.8 },
    right_side: { face: "right", x: dimensions.width / 2 - size.depth / 2 - 0.8, y: 0, z: 0 },
    left_side: { face: "left", x: -dimensions.width / 2 + size.depth / 2 + 0.8, y: 0, z: 0 },
    top: { face: "top", x: 0, y: dimensions.height / 2 - size.height / 2 - 0.8, z: 0 },
    bottom: { face: "bottom", x: 0, y: -dimensions.height / 2 + size.height / 2 + 0.8, z: 0 },
    center_front: { face: "front", x: 0, y: 0, z: dimensions.depth / 2 - size.depth / 2 - 0.8 }
  };
  const picked = map[semanticPosition] || map[defaultFace] || map.front;
  return {
    semanticPosition,
    role: defaultRole,
    face: picked.face,
    orientation: orientationForFace(picked.face),
    positionMm: { x: picked.x, y: picked.y, z: picked.z },
    featurePositionMm: featurePointForFace(picked, dimensions)
  };
}

function offsetOnFace(base, offset) {
  const next = {
    ...base,
    positionMm: { ...base.positionMm },
    featurePositionMm: { ...base.featurePositionMm }
  };
  if (base.face === "left" || base.face === "right") {
    next.positionMm.y += offset;
    next.featurePositionMm.y += offset;
  } else {
    next.positionMm.x += offset;
    next.featurePositionMm.x += offset;
  }
  return next;
}

function featurePointForFace(point, dimensions) {
  return {
    x: point.face === "right" ? dimensions.width / 2 : point.face === "left" ? -dimensions.width / 2 : point.x,
    y: point.face === "top" ? dimensions.height / 2 : point.face === "bottom" ? -dimensions.height / 2 : point.y,
    z: point.face === "front" ? dimensions.depth / 2 : point.face === "back" ? -dimensions.depth / 2 : point.z
  };
}

function orientationForFace(face) {
  const map = {
    front: "front",
    back: "back",
    right: "right",
    left: "left",
    top: "top",
    bottom: "bottom"
  };
  return map[face] || "front";
}

function objectPointToArray(point = {}) {
  return [Number(point.x || 0), Number(point.y || 0), Number(point.z || 0)];
}

function shapeScaleFor(shapeProfile) {
  const map = {
    rounded_rect: { width: 1, height: 1, depthDeltaMm: 0 },
    desktop_wedge: { width: 1.02, height: 1, depthDeltaMm: 4 },
    photo_frame: { width: 1.12, height: 1.08, depthDeltaMm: 2 },
    cat_ear_photo_frame: { width: 1.12, height: 1.18, depthDeltaMm: 2 },
    arched_frame: { width: 1.08, height: 1.16, depthDeltaMm: 2 },
    wide_landscape: { width: 1.22, height: 0.96, depthDeltaMm: 0 },
    tall_portrait: { width: 0.94, height: 1.24, depthDeltaMm: 0 }
  };
  return map[shapeProfile] || map.rounded_rect;
}

function decorativeShapeFeatures(enclosure) {
  const dimensions = enclosure.dimensionsMm || {};
  if (enclosure.shapeProfile !== "cat_ear_photo_frame") return [];
  const y = dimensions.height / 2;
  const z = dimensions.depth / 2;
  return [-1, 1].map((side) => ({
    id: `feature.decorative.cat_ear_${side < 0 ? "left" : "right"}`,
    type: "decorative_cat_ear",
    source: { kind: "geometryPreferences.enclosure.shapeProfile", value: enclosure.shapeProfile },
    face: "front_top",
    positionMm: [side * (dimensions.width / 2 - 18), y + 7, z - 1],
    sizeMm: [20, 16],
    role: "non_functional_shell_silhouette"
  }));
}

function route(id, from, to, points, type) {
  return {
    id,
    connectorId: id.replace(/^route\./, ""),
    from: routeEndpoint(from),
    to: routeEndpoint(to),
    type,
    routeType: "coarse_internal_path",
    pathMm: points,
    pointsMm: points.map(([x, y, z]) => ({ x, y, z })),
    clearanceMm: 4,
    source: {
      kind: "componentDescriptor.connectors",
      from: routeEndpoint(from),
      to: routeEndpoint(to)
    },
    validation: "human_fit_review"
  };
}

function routeEndpoint(value) {
  if (value && typeof value === "object") return value;
  const [componentId, connectorId] = String(value || "").split(".");
  return { componentId, connectorId };
}

function firstDescriptor(descriptors, type) {
  return descriptors.find((descriptor) => descriptor.type === type);
}

function descriptorSource(descriptor, field, id) {
  return {
    kind: `componentDescriptor.${field}`,
    componentId: descriptor.id,
    descriptorPath: descriptor.descriptorPath,
    id
  };
}

function capabilitiesForDescriptor(descriptor) {
  const map = {
    display: ["screen"],
    core_board: ["screen", "wifi", "usb_c_power"],
    interface: ["usb_c_power"],
    sensor: ["ambient_light_sensor"],
    speaker: ["speaker"],
    camera: ["camera"],
    battery: ["battery"],
    button: ["button"]
  };
  return map[descriptor.type] || [];
}
