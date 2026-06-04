export function buildDisplayProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  builder.addBoxNode({
    name: context.name,
    sizeMm: { ...dimensions, depth: Math.max(2, dimensions.depth) },
    centerMm: position,
    material: 2,
    extras: context.extras
  });
  builder.addBoxNode({
    name: `${context.name}.glass`,
    sizeMm: {
      width: Math.max(1, dimensions.width - 5),
      height: Math.max(1, dimensions.height - 5),
      depth: 0.8
    },
    centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 0.45 },
    material: 9,
    extras: { ...context.extras, role: "screen_glass" }
  });
  buildConnectorMarkers(builder, module);
}

export function buildPcbProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  const pcbDepth = Number(module.mechanicalProxy?.pcbThicknessMm || 1.6);
  const rearFaceZ = Number(position.z || 0) - pcbDepth / 2;
  builder.addBoxNode({
    name: context.name,
    sizeMm: { ...dimensions, depth: pcbDepth },
    centerMm: position,
    material: 1,
    extras: context.extras
  });
  [
    { id: "soc", x: -12, y: 0, width: 10, height: 8 },
    { id: "regulator", x: 8, y: 6, width: 8, height: 6 },
    { id: "antenna_zone", x: 12, y: -7, width: 12, height: 4 }
  ].forEach((chip) => {
    builder.addBoxNode({
      name: `${context.name}.chip.${chip.id}`,
      sizeMm: { width: chip.width, height: chip.height, depth: 1.8 },
      centerMm: {
        x: Number(position.x || 0) + chip.x,
        y: Number(position.y || 0) + chip.y,
        z: rearFaceZ - 0.9
      },
      material: 10,
      extras: { ...context.extras, role: "pcb_component", proxyFeature: chip.id }
    });
  });
  buildMountingHoleMarkers(builder, module);
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
  buildAccessVolumeMarkers(builder, module);
}

export function buildUsbCProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  builder.addBoxNode({
    name: context.name,
    sizeMm: dimensions,
    centerMm: position,
    material: 3,
    extras: context.extras
  });
  const usbConnector = firstConnector(module, "usb_c");
  const connectorCenter = localToWorld(position, usbConnector?.positionLocalMm || [0, -dimensions.height / 2, -dimensions.depth / 2]);
  builder.addBoxNode({
    name: `${context.name}.receptacle`,
    sizeMm: { width: 10, height: 3, depth: 2.4 },
    centerMm: connectorCenter,
    material: 7,
    extras: { ...context.extras, role: "usb_c_receptacle", connectorId: usbConnector?.id || "usb_c" }
  });
  buildConnectorMarkers(builder, module);
  buildAccessVolumeMarkers(builder, module);
}

export function buildSensorProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  builder.addBoxNode({
    name: context.name,
    sizeMm: dimensions,
    centerMm: position,
    material: 5,
    extras: context.extras
  });
  builder.addCylinderNode({
    name: `${context.name}.lens`,
    radiusMm: 2.2,
    heightMm: 1,
    centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 0.5 },
    material: 9,
    extras: { ...context.extras, role: "sensor_lens" }
  });
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
}

export function buildSpeakerProxy(builder, module) {
  const context = moduleContext(module);
  const dimensions = context.dimensions;
  builder.addCylinderNode({
    name: context.name,
    radiusMm: Math.min(dimensions.width, dimensions.height) / 2,
    heightMm: dimensions.depth,
    centerMm: context.position,
    material: 6,
    extras: context.extras,
    segments: 24
  });
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
}

export function buildCameraProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  builder.addBoxNode({
    name: context.name,
    sizeMm: dimensions,
    centerMm: position,
    material: 4,
    extras: context.extras
  });
  builder.addCylinderNode({
    name: `${context.name}.lens`,
    radiusMm: 4,
    heightMm: 2,
    centerMm: { ...position, z: Number(position.z || 0) + dimensions.depth / 2 + 1 },
    material: 10,
    extras: { ...context.extras, role: "camera_lens" }
  });
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
  buildAccessVolumeMarkers(builder, module);
}

export function buildBatteryProxy(builder, module) {
  const context = moduleContext(module);
  builder.addBoxNode({
    name: context.name,
    sizeMm: context.dimensions,
    centerMm: context.position,
    material: 13,
    extras: context.extras
  });
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
  buildAccessVolumeMarkers(builder, module);
}

export function buildButtonProxy(builder, module) {
  const context = moduleContext(module);
  const position = context.position;
  const dimensions = context.dimensions;
  builder.addCylinderNode({
    name: context.name,
    radiusMm: Math.min(dimensions.width, dimensions.height) / 2,
    heightMm: dimensions.depth,
    centerMm: position,
    material: 10,
    extras: context.extras,
    segments: 18
  });
  buildConnectorMarkers(builder, module);
  buildKeepoutMarkers(builder, module);
}

export function buildMountingHoleMarkers(builder, module) {
  const context = moduleContext(module);
  const holes = module.mountingHoles || module.mounting?.mountingHoles || [];
  for (const hole of holes) {
    const holeId = hole.id || `mount_${holes.indexOf(hole) + 1}`;
    const local = Array.isArray(hole) ? [hole[0], hole[1], 0] : hole.positionLocalMm;
    const center = localToWorld(context.position, local || [0, 0, 0]);
    builder.addCylinderNode({
      name: `${context.name}.mount.${safeNodeName(holeId)}`,
      radiusMm: Number(hole.diameterMm || module.mounting?.holeDiameterMm || 2.4) / 2,
      heightMm: 0.8,
      centerMm: center,
      material: 14,
      extras: {
        ...context.extras,
        role: "mounting_hole_marker",
        mountId: holeId,
        directEditingAllowed: false
      }
    });
  }
}

export function buildConnectorMarkers(builder, module) {
  const context = moduleContext(module);
  for (const connector of module.connectors || module.interfaces || []) {
    if (!connector.id) continue;
    const center = localToWorld(context.position, connector.positionLocalMm || [0, 0, 0]);
    builder.addBoxNode({
      name: `interface.${safeNodeName(module.componentId || module.moduleId)}.${safeNodeName(connector.id)}`,
      sizeMm: connector.type === "usb_c"
        ? { width: 9, height: 3, depth: 2.6 }
        : { width: 4, height: 4, depth: 4 },
      centerMm: center,
      material: 7,
      extras: {
        ...context.extras,
        role: "connector_marker",
        connectorId: connector.id,
        connectorType: connector.type,
        orientation: connector.orientation,
        directEditingAllowed: false
      }
    });
  }
}

export function buildKeepoutMarkers(builder, module) {
  const context = moduleContext(module);
  for (const keepout of module.keepouts || []) {
    const center = localToWorld(context.position, keepout.positionLocalMm || [0, 0, 0]);
    const size = sizeFromArrayOrObject(keepout.sizeMm, { width: 8, height: 8, depth: 8 });
    builder.addBoxNode({
      name: `${context.name}.keepout.${safeNodeName(keepout.id || "volume")}`,
      sizeMm: size,
      centerMm: center,
      material: 12,
      extras: {
        ...context.extras,
        role: "keepout_marker",
        keepoutId: keepout.id,
        keepoutType: keepout.type,
        directEditingAllowed: false
      }
    });
  }
}

export function buildAccessVolumeMarkers(builder, module) {
  const context = moduleContext(module);
  for (const access of module.accessVolumes || []) {
    const center = localToWorld(context.position, access.positionLocalMm || [0, 0, 0]);
    const size = sizeFromArrayOrObject(access.sizeMm, { width: 8, height: 8, depth: 8 });
    builder.addBoxNode({
      name: `${context.name}.access.${safeNodeName(access.id || "volume")}`,
      sizeMm: size,
      centerMm: center,
      material: 12,
      extras: {
        ...context.extras,
        role: "access_volume_marker",
        accessVolumeId: access.id,
        connectorId: access.connectorId,
        directEditingAllowed: false
      }
    });
  }
}

export function addProceduralProxyGeometry(builder, module) {
  const category = module.descriptorCategory || module.type;
  if (category === "display" || module.category === "Display") return buildDisplayProxy(builder, module);
  if (category === "core_board" || module.category === "Core") return buildPcbProxy(builder, module);
  if (category === "interface" || module.componentId === "usb_c_breakout") return buildUsbCProxy(builder, module);
  if (category === "sensor") return buildSensorProxy(builder, module);
  if (category === "speaker") return buildSpeakerProxy(builder, module);
  if (category === "camera") return buildCameraProxy(builder, module);
  if (category === "battery") return buildBatteryProxy(builder, module);
  if (category === "button") return buildButtonProxy(builder, module);
  const context = moduleContext(module);
  return builder.addBoxNode({
    name: context.name,
    sizeMm: context.dimensions,
    centerMm: context.position,
    material: context.extras.status === "review" ? 4 : 3,
    extras: context.extras
  });
}

function moduleContext(module) {
  const componentId = module.componentId || module.moduleId || module.id;
  return {
    position: pointObject(module.placement?.positionMm || module.positionMm),
    dimensions: module.dimensionsMm || { width: 10, height: 10, depth: 4 },
    name: `module.${safeNodeName(componentId)}`,
    extras: {
      componentId,
      moduleId: componentId,
      descriptorVersion: module.componentDescriptorVersion,
      descriptorPath: module.descriptorPath,
      assetQuality: module.assetQuality,
      validationStatus: module.validationStatus,
      role: module.role,
      status: module.status,
      riskTags: module.riskTags || [],
      directEditingAllowed: false
    }
  };
}

function firstConnector(module, type) {
  return (module.connectors || []).find((connector) => connector.type === type || connector.id === type);
}

function localToWorld(origin, local = [0, 0, 0]) {
  return {
    x: Number(origin.x || 0) + Number(local[0] || 0),
    y: Number(origin.y || 0) + Number(local[1] || 0),
    z: Number(origin.z || 0) + Number(local[2] || 0)
  };
}

function sizeFromArrayOrObject(value, fallback) {
  if (Array.isArray(value)) {
    return { width: Number(value[0] || fallback.width), height: Number(value[1] || fallback.height), depth: Number(value[2] || fallback.depth) };
  }
  return value || fallback;
}

function pointObject(value = {}) {
  if (Array.isArray(value)) return { x: value[0], y: value[1], z: value[2] };
  return value;
}

function safeNodeName(value) {
  return String(value || "component").replace(/[^a-zA-Z0-9_.-]/g, "_");
}
