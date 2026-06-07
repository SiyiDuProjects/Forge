---
received_date: 2026-06-06
source_context: Continuation of the active Forge 3D trusted generation loop V3 goal.
related_task: 3D trusted generation loop V3 P4 evidence context surfaces
status: implemented
key_handles: 3D trusted generation, generation evidence report, getRevisionArtifacts, ContextPack, source chain, artifact integrity, SHA-256, no raw artifact bytes
---

# 3D Evidence Context V3 P4

## Durable Decision

The generation evidence report is only useful to conversation-driven revision work if Forge actions and ContextPack expose it as compact metadata. Runtime layers should be able to see provenance, validation coverage, descriptor/layout evidence, artifact integrity, and read-only boundary flags without loading raw GLB/STL/STEP contents.

## Implementation Summary

- `getRevisionArtifacts` now includes `generationEvidenceReport`.
- `artifactStatusForRevision` now reports `hasGenerationEvidenceReport`.
- `ContextPack` now reads `generation_evidence_report.json` from the current revision folder when present and exposes a compact `generationEvidenceSummary`.
- The summary keeps source-of-truth flags, validation status, descriptor/mechanical coverage, layout coverage, artifact byte counts, SHA-256 hashes, and no-CAD/no-direct-edit flags.
- Tests cover Forge action artifact retrieval, project workspace ContextPack summaries, and QueryEngine compact ContextPack behavior while asserting raw GLB bytes are not included.
- Verification passed with targeted `node --test tests/forge_actions.test.mjs`, `node --test tests/project_workspace.test.mjs`, `node --test tests/query_engine.test.mjs`, and full `npm run check` with 77 tests.

## Boundary

This does not make artifact files editable. It does not expose raw model bytes, user-facing CAD export, manufacturing checkout, supplier ordering, or production validation claims. It only gives chat/tool layers enough metadata to reason about generated evidence correctly.
