---
received_date: 2026-06-07
source_context: Goal continuation after preview-solid validation; artifact audit needed stronger STL/STEP evidence beyond file presence and basic headers.
related_task: 3D STL STEP Artifact Audit Hardening V3 P34
status: implemented
key_handles: 3D trusted generation, STL audit, STEP audit, artifact_post_write_audit, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, directEditingBoundaryPresent
---

# 3D STL STEP Artifact Audit Hardening V3 P34

## Context

The trusted generation loop already wrote GLB/STL/STEP artifacts only after confirmation and validation. GLB audit had semantic-node and non-zero-thickness checks, but STL audit mostly checked ASCII STL headers and facet count, while STEP audit mostly checked for a few metadata strings.

That was weaker than the goal: confirmed artifacts should be reviewable evidence, not just non-empty files.

## Durable Decision

Post-write artifact audit should verify every generated artifact class at an appropriate level:

- GLB: semantic node prefixes, mesh primitives, no `GL_LINES`, accessor bounds, and thin mesh count.
- STL: parseable vertices, no degenerate facets, positive shell bounds, and no too-thin artifact axis.
- STEP handoff: ISO wrapper plus shell dimensions, module placements, component asset manifest, mechanical constraints, layout explanation, and no-direct-editing boundary.

## Implemented Shape

- `auditStlArtifact` now reports:
  - `geometry.vertexCount`
  - `geometry.degenerateFacetCount`
  - `geometry.bounds`
  - `geometry.spanMm`
  - `geometry.thinAxisCount`
  - `geometry.minimumSpanMm`
- STL audit now fails on:
  - missing parseable vertices
  - degenerate facets
  - too-thin overall shell artifact bounds
- `auditStepArtifact` now reports:
  - `format.hasShellDimensions`
  - `format.hasComponentAssetManifest`
  - `metadata.shellDimensionsMm`
  - `metadata.shellDimensionsPositive`
  - `metadata.directEditingBoundaryPresent`
- STEP audit now fails when required source-of-truth/review-boundary metadata is missing or invalid.

## Verification

- `node --check src/core/geometry_generation.mjs`
- `node --check tests/trusted_generation_regression.test.mjs`
- `node --check tests/core_pipeline.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/trusted_generation_regression.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/core_pipeline.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 91 tests.

## Boundary

This strengthens artifact evidence for the current deterministic prototype generator. It does not make the STL production ready, does not replace human DFM review, does not add user-facing CAD export, and does not broaden the preview into an editor.
