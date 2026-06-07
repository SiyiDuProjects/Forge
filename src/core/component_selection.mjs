import { getComponentDescriptor, listComponentDescriptors } from "./component_library.mjs";
import {
  normalizeComponentDescriptor,
  validateComponentDescriptorV2
} from "./component_descriptor_schema.mjs";

const ROLE_DESCRIPTOR_TYPES = Object.freeze({
  core_board: "core_board",
  display: "display",
  usb_c: "interface",
  ambient_sensor: "sensor",
  speaker: "speaker",
  button: "button",
  camera: "camera",
  battery: "battery"
});

const DEFAULT_COMPONENT_IDS = Object.freeze({
  core_board: "core_board_esp32_s3",
  display: "display_3_5_tft",
  usb_c: "usb_c_breakout",
  ambient_sensor: "ambient_sensor_basic",
  speaker: "speaker_20mm",
  button: "button_6mm",
  camera: "camera_module_basic",
  battery: "battery_lipo_2000"
});

export function selectComponents(productPlan = {}) {
  const requirements = productPlan.requirements || {};
  const componentPreferences = normalizeComponentPreferences(productPlan.componentPreferences || {});
  const selectionWarnings = [];
  const selectedComponentIds = [
    descriptorIdForRole({
      productPlan,
      role: "core_board",
      preferredId: componentPreferences.core_board,
      warnings: selectionWarnings
    })
  ];

  if (requirements.display !== false) {
    selectedComponentIds.push(displayComponentForSize(requirements.displaySizeInches, {
      productPlan,
      preferredId: componentPreferences.display,
      warnings: selectionWarnings
    }));
  }
  if (requirements.usbC !== false) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "usb_c",
      preferredId: componentPreferences.usb_c,
      warnings: selectionWarnings
    }));
  }
  if (requirements.ambientSensor) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "ambient_sensor",
      preferredId: componentPreferences.ambient_sensor,
      warnings: selectionWarnings
    }));
  }
  if (requirements.speaker || requirements.buzzer) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "speaker",
      preferredId: componentPreferences.speaker,
      warnings: selectionWarnings
    }));
  }
  if (Number(requirements.buttons || 0) > 0) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "button",
      preferredId: componentPreferences.button,
      warnings: selectionWarnings
    }));
  }
  if (requirements.camera) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "camera",
      preferredId: componentPreferences.camera,
      warnings: selectionWarnings
    }));
  }
  if (requirements.battery) {
    selectedComponentIds.push(descriptorIdForRole({
      productPlan,
      role: "battery",
      preferredId: componentPreferences.battery,
      warnings: selectionWarnings
    }));
  }

  const uniqueIds = [...new Set(selectedComponentIds.filter(Boolean))];
  const descriptors = getSelectableComponentDescriptors(uniqueIds, productPlan);
  const buttonDescriptorId = selectedComponentIds.find((componentId) => componentTypeForId(componentId, productPlan) === "button");
  const speakerDescriptorId = selectedComponentIds.find((componentId) => componentTypeForId(componentId, productPlan) === "speaker");
  const componentQuantities = {};
  if (buttonDescriptorId && Number(requirements.buttons || 0) > 0) {
    componentQuantities[buttonDescriptorId] = Number(requirements.buttons || 0);
  }
  if (speakerDescriptorId && requirements.buzzer) {
    componentQuantities[speakerDescriptorId] = 1;
  }
  const riskModuleIds = descriptors
    .filter((descriptor) => descriptor.risk?.requiresManualValidation)
    .map((descriptor) => descriptor.id);

  return {
    selectedComponentIds: uniqueIds,
    componentDescriptors: descriptors,
    componentQuantities,
    riskModuleIds,
    assumptions: [
      "ESP32-S3 selected as the default V1 controller.",
      "Only finite known component descriptors are selected in V1.",
      "ComponentDescriptor v2 roles may select preferred same-type descriptor variants when provided by ProductPlan.componentPreferences."
    ],
    warnings: [
      ...selectionWarnings,
      ...descriptors
        .filter((descriptor) => descriptor.risk?.requiresManualValidation)
        .map((descriptor) => ({
          type: "manual_validation_required",
          moduleId: descriptor.id,
          message: descriptor.risk.reason || `${descriptor.displayName} requires human validation.`
        }))
    ]
  };
}

function displayComponentForSize(sizeInches, { productPlan = {}, preferredId = "", warnings = [] } = {}) {
  const size = Number(sizeInches || 3.5);
  return descriptorIdForRole({
    productPlan,
    role: "display",
    preferredId,
    warnings,
    score: (descriptor) => Math.abs(displayDiagonalInches(descriptor) - size)
  });
}

function descriptorIdForRole({ productPlan = {}, role, preferredId = "", warnings = [], score = null } = {}) {
  const descriptorType = ROLE_DESCRIPTOR_TYPES[role];
  const fallbackId = DEFAULT_COMPONENT_IDS[role];
  const fallback = getSelectableComponentDescriptor(fallbackId, productPlan);
  if (!descriptorType) return fallbackId;

  if (preferredId) {
    const preferred = getSelectableComponentDescriptor(preferredId, productPlan);
    if (preferred && preferred.type === descriptorType) return preferred.id;
    warnings.push({
      type: "preferred_component_unavailable",
      severity: "warning",
      componentRole: role,
      preferredComponentId: preferredId,
      message: `${preferredId} is not a loaded ${descriptorType} ComponentDescriptor; falling back to ${fallbackId}.`
    });
  }

  const candidates = listSelectableComponentDescriptors(productPlan)
    .filter((descriptor) => descriptor.type === descriptorType)
    .filter((descriptor) => supportsRole(descriptor, role));
  if (candidates.length === 0) return fallback?.id || fallbackId;
  if (!score) return preferredDefaultFirst(candidates, fallbackId).id;
  return [...candidates].sort((left, right) => score(left) - score(right))[0].id;
}

function preferredDefaultFirst(candidates, fallbackId) {
  return candidates.find((descriptor) => descriptor.id === fallbackId) || candidates[0];
}

function supportsRole(descriptor, role) {
  if (!descriptor) return false;
  if (role === "usb_c") {
    return (descriptor.connectors || []).some((connector) => connector.type === "usb_c" || connector.id === "usb_c");
  }
  if (role === "ambient_sensor") {
    return (descriptor.capabilities || []).includes("ambient_light_sensor") || descriptor.type === "sensor";
  }
  return true;
}

function displayDiagonalInches(descriptor = {}) {
  const active = descriptor.mechanicalProxy?.screenActiveAreaMm || {};
  const width = Number(active.width || descriptor.dimensionsMm?.width || 0);
  const height = Number(active.height || descriptor.dimensionsMm?.height || 0);
  if (!(width > 0) || !(height > 0)) return Number.POSITIVE_INFINITY;
  return Math.sqrt(width ** 2 + height ** 2) / 25.4;
}

function componentTypeForId(componentId, productPlan = {}) {
  const descriptor = getSelectableComponentDescriptor(componentId, productPlan);
  return descriptor?.type || "";
}

export function componentTypeForProductPlanComponentId(componentId, productPlan = {}) {
  const descriptor = getSelectableComponentDescriptor(componentId, productPlan);
  return descriptor?.type || "";
}

export function getSelectableComponentDescriptor(componentId, productPlan = {}) {
  if (!componentId) return null;
  const local = listProductPlanComponentDescriptors(productPlan).find((descriptor) => descriptor.id === componentId);
  if (local) return JSON.parse(JSON.stringify(local));
  return getComponentDescriptor(componentId);
}

export function getSelectableComponentDescriptors(componentIds = [], productPlan = {}) {
  return componentIds
    .map((componentId) => getSelectableComponentDescriptor(componentId, productPlan))
    .filter(Boolean);
}

export function listSelectableComponentDescriptors(productPlan = {}) {
  const global = listComponentDescriptors();
  const local = listProductPlanComponentDescriptors(productPlan);
  const byId = new Map(global.map((descriptor) => [descriptor.id, descriptor]));
  for (const descriptor of local) byId.set(descriptor.id, descriptor);
  return [...byId.values()].map((descriptor) => JSON.parse(JSON.stringify(descriptor)));
}

function listProductPlanComponentDescriptors(productPlan = {}) {
  const entries = Array.isArray(productPlan.componentLibrary?.descriptors)
    ? productPlan.componentLibrary.descriptors
    : [];
  if (!entries.length) return [];
  const rawEntries = entries
    .map((entry) => entry?.descriptor || entry)
    .filter((descriptor) => descriptor && typeof descriptor === "object" && !Array.isArray(descriptor));
  const knownConnectorIdsByComponentId = new Map([
    ...listComponentDescriptors().map((descriptor) => [
      descriptor.id,
      new Set((descriptor.connectors || []).map((connector) => connector.id).filter(Boolean))
    ]),
    ...rawEntries.map((descriptor) => [
      descriptor.identity?.id || descriptor.id || "",
      new Set((descriptor.connectors || []).map((connector) => connector.id).filter(Boolean))
    ])
  ].filter(([componentId]) => componentId));

  return entries
    .filter((entry) => entry?.active !== false && entry?.status !== "retired" && entry?.status !== "blocked")
    .map((entry) => {
    const raw = entry?.descriptor || entry;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const id = raw.identity?.id || raw.id || "";
    const sourceFileName = raw.sourceNotes?.sourcesFile || "sources.md";
    const validation = validateComponentDescriptorV2(raw, {
      expectedId: entry.expectedId || id,
      knownConnectorIdsByComponentId,
      sourcesFileExists: Boolean(entry.sourcesText || entry.sourcesFilePresent)
    });
    return {
      ...normalizeComponentDescriptor(raw),
      descriptorPath: entry.descriptorPath || `productPlan.componentLibrary.${id}.descriptor`,
      sourcesPath: entry.sourcesPath || `productPlan.componentLibrary.${id}.${sourceFileName}`,
      schemaValidation: validation,
      libraryScope: "product_plan",
      librarySource: cloneForSelection(entry.source || {}),
      libraryReplacement: cloneForSelection(entry.replacement || null),
      libraryReplacementHistory: cloneForSelection(entry.replacementHistory || []),
      promotedAt: entry.promotedAt || ""
    };
  }).filter(Boolean);
}

function cloneForSelection(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizeComponentPreferences(preferences = {}) {
  return {
    core_board: preferences.core_board || preferences.coreBoard || "",
    display: preferences.display || "",
    usb_c: preferences.usb_c || preferences.usbC || "",
    ambient_sensor: preferences.ambient_sensor || preferences.ambientSensor || "",
    speaker: preferences.speaker || preferences.buzzer || "",
    button: preferences.button || preferences.buttons || "",
    camera: preferences.camera || "",
    battery: preferences.battery || ""
  };
}
