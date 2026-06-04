import { getComponentDescriptor } from "./component_library.mjs";

export const COMPONENT_ASSET_PURPOSES = Object.freeze(["preview", "mechanical", "validation", "manufacturing"]);

export function resolveComponentAsset(componentId, purpose = "preview", descriptorOverride = null) {
  if (!COMPONENT_ASSET_PURPOSES.includes(purpose)) {
    throw new Error(`Unsupported component asset purpose: ${purpose}`);
  }

  const descriptor = descriptorOverride || getComponentDescriptor(componentId);
  if (!descriptor) {
    return {
      componentId,
      purpose,
      resolvedType: "missing_descriptor",
      assetQuality: "missing",
      validationStatus: "missing",
      source: "missing",
      path: null,
      descriptor: null
    };
  }

  const paths = descriptor.assetPaths || {};
  if (purpose === "preview") {
    return assetResult({
      descriptor,
      purpose,
      vendorPath: paths.vendorGlb,
      proxyPath: paths.proxyVisualGlb,
      vendorType: "vendor_glb",
      proxyType: "proxy_visual_glb",
      proceduralType: "procedural_visual_proxy"
    });
  }

  if (purpose === "mechanical") {
    return assetResult({
      descriptor,
      purpose,
      vendorPath: paths.vendorStep,
      proxyPath: paths.proxyMechanicalStep,
      vendorType: "vendor_step",
      proxyType: "proxy_mechanical_step",
      proceduralType: "procedural_mechanical_proxy"
    });
  }

  if (purpose === "validation") {
    return descriptorResult(descriptor, purpose, "descriptor_data");
  }

  return descriptorResult(descriptor, purpose, "descriptor_driven_shell_features_only");
}

function assetResult({ descriptor, purpose, vendorPath, proxyPath, vendorType, proxyType, proceduralType }) {
  if (vendorPath) {
    return descriptorResult(descriptor, purpose, vendorType, vendorPath, "vendor_asset");
  }
  if (proxyPath) {
    return descriptorResult(descriptor, purpose, proxyType, proxyPath, "local_proxy_asset");
  }
  return descriptorResult(descriptor, purpose, proceduralType, null, "procedural_proxy_builder");
}

function descriptorResult(descriptor, purpose, resolvedType, path = null, source = "component_descriptor") {
  return {
    componentId: descriptor.id,
    purpose,
    resolvedType,
    assetQuality: descriptor.assetQuality,
    validationStatus: descriptor.validationStatus,
    source,
    path,
    descriptorPath: descriptor.descriptorPath,
    sourcesPath: descriptor.sourcesPath,
    directEditingAllowed: false
  };
}
