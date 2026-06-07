---
received_date: 2026-06-06
source_context: Continuing Forge 3D trusted generation loop V3 after audit status propagation
related_task: 3D trusted generation loop V3 P21 trusted preview status
status: implemented
key_handles: 3D trusted generation, modelPreview artifactTrust, trustedGenerated, artifactSummary, generation audit passed, right inspector compact status, read-only preview
---

# 3D Trusted Preview Status V3 P21

## Prompt

After P20, `artifactStatus` can distinguish generated files from trusted generated artifacts, but `modelPreview` and the compact right-inspector status were still centered on `modelArtifacts.status === "generated"`. That made the UI/result layer less precise than the backend evidence layer.

## Durable Decision

Carry compact trust state into the model preview and default inspector status:

- `modelPreview.artifactTrust.generated`
- `modelPreview.artifactTrust.trustedGenerated`
- `modelPreview.artifactTrust.auditStatus`
- `modelPreview.artifactTrust.auditPassed`
- `modelPreview.artifactTrust.findingCount`

The right inspector's single model status line now says audit-passed, audit-failed, or audit-pending rather than only saying the model exists. This keeps the default inspector compact and avoids generated evidence links or raw artifact details.

## Boundary

This is a user/result status improvement, not a CAD feature. The preview remains read-only, ProductPlan/GeometrySpec remain source of truth, and detailed GLB/STL/STEP/evidence files remain revision artifacts for explicit engineering/review surfaces.
