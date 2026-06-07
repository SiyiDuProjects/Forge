# Forge

Forge is a Codex-style hardware MVP planning workbench. It turns an ongoing hardware conversation into a `ProductPlan`: scope, parts list (BOM), risk limits, prototype structure preview (3D), electronics layout preview, quote assumptions, and a local human review packet.

当前原型保留中英两套界面文案。默认语言是简体中文，可在 `Forge 设置 -> 语言` 切换到 English。

Current enclosure boundary: every MVP shell is treated as a standardized 3D printed enclosure. Woodgrain, sage, graphite, and branded looks are finish treatments on that shell path, not separate manufacturing processes.

Current order boundary: `提交审核下单` writes a local human review packet only. It does not collect payment, start manufacturing, or contact suppliers.

## What Exists

- Single-page UI prototype in `index.html`, `styles.css`, and `app.js`
- Native macOS client package under `apps/forge-mac`, using SwiftUI for the three-column Mac shell and the existing Forge API as the source of truth
- Core planning pipeline under `src/core`
- ProductPlan, asset, job, GeometrySpec, generated model artifact, electronics layout preview, quote assumption, and local review APIs
- Forge action contract under `src/core/forge_actions.mjs` for future chat/tool-calling layers to inspect summaries, stage proposals, apply patches, validate designs, regenerate revisions, revert revisions, and retrieve artifacts without direct mesh or file mutation
- Forge QueryEngine / Chat Runtime V1 under `src/core/forge_query_engine.mjs`, with ContextPack prompt assembly, model adapters, Codex SDK runtime bridge, tool schema export, permission gate, tool executor, chat session JSONL, and confirmation flow
- Frontend chat turns can run through Codex, Forge QueryEngine, or the deterministic local Forge fallback. Codex stores provider-neutral `runtimeBinding` in the project manifest; Forge still executes changes only through policy-checked Forge actions.
- Frontend runtime controls in `Forge 设置`: `本地 Forge`, `Forge QueryEngine`, and `Codex`, plus a read-only runtime preflight status for Codex SDK availability and project thread state. The center thread projects SDK-native streamed Codex events into a Codex-style processed transcript: running turns stay expanded, completed turns default to `已处理 <duration>` collapsed, final assistant text stays visible as normal conversation text, and expansion shows SDK natural-language text plus safe counts such as `已探索`, `已运行`, `已编辑`, and todo progress. Command/file/tool specifics are hidden at the first level and available only through secondary detail expansion from those `已...` rows. Internal bridge rows such as runtime binding, model request/response, command output, file contents, raw tool input/output, and model provider details are not rendered in the main UI. The right inspector stays focused on the 3D prototype result, component layout, validation, and generated evidence.
- File-backed Forge project folders under `data/workspaces/<planId>/` with `project_manifest.json`, `product_plan.json`, read-only `revision_ledger.json`, append-only `events.jsonl`, persistent proposals, immutable revision folders, context markdown indexes, review files, and revision-scoped generated artifacts
- Tool Protocol metadata under `src/core/tool_registry.mjs` and ContextPack summaries under `src/core/context_pack_builder.mjs` for future chat/runtime layers
- Confirmed first-generation model artifacts under `data/models`: GLB with placed part placeholders for preview, STL shell-only print/quote handoff, STEP for internal engineering review, validation reports, and a CadQuery adapter script
- Descriptor-backed mechanical constraint evidence in GeometrySpec, component asset manifests, validation reports, design summaries, and STEP handoff metadata
- Explainable layout evidence in GeometrySpec, validation reports, GLB extras, design summaries, and STEP handoff metadata so placements, shell features, and cable routes stay traceable to descriptors and ProductPlan preferences
- Standalone Component Truth Registry V0 under `src/core/component_truth_registry.mjs` for read-only descriptor schema validation, linting, `sourceEvidence`, `trustLevel`, `reviewStatus`, missing-field reports, and common hardware module coverage
- ComponentDescriptor package readiness reports through Forge actions, `forge-tool component-package`, and the workspace component-package API so Forge-controlled replacement parts can be reviewed before ProductPlan selection
- ComponentDescriptor draft intake reports through Forge actions, `forge-tool descriptor-draft`, and the workspace draft-package API so proposed same-type parts from the Forge-controlled library pipeline can be checked for library-promotion readiness before becoming selectable ProductPlan inputs
- Workspace ComponentDescriptor draft discovery through `component-drafts/<draftId>/descriptor.json` plus `sources.md`, `forge-tool descriptor-drafts`, and workspace draft APIs so internal/supplier-vetted part packages can be checked before promotion
- Workspace ComponentDescriptor draft scaffolding through `forge-tool descriptor-scaffold` and workspace draft scaffold APIs so controlled same-type part packages start from a blocked, fillable `descriptor.json` plus `sources.md` skeleton instead of ad hoc JSON
- Workspace ComponentDescriptor spec patching through `forge-tool descriptor-specs`, including workspace-local `--specs-file` source notes, and workspace draft spec APIs so explicit source text can fill supported fields in an existing draft while keeping promotion, selection, and generation separate
- Workspace draft origin, explicit spec-patch, integrity, and drift metadata are preserved through ProductPlan component library entries, package/source evidence, GeometrySpec, ContextPack, revision ledger, and generation evidence reports when a promoted draft is selected and generated
- ComponentDescriptor promotion through Forge actions, `forge-tool descriptor-promote`, and the workspace promote-draft API so valid same-type part drafts can become ProductPlan-scoped selectable descriptors without writing Forge source files
- ComponentDescriptor selection through `forge-tool descriptor-select` and the workspace select API so a ready descriptor can create a pending ProductPlan revision without hand-written patch JSON or generated artifacts
- ComponentDescriptor retirement through Forge actions, `forge-tool descriptor-retire`, and the workspace retire API so ProductPlan-scoped promoted descriptors can be excluded from future selection while historical revision evidence remains intact
- Generation evidence reports with source-chain, validation coverage, SHA-256 file integrity metadata, and post-write artifact audit for confirmed GLB/STL/STEP outputs
- Prototype readiness Core V1 under `src/core/prototype_readiness.mjs`: Forge-controlled ElectronicsDescriptor seed evidence and trust report, derived `ElectronicsSpec`, prototype-level electronics validation for voltage, power path, and connector-route alignment, GeometrySpec-linked `AssemblyPlan` feasibility checks, development-board bring-up scaffold, and `PrototypeReadinessReport` persisted with each ProductPlan revision
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

## Run The Mac Client

Start the Forge server first, then open the Xcode app project:

```bash
open apps/forge-mac/ForgeMac.xcodeproj
```

Select the `ForgeMac` scheme and run. The Xcode project sets the app bundle identifier, which avoids Swift-package executable launch warnings around missing bundle identity. The Mac client defaults to `http://127.0.0.1:8765`, uses native SwiftUI/AppKit surfaces for the shell, loads generated GLB previews through a dedicated Three.js `WKWebView`, and keeps ProductPlan, GeometrySpec, Codex runtime state, and generated model artifacts in the existing Forge backend.

## Verify

```bash
npm run check
```

This runs syntax checks for `server.mjs` and `app.js`, then executes the Node test suite.

For the Mac client:

```bash
cd apps/forge-mac
swift build
xcodebuild -project ForgeMac.xcodeproj -scheme ForgeMac -configuration Debug -derivedDataPath DerivedData build
```

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
