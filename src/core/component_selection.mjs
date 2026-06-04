import { getComponentDescriptor, getComponentDescriptors } from "./component_library.mjs";

export function selectComponents(productPlan = {}) {
  const requirements = productPlan.requirements || {};
  const selectedComponentIds = ["core_board_esp32_s3"];

  if (requirements.display !== false) {
    selectedComponentIds.push(displayComponentForSize(requirements.displaySizeInches));
  }
  if (requirements.usbC !== false) selectedComponentIds.push("usb_c_breakout");
  if (requirements.ambientSensor) selectedComponentIds.push("ambient_sensor_basic");
  if (requirements.speaker || requirements.buzzer) selectedComponentIds.push("speaker_20mm");
  if (Number(requirements.buttons || 0) > 0) selectedComponentIds.push("button_6mm");
  if (requirements.camera) selectedComponentIds.push("camera_module_basic");
  if (requirements.battery) selectedComponentIds.push("battery_lipo_2000");

  const uniqueIds = [...new Set(selectedComponentIds)];
  const descriptors = getComponentDescriptors(uniqueIds);
  const riskModuleIds = descriptors
    .filter((descriptor) => descriptor.risk?.requiresManualValidation)
    .map((descriptor) => descriptor.id);

  return {
    selectedComponentIds: uniqueIds,
    componentDescriptors: descriptors,
    componentQuantities: {
      button_6mm: Number(requirements.buttons || 0) || undefined,
      speaker_20mm: requirements.buzzer ? 1 : undefined
    },
    riskModuleIds,
    assumptions: [
      "ESP32-S3 selected as the default V1 controller.",
      "Only finite known component descriptors are selected in V1."
    ],
    warnings: descriptors
      .filter((descriptor) => descriptor.risk?.requiresManualValidation)
      .map((descriptor) => ({
        type: "manual_validation_required",
        moduleId: descriptor.id,
        message: descriptor.risk.reason || `${descriptor.displayName} requires human validation.`
      }))
  };
}

function displayComponentForSize(sizeInches) {
  const size = Number(sizeInches || 3.5);
  if (size >= 6.5 && getComponentDescriptor("display_7_tft")) return "display_7_tft";
  if (size >= 4.5 && getComponentDescriptor("display_5_tft")) return "display_5_tft";
  return "display_3_5_tft";
}
