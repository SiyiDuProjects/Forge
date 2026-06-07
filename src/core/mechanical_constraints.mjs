export const MECHANICAL_CONSTRAINT_REPORT_VERSION = "mechanical_constraints_v1";

export function createMechanicalConstraintSummary(descriptor = {}) {
  const componentId = descriptor.id || descriptor.identity?.id || "";
  const displayName = descriptor.displayName || descriptor.identity?.displayName || componentId;
  const assetQuality = descriptor.assetQuality || "unknown";
  const validationStatus = descriptor.validationStatus || "unknown";
  const mechanicalProxy = descriptor.mechanicalProxy || {};
  const mounting = descriptor.mounting || {};
  const connectors = descriptor.connectors || [];
  const interfaces = descriptor.interfaces || [];
  const externalFeatures = descriptor.externalFeatures || [];
  const keepouts = descriptor.keepouts || [];
  const accessVolumes = descriptor.accessVolumes || [];
  const cableExitDirections = descriptor.cableExitDirections || [];
  const trustLevel = descriptor.trustLevel || mechanicalTrustLevel({ assetQuality, validationStatus });

  return {
    componentId,
    displayName,
    category: descriptor.descriptorCategory || descriptor.type || descriptor.identity?.category || descriptor.category || "unknown",
    descriptorVersion: descriptor.versioning?.descriptorVersion || "",
    descriptorPath: descriptor.descriptorPath || "",
    sourcesPath: descriptor.sourcesPath || "",
    assetQuality,
    validationStatus,
    trustLevel,
    productionReady: trustLevel === "engineer_verified",
    requiresHumanValidation: requiresHumanValidation(descriptor, trustLevel),
    dimensionsMm: descriptor.dimensionsMm || {},
    coordinateSystem: {
      origin: descriptor.coordinateSystem?.origin || "",
      front: descriptor.coordinateSystem?.front || ""
    },
    mounting: {
      method: mechanicalProxy.mountingMethod || mounting.method || "descriptor_proxy",
      holeCount: (descriptor.mountingHoles || mounting.mountingHoles || []).length,
      holeIds: (descriptor.mountingHoles || mounting.mountingHoles || []).map((hole, index) => hole.id || `mount_${index + 1}`),
      defaultHoleDiameterMm: numberOrNull(mechanicalProxy.defaultHoleDiameterMm ?? mounting.holeDiameterMm),
      standoffOuterDiameterMm: numberOrNull(mechanicalProxy.defaultStandoffOuterDiameterMm ?? mounting.standoffOuterDiameterMm),
      retentionLipMm: numberOrNull(mechanicalProxy.retentionLipMm ?? mounting.retentionLipMm),
      bodyType: mechanicalProxy.bodyType || ""
    },
    interfaces: {
      connectorCount: connectors.length,
      connectorIds: connectors.map((connector) => connector.id).filter(Boolean),
      requiredExternalAccessConnectorIds: connectors
        .filter((connector) => connector.requiresExternalAccess)
        .map((connector) => connector.id)
        .filter(Boolean),
      interfaceCount: interfaces.length,
      cableExitDirectionCount: cableExitDirections.length
    },
    shellFeatures: {
      externalFeatureCount: externalFeatures.length,
      externalFeatureIds: externalFeatures.map((feature) => feature.id).filter(Boolean),
      externalFeatureTypes: [...new Set(externalFeatures.map((feature) => feature.type).filter(Boolean))],
      maxInsertionClearanceMm: maxNumber(externalFeatures.map((feature) => feature.insertionClearanceMm))
    },
    clearances: {
      keepoutVolumeCount: keepouts.length,
      keepoutIds: keepouts.map((keepout) => keepout.id).filter(Boolean),
      accessVolumeCount: accessVolumes.length,
      accessVolumeIds: accessVolumes.map((access) => access.id).filter(Boolean),
      accessVolumeConnectorIds: accessVolumes.map((access) => access.connectorId).filter(Boolean)
    },
    sourceEvidence: {
      sourceType: descriptor.sourceEvidence?.sourceType || "",
      librarySourceType: descriptor.librarySource?.type || "",
      workspaceDraft: descriptor.librarySource?.workspaceDraft ? { ...descriptor.librarySource.workspaceDraft } : null,
      sourceConfidence: descriptor.sourceEvidence?.sourceConfidence || descriptor.sourceNotes?.confidence || "",
      measurementBasis: descriptor.sourceEvidence?.measurementBasis || "",
      lastReviewed: descriptor.sourceEvidence?.lastReviewed || "",
      vendorAssetAvailable: Boolean(descriptor.assetPaths?.vendorGlb || descriptor.assetPaths?.vendorStep),
      proxyAssetAvailable: Boolean(descriptor.assetPaths?.proxyVisualGlb || descriptor.assetPaths?.proxyMechanicalStep),
      references: Array.isArray(descriptor.sourceEvidence?.references)
        ? descriptor.sourceEvidence.references.map((reference) => ({ ...reference }))
        : []
    },
    warnings: constraintWarnings({ descriptor, trustLevel, connectors, cableExitDirections, accessVolumes })
  };
}

export function createMechanicalConstraintReport(componentDescriptors = []) {
  const components = componentDescriptors.map(createMechanicalConstraintSummary);
  const trustLevelCounts = countBy(components, (component) => component.trustLevel);
  return {
    version: MECHANICAL_CONSTRAINT_REPORT_VERSION,
    source: "component_descriptor_v2",
    components,
    coverage: {
      componentCount: components.length,
      connectorCount: sumBy(components, (component) => component.interfaces.connectorCount),
      externalFeatureCount: sumBy(components, (component) => component.shellFeatures.externalFeatureCount),
      keepoutVolumeCount: sumBy(components, (component) => component.clearances.keepoutVolumeCount),
      accessVolumeCount: sumBy(components, (component) => component.clearances.accessVolumeCount),
      cableExitDirectionCount: sumBy(components, (component) => component.interfaces.cableExitDirectionCount),
      vendorAssetCount: components.filter((component) => component.sourceEvidence.vendorAssetAvailable).length,
      proxyComponentCount: components.filter((component) => component.trustLevel === "proxy_seed").length,
      unverifiedProxyCount: components.filter((component) => component.validationStatus === "unverified_proxy").length,
      productionReadyCount: components.filter((component) => component.productionReady).length,
      humanReviewComponentIds: components
        .filter((component) => component.requiresHumanValidation)
        .map((component) => component.componentId),
      trustLevelCounts
    },
    directEditingAllowed: false,
    note: "Mechanical constraints are descriptor-backed proxy evidence for prototype planning; they are not production validation."
  };
}

export function mechanicalTrustLevel({ assetQuality = "", validationStatus = "" } = {}) {
  if (assetQuality === "verified_mechanical" && validationStatus === "engineer_verified") return "engineer_verified";
  if (assetQuality === "vendor_reference" || validationStatus === "vendor_supplied") return "vendor_reference";
  if (validationStatus === "descriptor_reviewed") return "descriptor_reviewed_proxy";
  if (validationStatus === "unverified_proxy" || assetQuality === "mechanical_proxy" || assetQuality === "procedural_proxy") return "proxy_seed";
  return "unknown";
}

function requiresHumanValidation(descriptor, trustLevel) {
  return Boolean(descriptor.risk?.requiresManualValidation || descriptor.riskFlags?.requiresManualValidation || trustLevel !== "engineer_verified");
}

function constraintWarnings({ descriptor, trustLevel, connectors, cableExitDirections, accessVolumes }) {
  const warnings = [];
  if (trustLevel === "proxy_seed") {
    warnings.push("proxy_dimensions_require_human_review");
  }
  if (connectors.length > 0 && cableExitDirections.length === 0) {
    warnings.push("connector_cable_exit_directions_missing");
  }
  const externalConnectorIds = connectors
    .filter((connector) => connector.requiresExternalAccess)
    .map((connector) => connector.id)
    .filter(Boolean);
  for (const connectorId of externalConnectorIds) {
    if (!accessVolumes.some((access) => access.connectorId === connectorId)) {
      warnings.push(`external_access_volume_missing:${connectorId}`);
    }
  }
  if (descriptor.assetQuality === "mechanical_proxy" && !descriptor.assetPaths?.proxyMechanicalStep && !descriptor.assetPaths?.vendorStep) {
    warnings.push("procedural_mechanical_proxy_only");
  }
  return warnings;
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(items, valueFn) {
  return items.reduce((sum, item) => sum + Number(valueFn(item) || 0), 0);
}

function maxNumber(values) {
  const numbers = values.map(Number).filter((value) => Number.isFinite(value));
  return numbers.length ? Math.max(...numbers) : null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
