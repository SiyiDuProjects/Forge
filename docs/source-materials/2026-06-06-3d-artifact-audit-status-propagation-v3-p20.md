---
received_date: 2026-06-06
source_context: Continuing Forge 3D trusted generation loop V3 after artifact post-write audit
related_task: 3D trusted generation loop V3 P20 artifact audit status propagation
status: implemented
key_handles: 3D trusted generation, artifactStatus, trustedGenerated, artifactAuditStatus, artifactAuditPassed, artifactAuditFindingCount, generation evidence, post-write audit
---

# 3D Artifact Audit Status Propagation V3 P20

## Prompt

P19 added post-write artifact audit inside `generation_evidence_report.json`, but the high-level `artifactStatus` summary still only reported file presence and generated status. That left a risk that UI/chat/tool layers could treat existing GLB/STL/STEP files as trusted even if audit metadata later reports a failure.

## Durable Decision

Keep the existing `modelArtifacts.status` contract (`pending_confirmation`, `generated`, `blocked`) stable, and add explicit trust fields to compact summaries:

- `artifactStatus.generated`: derived files were generated.
- `artifactStatus.trustedGenerated`: files were generated and post-write artifact audit passed.
- `artifactStatus.artifactAuditStatus`
- `artifactStatus.artifactAuditPassed`
- `artifactStatus.artifactAuditFindingCount`

ContextPack current revision summaries also expose compact artifact audit status under `currentRevisionSummary.generationEvidence.artifactAudit`.

## Boundary

This does not change ProductPlan/GeometrySpec source-of-truth ownership, does not make GLB/STL/STEP editable, and does not turn audit metadata into CAD or production validation. It only prevents high-level surfaces from collapsing "file exists" and "trusted generated artifact" into the same state.
