import { unique } from "./utils.mjs";

export function createProductSpec(interpreted, modules, riskReport, quote) {
  const capabilities = unique(
    modules.flatMap((module) => module.capabilities || [])
      .filter((capability) => capability !== "enclosure")
  );

  return {
    product_type: productTypeName(interpreted.productType),
    user_request: interpreted.requestText,
    target_mvp_slice: "indoor_desktop_display_device",
    enclosure: {
      method: "parameterized_3d_printed_shell",
      finish: interpreted.finish,
      screen_size_in: interpreted.screenSize,
      mounting: "standard_core_board_standoffs"
    },
    functions: unique(interpreted.functions),
    data_sources: unique(interpreted.dataSources),
    hardware_capabilities: capabilities,
    power: interpreted.options.battery ? "battery_requested_but_not_mvp_default" : "usb_c_low_voltage",
    manufacturing_method: "standard_core_board + approved_modules + 3d_printed_enclosure",
    module_stack: modules.map((module) => module.name),
    review: {
      level: riskReport.reviewLevel,
      status: riskReport.status,
      notes: riskReport.items.map((item) => item.text)
    },
    quote_estimate_usd: {
      hardware: quote.hardware,
      print_and_assembly: quote.build,
      review: quote.review,
      range: quote.range
    }
  };
}

function productTypeName(productType) {
  const map = {
    display: "ai_desktop_display",
    companion: "ai_companion_screen",
    prototype: "founder_hardware_prototype"
  };
  return map[productType] || "ai_desktop_display";
}
