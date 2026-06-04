# Reference Build 001

Status: implemented as a descriptor-driven mechanical proxy reference build.

## Scenario

The default demo conversation creates a small woodgrain desktop display:

- 3.5 inch TFT display
- Standard 3D printed shell
- Front screen opening
- Rear USB-C power opening
- Ambient light sensor and front sensor window
- ESP32-S3-style core board on standoffs
- Coarse internal routes for display ribbon, sensor wiring, and USB-C power

The conversation updates ProductPlan revisions first. The final confirmation turn locks the revision and writes model artifacts.

## Generated Files

Each confirmed revision writes:

- `product_plan.json`
- `geometry-spec.json`
- `component_selections.json`
- `component_descriptors.json`
- `component_asset_manifest.json`
- `model.glb`
- `model.stl`
- `shell_front.stl`
- `shell_back.stl`
- `model.step`
- `design_summary.md`
- `validation_report.json`
- `generate_model.py`

## GLB Nodes

The preview GLB keeps stable prefixes:

- `shell.*`
- `feature.*`
- `module.*`
- `interface.*`
- `route.*`

Reference nodes include:

- `shell.front`
- `shell.back`
- `feature.opening.screen`
- `feature.opening.usb_c`
- `feature.opening.ambient_sensor`
- `feature.standoff.core_board.*`
- `module.display_3_5_tft`
- `module.core_board_esp32_s3`
- `module.usb_c_breakout`
- `module.ambient_sensor_basic`
- `interface.*`
- `route.display_to_core_board`
- `route.sensor_to_core_board`

All GLB POSITION accessors include `min` and `max`. GLB extras include `placedModuleCount`, `riskModuleIds`, `componentAssetManifest`, and `directEditingAllowed: false`.

## STL Boundary

STL output is shell-only. It may include front/back shell rails, screen opening/bezel, sensor window frame, USB-C cutout frame, shell walls, and standoffs/bosses.

STL output must not include display bodies, PCB bodies, sensor bodies, USB-C component bodies, speaker, camera, battery, cables, labels, keepouts, or access-volume markers.

## UI Boundary

The user can rotate, pan, zoom, switch `外观层` / `元器件层`, view component asset quality, view warnings, and open generated evidence links.

The user cannot drag parts, edit holes, edit geometry, author materials, use CAD tools, or start manufacturing from the viewer.
