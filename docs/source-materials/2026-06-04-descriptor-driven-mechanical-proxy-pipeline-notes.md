---
received_date: 2026-06-04
source_context: User pasted Forge Goal for descriptor-driven mechanical proxy component asset pipeline
related_task: ComponentDescriptor v2 mechanical proxy generator
status: implemented
key_handles: ComponentDescriptor v2, descriptor-driven proxy, component_assets, component_asset_manifest, proxy geometry builder, generated evidence, read-only 3D preview
---

# Descriptor-Driven Mechanical Proxy Pipeline Notes

## Durable Decisions

- ComponentDescriptor v2 is now the source of truth for component geometry metadata.
- GLB/STEP/STL generation must align to descriptors; the generator should not infer holes, connectors, openings, mounting, keepouts, access volumes, or cable routes from arbitrary meshes.
- Current component assets are mechanical proxies with `validationStatus: unverified_proxy`.
- The first implementation keeps procedural GLB generation and shell-only STL output; it does not add real CadQuery/OpenCascade runtime or a CAD backend.
- Each confirmed revision writes `component_descriptors.json` and `component_asset_manifest.json` alongside ProductPlan, GeometrySpec, model, shell, summary, and validation artifacts.
- UI remains read-only. Artifact links are allowed as generated evidence, not as CAD editing or production controls.
- Camera and battery can appear as proxy review components, but must stay manual-validation risks.

## Search Handles

- `ComponentDescriptor v2`
- `component_assets`
- `descriptor.json`
- `sources.md`
- `component_asset_manifest.json`
- `mechanical_proxy`
- `unverified_proxy`
- `proxy_geometry_builder`
- `procedural_visual_proxy`
- `descriptor-driven shell features`
- `read-only assembly preview`

## Current Boundary

This work records and implements the descriptor-driven mechanical proxy layer. It does not implement real supplier asset ingestion, real CAD kernel execution, electrical validation, thermal validation, production readiness, checkout, supplier ordering, or user-facing CAD editing.
