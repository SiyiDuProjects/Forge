export function validatePrototypeGeometry({ productPlan = {}, componentSelection = {}, layout = {} } = {}) {
  const errors = [];
  const warnings = [...(componentSelection.warnings || []), ...(layout.warnings || [])];
  const placements = layout.placements || [];
  const features = layout.features || [];
  const routes = layout.routes || [];
  const descriptors = componentSelection.componentDescriptors || [];
  const descriptorById = new Map(descriptors.map((descriptor) => [descriptor.id, descriptor]));
  const placementById = new Map(placements.map((placement) => [placement.componentId, placement]));
  const enclosure = layout.enclosure || {};
  const dimensions = enclosure.dimensionsMm || {};
  const wallThickness = Number(enclosure.wallThicknessMm || productPlan.constraints?.wallThicknessMm || 0);

  if (wallThickness < 2) {
    errors.push({
      type: "wall_too_thin",
      severity: "blocked",
      message: "Wall thickness must be at least 2.0 mm for the V1 printed shell."
    });
  }

  for (const componentId of componentSelection.selectedComponentIds || []) {
    if (!descriptorById.has(componentId)) {
      errors.push({
        type: "missing_component_descriptor",
        severity: "blocked",
        moduleId: componentId,
        componentId,
        message: `${componentId} has no ComponentDescriptor v2 asset.`
      });
    }
  }

  for (const descriptor of descriptors) {
    if (descriptor.schemaValidation && !descriptor.schemaValidation.valid) {
      errors.push({
        type: "component_descriptor_schema_invalid",
        severity: "blocked",
        moduleId: descriptor.id,
        componentId: descriptor.id,
        message: `${descriptor.id} descriptor schema is invalid: ${descriptor.schemaValidation.errors.join("; ")}`
      });
    }
    if (!hasDimensions(descriptor.dimensionsMm)) {
      errors.push({
        type: "missing_descriptor_dimensions",
        severity: "blocked",
        moduleId: descriptor.id,
        componentId: descriptor.id,
        message: `${descriptor.displayName} is missing descriptor dimensions.`
      });
    }
    if (descriptor.validationStatus === "unverified_proxy") {
      warnings.push({
        type: "unverified_proxy_dimensions",
        moduleId: descriptor.id,
        componentId: descriptor.id,
        severity: "warning",
        assetQuality: descriptor.assetQuality,
        validationStatus: descriptor.validationStatus,
        message: `${descriptor.displayName} uses unverified proxy dimensions and requires human validation before production.`
      });
    }
    if (descriptor.assetQuality === "mechanical_proxy" || descriptor.assetQuality === "procedural_proxy") {
      warnings.push({
        type: "proxy_asset_quality",
        moduleId: descriptor.id,
        componentId: descriptor.id,
        severity: "warning",
        assetQuality: descriptor.assetQuality,
        validationStatus: descriptor.validationStatus,
        message: `${descriptor.displayName} is represented by a descriptor-driven mechanical proxy.`
      });
    }
  }

  for (const placement of placements) {
    if (!descriptorById.has(placement.componentId)) {
      errors.push({
        type: "placement_missing_descriptor",
        severity: "blocked",
        moduleId: placement.componentId,
        componentId: placement.componentId,
        message: `${placement.componentId} placement does not reference a loaded descriptor.`
      });
    }
    if (!placement.assetQuality || !placement.validationStatus) {
      warnings.push({
        type: "placement_missing_asset_quality",
        moduleId: placement.componentId,
        componentId: placement.componentId,
        severity: "warning",
        message: `${placement.name} placement should expose asset quality and validation status.`
      });
    }
    if (!insideCavity(placement, dimensions, wallThickness)) {
      warnings.push({
        type: "component_near_or_outside_cavity",
        moduleId: placement.componentId,
        componentId: placement.componentId,
        severity: "warning",
        message: `${placement.name} should be checked against the enclosure internal cavity.`
      });
    }
  }

  validateExternalFeatures({ descriptors, features, errors });
  validateMounting({ descriptors, features, errors });
  validateRoutes({ routes, descriptorById, placementById, warnings, errors });
  validateKeepouts({ placements, warnings });

  for (const componentId of componentSelection.riskModuleIds || []) {
    if (!placementById.has(componentId)) {
      warnings.push({
        type: "risk_module_not_placed",
        moduleId: componentId,
        componentId,
        severity: "warning",
        message: `${componentId} is a risk module and should be visible in review output when selected.`
      });
    }
  }

  return {
    errors,
    warnings,
    status: errors.length ? "blocked" : warnings.length ? "passed_with_warnings" : "passed",
    printableReady: errors.length === 0,
    canGenerateArtifacts: errors.length === 0,
    directEditingAllowed: false,
    checks: [
      "component_descriptor_exists",
      "component_descriptor_schema",
      "descriptor_dimensions",
      "component_fit_in_internal_cavity",
      "external_feature_openings",
      "external_connector_cutout",
      "mounting_hole_standoffs",
      "connector_access_volume",
      "keepout_volume_proxy",
      "route_endpoint_connectors",
      "risk_module_visibility",
      "asset_quality_reported",
      "shell_only_stl",
      "direct_editing_disabled"
    ],
    note: "Descriptor-driven proxy preview. Requires human engineering validation before production use."
  };
}

function validateExternalFeatures({ descriptors, features, errors }) {
  for (const descriptor of descriptors) {
    for (const externalFeature of descriptor.externalFeatures || []) {
      const match = features.find((feature) => (
        feature.targetComponentId === descriptor.id
        && feature.targetFeatureId === externalFeature.id
      ));
      if (!match) {
        errors.push({
          type: "missing_external_feature_opening",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} external feature ${externalFeature.id} has no shell opening or marker.`
        });
      }
    }
    for (const connector of descriptor.connectors || []) {
      if (!connector.requiresExternalAccess) continue;
      const match = features.find((feature) => (
        feature.targetComponentId === descriptor.id
        && feature.targetConnectorId === connector.id
      ));
      if (!match) {
        errors.push({
          type: "missing_external_connector_cutout",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName}.${connector.id} requires an external cutout.`
        });
      }
    }
  }
}

function validateMounting({ descriptors, features, errors }) {
  for (const descriptor of descriptors) {
    if (!descriptor.mountingHoles?.length) continue;
    const standoffs = features.filter((feature) => feature.type === "standoff" && feature.targetComponentId === descriptor.id);
    if (standoffs.length < descriptor.mountingHoles.length) {
      errors.push({
        type: "missing_mounting_hole_standoffs",
        severity: "blocked",
        moduleId: descriptor.id,
        componentId: descriptor.id,
        message: `${descriptor.displayName} has mounting holes that did not generate standoffs.`
      });
    }
  }
}

function validateRoutes({ routes, descriptorById, placementById, warnings, errors }) {
  for (const route of routes) {
    if (!route.from || !route.to || !route.pathMm?.length) {
      warnings.push({
        type: "incomplete_route",
        severity: "warning",
        routeId: route.id,
        message: `${route.id} is missing connector endpoints or route path.`
      });
      continue;
    }
    for (const endpoint of [route.from, route.to]) {
      const descriptor = descriptorById.get(endpoint.componentId);
      if (!descriptor) {
        errors.push({
          type: "route_endpoint_missing_descriptor",
          severity: "blocked",
          routeId: route.id,
          moduleId: endpoint.componentId,
          componentId: endpoint.componentId,
          message: `${route.id} references ${endpoint.componentId}, but no descriptor is loaded.`
        });
        continue;
      }
      if (!placementById.has(endpoint.componentId)) {
        errors.push({
          type: "route_endpoint_missing_placement",
          severity: "blocked",
          routeId: route.id,
          moduleId: endpoint.componentId,
          componentId: endpoint.componentId,
          message: `${route.id} references ${endpoint.componentId}, but the component is not placed.`
        });
      }
      if (!(descriptor.connectors || []).some((connector) => connector.id === endpoint.connectorId)) {
        errors.push({
          type: "route_endpoint_missing_connector",
          severity: "blocked",
          routeId: route.id,
          moduleId: endpoint.componentId,
          componentId: endpoint.componentId,
          message: `${route.id} references missing connector ${endpoint.componentId}.${endpoint.connectorId}.`
        });
      }
    }
  }
}

function validateKeepouts({ placements, warnings }) {
  for (const placement of placements) {
    for (const keepout of placement.keepouts || []) {
      warnings.push({
        type: "keepout_volume_proxy",
        moduleId: placement.componentId,
        componentId: placement.componentId,
        severity: "warning",
        keepoutId: keepout.id,
        message: `${placement.name} keepout ${keepout.id} is represented as a proxy check volume.`
      });
    }
    for (const access of placement.accessVolumes || []) {
      warnings.push({
        type: "access_volume_proxy",
        moduleId: placement.componentId,
        componentId: placement.componentId,
        severity: "warning",
        accessVolumeId: access.id,
        message: `${placement.name} access volume ${access.id} needs human fit validation.`
      });
    }
  }
}

function insideCavity(placement, dimensions, wallThickness) {
  if (!dimensions.width || !dimensions.height || !dimensions.depth) return true;
  if (placement.face === "front" || placement.face === "back") return true;
  const position = placement.positionMm || placement.placement?.positionMm || {};
  const size = placement.dimensionsMm || {};
  const halfWidth = dimensions.width / 2 - wallThickness;
  const halfHeight = dimensions.height / 2 - wallThickness;
  const halfDepth = dimensions.depth / 2;
  return Math.abs(Number(position.x || 0)) + Number(size.width || 0) / 2 <= halfWidth + 2
    && Math.abs(Number(position.y || 0)) + Number(size.height || 0) / 2 <= halfHeight + 2
    && Math.abs(Number(position.z || 0)) + Number(size.depth || 0) / 2 <= halfDepth + 2;
}

function hasDimensions(dimensions = {}) {
  return Number(dimensions.width) > 0 && Number(dimensions.height) > 0 && Number(dimensions.depth) > 0;
}
