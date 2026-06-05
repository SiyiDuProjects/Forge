# Forge

Forge is a Codex-style hardware MVP planning workbench. It turns an ongoing hardware conversation into a `ProductPlan`: scope, parts list (BOM), risk limits, prototype structure preview (3D), electronics layout preview, quote assumptions, and a local human review packet.

当前原型保留中英两套界面文案。默认语言是简体中文，可在 `Forge 设置 -> 语言` 切换到 English。

Current enclosure boundary: every MVP shell is treated as a standardized 3D printed enclosure. Woodgrain, sage, graphite, and branded looks are finish treatments on that shell path, not separate manufacturing processes.

Current order boundary: `提交审核下单` writes a local human review packet only. It does not collect payment, start manufacturing, or contact suppliers.

## What Exists

- Single-page UI prototype in `index.html`, `styles.css`, and `app.js`
- Core planning pipeline under `src/core`
- ProductPlan, asset, job, GeometrySpec, generated model artifact, electronics layout preview, quote assumption, and local review APIs
- Forge action contract under `src/core/forge_actions.mjs` for future chat/tool-calling layers to inspect summaries, stage proposals, apply patches, validate designs, regenerate revisions, revert revisions, and retrieve artifacts without direct mesh or file mutation
- Forge QueryEngine / Chat Runtime V1 under `src/core/forge_query_engine.mjs`, with ContextPack prompt assembly, model adapters, tool schema export, permission gate, tool executor, chat session JSONL, and confirmation flow
- Default UI chat turns use the local Forge tool runtime, so invalid external model keys do not block ProductPlan updates; OpenAI-backed turns are opt-in configuration.
- File-backed Forge project folders under `data/workspaces/<planId>/` with `project_manifest.json`, `product_plan.json`, append-only `events.jsonl`, persistent proposals, immutable revision folders, context markdown indexes, review files, and revision-scoped generated artifacts
- Tool Protocol metadata under `src/core/tool_registry.mjs` and ContextPack summaries under `src/core/context_pack_builder.mjs` for future chat/runtime layers
- Confirmed first-generation model artifacts under `data/models`: GLB with placed part placeholders for preview, STL shell-only print/quote handoff, STEP for internal engineering review, validation reports, and a CadQuery adapter script
- Shared contracts under `src/contracts`
- Project and architecture docs under `docs`
- Lightweight work and source-material indexes for future context recovery
- Node built-in test suite under `tests`
- GitHub Actions check workflow under `.github/workflows/check.yml`

## Run Locally

```bash
npm start
```

The server defaults to `http://127.0.0.1:8765`.

If the managed Codex sandbox reports `listen EPERM`, rerun in a normal local terminal/browser session before treating it as an app bug.

## Verify

```bash
npm run check
```

This runs syntax checks for `server.mjs` and `app.js`, then executes the Node test suite.

## Product Boundary

This is a complete clickable UI prototype, not a real manufacturing system.

- No real upload
- No user-facing CAD editor or direct geometry editing
- No real supplier ordering
- No real payment or checkout
- No real manufacturing order or user-facing export flow
- No enclosure process beyond standardized 3D printing
- No full Claude Code clone, MCP, remote sessions, shell tools, arbitrary file editing, plugin marketplace, or multi-agent runtime
- The current 3D layer validates `GeometrySpec` during conversation and generates deterministic v1 artifacts only after explicit generation confirmation; it is not yet a full CadQuery/OpenCascade service or SolidWorks automation
- SolidWorks is only an internal STEP handoff target, not part of the user flow

Every visible button should still produce a concrete UI state: view switch, popover, panel, filter, mock queue state, or mock notice.

## Key Docs

- [Project Plan](docs/PROJECT_PLAN.md)
- [Work Index](docs/WORK_INDEX.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Contracts](docs/CONTRACTS.md)
- [Forge Action Contract](docs/FORGE_ACTION_CONTRACT.md)
- [Forge QueryEngine](docs/FORGE_QUERY_ENGINE.md)
- [Observability](docs/operations/OBSERVABILITY.md)
- [Source Materials Index](docs/source-materials/INDEX.md)
