# Forge Project Plan

## 1. Project Goal

Forge is a hardware-build workbench inspired by Codex's product experience, but it is not a clone of Codex content.

The product should let a user describe a custom desk hardware idea, then convert that request into a practical MVP prototype plan packet:

- Parsed product intent
- Hardware scope
- Parts list (BOM) and stocked parts
- Risk limit / risk report
- Quote band
- Device behavior rules (firmware preview)
- Manufacturing check (DFM) packet for human review
- Standardized 3D printed enclosure plan
- ProductPlan revisions created from ongoing conversation
- Prototype structure preview (3D) and electronics-layout generation jobs
- Stable Forge action contract for future chat/tool-calling layers to inspect, propose, stage, commit, validate, regenerate, revert, and retrieve artifacts without owning Forge state

The UI should preserve the Codex interaction model: left workspace sidebar, center thread, bottom composer, right-side live output/inspector, settings dialog, and floating menus. The visible labels, buttons, workflows, and output content must be our own hardware-build language.

## 2. Original Requirement Summary

The initial requirement was:

- Build the full Codex-style interface, not only a partial demo.
- Include detailed UI states such as settings, floating windows, menus, button hover/active states, progress output, and right-side panels.
- Use screenshots / computer observation as design reference.
- Use Browser verification to compare the implemented UI with the intended experience.
- Change button content for our product instead of keeping every Codex button.
- Delete or avoid buttons that do not fit the hardware workflow.
- Make the interface visually close in structure and interaction, while replacing the product meaning with our own.

Current interpretation:

Codex is the interaction reference. Forge is the product. The implementation should borrow structure, density, and behaviors, but the information architecture should be for hardware prototyping.

## 3. Product Positioning

Forge is for early hardware MVP planning.

Primary user:

- Founder or product builder describing a custom hardware object
- Hardware operator checking feasibility, cost, and manufacturing readiness
- Internal reviewer deciding whether a prototype can move forward

Primary job:

Turn a natural-language hardware idea into a constrained, priced, reviewable prototype plan packet.

Non-goals for the first MVP:

- Real manufacturing checkout
- Camera/battery certification workflow
- User-facing CAD/modeling editor
- Full manufacturing-grade CAD automation or SolidWorks automation
- Real supplier ordering
- User accounts and team permissions
- Real AI memory or external data integrations
- Full chatbot framework integration; future chat runtimes must call Forge actions instead of owning ProductPlan, GeometrySpec, artifacts, or files

Enclosure boundary:

- All MVP enclosures use standardized 3D printing only.
- Woodgrain, sage, graphite, brand color, and similar requests are treated as surface finish or texture choices on the same 3D printed enclosure family.
- Do not represent walnut, wood, metal, CNC, injection molding, or other enclosure processes as available MVP manufacturing paths.
- Enclosure review should focus on screen fit, board standoffs, connector access, print tolerance, assembly, and bounded geometry validation.
- The 3D surface is a prototype-result preview, not a modeling editor. It should make the planned prototype feel tangible without moving Forge into CAD, mesh editing, material authoring, or parametric modeling workflows.

## 4. Interface Scope

### Left Sidebar

Purpose: Start a new ProductPlan and select an existing project/revision without making history or review feel like separate primary products.

Current direction:

- One primary `新项目` button at the top.
- `新项目` should stay visually neutral by default with no filled background; use a subtle background only on hover/focus interaction.
- A compact project/revision list below it. ProductPlan revisions such as `r4`, `r3`, and `r2` are selected from this list instead of a separate `项目历史` tab.
- Project/revision rows show only the project name in the visible UI; do not add subtitle explanations such as status, model state, or quote text under each row.
- The `方案菜单` / project actions `...` button belongs on the right side of the left-sidebar `项目` header, not in the center thread topbar.
- `Forge 设置` stays in the lower-left footer.
- Review submission APIs and internal review material remain available through the plan/review flow, but `审核包` should not be a left-sidebar primary entry during the current 3D-generation focus.

Avoid:

- Generic Codex labels that do not map to hardware
- Extra placeholder buttons with no workflow meaning
- Large thread cards that make project rows look like equal top-level views
- Separate left-sidebar blocks for `对话生成`, `项目历史`, or `审核包`
- Fake operating-system chrome such as macOS traffic-light window controls in the web prototype, unless Forge is actually running inside a native Mac shell.

### Center Thread

Purpose: Show the build request, agent summary, and command-style run log.

Required content:

- User request bubble
- Bench agent response
- Prominent `原型快照` result card after the bench response
- ProductPlan revision run log
- Bottom composer for hardware request entry and send/update only

Composer actions:

- Send/update ProductPlan button
- Do not keep `+`, `范围`, `零件`, `风险`, or `3D预览` chips in the composer unless they become real implemented workflows. Current scope/parts/risk/model information lives in the thread, right inspector, and explicit model-generation controls.

### Right Inspector

Purpose: Focused live structure output, not a generic dashboard or review packet page.

Current sections:

- `原型结构预览（3D）`

The right inspector should keep the 3D preview, `外观层` / `元器件层` layer controls, shell path, dimensions, and structure checks visible. The generated/pending 3D state belongs in the section header summary, not as a duplicate fact row. Scope, parts list (BOM), quote, risk limits, and review status can remain in the ProductPlan thread/run log and review flow, but should not make the inspector feel like a stacked packet list.

Visual direction:

- More like Codex inspector output than rounded dashboard cards
- Keep the prototype structure preview near the top and expanded by default.
- Use layer states rather than camera presets: switching `外观层` / `元器件层` must not rotate, pan, zoom, or reset the current view. `外观层` keeps normal/default material opacity, so the 3D printed shell stays opaque and any genuinely exposed components remain visible. `元器件层` keeps the same camera and makes every shell surface semi-transparent so internal components, interface markers, cable routes, and risk colors can be inspected.
- Layer implementation must cover shell nodes, shell materials, shell roles, and shell-derived structural feature nodes such as openings, cutouts, windows, vents, standoffs, and bays. Browser verification must use screenshots to confirm the main visible shell turns transparent; a tiny pixel diff or a single small part changing color is not enough.
- Add a compact fullscreen preview button on the 3D preview itself; it should open a larger read-only preview and allow returning to the normal inspector size.
- Show generated artifact links only as compact read-only evidence links after confirmed generation; do not make them CAD editing, export, checkout, or production controls. Review contact/person fields belong in the separate submission dialog.
- Keep the preview, layer controls, and structure fact rows on one consistent indentation grid; avoid flex rows that make labels, values, and chips jump between different left edges.
- Avoid instruction paragraphs under the inspector preview; interaction affordances should be discoverable from the 3D surface and the fullscreen button.
- Low shadow
- Thin dividers
- Dense, scan-friendly sections
- Hardware controls still usable and clear

### Floating UI

Required floating surfaces:

- Thread menu
- Prototype structure preview (3D) popover from explicit preview actions
- Review contact dialog for `提交审核下单`
- Forge 设置 dialog

Settings sections:

- 工作室
- 零件
- 生产检查
- 设备行为
- 语言

## 5. Current Implementation Status

Implemented:

- Static HTML/CSS/JS single-page app
- Local Node server
- Core hardware pipeline modules
- Natural-language interpretation
- Module matching
- Risk guardrails
- Quote estimation
- Product blueprint generation
- Firmware rule generation
- Review/manufacturing-check submission path
- ProductPlan center object with conversation, revisions, assets, jobs, and review submission
- Unified generation jobs for prototype structure preview, electronics layout preview, quote estimate, review packet, and AI chat reserved capability
- Asset metadata registration for text, image, and reference URL inputs
- `GeometrySpec` generated from the locked ProductPlan revision as the single 3D-generation input
- Module geometry metadata for dimensions, mounting, interface direction, clearance, and risk tags
- Confirmed-generation v1 model artifacts under `data/models`: GLB preview with placed part volumes, STL shell-only print/quote handoff, STEP engineering handoff with placement summary, validation report, and CadQuery adapter script
- Geometry validation for missing module geometry, camera/battery review warnings, standard shell fit, interface directions, cable route placeholders, and blocked motion structures
- Prototype structure preview presented as a result snapshot; normal conversation keeps it pending until the user confirms generation
- UI-only electronics layout preview with positions, interface directions, cable notes, and conflict checks
- Conversation-first UI that calls the backend ProductPlan pipeline and falls back locally if needed
- Codex-like shell layout
- Floating layer and popovers
- Bench settings dialog
- Hardware-specific button labels
- Right inspector changed toward flat section styling
- Local fallback when API fetch fails, so the UI can still render a complete bench draft
- Conversation-first ProductPlan flow with compact left-side project/revision selection, center chat, and live right-side plan packet
- Center `原型快照` result card that gives the 3D preview stronger product presence without turning the app into a modeling tool
- Right-side `原型结构预览（3D）` section pinned near the top, expanded by default, with `外观层` and `元器件层` transparency states
- Three complete mock scenarios: Woodgrain desk display, Motion companion, and Booth counter unit
- Expanded UI-only flow states for request parsing, scope, parts list (BOM), risk limits, quote, behavior rules, and manufacturing check (DFM) packet
- Popovers/dialogs for manufacturing check (DFM), thread actions, review contact submission, and bench settings
- Composer placeholder shortcuts removed; scope, parts list (BOM), and risk limits remain visible through the ProductPlan thread output, while the right inspector focuses on 3D state instead of composer chips.
- Right inspector simplified to a 3D-focused panel: preview canvas, layer controls, shell dimensions, structure checks, and model state only.
- Bilingual UI copy across the shell, mock scenarios, popovers, inspector, and settings
- Language settings panel with `简体中文` and `English` options
- Git repository initialized
- README, architecture, contract, and observability docs
- Lightweight work and source-material indexes for future context recovery
- Node built-in tests for pipeline behavior, blocking rules, firmware preview, contracts, and bilingual UI assets
- GitHub Actions workflow that runs `npm run check`
- JSON request logging in the local server
- Forge action contract in `src/core/forge_actions.mjs` with workspace summaries, component search, proposal creation, staged patches, committed patch application, regeneration, validation, revert, artifact retrieval, structured patch errors, and HTTP wrappers under `/api/workspaces/:workspaceId/...`
- Proposal storage on `workspaceState.proposals` with proposed/staged/committed/rejected lifecycle states

Implementation boundary:

- The current UI is a complete clickable prototype, not a real manufacturing workflow.
- Actions should change visible UI state, ProductPlan revision, popover content, contact state, or local review submission state.
- Current visible UI language supports Simplified Chinese and English.
- Do not add real upload, real checkout, real supplier ordering, user-facing CAD export, or real manufacturing calls without a product direction change.
- The current 3D core is a bounded deterministic generator and CadQuery/OpenCascade adapter boundary, not a full CAD platform.
- SolidWorks is only an internal STEP handoff target for reviewers, not a user-facing generation core.
- The 3D preview should remain a result/evidence surface. Users may rotate, zoom, pan, and switch between appearance/component transparency layers, but cannot drag parts, edit holes, or directly modify geometry.
- Conversation turns can update `GeometrySpec` and validation without writing GLB/STL/STEP; a clear confirmation such as "生成模型", "现在造一下", or "build it" is required before model artifacts are written.
- Future chatbot, agent, or tool-calling layers must use the Forge action contract instead of directly mutating files, meshes, `GeometrySpec`, GLB, STL, STEP, or ProductPlan internals.

Known local verification limits:

- Managed Codex sandbox runs can still block local server binding with `listen EPERM`, and sandboxed localhost requests may fail even when the server is running. Treat these as environment limits before treating them as app bugs.
- The latest consistency pass was verified against an unrestricted local server on `http://127.0.0.1:8766` using Browser interaction checks and live API checks.
- Browser screenshot capture timed out during this pass. Future visual polish should still capture a stable screenshot in an unrestricted browser session.

## 6. Button And Content Rules

Use plain-language-first hardware workflow language. The user-facing label should explain the concept before showing the acronym:

- 原型方案包
- 零件清单（BOM）
- 风险限制
- 报价区间
- 生产可行性（DFM）
- 设备行为规则（固件）
- 范围
- USB-C 桌面供电

Avoid making the main label only `BOM`, `DFM`, `护栏`, `打样`, or `固件规则`. These are allowed as secondary terms when paired with plain wording, such as `零件清单（BOM）` and `生产可行性（DFM）`.

Avoid generic inherited labels from earlier Codex-style drafts:

- Generic copy/review labels that do not describe a bench packet action
- Generic goal labels with no product-specific scope surface
- Sidebar labels that do not map to parts, manufacturing check, device behavior, or build flow

Rule:

A button should exist only if it maps to a real hardware-build workflow. If a Codex button does not have a useful equivalent, remove it instead of renaming it vaguely.

Language rule:

- The current product UI must preserve both Simplified Chinese and English versions.
- New visible buttons, statuses, dialogs, inspector sections, empty states, mock data, and docs must update both languages in the same change.
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, and TFT, but visible labels should explain the term in Chinese first.
- User-facing 3D copy should say `3D 模型`, `原型预览`, `零件布局`, and `可旋转查看`. Reserve CAD, SolidWorks, STEP, STL, and GLB wording for internal engineering notes, review packets, and implementation docs unless the user explicitly asks for engineering file details.
- The settings dialog language switch must keep both `简体中文` and `English` selectable.

## 7. MVP Flow

1. User describes a hardware idea.
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate flags camera and battery for human review and blocks motion structures from the standard path.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision from the conversation turn.
7. The model-generation job locks a `GeometrySpec`, validates geometry, and waits for explicit generation confirmation before writing GLB/STL/STEP.
8. Generation jobs attach a prototype structure preview (3D), electronics layout, quote assumptions, and validation report to the revision.
9. User enters name and email, then clicks `提交审核下单`.
10. The app writes a local human review packet; no payment or manufacturing starts.

## 8. Engineering Plan

### Phase 1: Interface Foundation

Status: mostly complete.

- Codex-like shell
- Sidebar
- Thread
- Composer
- Inspector
- Floating menus
- Settings

### Phase 2: Product Language Fit

Status: current UI pass complete; keep auditing during future changes.

- Replace all generic Codex-style labels
- Remove buttons that do not fit the hardware workflow
- Make right inspector feel like a live build output surface
- Keep user-visible content tied to hardware MVP planning
- Keep all visible UI copy available in both Simplified Chinese and English

### Phase 3: Workflow Depth

Status: ProductPlan API, conversation-first v1, bounded GeometrySpec artifact generation, confirmed placed-part GLB, ComponentDescriptor v2 mechanical proxy pass, and Forge action contract complete. The first descriptor-driven hardware prototype generator path is implemented for the standard desktop display archetype, and future chat/tool-calling layers now have a controlled backend action surface.

- Keep user turns creating ProductPlan revisions.
- Keep prototype structure preview (3D), electronics layout, quote, and review submission on unified jobs.
- Keep `GeometrySpec` as the only 3D-generation input source; do not generate CAD directly from chat prose.
- Keep normal conversation revisions in `pending_confirmation`; only confirmed generation revisions should attach GLB/STL/STEP artifacts.
- Keep GLB user preview with placed part volumes, interface markers, cable-route lines, and risk markers. Keep STL shell-only for print/quote handoff and STEP as the internal SolidWorks/engineering handoff.
- Keep the viewer read-only except rotate, zoom, pan, risk markers, and appearance/component layer switching.
- Keep non-standard hardware in `manual_expansion_draft`.
- Keep future AI/chat runtimes outside direct Forge state mutation; they should call actions for summary, component search, proposal, patch application, validation, regeneration, revert, and artifact retrieval.

Implemented V1 conversational hardware prototype path:

- Treat the conversation-derived `ProductPlan` / `WorkspaceState` as structured state. The generator does not create geometry directly from raw chat prose.
- Use a finite `ComponentDescriptor` library for known hardware modules: display, core board, USB-C breakout, ambient sensor, speaker, camera, battery, and button descriptors.
- Store ComponentDescriptor v2 assets under `src/core/component_assets/<component_id>/descriptor.json` with companion `sources.md` notes. Current seed assets are mechanical proxies with explicit `unverified_proxy` validation status, not vendor-verified mechanical models.
- Resolve component assets by purpose through `resolveComponentAsset(componentId, purpose)`: preview, mechanical, validation, and manufacturing. Current fallback uses procedural visual/mechanical proxies unless vendor/proxy asset paths are later added.
- Write `component_descriptors.json` and `component_asset_manifest.json` for each confirmed revision so the generated model can be traced back to descriptor asset quality, validation status, and source paths.
- Run deterministic component selection before geometry: pick supported modules, preserve assumptions and risk tags, and keep unsupported/missing geometry from producing fake artifacts.
- Convert selected components into a `GeometrySpec` through a layout engine that derives enclosure dimensions, screen opening, USB-C rear opening, standoffs, interface points, and coarse cable routes.
- Derive openings, standoffs, connector markers, routes, keepouts, and access-volume markers from descriptor fields such as `externalFeatures`, `mountingHoles`, `connectors`, `keepouts`, and `accessVolumes`; do not infer those semantics from arbitrary mesh geometry.
- Validate the `GeometrySpec` before writing files. Missing component descriptors, invalid schema, missing dimensions, route endpoints without real connectors, blocked motion structures, and insufficient geometry should stay visible as blocked or pending states instead of silent model output.
- Generate a semantic `model.glb` with stable nodes under `shell.*`, `feature.*`, `module.*`, `interface.*`, and `route.*`. The current GLB shows a standard desktop display shell, screen opening, rear USB-C opening, ambient sensor opening, back-frame access, core board, USB-C, ambient sensor, mounting points, connector markers, keepout/access-volume proxy markers, chips, and cable-route geometry.
- Keep shell print handoff split into `shell_front.stl` and `shell_back.stl`; electronics are excluded from printable STL output.
- Persist generation evidence files with each revision: `product_plan.json`, `geometry-spec.json`, `component_selections.json`, `component_descriptors.json`, `component_asset_manifest.json`, `model.glb`, shell STL files, `design_summary.md`, `validation_report.json`, STEP handoff summary, and the CadQuery adapter script.
- Keep the UI as a read-only result preview. Users can switch `外观层` / `元器件层`, rotate, zoom, pan, view component asset quality, view warnings, and open generated evidence links, but they cannot drag parts, edit holes, or modify geometry directly.

Implemented Forge action contract:

- `getWorkspaceSummary` returns compact workspace state for chat/UI context without embedding large artifact content.
- `searchComponentLibrary` exposes finite ComponentDescriptor-backed supported components and camera/battery review risks.
- `proposeDesignChange` creates proposal records from user messages without creating committed revisions.
- `stageDesignPatch` stores explicit structured patches as staged proposals without generating committed revisions.
- `commitStagedChange` commits a proposal through the existing ProductPlan revision and artifact-generation path.
- `applyDesignPatch` applies explicit patches immediately for clear user commands and creates a generated revision.
- `regenerateRevision` creates a fresh revision from the same design intent when generation code or descriptors change.
- `validateDesign` validates current state, staged proposals, or explicit patches without writing model artifacts.
- `revertRevision` switches the current workspace back to a known revision without AI involvement.
- `getRevisionArtifacts` returns compact artifact links and metadata for ProductPlan, GeometrySpec, component selections, descriptors, asset manifest, GLB, shell STL, validation report, and design summary.
- `rejectStagedChange` marks proposals rejected so they cannot be committed later.
- Patch validation fails safely for unknown patch types, unknown paths, unknown components, unsupported component types, unsupported semantic positions, and unsupported shape profiles.

Real-generation direction:

- Long conversation context may be delegated to an open-source memory/chat-context project later; do not design Forge as if this layer has already been chosen.
- The first-generation core route is `ProductPlan revision -> GeometrySpec -> confirmed generation -> CadQuery/OpenCascade target -> GLB user preview + STL/STEP internal files`.
- The structured generation state describes selected options and physical build state: requested modules, camera/battery decisions, enclosure finish, part positions, mounting holes, interface directions, connector openings, and other geometry-relevant constraints.
- The parts library should keep expanding machine-readable physical metadata such as dimensions, mounting hole patterns, interfaces, clearance needs, and fit notes.
- Future real supplier assets should be attached through descriptor asset paths such as `vendor.glb`, `vendor.step`, `proxy_visual.glb`, and `proxy_mechanical.step`; the current implementation reserves those slots but does not require files to exist.
- The current runtime writes deterministic v1 artifacts and emits a CadQuery script after confirmation; a later service can replace that writer with real CadQuery/OpenCascade execution.
- SolidWorks is not the first-generation core. Forge exports STEP as an internal reviewer/post-processing target that an engineer can open in SolidWorks.
- "Connections" in the first version mean interface direction and coarse cable routing shown in GeometrySpec, GLB nodes, and canvas preview: USB-C, display ribbon, sensor/speaker/camera/battery interfaces, rough route paths, and interference risk. They do not mean PCB design, schematic generation, circuit verification, or electrical validation.
- LLM usage should be tool-oriented: OpenAI API calls can receive prompts that explain cost/constraint tradeoffs, ask clarifying questions until enough information is available, then call tools such as parameter update, model generation, or conversation summarization.
- This path does not change the remaining boundary: no user-facing CAD editor, real manufacturing, checkout, supplier ordering, certification workflow, or external production flow is part of the current MVP until explicitly prioritized.

Future Markdown-first ProductPlan direction:

- ProductPlan should eventually be organized around local Markdown files. The main Markdown file represents the current buildable plan state.
- Each conversation turn can update a visible "pending generation instruction" or main-file draft, but it should not regenerate a model after every message.
- A new revision should be created only after the user confirms intent with language such as "build it now", "generate the model", or "this is ready".
- Each revision should save a main-file snapshot, the conversation-change file used for that round, generated 3D output, quote output, and review packet.
- Version rollback should restore the selected main-file snapshot and allow continued edits from the related conversation-change file.
- The 3D preview should show generated output only after confirmation. If nothing has been generated or if required information is missing, the UI should show pending-generation or insufficient-information state instead of fake GLB/STL/STEP completion.
- Camera and battery can enter the structure preview path, but must be marked as human-review risks. Motion structures should still become manual expansion drafts rather than normal standard-shell revisions.
- Future quotes should come from 3D print pricing, parts pricing, labor cost, and profit/risk buffer. This does not add a real pricing model to the current MVP.
- Tool-calling boundaries should include updating the main file, checking parts, generating structure, estimating price, and generating a review packet. Separate conversation summarization is not required because the pending generation instruction is the maintained source of truth.

Next:

- Keep tuning right-inspector density from real desktop screenshots.
- Add richer contact/review affordances after internal testing.
- Decide later whether the deterministic writer should be replaced by a real CadQuery/OpenCascade service, Onshape integration, or another engineering adapter.

### Phase 4: Verification

Required:

- Run `npm run check`, which includes syntax checks and tests
- Start local server
- Open in Browser
- Capture desktop screenshot
- Test settings dialog
- Test thread menu
- Confirm the composer has no placeholder shortcut chips.
- Confirm the right inspector only shows generated artifact links as read-only evidence for generated revisions, with no modeling, CAD editing, checkout, or production controls.
- Confirm the right inspector has no duplicated 3D status row or review contact/person fields.
- Confirm the 3D fullscreen preview opens, keeps layer switching, and can be closed back to the compact inspector.
- Test prototype structure preview (3D) popover and `外观层` / `元器件层` transparency states
- Test camera/battery human-review risk flow
- Test blocked motion flow
- Test successful local human review packet flow
- Compare right inspector against the intended Codex-style density

## 9. Acceptance Criteria

The project should not be considered done until:

- The first viewport looks like a coherent Codex-style workbench.
- All visible buttons use Forge hardware language.
- Unneeded Codex-style buttons are removed.
- Settings and floating menus open, close, and show useful product-specific content.
- Right inspector reads as a focused 3D structure preview, not a generic dashboard or contact form. Read-only generated evidence links may appear after confirmed generation.
- A normal request produces a ProductPlan revision with scope, parts list (BOM), GeometrySpec, pending prototype structure preview (3D), electronics layout, quote assumptions, and risk limits.
- A confirmed generation request writes a new revision with GLB/STL/STEP, validation report, and placed part volumes in the GLB.
- A confirmed generation request also writes ComponentDescriptor v2 evidence: `component_descriptors.json` and `component_asset_manifest.json`.
- Component asset quality and validation status are visible in the UI and generated evidence. Current proxy components must not be presented as production ready.
- The 3D preview is visible as an outcome snapshot and allows rotate, zoom, pan, and appearance/component layer switching, but does not introduce modeling-editor behavior.
- Future chatbot, agent, or LLM tool-calling runtimes can drive Forge by calling a small safe set of backend actions rather than directly mutating files or geometry.
- Proposal and discussion flows can create `workspaceState.proposals` without generating committed revisions.
- Staged/committed action flows preserve revision-specific artifacts and do not overwrite old revision artifacts.
- Patch application rejects unsafe or unsupported changes with structured errors.
- Action schemas and API wrappers are documented in `docs/FORGE_ACTION_CONTRACT.md` and `docs/CONTRACTS.md`.
- A camera/battery request remains reviewable and shows clear human-review risk messaging.
- A motion request is blocked from the standard desktop screen path.
- `提交审核下单` writes a local human review packet and states that no payment or manufacturing has started.
- Browser interaction verification has been completed after local server access is available; screenshot capture should still be repeated when the Browser capture path is stable.

## 10. Immediate Next Steps

1. Capture a stable desktop screenshot in an unrestricted browser session.
2. Continue screenshot-based right inspector spacing checks after each UI pass.
3. Deepen the ProductPlan right-side sections as read-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
7. Keep `docs/WORK_INDEX.md` and `docs/source-materials/INDEX.md` updated after meaningful work blocks or preserved source-material additions.
