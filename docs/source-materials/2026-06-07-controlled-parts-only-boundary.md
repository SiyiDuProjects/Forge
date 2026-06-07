---
received_date: 2026-06-07
source_context: User corrected the Forge V3 component onboarding boundary after completion audit.
related_task: Controlled parts only product boundary
status: implemented
key_handles: controlled parts only, no user uploaded parts, ComponentDescriptor, workspace draft, vetted supplier source, Forge-controlled library
---

# Controlled Parts Only Boundary

The product should not imply that end users can upload arbitrary parts for Forge to manufacture.

Because Forge is intended to produce physical prototypes, selectable parts must come from the Forge-controlled component library or from vetted internal/supplier source material that has been onboarded through the controlled ComponentDescriptor draft/spec/promote/select path.

Project-local descriptor drafts and `source-specs.md` remain useful, but they are an internal/operator/Codex product-agent mechanism for controlled library onboarding. They are not a user-facing upload workflow.

Frontend implication: do not build a general "upload your part" surface. Users can select supported parts/options, while unsupported or new components should become a controlled sourcing/library task handled by Forge.
