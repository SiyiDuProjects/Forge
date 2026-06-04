---
received_date: 2026-06-04
source_context: Local clone and static review of liuup/claude-code-analysis plus user direction about a file-backed hardware Codex/Claude Code style workbench
related_task: Claude Code source analysis for Forge integration planning
status: summarized
key_handles: claude-code-analysis, file-backed hardware project, hardware codex, ProductPlan folder, Tool protocol, append-only transcript, GeometrySpec source of truth
---

# Claude Code Analysis And Forge File-Backed Direction Notes

## Source

- External repository: `https://github.com/liuup/claude-code-analysis`
- Local clone: `external/claude-code-analysis`
- Reviewed clone commit: `7b7b915`
- Repository structure observed locally:
  - `README.md`
  - `analysis/`
  - `analysis/components/`
  - `src/`
  - `src.zip`

The repository describes itself as a static analysis package for Claude Code source. The local `src/` tree contains 1902 TypeScript/TSX source files. The analysis corpus contains long-form markdown chapters covering architecture, security, memory, tool calls, MCP, sandboxing, context management, prompt management, multi-agent, session storage, components, comparison, file tree, and summary.

## Useful Claude Code Patterns For Forge

The most relevant mechanism is not the full CLI/TUI product. It is the separation of runtime responsibilities:

```text
entrypoints / UI
  -> query or action execution core
  -> tool/action protocol
  -> permissions and validation
  -> append-only state / transcript
  -> memory or file indexes
  -> generated artifacts
```

Potentially reusable ideas for Forge:

- Treat callable actions as protocol objects, not plain functions. Claude Code `Tool` includes schema, validation, permission, read-only/destructive/concurrency flags, result mapping, progress, and UI rendering metadata. Forge already has a thin version of this in `src/core/forge_actions.mjs`.
- Keep model or chat output behind controlled actions. Forge should continue to route through `getWorkspaceSummary`, `proposeDesignChange`, `stageDesignPatch`, `commitStagedChange`, `validateDesign`, `regenerateRevision`, `revertRevision`, and `getRevisionArtifacts`.
- Use a file-backed project folder as the durable source, but keep generated artifacts separate from editable source. ProductPlan/revision/GeometrySpec/component descriptors should be source or locked revision evidence; GLB/STL/STEP should stay generated artifacts.
- Use append-only logs for conversation, plan changes, proposal lifecycle, artifact generation, validation, and review actions. Claude Code's session JSONL model is useful, but Forge does not need its full resume graph repair, sidechain, or remote ingress complexity at MVP scale.
- Use file indexes instead of loading every raw artifact into context. Claude Code memory uses `MEMORY.md` as an index with truncation and relevant recall. Forge can use project-level indexes for plan files, component selections, source references, generated outputs, and review packets.
- Use context compaction and reinjection only around Forge objects that matter: current ProductPlan, current revision, pending proposals, validation state, and artifact manifest. Avoid carrying full chat history or raw generated file content by default.
- Keep prompt/runtime instructions sectioned and inspectable. Claude Code's prompt runtime splits default policy, context, dynamic sections, append prompts, and task-specific prompts. Forge can use a simpler hardware-specific prompt section system for plan interpretation, proposal creation, geometry validation, and review packet generation.
- Treat UI messages as typed workflow events. Claude Code has typed message renderers for user text, assistant text, tool use, tool result, permission denial, compact boundary, and task notifications. Forge can use typed ProductPlan events: user request, parser result, plan patch, validation warning, generation confirmation, artifact generated, review submitted.

## Parts That Should Not Be Copied Into Forge Now

- Full terminal UI/Ink component system.
- Full Claude Code CLI surface, slash command catalog, command history, vim editing, voice, browser/desktop bridge, remote control, daemon, or background session system.
- Full MCP client/server platform unless Forge explicitly becomes an external tool marketplace.
- Full multi-agent/swarm/team memory runtime.
- Full shell sandbox. Forge should only need this if it starts executing arbitrary user/model shell commands.
- Telemetry, feedback-survey, transcript-upload, or product analytics systems from Claude Code.
- User-facing code-agent concepts that do not map to hardware prototyping.

## New Forge Direction From User

The user is considering making Forge a hardware version of Codex/Claude Code: the system would really generate project source files and store each hardware project as a folder.

Working interpretation:

```text
Forge project folder
  ProductPlan.md or product_plan.json
  project_manifest.json
  events.jsonl
  revisions/
    rev-.../
      product_plan.json
      geometry-spec.json
      component_selections.json
      component_descriptors.json
      component_asset_manifest.json
      validation_report.json
      design_summary.md
      artifacts/
        model.glb
        shell_front.stl
        shell_back.stl
        model.step
  source-materials/
  review/
```

Important boundary:

- `ProductPlan` should remain the central editable object.
- `GeometrySpec` should remain the only 3D-generation input for a locked revision.
- `ComponentDescriptor v2` should remain the source for component mechanical metadata.
- Generated GLB/STL/STEP should be artifacts, not editable source.
- Raw chat prose should create proposals or patches, not directly write model files.

Open integration question:

- Which subset of Claude Code's file-backed runtime should be adapted to Forge so the product feels like a real hardware workbench without becoming a generic coding agent or CAD platform?
