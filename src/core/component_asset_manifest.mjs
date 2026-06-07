import { resolveComponentAsset } from "./component_asset_resolver.mjs";
import { createMechanicalConstraintReport, createMechanicalConstraintSummary } from "./mechanical_constraints.mjs";

export function createComponentAssetManifest(componentDescriptors = []) {
  const mechanicalConstraintReport = createMechanicalConstraintReport(componentDescriptors);
  const components = componentDescriptors.map((descriptor) => {
    const preview = resolveComponentAsset(descriptor.id, "preview", descriptor);
    const mechanical = resolveComponentAsset(descriptor.id, "mechanical", descriptor);
    const validation = resolveComponentAsset(descriptor.id, "validation", descriptor);
    const manufacturing = resolveComponentAsset(descriptor.id, "manufacturing", descriptor);
    return {
      componentId: descriptor.id,
      displayName: descriptor.displayName,
      descriptorVersion: descriptor.versioning?.descriptorVersion || "",
      assetQuality: descriptor.assetQuality,
      validationStatus: descriptor.validationStatus,
      preview,
      mechanical,
      validation,
      manufacturing,
      mechanicalConstraints: createMechanicalConstraintSummary(descriptor),
      usesProceduralProxy: [preview, mechanical].some((asset) => asset.resolvedType.startsWith("procedural_")),
      vendorAssetAvailable: Boolean(descriptor.assetPaths?.vendorGlb || descriptor.assetPaths?.vendorStep),
      directEditingAllowed: false
    };
  });

  return {
    version: "component_asset_manifest_v1",
    source: "component_descriptor_v2",
    components,
    mechanicalConstraintCoverage: mechanicalConstraintReport.coverage,
    proxyWarning: "This prototype uses descriptor-driven mechanical proxy components unless a verified vendor asset is explicitly listed.",
    directEditingAllowed: false
  };
}
