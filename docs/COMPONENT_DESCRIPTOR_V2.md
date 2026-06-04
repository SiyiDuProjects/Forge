# ComponentDescriptor v2

Status: implemented as the descriptor-driven mechanical proxy layer for the current Forge prototype generator.

## Purpose

`ComponentDescriptor v2` is the source of truth for component geometry metadata used by Forge. The generator may create GLB preview geometry, shell features, validation checks, and internal handoff summaries from descriptors, but it must not infer holes, connectors, openings, mounting, keepouts, access volumes, or cable exits from arbitrary mesh geometry.

## Required Fields

Each descriptor in `src/core/component_assets/<component_id>/descriptor.json` includes:

- `identity`
- `versioning`
- `assetQuality`
- `validationStatus`
- `dimensionsMm`
- `coordinateSystem`
- `visualProxy`
- `mechanicalProxy`
- `mountingHoles`
- `connectors`
- `interfaces`
- `externalFeatures`
- `keepouts`
- `accessVolumes`
- `cableExitDirections`
- `riskFlags`
- `assetPaths`
- `sourceNotes`

Every component folder also keeps `sources.md`. Current seed descriptors are proxy data, not vendor-verified mechanical assets.

## Asset Resolution

`resolveComponentAsset(componentId, purpose)` supports:

- `preview`: `vendorGlb -> proxyVisualGlb -> procedural_visual_proxy`
- `mechanical`: `vendorStep -> proxyMechanicalStep -> procedural_mechanical_proxy`
- `validation`: descriptor data
- `manufacturing`: descriptor-driven shell features only

Each revision writes `component_asset_manifest.json`, recording resolved asset type, asset quality, validation status, source paths, and whether procedural proxies were used.

## Current Seed Components

- `display_3_5_tft`
- `display_5_tft`
- `core_board_esp32_s3`
- `usb_c_breakout`
- `ambient_sensor_basic`
- `speaker_20mm`
- `camera_module_basic`
- `battery_lipo_2000`
- `battery_18650_holder`
- `button_6mm`

Camera and battery descriptors remain human-review risks. They can appear in the structure preview as amber/manual-review proxy components, but they are not electrical, thermal, safety, charging, shipping, privacy, or production validation.

## Boundaries

- No CAD editor or direct geometry editing.
- No dragging components or editing holes in the viewer.
- No arbitrary AI mesh generation.
- No supplier ordering, checkout, or production workflow.
- No PCB, schematic, electrical, battery safety, or thermal validation.
- No SolidWorks/Fusion/Onshape backend.
- No full CadQuery/OpenCascade runtime in this step.
