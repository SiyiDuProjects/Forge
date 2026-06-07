import {
  createMechanicalConstraintSummary,
  mechanicalTrustLevel
} from "./mechanical_constraints.mjs";

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

export const COMPONENT_TRUST_LEVEL = Object.freeze({
  PROXY_SEED: "proxy_seed",
  DESCRIPTOR_REVIEWED_PROXY: "descriptor_reviewed_proxy",
  VENDOR_REFERENCE: "vendor_reference",
  ENGINEER_VERIFIED: "engineer_verified"
});

export const COMPONENT_REVIEW_STATUS = Object.freeze({
  DRAFT: "draft",
  NEEDS_REVIEW: "needs_review",
  REVIEWABLE: "reviewable",
  APPROVED: "approved",
  BLOCKED: "blocked",
  RETIRED: "retired"
});

const REQUIRED_OBJECT_FIELDS = [
  "identity",
  "versioning",
  "assetQuality",
  "validationStatus",
  "sourceEvidence",
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

export function validateComponentDescriptorV2(
  descriptor = {},
  { expectedId = "", knownConnectorIdsByComponentId = null, sourcesFileExists = null } = {}
) {
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
  if (descriptor.identity?.category && !Object.hasOwn(LEGACY_CATEGORY_BY_DESCRIPTOR_CATEGORY, descriptor.identity.category)) {
    errors.push(`identity.category ${descriptor.identity.category} is not supported by the current descriptor-driven generator`);
  }
  if (!descriptor.versioning?.descriptorVersion) errors.push("versioning.descriptorVersion is required");

  if (!Object.values(ASSET_QUALITY).includes(descriptor.assetQuality)) {
    errors.push(`assetQuality must be one of ${Object.values(ASSET_QUALITY).join(", ")}`);
  }
  if (!Object.values(VALIDATION_STATUS).includes(descriptor.validationStatus)) {
    errors.push(`validationStatus must be one of ${Object.values(VALIDATION_STATUS).join(", ")}`);
  }
  if (!Object.values(COMPONENT_TRUST_LEVEL).includes(descriptor.trustLevel)) {
    errors.push(`trustLevel must be one of ${Object.values(COMPONENT_TRUST_LEVEL).join(", ")}`);
  }
  if (!Object.values(COMPONENT_REVIEW_STATUS).includes(descriptor.reviewStatus)) {
    errors.push(`reviewStatus must be one of ${Object.values(COMPONENT_REVIEW_STATUS).join(", ")}`);
  }

  const expectedTrustLevel = mechanicalTrustLevel({
    assetQuality: descriptor.assetQuality,
    validationStatus: descriptor.validationStatus
  });
  if (descriptor.trustLevel && expectedTrustLevel !== "unknown" && descriptor.trustLevel !== expectedTrustLevel) {
    errors.push(`trustLevel ${descriptor.trustLevel} does not match assetQuality/validationStatus derived level ${expectedTrustLevel}`);
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

  const connectorIds = new Set((descriptor.connectors || []).map((connector) => connector.id).filter(Boolean));

  for (const connector of descriptor.connectors || []) {
    if (!connector.id) errors.push(`${id || "descriptor"} has a connector without id`);
    if (!connector.type) errors.push(`${id || "descriptor"}.${connector.id || "connector"} requires connector type`);
    if (!Array.isArray(connector.positionLocalMm) || connector.positionLocalMm.length !== 3) {
      errors.push(`${id || "descriptor"}.${connector.id || "connector"} requires positionLocalMm [x,y,z]`);
    }
    if (connector.positionLocalMm && !allFiniteNumbers(connector.positionLocalMm)) {
      errors.push(`${id || "descriptor"}.${connector.id || "connector"} positionLocalMm must contain finite numbers`);
    }
    if (!Array.isArray(connector.mating)) {
      errors.push(`${id || "descriptor"}.${connector.id || "connector"} requires mating array`);
    }
    for (const mate of connector.mating || []) {
      validateMatingEndpoint({
        descriptorId: id,
        connectorId: connector.id,
        mate,
        errors,
        knownConnectorIdsByComponentId
      });
    }
  }

  for (const interfaceItem of descriptor.interfaces || []) {
    if (!interfaceItem.id) errors.push(`${id || "descriptor"} has an interface without id`);
    if (!interfaceItem.connectorId) {
      errors.push(`${id || "descriptor"}.${interfaceItem.id || "interface"} requires connectorId`);
    } else if (!connectorIds.has(interfaceItem.connectorId)) {
      errors.push(`${id || "descriptor"}.${interfaceItem.id || "interface"} references missing connector ${interfaceItem.connectorId}`);
    }
  }

  for (const externalFeature of descriptor.externalFeatures || []) {
    if (!externalFeature.id) errors.push(`${id || "descriptor"} has an external feature without id`);
    if (!externalFeature.type) errors.push(`${id || "descriptor"}.${externalFeature.id || "externalFeature"} requires feature type`);
    if (externalFeature.positionLocalMm && (!Array.isArray(externalFeature.positionLocalMm) || externalFeature.positionLocalMm.length !== 3 || !allFiniteNumbers(externalFeature.positionLocalMm))) {
      errors.push(`${id || "descriptor"}.${externalFeature.id || "externalFeature"} positionLocalMm must be [x,y,z]`);
    }
    if (externalFeature.openingSizeMm && (!Array.isArray(externalFeature.openingSizeMm) || externalFeature.openingSizeMm.length !== 2 || !allPositiveNumbers(externalFeature.openingSizeMm))) {
      errors.push(`${id || "descriptor"}.${externalFeature.id || "externalFeature"} openingSizeMm must be positive [width,height]`);
    }
  }

  for (const keepout of descriptor.keepouts || []) {
    validateVolumeLike({
      descriptorId: id,
      item: keepout,
      collectionName: "keepout",
      errors
    });
  }

  for (const access of descriptor.accessVolumes || []) {
    validateVolumeLike({
      descriptorId: id,
      item: access,
      collectionName: "accessVolume",
      errors
    });
    if (access.connectorId && !connectorIds.has(access.connectorId)) {
      errors.push(`${id || "descriptor"}.${access.id || "accessVolume"} references missing connector ${access.connectorId}`);
    }
  }

  for (const cableExit of descriptor.cableExitDirections || []) {
    if (!cableExit.connectorId) {
      errors.push(`${id || "descriptor"} has a cableExitDirection without connectorId`);
    } else if (!connectorIds.has(cableExit.connectorId)) {
      errors.push(`${id || "descriptor"} cableExitDirection references missing connector ${cableExit.connectorId}`);
    }
    if (!cableExit.direction) errors.push(`${id || "descriptor"} cableExitDirection ${cableExit.connectorId || ""} requires direction`);
  }

  for (const hole of descriptor.mountingHoles || []) {
    if (!hole.id) errors.push(`${id || "descriptor"} has a mounting hole without id`);
    if (!Array.isArray(hole.positionLocalMm) || hole.positionLocalMm.length !== 3 || !allFiniteNumbers(hole.positionLocalMm)) {
      errors.push(`${id || "descriptor"}.${hole.id || "mountingHole"} requires positionLocalMm [x,y,z]`);
    }
    if (!(Number(hole.diameterMm) > 0)) {
      errors.push(`${id || "descriptor"}.${hole.id || "mountingHole"} requires positive diameterMm`);
    }
  }

  validateSourceEvidence({
    descriptorId: id,
    sourceEvidence: descriptor.sourceEvidence,
    sourceNotes: descriptor.sourceNotes,
    errors,
    warnings
  });

  const sourceNotes = descriptor.sourceNotes || {};
  if (!sourceNotes.summary) errors.push(`${id || "descriptor"} sourceNotes.summary is required`);
  if (!sourceNotes.sourcesFile) errors.push(`${id || "descriptor"} sourceNotes.sourcesFile is required`);
  if (!sourceNotes.confidence) errors.push(`${id || "descriptor"} sourceNotes.confidence is required`);
  if (sourcesFileExists === false) {
    errors.push(`${id || "descriptor"} companion source notes file is missing`);
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

function validateSourceEvidence({ descriptorId, sourceEvidence = {}, sourceNotes = {}, errors, warnings }) {
  const id = descriptorId || "descriptor";
  if (!sourceEvidence || typeof sourceEvidence !== "object" || Array.isArray(sourceEvidence)) {
    errors.push(`${id} sourceEvidence must be an object`);
    return;
  }
  if (!sourceEvidence.sourceType) errors.push(`${id} sourceEvidence.sourceType is required`);
  if (!sourceEvidence.sourceConfidence) errors.push(`${id} sourceEvidence.sourceConfidence is required`);
  if (!sourceEvidence.measurementBasis) errors.push(`${id} sourceEvidence.measurementBasis is required`);
  if (!sourceEvidence.lastReviewed) errors.push(`${id} sourceEvidence.lastReviewed is required`);
  if (!Array.isArray(sourceEvidence.references)) {
    errors.push(`${id} sourceEvidence.references must be an array`);
  } else if (sourceEvidence.references.length === 0) {
    errors.push(`${id} sourceEvidence.references must include at least one reference`);
  }
  for (const [index, reference] of (sourceEvidence.references || []).entries()) {
    if (!reference.kind) errors.push(`${id} sourceEvidence.references[${index}].kind is required`);
    if (!reference.path) errors.push(`${id} sourceEvidence.references[${index}].path is required`);
  }
  if (sourceNotes.confidence && sourceEvidence.sourceConfidence && sourceEvidence.sourceConfidence !== sourceNotes.confidence) {
    warnings.push(`${id} sourceEvidence.sourceConfidence does not match sourceNotes.confidence`);
  }
  const sourceNotePath = sourceNotes.sourcesFile || "sources.md";
  const hasSourceNoteReference = (sourceEvidence.references || []).some((reference) => reference.path === sourceNotePath);
  if (sourceNotes.sourcesFile && !hasSourceNoteReference) {
    errors.push(`${id} sourceEvidence.references must include ${sourceNotes.sourcesFile}`);
  }
}

function validateMatingEndpoint({ descriptorId, connectorId, mate, errors, knownConnectorIdsByComponentId }) {
  const endpoint = parseEndpoint(mate);
  if (!endpoint.componentId || !endpoint.connectorId) {
    errors.push(`${descriptorId || "descriptor"}.${connectorId || "connector"} has invalid mating endpoint ${String(mate)}`);
    return;
  }
  if (endpoint.componentId === "external") return;
  const knownConnectors = connectorSetFor(knownConnectorIdsByComponentId, endpoint.componentId);
  if (!knownConnectors) return;
  if (!knownConnectors.has(endpoint.connectorId)) {
    errors.push(`${descriptorId || "descriptor"}.${connectorId || "connector"} mates with missing connector ${endpoint.componentId}.${endpoint.connectorId}`);
  }
}

function connectorSetFor(knownConnectorIdsByComponentId, componentId) {
  if (!knownConnectorIdsByComponentId) return null;
  if (knownConnectorIdsByComponentId instanceof Map) return knownConnectorIdsByComponentId.get(componentId) || null;
  const value = knownConnectorIdsByComponentId[componentId];
  if (!value) return null;
  return value instanceof Set ? value : new Set(value);
}

function parseEndpoint(value) {
  const [componentId, connectorId] = String(value || "").split(".");
  return { componentId, connectorId };
}

function validateVolumeLike({ descriptorId, item = {}, collectionName, errors }) {
  if (!item.id) errors.push(`${descriptorId || "descriptor"} has a ${collectionName} without id`);
  if (!item.type) errors.push(`${descriptorId || "descriptor"}.${item.id || collectionName} requires type`);
  if (!Array.isArray(item.positionLocalMm) || item.positionLocalMm.length !== 3 || !allFiniteNumbers(item.positionLocalMm)) {
    errors.push(`${descriptorId || "descriptor"}.${item.id || collectionName} requires positionLocalMm [x,y,z]`);
  }
  if (!Array.isArray(item.sizeMm) || item.sizeMm.length !== 3 || !allPositiveNumbers(item.sizeMm)) {
    errors.push(`${descriptorId || "descriptor"}.${item.id || collectionName} requires positive sizeMm [width,height,depth]`);
  }
}

function allFiniteNumbers(values = []) {
  return values.every((value) => Number.isFinite(Number(value)));
}

function allPositiveNumbers(values = []) {
  return values.every((value) => Number(value) > 0);
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
  const derivedTrustLevel = mechanicalTrustLevel({
    assetQuality: clone.assetQuality,
    validationStatus: clone.validationStatus
  });
  const trustLevel = clone.trustLevel || derivedTrustLevel;

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
    trustLevel,
    reviewStatus: clone.reviewStatus || "needs_review",
    sourceEvidence: clone.sourceEvidence || {},
    sourceNotes: clone.sourceNotes || {},
    risk: {
      requiresManualValidation: Boolean(riskFlags.requiresManualValidation),
      severity: riskFlags.severity || "none",
      reason: riskFlags.reason || "",
      warnings: riskFlags.warnings || []
    },
    capabilities: CAPABILITIES_BY_CATEGORY[category] || [],
    mechanicalConstraints: createMechanicalConstraintSummary({
      ...clone,
      id: identity.id || clone.id,
      type: category,
      descriptorCategory: category,
      category: identity.legacyCategory || LEGACY_CATEGORY_BY_DESCRIPTOR_CATEGORY[category] || category,
      displayName,
      dimensionsMm,
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
      assetQuality: clone.assetQuality,
      validationStatus: clone.validationStatus,
      trustLevel,
      reviewStatus: clone.reviewStatus || "needs_review",
      sourceEvidence: clone.sourceEvidence || {},
      sourceNotes: clone.sourceNotes || {},
      risk: {
        requiresManualValidation: Boolean(riskFlags.requiresManualValidation),
        severity: riskFlags.severity || "none",
        reason: riskFlags.reason || "",
        warnings: riskFlags.warnings || []
      }
    })
  };
}
