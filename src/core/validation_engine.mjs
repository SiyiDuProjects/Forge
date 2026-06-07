import { createMechanicalConstraintReport } from "./mechanical_constraints.mjs";
import { createLayoutExplanationReport } from "./layout_explanation.mjs";

export const MIN_PREVIEW_SOLID_THICKNESS_MM = 1.15;

export function validatePrototypeGeometry({ productPlan = {}, componentSelection = {}, layout = {} } = {}) {
  const errors = [];
  const warnings = [...(componentSelection.warnings || []), ...(layout.warnings || [])];
  const placements = layout.placements || [];
  const features = layout.features || [];
  const routes = layout.routes || [];
  const descriptors = componentSelection.componentDescriptors || [];
  const mechanicalConstraintReport = createMechanicalConstraintReport(descriptors);
  const layoutExplanationReport = createLayoutExplanationReport({
    productPlan,
    componentDescriptors: descriptors,
    layout
  });
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
  validateMounting({ descriptors, placements, features, errors });
  validateMechanicalConstraints({ report: mechanicalConstraintReport, warnings, errors });
  validateLayoutExplanations({ report: layoutExplanationReport, warnings });
  errors.push(...collectPreviewSolidDimensionErrors({
    enclosure,
    placements,
    features,
    routes
  }));
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
    mechanicalConstraintReport,
    layoutExplanationReport,
    directEditingAllowed: false,
    checks: [
      "component_descriptor_exists",
      "component_descriptor_schema",
      "descriptor_dimensions",
      "mechanical_constraints_report",
      "mechanical_constraint_trust_status",
      "layout_explanation_report",
      "layout_explanation_coverage",
      "component_fit_in_internal_cavity",
      "external_feature_openings",
      "external_feature_opening_sizes",
      "external_connector_cutout",
      "mounting_hole_standoffs",
      "captured_panel_retention",
      "edge_capture_retention",
      "panel_button_retention",
      "grille_mount_retention",
      "review_only_battery_bay",
      "optical_window_retention",
      "connector_access_volume",
      "keepout_volume_proxy",
      "route_endpoint_connectors",
      "required_internal_connector_routes",
      "preview_solid_dimensions",
      "risk_module_visibility",
      "asset_quality_reported",
      "shell_only_stl",
      "direct_editing_disabled"
    ],
    note: "Descriptor-driven proxy preview. Requires human engineering validation before production use."
  };
}

export function collectPreviewSolidDimensionErrors({
  enclosure = {},
  placements = [],
  features = [],
  routes = []
} = {}) {
  const errors = [];
  validatePositiveDimensions({
    errors,
    value: enclosure.dimensionsMm || {},
    source: "enclosure.dimensionsMm",
    fields: objectDimensionFields("width", "height", "depth"),
    messagePrefix: "Enclosure"
  });

  for (const placement of placements || []) {
    validatePositiveDimensions({
      errors,
      value: placement.dimensionsMm || {},
      source: "placement.dimensionsMm",
      fields: objectDimensionFields("width", "height", "depth"),
      componentId: placement.componentId || placement.moduleId || "",
      moduleId: placement.moduleId || placement.componentId || "",
      messagePrefix: placement.name || placement.componentId || "Placement"
    });
  }

  for (const feature of features || []) {
    validateFeaturePreviewDimensions(feature, errors);
  }

  for (const route of routes || []) {
    validateRoutePreviewDimensions(route, errors);
  }

  return errors;
}

function validateFeaturePreviewDimensions(feature = {}, errors) {
  if (feature.type === "split_line") return;
  const common = {
    errors,
    featureId: feature.id || "",
    componentId: feature.targetComponentId || feature.targetModuleId || "",
    moduleId: feature.targetModuleId || feature.targetComponentId || "",
    messagePrefix: feature.id || `${feature.type || "feature"} preview feature`
  };

  if (Array.isArray(feature.sizeMm)) {
    validatePositiveDimensions({
      ...common,
      value: feature.sizeMm,
      source: "feature.sizeMm",
      fields: arrayDimensionFields("width", "height")
    });
  }

  for (const field of [
    "depthMm",
    "heightMm",
    "outerDiameterMm",
    "holeDiameterMm",
    "retainerWidthMm",
    "retentionLipMm",
    "rimWidthMm",
    "collarWidthMm",
    "buttonTravelMm"
  ]) {
    if (feature[field] === undefined || feature[field] === null) continue;
    validatePositiveDimensions({
      ...common,
      value: { [field]: feature[field] },
      source: `feature.${field}`,
      fields: objectDimensionFields(field)
    });
  }
}

function validateRoutePreviewDimensions(route = {}, errors) {
  const points = Array.isArray(route.pathMm)
    ? route.pathMm
    : Array.isArray(route.pointsMm)
      ? route.pointsMm.map((point) => [point.x, point.y, point.z])
      : [];
  if (points.length < 2) {
    errors.push({
      type: "preview_route_path_missing",
      severity: "blocked",
      routeId: route.id || "",
      message: `${route.id || "Route"} needs at least two points for non-zero-thickness route preview geometry.`
    });
    return;
  }
  for (let index = 0; index < points.length - 1; index += 1) {
    const lengthMm = distanceMm(points[index], points[index + 1]);
    if (!Number.isFinite(lengthMm) || lengthMm < MIN_PREVIEW_SOLID_THICKNESS_MM) {
      errors.push({
        type: "preview_route_segment_too_short",
        severity: "blocked",
        routeId: route.id || "",
        segmentIndex: index,
        actualMm: Number.isFinite(lengthMm) ? Number(lengthMm.toFixed(3)) : null,
        minimumMm: MIN_PREVIEW_SOLID_THICKNESS_MM,
        message: `${route.id || "Route"} segment ${index + 1} is too short to generate reviewable non-zero-thickness route geometry.`
      });
    }
  }
}

function validatePositiveDimensions({
  errors,
  value,
  source,
  fields,
  componentId = "",
  moduleId = "",
  featureId = "",
  messagePrefix = "Geometry"
}) {
  for (const field of fields) {
    const actual = dimensionValue(value, field);
    if (!Number.isFinite(actual) || actual < MIN_PREVIEW_SOLID_THICKNESS_MM) {
      errors.push({
        type: "preview_solid_dimension_too_thin",
        severity: "blocked",
        moduleId,
        componentId,
        featureId,
        source,
        axis: field.name,
        actualMm: Number.isFinite(actual) ? Number(actual.toFixed(3)) : null,
        minimumMm: MIN_PREVIEW_SOLID_THICKNESS_MM,
        message: `${messagePrefix} ${field.name} must be at least ${MIN_PREVIEW_SOLID_THICKNESS_MM} mm for reviewable non-zero-thickness preview geometry.`
      });
    }
  }
}

function objectDimensionFields(...names) {
  return names.map((name) => ({ name, key: name }));
}

function arrayDimensionFields(...names) {
  return names.map((name, index) => ({ name, index }));
}

function dimensionValue(value, field) {
  if (Array.isArray(value)) return Number(value[field.index]);
  return Number(value?.[field.key]);
}

function distanceMm(start = [], end = []) {
  const a = pointToArray(start);
  const b = pointToArray(end);
  return Math.hypot(
    Number(b[0]) - Number(a[0]),
    Number(b[1]) - Number(a[1]),
    Number(b[2]) - Number(a[2])
  );
}

function pointToArray(point = []) {
  if (Array.isArray(point)) return point;
  return [point.x, point.y, point.z];
}

function validateLayoutExplanations({ report, warnings }) {
  const coverage = report.coverage || {};
  const missingPlacements = Number(coverage.placementCount || 0) - Number(coverage.explainedPlacementCount || 0);
  const missingFeatures = Number(coverage.featureCount || 0) - Number(coverage.explainedFeatureCount || 0);
  const missingRoutes = Number(coverage.routeCount || 0) - Number(coverage.explainedRouteCount || 0);
  if (missingPlacements > 0 || missingFeatures > 0 || missingRoutes > 0) {
    warnings.push({
      type: "layout_explanation_incomplete",
      severity: "warning",
      missingPlacements,
      missingFeatures,
      missingRoutes,
      message: `Layout explanation coverage is incomplete: ${missingPlacements} placements, ${missingFeatures} features, and ${missingRoutes} routes lack reasons.`
    });
  }
}

function validateMechanicalConstraints({ report, warnings, errors }) {
  for (const component of report.components || []) {
    if (!component.mounting?.method) {
      errors.push({
        type: "mechanical_constraint_missing_mounting_method",
        severity: "blocked",
        moduleId: component.componentId,
        componentId: component.componentId,
        message: `${component.displayName} has no descriptor-backed mounting method.`
      });
    }
    if (!hasDimensions(component.dimensionsMm)) {
      errors.push({
        type: "mechanical_constraint_missing_dimensions",
        severity: "blocked",
        moduleId: component.componentId,
        componentId: component.componentId,
        message: `${component.displayName} has no descriptor-backed mechanical dimensions.`
      });
    }
    if (component.interfaces.connectorCount > 0 && component.interfaces.cableExitDirectionCount === 0) {
      warnings.push({
        type: "mechanical_constraint_missing_cable_exit",
        moduleId: component.componentId,
        componentId: component.componentId,
        severity: "warning",
        message: `${component.displayName} has connectors but no cable-exit direction metadata.`
      });
    }
    for (const connectorId of component.interfaces.requiredExternalAccessConnectorIds || []) {
      if (!component.clearances.accessVolumeConnectorIds.includes(connectorId)) {
        warnings.push({
          type: "mechanical_constraint_missing_external_access_volume",
          moduleId: component.componentId,
          componentId: component.componentId,
          severity: "warning",
          connectorId,
          message: `${component.displayName}.${connectorId} requires external access but has no descriptor-backed access volume.`
        });
      }
    }
    if (component.requiresHumanValidation) {
      warnings.push({
        type: "mechanical_constraint_trust_not_verified",
        moduleId: component.componentId,
        componentId: component.componentId,
        severity: "warning",
        assetQuality: component.assetQuality,
        validationStatus: component.validationStatus,
        trustLevel: component.trustLevel,
        message: `${component.displayName} mechanical constraints are ${component.trustLevel}; production review is still required.`
      });
    }
  }
}

function validateExternalFeatures({ descriptors, features, errors }) {
  for (const descriptor of descriptors) {
    for (const externalFeature of descriptor.externalFeatures || []) {
      const match = features.find((feature) => (
        feature.targetComponentId === descriptor.id
        && feature.targetFeatureId === externalFeature.id
        && feature.type === externalFeature.type
      ));
      if (!match) {
        errors.push({
          type: "missing_external_feature_opening",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} external feature ${externalFeature.id} has no shell opening or marker.`
        });
        continue;
      }
      if (externalFeature.openingSizeMm && !sameSize2d(match.sizeMm, externalFeature.openingSizeMm)) {
        errors.push({
          type: "external_feature_opening_size_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          featureId: externalFeature.id,
          expectedSizeMm: externalFeature.openingSizeMm,
          actualSizeMm: match.sizeMm || [],
          message: `${descriptor.displayName} external feature ${externalFeature.id} opening size does not match ComponentDescriptor v2.`
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

function validateMounting({ descriptors, placements, features, errors }) {
  for (const descriptor of descriptors) {
    if (descriptor.mountingHoles?.length) {
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
    if (descriptor.mechanicalProxy?.mountingMethod === "captured_panel") {
      const retention = features.find((feature) => (
        feature.type === "captured_panel_retention"
        && feature.targetComponentId === descriptor.id
      ));
      if (!retention) {
        errors.push({
          type: "missing_captured_panel_retention",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} uses captured-panel mounting but has no generated display retention feature.`
        });
        continue;
      }
      const expectedBezel = Number(descriptor.mechanicalProxy?.bezelMm || 0);
      if (expectedBezel > 0 && Math.abs(Number(retention.bezelMm || 0) - expectedBezel) >= 0.001) {
        errors.push({
          type: "captured_panel_bezel_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedBezelMm: expectedBezel,
          actualBezelMm: retention.bezelMm || null,
          message: `${descriptor.displayName} captured-panel retention bezel does not match ComponentDescriptor v2.`
        });
      }
      if (retention.mountingMethod !== "captured_panel") {
        errors.push({
          type: "captured_panel_mounting_method_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedMountingMethod: "captured_panel",
          actualMountingMethod: retention.mountingMethod || "",
          message: `${descriptor.displayName} captured-panel retention mounting method does not match ComponentDescriptor v2.`
        });
      }
    }
    if (descriptor.mechanicalProxy?.mountingMethod === "edge_capture") {
      const retention = features.find((feature) => (
        feature.type === "edge_capture_retention"
        && feature.targetComponentId === descriptor.id
      ));
      if (!retention) {
        errors.push({
          type: "missing_edge_capture_retention",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} uses edge-capture mounting but has no generated retention feature.`
        });
        continue;
      }
      const expectedLip = Number(descriptor.mechanicalProxy?.retentionLipMm || 0);
      if (expectedLip > 0 && Math.abs(Number(retention.retentionLipMm || 0) - expectedLip) >= 0.001) {
        errors.push({
          type: "edge_capture_retention_lip_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedRetentionLipMm: expectedLip,
          actualRetentionLipMm: retention.retentionLipMm || null,
          message: `${descriptor.displayName} edge-capture retention lip does not match ComponentDescriptor v2.`
        });
      }
    }
    if (descriptor.mechanicalProxy?.mountingMethod === "panel_button") {
      const placementCount = placements.filter((placement) => placement.componentId === descriptor.id).length;
      const retentions = features.filter((feature) => (
        feature.type === "panel_button_retention"
        && feature.targetComponentId === descriptor.id
      ));
      if (retentions.length < placementCount) {
        errors.push({
          type: "missing_panel_button_retention",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedCount: placementCount,
          actualCount: retentions.length,
          message: `${descriptor.displayName} uses panel-button mounting but has missing generated retention collars.`
        });
      }
    }
    if (descriptor.mechanicalProxy?.mountingMethod === "grille_mount") {
      const retention = features.find((feature) => (
        feature.type === "grille_mount_retention"
        && feature.targetComponentId === descriptor.id
      ));
      if (!retention) {
        errors.push({
          type: "missing_grille_mount_retention",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} uses grille mounting but has no generated grille retention frame.`
        });
      }
    }
    if (requiresReviewBatteryBay(descriptor)) {
      const batteryBay = features.find((feature) => (
        feature.type === "battery_bay"
        && feature.targetComponentId === descriptor.id
      ));
      if (!batteryBay) {
        errors.push({
          type: "missing_review_battery_bay",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} is a battery review item but has no generated review-only retained bay.`
        });
        continue;
      }
      const expectedMethod = descriptor.mechanicalProxy?.mountingMethod || "";
      if (expectedMethod && batteryBay.mountingMethod !== expectedMethod) {
        errors.push({
          type: "battery_bay_mounting_method_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedMountingMethod: expectedMethod,
          actualMountingMethod: batteryBay.mountingMethod || "",
          message: `${descriptor.displayName} battery bay mounting method does not match ComponentDescriptor v2.`
        });
      }
      if (batteryBay.reviewOnly !== true) {
        errors.push({
          type: "battery_bay_review_boundary_missing",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} battery bay must remain marked as review-only.`
        });
      }
    }
    if (requiresOpticalWindowRetention(descriptor)) {
      const retention = features.find((feature) => (
        feature.type === "optical_window_retention"
        && feature.targetComponentId === descriptor.id
      ));
      if (!retention) {
        errors.push({
          type: "missing_optical_window_retention",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} uses front-window mounting but has no generated optical retention frame.`
        });
        continue;
      }
      const expectedMethod = descriptor.mechanicalProxy?.mountingMethod || "";
      if (retention.mountingMethod !== expectedMethod) {
        errors.push({
          type: "optical_window_mounting_method_mismatch",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          expectedMountingMethod: expectedMethod,
          actualMountingMethod: retention.mountingMethod || "",
          message: `${descriptor.displayName} optical retention mounting method does not match ComponentDescriptor v2.`
        });
      }
      if (expectedMethod === "front_window_review" && retention.reviewOnly !== true) {
        errors.push({
          type: "optical_window_review_boundary_missing",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          message: `${descriptor.displayName} front-window review retention must remain marked review-only.`
        });
      }
      const externalFeature = (descriptor.externalFeatures || []).find((feature) => (
        feature.id === retention.targetFeatureId
      ));
      if (externalFeature?.privacyReviewRequired && retention.privacyReviewRequired !== true) {
        errors.push({
          type: "optical_window_privacy_review_missing",
          severity: "blocked",
          moduleId: descriptor.id,
          componentId: descriptor.id,
          featureId: externalFeature.id,
          message: `${descriptor.displayName} optical retention lost the descriptor privacy review flag.`
        });
      }
    }
  }
}

function validateRoutes({ routes, descriptorById, placementById, warnings, errors }) {
  const routePairs = new Set();
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
    routePairs.add(canonicalRoutePair(route.from, route.to));
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
      if (!hasConnector(descriptor, endpoint.connectorId)) {
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
  for (const requirement of requiredInternalRoutes({ descriptorById, placementById })) {
    if (routePairs.has(requirement.key)) continue;
    errors.push({
      type: "missing_descriptor_connector_route",
      severity: "blocked",
      moduleId: requirement.from.componentId,
      componentId: requirement.from.componentId,
      from: requirement.from,
      to: requirement.to,
      message: `${requirement.from.componentId}.${requirement.from.connectorId} mates with ${requirement.to.componentId}.${requirement.to.connectorId}, but no descriptor-backed internal route was generated.`
    });
  }
}

function requiredInternalRoutes({ descriptorById, placementById }) {
  const requirements = [];
  const seen = new Set();
  for (const descriptor of descriptorById.values()) {
    if (!placementById.has(descriptor.id)) continue;
    if (descriptor.type === "core_board" || descriptor.descriptorCategory === "core_board") continue;
    for (const connector of descriptor.connectors || []) {
      for (const mating of connector.mating || []) {
        const to = routeEndpoint(mating);
        if (!to.componentId || to.componentId === "external" || !to.connectorId) continue;
        const targetDescriptor = descriptorById.get(to.componentId);
        if (!targetDescriptor || !placementById.has(to.componentId)) continue;
        const from = { componentId: descriptor.id, connectorId: connector.id };
        const key = canonicalRoutePair(from, to);
        if (seen.has(key)) continue;
        seen.add(key);
        requirements.push({ key, from, to });
      }
    }
  }
  return requirements;
}

function canonicalRoutePair(from = {}, to = {}) {
  return [endpointKey(from), endpointKey(to)].sort().join("<->");
}

function endpointKey(endpoint = {}) {
  return `${endpoint.componentId || ""}.${endpoint.connectorId || ""}`;
}

function hasConnector(descriptor = {}, connectorId = "") {
  return (descriptor.connectors || []).some((connector) => connector.id === connectorId);
}

function routeEndpoint(value) {
  if (value && typeof value === "object") return value;
  const [componentId, connectorId] = String(value || "").split(".");
  return { componentId, connectorId };
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

function sameSize2d(actual = [], expected = []) {
  return Math.abs(Number(actual?.[0] || 0) - Number(expected?.[0] || 0)) < 0.001
    && Math.abs(Number(actual?.[1] || 0) - Number(expected?.[1] || 0)) < 0.001;
}

function requiresReviewBatteryBay(descriptor = {}) {
  const method = descriptor.mechanicalProxy?.mountingMethod || "";
  return descriptor.type === "battery"
    && (method === "review_only_retained_bay" || method === "screw_or_adhesive_tray");
}

function requiresOpticalWindowRetention(descriptor = {}) {
  const method = descriptor.mechanicalProxy?.mountingMethod || "";
  return method === "front_window" || method === "front_window_review";
}
