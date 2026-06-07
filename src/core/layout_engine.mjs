export function generateLayout(productPlan = {}, componentDescriptors = []) {
  const enclosure = enclosureForProductPlan(productPlan, componentDescriptors);
  const placements = [];
  const features = [];
  const routes = [];
  const warnings = [];

  const display = firstDescriptor(componentDescriptors, "display");
  const core = firstDescriptor(componentDescriptors, "core_board");
  const usb = firstDescriptor(componentDescriptors, "interface");
  const sensor = firstDescriptor(componentDescriptors, "sensor");
  const speaker = firstDescriptor(componentDescriptors, "speaker");
  const button = firstDescriptor(componentDescriptors, "button");
  const camera = firstDescriptor(componentDescriptors, "camera");
  const battery = firstDescriptor(componentDescriptors, "battery");
  const placementPreferences = productPlan.geometryPreferences?.placements || {};

  if (display) {
    const displayPlacement = {
      role: "front_display",
      face: "front",
      positionMm: { x: 0, y: 0, z: enclosure.dimensionsMm.depth / 2 - display.dimensionsMm.depth / 2 - 1 },
      orientation: "front"
    };
    placements.push(placement(display, {
      role: displayPlacement.role,
      face: displayPlacement.face,
      positionMm: displayPlacement.positionMm,
      orientation: displayPlacement.orientation
    }));
    const screenOpening = screenOpeningFeature(display, enclosure);
    features.push(screenOpening);
    if (display.mechanicalProxy?.mountingMethod === "captured_panel") {
      features.push(capturedPanelRetentionFeature(display, displayPlacement, screenOpening));
    }
  }

  if (core) {
    const coreZ = -enclosure.dimensionsMm.depth / 2 + enclosure.wallThicknessMm + 7 + core.dimensionsMm.depth / 2;
    const corePosition = { x: 0, y: -2, z: coreZ };
    placements.push(placement(core, {
      role: "core_board",
      face: "internal_back",
      positionMm: corePosition,
      orientation: "internal"
    }));
    features.push(...coreStandoffFeatures(core, { x: 0, y: -2, z: -enclosure.dimensionsMm.depth / 2 + enclosure.wallThicknessMm }, enclosure, corePosition));
  }

  if (usb) {
    const usbCutoutFeature = descriptorExternalFeature(usb, "usb_c_cutout", "usb_cutout");
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
      source: descriptorSource(usb, "externalFeatures", usbCutoutFeature?.id || "usb_c_cutout"),
      targetModuleId: usb.id,
      targetComponentId: usb.id,
      targetFeatureId: usbCutoutFeature?.id || "usb_c_cutout",
      targetConnectorId: "usb_c",
      face: usbPosition.face,
      positionMm: objectPointToArray(usbPosition.featurePositionMm),
      sizeMm: descriptorOpeningSize(usbCutoutFeature, [11, 5]),
      role: `${usbPosition.face}_usb_c_cutout`
    });
    if (usb.mechanicalProxy?.mountingMethod === "edge_capture") {
      features.push(edgeCaptureRetentionFeature(usb, usbPosition));
    }
  }

  if (sensor) {
    const sensorWindowFeature = descriptorExternalFeature(sensor, "ambient_sensor_window", "sensor_window");
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
    const sensorOpening = {
      id: "feature.opening.ambient_sensor",
      type: "sensor_window",
      source: descriptorSource(sensor, "externalFeatures", sensorWindowFeature?.id || "ambient_sensor_window"),
      targetModuleId: sensor.id,
      targetComponentId: sensor.id,
      targetFeatureId: sensorWindowFeature?.id || "ambient_sensor_window",
      face: sensorPosition.face,
      positionMm: objectPointToArray(sensorPosition.featurePositionMm),
      sizeMm: descriptorOpeningSize(sensorWindowFeature, [6, 4]),
      visibilityConeDeg: sensorWindowFeature?.visibilityConeDeg,
      role: `${sensorPosition.face}_ambient_sensor_window`
    };
    features.push(sensorOpening);
    if (sensor.mechanicalProxy?.mountingMethod === "front_window") {
      features.push(opticalWindowRetentionFeature(sensor, sensorPosition, sensorOpening));
    }
  }

  if (speaker) {
    const speakerVentFeature = descriptorExternalFeature(speaker, "speaker_vents", "speaker_vents");
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
    const speakerVent = {
      id: "feature.opening.speaker_vents",
      type: "speaker_vents",
      source: descriptorSource(speaker, "externalFeatures", speakerVentFeature?.id || "speaker_vents"),
      targetModuleId: speaker.id,
      targetComponentId: speaker.id,
      targetFeatureId: speakerVentFeature?.id || "speaker_vents",
      face: speakerPosition.face,
      positionMm: objectPointToArray(speakerPosition.featurePositionMm),
      sizeMm: descriptorOpeningSize(speakerVentFeature, [24, 12]),
      ventCount: Number(speakerVentFeature?.ventCount || 5),
      role: `speaker_${speakerPosition.face}_vents`
    };
    features.push(speakerVent);
    if (speaker.mechanicalProxy?.mountingMethod === "grille_mount") {
      features.push(grilleMountRetentionFeature(speaker, speakerPosition, speakerVent));
    }
  }

  if (button) {
    const buttonHoleFeature = descriptorExternalFeature(button, "button_hole", "button_hole");
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
      const buttonOpening = {
        id: `feature.opening.button_${index + 1}`,
        type: "button_hole",
        source: descriptorSource(button, "externalFeatures", buttonHoleFeature?.id || "button_hole"),
        targetModuleId: button.id,
        targetComponentId: button.id,
        targetFeatureId: buttonHoleFeature?.id || "button_hole",
        face: shifted.face,
        positionMm: objectPointToArray(shifted.featurePositionMm),
        sizeMm: descriptorOpeningSize(buttonHoleFeature, [6, 6]),
        instanceLabel: `button_${index + 1}`,
        role: `${shifted.face}_button_hole`
      };
      features.push(buttonOpening);
      if (button.mechanicalProxy?.mountingMethod === "panel_button") {
        features.push(panelButtonRetentionFeature(button, shifted, index, buttonOpening));
      }
    }
  }

  if (camera) {
    const cameraWindowFeature = descriptorExternalFeature(camera, "camera_window", "camera_window");
    const cameraY = enclosure.dimensionsMm.height / 2 - 16;
    placements.push(placement(camera, {
      role: "front_camera_review",
      face: "front",
      positionMm: { x: 0, y: cameraY, z: enclosure.dimensionsMm.depth / 2 - camera.dimensionsMm.depth / 2 - 0.6 },
      orientation: "front"
    }));
    const cameraOpening = {
      id: "feature.opening.camera",
      type: "camera_window",
      source: descriptorSource(camera, "externalFeatures", cameraWindowFeature?.id || "camera_window"),
      targetModuleId: camera.id,
      targetComponentId: camera.id,
      targetFeatureId: cameraWindowFeature?.id || "camera_window",
      face: "front",
      positionMm: [0, cameraY, enclosure.dimensionsMm.depth / 2],
      sizeMm: descriptorOpeningSize(cameraWindowFeature, [8, 8]),
      privacyReviewRequired: Boolean(cameraWindowFeature?.privacyReviewRequired),
      role: "front_camera_window"
    };
    features.push(cameraOpening);
    if (camera.mechanicalProxy?.mountingMethod === "front_window_review") {
      features.push(opticalWindowRetentionFeature(camera, {
        face: "front",
        positionMm: { x: 0, y: cameraY, z: enclosure.dimensionsMm.depth / 2 - camera.dimensionsMm.depth / 2 - 0.6 }
      }, cameraOpening));
    }
    warnings.push({
      type: "manual_validation_required",
      moduleId: camera.id,
      severity: "warning",
      message: camera.risk?.reason || "Camera placement requires human review."
    });
  }

  if (battery) {
    const batteryBayClearanceMm = 2;
    const batteryBayLipMm = Number(battery.mechanicalProxy?.retentionLipMm || 1.8);
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
      sizeMm: [
        battery.dimensionsMm.width + batteryBayClearanceMm * 2,
        battery.dimensionsMm.height + batteryBayClearanceMm * 2
      ],
      depthMm: Math.max(4, Number(battery.dimensionsMm.depth || 8) + batteryBayLipMm),
      bayClearanceMm: batteryBayClearanceMm,
      retentionLipMm: batteryBayLipMm,
      mountingMethod: battery.mechanicalProxy?.mountingMethod || "review_only_retained_bay",
      reviewOnly: true,
      humanReviewRequired: true,
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
    const displayRoute = routeToCore(display, core, "", "route.display_to_core_board", "fpc", placements, enclosure);
    if (displayRoute) routes.push(displayRoute);
  }
  if (sensor && core) {
    const sensorRoute = routeToCore(sensor, core, "", "route.sensor_to_core_board", "i2c", placements, enclosure);
    if (sensorRoute) routes.push(sensorRoute);
  }
  if (button && core && Number(productPlan.requirements?.buttons || 0) > 0) {
    const buttonRoute = routeToCore(button, core, "", "route.button_to_core_board", "gpio", placements, enclosure);
    if (buttonRoute) routes.push(buttonRoute);
  }
  if (speaker && core) {
    const speakerRoute = routeToCore(speaker, core, "", "route.speaker_to_core_board", "audio", placements, enclosure);
    if (speakerRoute) routes.push(speakerRoute);
  }
  if (camera && core) {
    const cameraRoute = routeToCore(camera, core, "", "route.camera_to_core_board", "camera_fpc", placements, enclosure);
    if (cameraRoute) routes.push(cameraRoute);
  }
  if (battery && core) {
    const batteryRoute = routeToCore(battery, core, "", "route.battery_to_core_board", "battery_power", placements, enclosure);
    if (batteryRoute) routes.push(batteryRoute);
  }
  if (usb && core) {
    const usbRoute = routeToCore(usb, core, "", "route.usb_c_to_core_board", "power", placements, enclosure);
    if (usbRoute) routes.push(usbRoute);
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
    sizeMm: descriptorOpeningSize(openingFeature, [display.dimensionsMm.width + margin * 2, display.dimensionsMm.height + margin * 2]),
    bezelMm: bezel,
    role: "front_screen_opening"
  };
}

function capturedPanelRetentionFeature(display, displayPlacement, openingFeature) {
  const bezelMm = Number(display.mechanicalProxy?.bezelMm || openingFeature.bezelMm || 4);
  const retainerWidthMm = Math.max(1.8, bezelMm * 0.55);
  return {
    id: `feature.retention.${display.id}.captured_panel`,
    type: "captured_panel_retention",
    source: descriptorSource(display, "mechanicalProxy", "mountingMethod"),
    targetModuleId: display.id,
    targetComponentId: display.id,
    targetFeatureId: openingFeature.targetFeatureId || "screen_opening",
    face: displayPlacement.face,
    positionMm: objectPointToArray(displayPlacement.positionMm),
    sizeMm: [display.dimensionsMm.width, display.dimensionsMm.height],
    depthMm: display.dimensionsMm.depth,
    bezelMm,
    retainerWidthMm,
    mountingMethod: display.mechanicalProxy?.mountingMethod || "captured_panel",
    role: "front_display_captured_panel_retention"
  };
}

function coreStandoffFeatures(core, origin, enclosure, corePosition) {
  const holes = core.mounting?.mountingHoles || [];
  const pcbThicknessMm = Number(core.mechanicalProxy?.pcbThicknessMm || 1.6);
  const boardUndersideZ = Number(corePosition?.z || 0) - pcbThicknessMm / 2;
  return holes.map((hole, index) => {
    const position = Array.isArray(hole) ? hole : hole.positionLocalMm || [0, 0, 0];
    const [x, y] = position;
    const baseZ = origin.z;
    return {
      id: `feature.standoff.core_board.${index + 1}`,
      type: "standoff",
      source: descriptorSource(core, "mountingHoles", hole.id || `mount_${index + 1}`),
      targetModuleId: core.id,
      targetComponentId: core.id,
      targetFeatureId: hole.id || `mount_${index + 1}`,
      targetMountId: hole.id || `mount_${index + 1}`,
      face: "internal_back",
      positionMm: [origin.x + x, origin.y + y, baseZ],
      outerDiameterMm: core.mounting?.standoffOuterDiameterMm || 5,
      holeDiameterMm: core.mounting?.holeDiameterMm || hole.diameterMm || 2.4,
      heightMm: Math.max(6, boardUndersideZ - baseZ),
      role: "core_board_standoff"
    };
  });
}

function edgeCaptureRetentionFeature(descriptor, position) {
  const retentionLipMm = Number(descriptor.mechanicalProxy?.retentionLipMm || 1.2);
  return {
    id: `feature.retention.${descriptor.id}.edge_capture`,
    type: "edge_capture_retention",
    source: descriptorSource(descriptor, "mechanicalProxy", "retentionLipMm"),
    targetModuleId: descriptor.id,
    targetComponentId: descriptor.id,
    targetFeatureId: "edge_capture",
    face: position.face,
    positionMm: objectPointToArray(position.positionMm),
    sizeMm: [descriptor.dimensionsMm.width, descriptor.dimensionsMm.height],
    depthMm: descriptor.dimensionsMm.depth,
    retentionLipMm,
    mountingMethod: descriptor.mechanicalProxy?.mountingMethod || "edge_capture",
    role: `${position.face}_${descriptor.id}_edge_capture_retention`
  };
}

function grilleMountRetentionFeature(descriptor, position, openingFeature) {
  const openingWidth = Number(openingFeature.sizeMm?.[0] || descriptor.dimensionsMm.width || 24);
  const openingHeight = Number(openingFeature.sizeMm?.[1] || descriptor.dimensionsMm.height || 12);
  const rimWidthMm = Math.max(1.2, Math.min(3, Math.abs(Number(descriptor.dimensionsMm.width || openingWidth) - openingWidth) / 2 || 1.8));
  return {
    id: `feature.retention.${descriptor.id}.grille_mount`,
    type: "grille_mount_retention",
    source: descriptorSource(descriptor, "mechanicalProxy", "mountingMethod"),
    targetModuleId: descriptor.id,
    targetComponentId: descriptor.id,
    targetFeatureId: openingFeature.targetFeatureId || "speaker_vents",
    face: position.face,
    positionMm: openingFeature.positionMm,
    sizeMm: [openingWidth, openingHeight],
    depthMm: Math.max(1.8, Number(descriptor.dimensionsMm.depth || 6) * 0.7),
    rimWidthMm,
    ventCount: openingFeature.ventCount,
    mountingMethod: descriptor.mechanicalProxy?.mountingMethod || "grille_mount",
    role: `${position.face}_${descriptor.id}_grille_mount_retention`
  };
}

function panelButtonRetentionFeature(descriptor, position, index, openingFeature) {
  const openingWidth = Number(openingFeature.sizeMm?.[0] || 6);
  const openingHeight = Number(openingFeature.sizeMm?.[1] || 6);
  const collarWidthMm = Math.max(1.2, Math.min(2.4, (Number(descriptor.dimensionsMm.width || 8) - openingWidth) / 2 || 1.2));
  const travelKeepout = (descriptor.keepouts || []).find((keepout) => keepout.type === "mechanical_travel");
  const buttonTravelMm = Number(travelKeepout?.sizeMm?.[2] || descriptor.dimensionsMm.depth || 5);
  return {
    id: `feature.retention.button_${index + 1}.panel_button`,
    type: "panel_button_retention",
    source: descriptorSource(descriptor, "mechanicalProxy", "mountingMethod"),
    targetModuleId: descriptor.id,
    targetComponentId: descriptor.id,
    targetFeatureId: openingFeature.targetFeatureId || "button_hole",
    targetInstanceLabel: `button_${index + 1}`,
    face: position.face,
    positionMm: openingFeature.positionMm,
    sizeMm: [openingWidth, openingHeight],
    depthMm: Math.max(1.8, buttonTravelMm),
    collarWidthMm,
    buttonTravelMm,
    mountingMethod: descriptor.mechanicalProxy?.mountingMethod || "panel_button",
    role: `${position.face}_button_${index + 1}_panel_retention`
  };
}

function opticalWindowRetentionFeature(descriptor, position, openingFeature) {
  const width = Number(openingFeature.sizeMm?.[0] || descriptor.dimensionsMm.width || 8);
  const height = Number(openingFeature.sizeMm?.[1] || descriptor.dimensionsMm.height || 8);
  const rimWidthMm = Math.max(1.2, Math.min(2.4, Math.max(width, height) * 0.18));
  const mountingMethod = descriptor.mechanicalProxy?.mountingMethod || "front_window";
  return {
    id: `feature.retention.${descriptor.id}.${mountingMethod}`,
    type: "optical_window_retention",
    source: descriptorSource(descriptor, "mechanicalProxy", "mountingMethod"),
    targetModuleId: descriptor.id,
    targetComponentId: descriptor.id,
    targetFeatureId: openingFeature.targetFeatureId,
    face: position.face,
    positionMm: openingFeature.positionMm,
    sizeMm: [width, height],
    depthMm: Math.max(1.8, Number(descriptor.dimensionsMm.depth || 4)),
    rimWidthMm,
    mountingMethod,
    visibilityConeDeg: openingFeature.visibilityConeDeg,
    privacyReviewRequired: Boolean(openingFeature.privacyReviewRequired),
    reviewOnly: mountingMethod.includes("review"),
    humanReviewRequired: mountingMethod.includes("review"),
    role: `${position.face}_${descriptor.id}_optical_window_retention`
  };
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
    sourcesPath: descriptor.sourcesPath,
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

function routeToCore(descriptor, core, coreConnectorId, routeId, routeType, placements, enclosure) {
  const matingPair = connectorMatingTo(descriptor, core.id, coreConnectorId);
  if (!matingPair) return null;
  const componentPlacement = placements.find((item) => item.componentId === descriptor.id);
  const corePlacement = placements.find((item) => item.componentId === core.id);
  if (!componentPlacement || !corePlacement) return null;
  const start = connectorWorldPoint(componentPlacement, descriptor, matingPair.connector.id);
  const end = connectorWorldPoint(corePlacement, core, matingPair.target.connectorId);
  return route(routeId, `${descriptor.id}.${matingPair.connector.id}`, `${core.id}.${matingPair.target.connectorId}`, [
    start,
    routeMidpoint(start, end, enclosure),
    end
  ], routeType);
}

function connectorMatingTo(descriptor = {}, targetComponentId, targetConnectorId = "") {
  for (const connector of descriptor.connectors || []) {
    for (const mate of connector.mating || []) {
      const endpoint = routeEndpoint(mate);
      if (endpoint.componentId === targetComponentId && (!targetConnectorId || endpoint.connectorId === targetConnectorId)) {
        return { connector, target: endpoint };
      }
    }
  }
  return null;
}

function connectorWorldPoint(placement = {}, descriptor = {}, connectorId = "") {
  const connector = (descriptor.connectors || []).find((item) => item.id === connectorId);
  const position = placement.positionMm || placement.placement?.positionMm || {};
  const local = connector?.positionLocalMm || [0, 0, 0];
  return [
    Number(position.x || 0) + Number(local[0] || 0),
    Number(position.y || 0) + Number(local[1] || 0),
    Number(position.z || 0) + Number(local[2] || 0)
  ];
}

function routeMidpoint(start = [], end = [], enclosure = {}) {
  return [
    (Number(start[0] || 0) + Number(end[0] || 0)) / 2,
    (Number(start[1] || 0) + Number(end[1] || 0)) / 2,
    Math.max(-4, -Number(enclosure.dimensionsMm?.depth || 32) / 8)
  ];
}

function routeEndpoint(value) {
  if (value && typeof value === "object") return value;
  const [componentId, connectorId] = String(value || "").split(".");
  return { componentId, connectorId };
}

function firstDescriptor(descriptors, type) {
  return descriptors.find((descriptor) => descriptor.type === type);
}

function descriptorExternalFeature(descriptor, id, type = id) {
  return (descriptor.externalFeatures || []).find((feature) => feature.id === id || feature.type === type);
}

function descriptorOpeningSize(feature, fallback) {
  const size = Array.isArray(feature?.openingSizeMm) ? feature.openingSizeMm : fallback;
  return [
    Number(size?.[0] || fallback[0]),
    Number(size?.[1] || fallback[1])
  ];
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
