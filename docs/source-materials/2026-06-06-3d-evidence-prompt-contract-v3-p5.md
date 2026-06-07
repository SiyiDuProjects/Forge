---
received_date: 2026-06-06
source_context: Continuation of the active Forge 3D trusted generation loop V3 goal.
related_task: 3D trusted generation loop V3 P5 prompt and tool schema evidence contract
status: implemented
key_handles: 3D trusted generation, prompt sections, Tool Protocol, generationEvidenceSummary, generationEvidenceReport, getRevisionArtifacts, no raw GLB/STL/STEP bytes
---

# 3D Evidence Prompt Contract V3 P5

## Durable Decision

Generation evidence should be visible to model/runtime layers as compact metadata, not as raw artifact content. Prompt sections should explicitly tell the model how to use `generationEvidenceSummary`, and Tool Protocol metadata should name the generation evidence artifact returned by `getRevisionArtifacts`.

## Implementation Summary

- Added prompt boundary text for using generation evidence summaries to discuss source chain, validation, descriptor/layout coverage, and file integrity.
- Added prompt tool-rule text to use `getRevisionArtifacts` for compact metadata, including `generationEvidenceReport`, without treating artifacts as editable CAD files.
- Expanded `getRevisionArtifacts` output schema to name `generationEvidenceReport`, its artifact path, and `artifactStatus.hasGenerationEvidenceReport`.
- Tests verify the prompt includes evidence metadata/rules, excludes raw `glTF` bytes, and the Tool Protocol schema exposes the new evidence fields.
- Verification passed with targeted `node --test tests/project_workspace.test.mjs` and full `npm run check` with 77 tests.

## Boundary

This does not change generation behavior or expose raw model bytes. The runtime still cannot mutate GLB/STL/STEP, raw GeometrySpec, component descriptors, or arbitrary project files.
