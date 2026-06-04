export const COMPONENT_DESCRIPTOR_SCHEMA_VERSION = "component_descriptor_v2";

export const ASSET_QUALITY = Object.freeze({
  PROCEDURAL_PROXY: "procedural_proxy",
  MECHANICAL_PROXY: "mechanical_proxy",
  VENDOR_REFERENCE: "vendor_reference",
  VERIFIED_MECHANICAL: "verified_mechanical"
});

export const VALIDATION_STATUS = Object.freeze({
  UNVERIFIED_PROXY: "unverified_proxy",
  DESCRIPTOR_REVIEWED: "descriptor_reviewed",
  VENDOR_SUPPLIED: "vendor_supplied",
  ENGINEER_VERIFIED: "engineer_verified"
});

const REQUIRED_OBJECT_FIELDS = [
  "identity",
  "versioning",
  "assetQuality",
  "validationStatus",
  "dimensionsMm",
  "coordinateSystem",
  "visualProxy",
  "mechanicalProxy",
  "mountingHoles",
  "connectors",
  "interfaces",
  "externalFeatures",
  "keepouts",
  "accessVolumes",
  "cableExitDirections",
  "riskFlags",
  "assetPaths",
  "sourceNotes"
];

const LEGACY_CATEGORY_BY_DESCRIPTOR_CATEGORY = Object.freeze({
  display: "Display",
  core_board: "Core",
  interface: "Power",
  sensor: "Sensor",
  speaker: "Audio",
  camera: "Vision",
  battery: "Power",
  button: "Input"
});

const CAPABILITIES_BY_CATEGORY = Object.freeze({
  display: ["screen"],
  core_board: ["screen", "wifi", "usb_c_power"],
  interface: ["usb_c_power"],
  sensor: ["ambient_light_sensor"],
  speaker: ["speaker"],
  camera: ["camera"],
  battery: ["battery"],
  button: ["button"]
});

export function validateComponentDescriptorV2(descriptor = {}, { expectedId = "" } = {}) {
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_OBJECT_FIELDS) {
    if (!(field in descriptor)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  const id = descriptor.identity?.id || descriptor.id;
  if (!id) errors.push("identity.id is required");
  if (expectedId && id !== expectedId) errors.push(`Descriptor id ${id} does not match folder ${expectedId}`);
  if (descriptor.schemaVersion !== COMPONENT_DESCRIPTOR_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${COMPONENT_DESCRIPTOR_SCHEMA_VERSION}`);
  }
  if (!descriptor.identity?.displayName) errors.push("identity.displayName is required");
  if (!descriptor.identity?.category) errors.push("identity.category is required");
  if (!descriptor.versioning?.descriptorVersion) errors.push("versioning.descriptorVersion is required");

  if (!Object.values(ASSET_QUALITY).includes(descriptor.assetQuality)) {
    errors.push(`assetQuality must be one of ${Object.values(ASSET_QUALITY).join(", ")}`);
  }
  if (!Object.values(VALIDATION_STATUS).includes(descriptor.validationStatus)) {
    errors.push(`validationStatus must be one of ${Object.values(VALIDATION_STATUS).join(", ")}`);
  }

  const dimensions = descriptor.dimensionsMm || {};
  for (const key of ["width", "height", "depth"]) {
    if (!(Number(dimensions[key]) > 0)) errors.push(`dimensionsMm.${key} must be a positive number`);
  }

  if (!descriptor.coordinateSystem?.origin || !descriptor.coordinateSystem?.front) {
    errors.push("coordinateSystem.origin and coordinateSystem.front are required");
  }

  for (const field of [
    "mountingHoles",
    "connectors",
    "interfaces",
    "externalFeatures",
    "keepouts",
    "accessVolumes",
    "cableExitDirections"
  ]) {
    if (!Array.isArray(descriptor[field])) errors.push(`${field} must be an array`);
  }

  for (const connector of descriptor.connectors || []) {
    if (!connector.id) errors.push(`${id || "descriptor"} has a connector without id`);
    if (!Array.isArray(connector.positionLocalMm) || connector.positionLocalMm.length !== 3) {
      errors.push(`${id || "descriptor"}.${connector.id || "connector"} requires positionLocalMm [x,y,z]`);
    }
  }

  if (descriptor.validationStatus === VALIDATION_STATUS.UNVERIFIED_PROXY) {
    warnings.push(`${id} uses unverified proxy dimensions and must not be treated as production ready.`);
  }
  if (descriptor.assetQuality === ASSET_QUALITY.MECHANICAL_PROXY || descriptor.assetQuality === ASSET_QUALITY.PROCEDURAL_PROXY) {
    warnings.push(`${id} resolves to a proxy asset unless a verified vendor asset is added.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function normalizeComponentDescriptor(descriptor = {}) {
  const clone = JSON.parse(JSON.stringify(descriptor));
  const identity = clone.identity || {};
  const category = identity.category || clone.category || clone.type || "unknown";
  const displayName = identity.displayName || clone.displayName || identity.id || clone.id || "Unnamed component";
  const dimensionsMm = clone.dimensionsMm || {};
  const mountingHoles = clone.mountingHoles || [];
  const connectors = clone.connectors || [];
  const riskFlags = clone.riskFlags || {};
  const assetPaths = clone.assetPaths || {};

  return {
    ...clone,
    id: identity.id || clone.id,
    type: category,
    descriptorCategory: category,
    category: identity.legacyCategory || LEGACY_CATEGORY_BY_DESCRIPTOR_CATEGORY[category] || category,
    displayName,
    dimensionsMm,
    visual: clone.visualProxy || clone.visual || {},
    mechanicalProxy: clone.mechanicalProxy || {},
    placementRules: clone.placementRules || {},
    mounting: {
      method: clone.mechanicalProxy?.mountingMethod || clone.mounting?.method || "descriptor_proxy",
      mountingHoles,
      holeDiameterMm: clone.mechanicalProxy?.defaultHoleDiameterMm,
      standoffOuterDiameterMm: clone.mechanicalProxy?.defaultStandoffOuterDiameterMm,
      retentionLipMm: clone.mechanicalProxy?.retentionLipMm
    },
    connectors,
    interfaces: clone.interfaces || connectors,
    externalFeatures: clone.externalFeatures || [],
    keepouts: clone.keepouts || [],
    accessVolumes: clone.accessVolumes || [],
    cableExitDirections: clone.cableExitDirections || [],
    assets: {
      vendorGlb: assetPaths.vendorGlb || null,
      vendorStep: assetPaths.vendorStep || null,
      proxyVisualGlb: assetPaths.proxyVisualGlb || null,
      proxyMechanicalStep: assetPaths.proxyMechanicalStep || null,
      glb: assetPaths.vendorGlb || assetPaths.proxyVisualGlb || null,
      step: assetPaths.vendorStep || assetPaths.proxyMechanicalStep || null
    },
    assetQuality: clone.assetQuality,
    validationStatus: clone.validationStatus,
    sourceNotes: clone.sourceNotes || {},
    risk: {
      requiresManualValidation: Boolean(riskFlags.requiresManualValidation),
      severity: riskFlags.severity || "none",
      reason: riskFlags.reason || "",
      warnings: riskFlags.warnings || []
    },
    capabilities: CAPABILITIES_BY_CATEGORY[category] || []
  };
}
