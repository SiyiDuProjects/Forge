---
received_date: 2026-06-06
source_context: User goal in Codex thread
related_task: Forge Product Repo & Revision Ledger V0
status: implemented
key_handles: Forge Product Repo, Revision Ledger V0, ProductPlan source of truth, proposed patches, accepted changes, rejected changes, artifact manifest, diff metadata, rollback
---

# Forge Product Repo & Revision Ledger V0

Raw goal:

> Forge Product Repo & Revision Ledger V0: create the project-level state model for conversation-driven hardware product iteration. ProductPlan remains the source of truth; GeometrySpec, artifacts, validation reports, and evidence reports are derived revision outputs. Implement revision records, proposed patches, accepted/rejected changes, artifact manifests, diff metadata, and rollback support. Do not implement CAD editing or manufacturing.

Implementation boundary:

- Add a project-level revision ledger that summarizes existing ProductPlan revisions, workspace proposals, events, diffs, artifact manifests, and rollback history.
- Keep ProductPlan as the authoritative state object.
- Treat GeometrySpec, validation reports, generation evidence reports, and GLB/STL/STEP as derived revision outputs.
- Keep the ledger read-only for chat/runtime context; project-changing mutations still go through Forge actions.
- Do not add CAD editing, manufacturing, checkout, supplier ordering, or direct artifact mutation.
