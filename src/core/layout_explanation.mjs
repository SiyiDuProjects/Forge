export const LAYOUT_EXPLANATION_REPORT_VERSION = "layout_explanation_v1";

export function createLayoutExplanationReport({ productPlan = {}, componentDescriptors = [], layout = {} } = {}) {
  const descriptorById = new Map(componentDescriptors.map((descriptor) => [descriptor.id, descriptor]));
  const placementPreferences = productPlan.geometryPreferences?.placements || {};
  const placements = (layout.placements || []).map((placement) => {
    const descriptor = descriptorById.get(placement.componentId);
    const preference = placementPreferenceFor(placement, placementPreferences);
    return {
      id: `layout.placement.${placement.componentId}${placement.instanceLabel ? `.${placement.instanceLabel}` : ""}`,
      kind: "placement",
      componentId: placement.componentId,
      role: placement.role,
      face: placement.face,
      positionMm: placement.positionMm,
      ruleId: placementRuleId(placement),
      reason: placementReason(placement, descriptor, preference),
      descriptorInputs: descriptorInputs(descriptor),
      productPreference: preference,
      trustLevel: descriptor?.mechanicalConstraints?.trustLevel || "unknown",
      directEditingAllowed: false
    };
  });
  const features = (layout.features || []).map((feature) => {
    const descriptor = descriptorById.get(feature.targetComponentId);
    return {
      id: `layout.feature.${feature.id}`,
      kind: "feature",
      featureId: feature.id,
      featureType: feature.type,
      targetComponentId: feature.targetComponentId || "",
      face: feature.face,
      positionMm: feature.positionMm,
      sizeMm: feature.sizeMm || null,
      ruleId: featureRuleId(feature),
      reason: featureReason(feature, descriptor),
      descriptorSource: feature.source || null,
      descriptorInputs: descriptorInputs(descriptor),
      directEditingAllowed: false
    };
  });
  const routes = (layout.routes || []).map((route) => {
    const fromDescriptor = descriptorById.get(route.from?.componentId);
    const toDescriptor = descriptorById.get(route.to?.componentId);
    return {
      id: `layout.route.${route.id}`,
      kind: "route",
      routeId: route.id,
      routeType: route.routeType || "coarse_internal_path",
      signalType: route.type || "",
      from: route.from,
      to: route.to,
      pointCount: route.pathMm?.length || 0,
      ruleId: "descriptor_connector_coarse_route",
      reason: routeReason(route, fromDescriptor, toDescriptor),
      descriptorInputs: [
        connectorInput(fromDescriptor, route.from),
        connectorInput(toDescriptor, route.to)
      ].filter(Boolean),
      validation: route.validation || "human_fit_review",
      directEditingAllowed: false
    };
  });

  return {
    version: LAYOUT_EXPLANATION_REPORT_VERSION,
    source: "component_descriptor_v2_and_product_plan_geometry_preferences",
    placements,
    features,
    routes,
    coverage: {
      placementCount: placements.length,
      featureCount: features.length,
      routeCount: routes.length,
      explainedPlacementCount: placements.filter((item) => item.reason).length,
      explainedFeatureCount: features.filter((item) => item.reason).length,
      explainedRouteCount: routes.filter((item) => item.reason).length,
      descriptorDrivenFeatureCount: features.filter((item) => item.descriptorSource?.kind?.startsWith("componentDescriptor")).length,
      preferenceDrivenPlacementCount: placements.filter((item) => item.productPreference?.semanticPosition).length,
      manualReviewPlacementCount: placements.filter((item) => item.role?.includes("review")).length
    },
    directEditingAllowed: false,
    note: "Layout explanations describe why deterministic placement, shell feature, and route rules selected each preview element; they are not direct-edit handles."
  };
}

function placementRuleId(placement) {
  if (placement.role === "front_display") return "display_front_capture";
  if (placement.role === "core_board") return "core_board_internal_standoff_mount";
  if (placement.role === "rear_power_input") return "usb_c_rear_or_preferred_edge_access";
  if (placement.role === "front_sensor") return "sensor_front_window_preference";
  if (placement.role === "speaker_volume") return "speaker_rear_grille_preference";
  if (placement.role === "button_input") return "button_panel_preference";
  if (placement.role === "front_camera_review") return "camera_front_review_window";
  if (placement.role === "battery_review_volume") return "battery_internal_review_bay";
  return "descriptor_default_placement";
}

function featureRuleId(feature) {
  if (feature.type === "screen_opening") return "display_external_feature_screen_opening";
  if (feature.type === "captured_panel_retention") return "descriptor_captured_panel_retention";
  if (feature.type === "usb_cutout") return "connector_external_access_cutout";
  if (feature.type === "edge_capture_retention") return "descriptor_edge_capture_retention";
  if (feature.type === "grille_mount_retention") return "descriptor_grille_mount_retention";
  if (feature.type === "panel_button_retention") return "descriptor_panel_button_retention";
  if (feature.type === "standoff") return "mounting_hole_standoff_projection";
  if (feature.type === "sensor_window" || feature.type === "camera_window") return "optical_external_feature_window";
  if (feature.type === "optical_window_retention") return "descriptor_optical_window_retention";
  if (feature.type === "speaker_vents") return "speaker_external_feature_vents";
  if (feature.type === "button_hole") return "button_external_feature_hole";
  if (feature.type === "battery_bay") return "manual_review_retention_bay";
  if (feature.type === "split_line") return "standard_front_back_shell_split";
  if (feature.type === "decorative_cat_ear") return "shape_profile_decorative_silhouette";
  return "descriptor_shell_feature";
}

function placementReason(placement, descriptor, preference) {
  const name = descriptor?.displayName || placement.name || placement.componentId;
  const preferenceText = preference?.semanticPosition ? ` Product preference requested ${preference.semanticPosition}.` : "";
  if (placement.role === "front_display") {
    return `${name} is placed behind the front opening so the display viewing area aligns with the descriptor screen opening.${preferenceText}`;
  }
  if (placement.role === "core_board") {
    return `${name} is placed on the rear internal plane so descriptor mounting holes can project to shell standoffs.${preferenceText}`;
  }
  if (placement.role === "rear_power_input") {
    return `${name} is placed on the selected rear/edge face so the USB-C connector can mate with an external cable through its descriptor cutout.${preferenceText}`;
  }
  if (placement.role?.includes("review")) {
    return `${name} remains visible as a human-review placement because its descriptor risk state requires review before production.${preferenceText}`;
  }
  return `${name} is placed from the standard desktop display layout rule using descriptor dimensions, face, and connector/access metadata.${preferenceText}`;
}

function featureReason(feature, descriptor) {
  const name = descriptor?.displayName || feature.targetComponentId || feature.id;
  if (feature.type === "standoff") {
    return `${feature.id} is derived from ${name} mounting-hole metadata and supports the board at the generated internal rear plane.`;
  }
  if (feature.type === "captured_panel_retention") {
    return `${feature.id} is derived from ${name} captured-panel mounting metadata and models the display retainer frame behind the front opening.`;
  }
  if (feature.type === "edge_capture_retention") {
    return `${feature.id} is derived from ${name} mounting metadata and models the descriptor retention lip for edge capture.`;
  }
  if (feature.type === "grille_mount_retention") {
    return `${feature.id} is derived from ${name} grille-mount metadata and frames the descriptor speaker vent opening.`;
  }
  if (feature.type === "panel_button_retention") {
    return `${feature.id} is derived from ${name} panel-button mounting metadata and frames the descriptor button travel opening.`;
  }
  if (feature.type === "optical_window_retention") {
    return `${feature.id} is derived from ${name} front-window mounting metadata and frames the descriptor optical window while preserving review flags when required.`;
  }
  if (feature.type === "battery_bay") {
    return `${feature.id} is derived from ${name} review-only mounting metadata and keeps the battery volume visible as a human-review retained bay.`;
  }
  if (feature.type === "split_line") {
    return "The front/back split line follows the standard 3D printed shell family.";
  }
  if (feature.type?.includes("opening") || feature.type?.includes("cutout") || feature.type?.includes("window") || feature.type === "speaker_vents" || feature.type === "button_hole") {
    return `${feature.id} is derived from ${name} descriptor external feature or connector access metadata on the selected shell face.`;
  }
  return `${feature.id} is generated by the standard layout rule for ${name}.`;
}

function routeReason(route, fromDescriptor, toDescriptor) {
  const from = route.from ? `${route.from.componentId}.${route.from.connectorId}` : "unknown";
  const to = route.to ? `${route.to.componentId}.${route.to.connectorId}` : "unknown";
  const fromName = fromDescriptor?.displayName || route.from?.componentId || "source component";
  const toName = toDescriptor?.displayName || route.to?.componentId || "target component";
  return `${route.id} connects ${from} to ${to} using ${fromName} and ${toName} descriptor connector metadata and a coarse human-fit-review route.`;
}

function placementPreferenceFor(placement, preferences) {
  const map = {
    rear_power_input: preferences.usb_c,
    button_input: preferences.buttons,
    front_sensor: preferences.ambient_sensor,
    speaker_volume: preferences.speaker,
    front_camera_review: preferences.camera,
    battery_review_volume: preferences.battery
  };
  return map[placement.role] || null;
}

function descriptorInputs(descriptor) {
  if (!descriptor) return null;
  return {
    componentId: descriptor.id,
    descriptorPath: descriptor.descriptorPath || "",
    dimensionsMm: descriptor.dimensionsMm || {},
    mountingMethod: descriptor.mechanicalProxy?.mountingMethod || descriptor.mounting?.method || "",
    connectorIds: (descriptor.connectors || []).map((connector) => connector.id).filter(Boolean),
    externalFeatureIds: (descriptor.externalFeatures || []).map((feature) => feature.id).filter(Boolean),
    keepoutIds: (descriptor.keepouts || []).map((keepout) => keepout.id).filter(Boolean),
    accessVolumeIds: (descriptor.accessVolumes || []).map((access) => access.id).filter(Boolean)
  };
}

function connectorInput(descriptor, endpoint) {
  if (!descriptor || !endpoint) return null;
  const connector = (descriptor.connectors || []).find((item) => item.id === endpoint.connectorId);
  return {
    componentId: descriptor.id,
    connectorId: endpoint.connectorId,
    connectorType: connector?.type || "",
    orientation: connector?.orientation || "",
    positionLocalMm: connector?.positionLocalMm || null,
    descriptorPath: descriptor.descriptorPath || ""
  };
}
