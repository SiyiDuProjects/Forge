---
received_date: 2026-06-07
source_context: Goal continuation after STL/STEP artifact audit hardening; compact runtime context needed to expose why artifacts are trusted without raw artifact bytes.
related_task: 3D Artifact Audit Context Diagnostics V3 P35
status: implemented
key_handles: 3D trusted generation, ContextPack, generationEvidenceSummary, artifactAudit diagnostics, thinMeshPrimitiveCount, degenerateFacetCount, thinAxisCount, shellDimensionsPositive, raw artifact bytes excluded
---

# 3D Artifact Audit Context Diagnostics V3 P35

## Context

P34 strengthened `generation_evidence_report.json` with format-specific GLB/STL/STEP audit fields. The report file had the details, but `ContextPack.generationEvidenceSummary.artifactAudit.checks` still only carried compact pass/present/bytes/hash fields.

That made the runtime context too weak: Codex/QueryEngine could see that audit passed or failed, but not the compact reason dimensions such as GLB thin mesh count, STL degenerate facet count, or STEP handoff boundary metadata.

## Durable Decision

ContextPack should carry compact artifact audit diagnostics that are safe for prompt/runtime use and still exclude raw artifact bytes.

The compact context should include:

- GLB semantic/thickness counters.
- STL parseability/degenerate/thin-axis counters and span summaries.
- STEP shell-dimension and no-direct-editing boundary flags.
- Finding codes, not raw artifact contents.

## Implemented Shape

- `compactArtifactAudit` now includes:
  - `findingCodes`
  - top-level `diagnostics`
  - per-artifact `checks.<artifactKey>.diagnostics`
- `currentRevisionSummary.generationEvidence.artifactAudit` now includes compact diagnostics.
- ContextPack remains explicit that raw GLB/STL/STEP bytes are excluded.

## Verification

- `node --check src/core/context_pack_builder.mjs`
- `node --check tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/project_workspace.test.mjs`
- `node --import ./tests/setup_test_environment.mjs --test tests/query_engine.test.mjs`
- `npm run check`

Targeted tests pass. Full `npm run check` passes with 91 tests.

## Boundary

These diagnostics are context and review metadata. They do not expose raw model bytes, do not authorize direct GeometrySpec/artifact mutation, and do not make generated STL/STEP production ready.
