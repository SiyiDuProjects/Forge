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

Enclosure boundary:

- All MVP enclosures use standardized 3D printing only.
- Woodgrain, sage, graphite, brand color, and similar requests are treated as surface finish or texture choices on the same 3D printed enclosure family.
- Do not represent walnut, wood, metal, CNC, injection molding, or other enclosure processes as available MVP manufacturing paths.
- Enclosure review should focus on screen fit, board standoffs, connector access, print tolerance, assembly, and bounded geometry validation.
- The 3D surface is a prototype-result preview, not a modeling editor. It should make the planned prototype feel tangible without moving Forge into CAD, mesh editing, material authoring, or parametric modeling workflows.

## 4. Interface Scope

### Left Sidebar

Purpose: Navigate project history and internal ProductPlan drafts.

Current direction:

- `对话生成`
- `项目历史`
- `审核包`
- Forge project: `Forge Lab`
- Drafts such as `木纹桌面屏` and `人工扩展草案`
- `Forge 设置`

Avoid:

- Generic Codex labels that do not map to hardware
- Extra placeholder buttons with no workflow meaning

### Center Thread

Purpose: Show the build request, agent summary, and command-style run log.

Required content:

- User request bubble
- Bench agent response
- Prominent `原型快照` result card after the bench response
- ProductPlan revision run log
- Bottom composer with hardware-specific controls

Composer actions:

- `+` add build input
- `范围`
- `零件`
- `风险`
- `3D预览`
- Send/update ProductPlan button

### Right Inspector

Purpose: Live structured output, not a generic dashboard.

Current sections:

- `原型结构预览（3D）`
- `范围`
- `零件清单（BOM）`
- `电子零件布局`
- `估算+假设`
- `风险限制`
- `审核提交状态`

Visual direction:

- More like Codex inspector output than rounded dashboard cards
- Keep the prototype structure preview near the top and expanded by default.
- Use layer states rather than CAD-style camera presets: `外观层` shows the outside shell as the product result, and `元器件层` makes the shell transparent so internal components, interface markers, cable routes, and risk colors can be inspected.
- Low shadow
- Thin dividers
- Dense, scan-friendly sections
- Hardware controls still usable and clear

### Floating UI

Required floating surfaces:

- Thread menu
- Add build input menu
- MVP 范围 popover
- 零件清单（BOM）popover
- 风险限制 popover
- 原型结构预览（3D）popover
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
- Conversation-first ProductPlan flow with project history, center chat, and live right-side plan packet
- Center `原型快照` result card that gives the 3D preview stronger product presence without turning the app into a modeling tool
- Right-side `原型结构预览（3D）` section pinned near the top, expanded by default, with `外观层` and `元器件层` transparency states
- Three complete mock scenarios: Woodgrain desk display, Motion companion, and Booth counter unit
- Expanded UI-only flow states for request parsing, scope, parts list (BOM), risk limits, quote, behavior rules, and manufacturing check (DFM) packet
- Popovers for add input, scope, parts list (BOM), risk limits, manufacturing check (DFM), thread actions, and bench settings
- Bilingual UI copy across the shell, mock scenarios, popovers, inspector, and settings
- Language settings panel with `简体中文` and `English` options
- Git repository initialized
- README, architecture, contract, and observability docs
- Node built-in tests for pipeline behavior, blocking rules, firmware preview, contracts, and bilingual UI assets
- GitHub Actions workflow that runs `npm run check`
- JSON request logging in the local server

Implementation boundary:

- The current UI is a complete clickable prototype, not a real manufacturing workflow.
- Actions should change visible UI state, ProductPlan revision, popover content, contact state, or local review submission state.
- Current visible UI language supports Simplified Chinese and English.
- Do not add real upload, real checkout, real supplier ordering, user-facing CAD export, or real manufacturing calls without a product direction change.
- The current 3D core is a bounded deterministic generator and CadQuery/OpenCascade adapter boundary, not a full CAD platform.
- SolidWorks is only an internal STEP handoff target for reviewers, not a user-facing generation core.
- The 3D preview should remain a result/evidence surface. Users may rotate, zoom, pan, and switch between appearance/component transparency layers, but cannot drag parts, edit holes, or directly modify geometry.
- Conversation turns can update `GeometrySpec` and validation without writing GLB/STL/STEP; a clear confirmation such as "生成模型", "现在造一下", or "build it" is required before model artifacts are written.

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

Status: ProductPlan API, conversation-first v1, bounded GeometrySpec artifact generation, and confirmed placed-part GLB pass complete.

- Keep user turns creating ProductPlan revisions.
- Keep prototype structure preview (3D), electronics layout, quote, and review submission on unified jobs.
- Keep `GeometrySpec` as the only 3D-generation input source; do not generate CAD directly from chat prose.
- Keep normal conversation revisions in `pending_confirmation`; only confirmed generation revisions should attach GLB/STL/STEP artifacts.
- Keep GLB user preview with placed part volumes, interface markers, cable-route lines, and risk markers. Keep STL shell-only for print/quote handoff and STEP as the internal SolidWorks/engineering handoff.
- Keep the viewer read-only except rotate, zoom, pan, risk markers, and appearance/component layer switching.
- Keep non-standard hardware in `manual_expansion_draft`.

Real-generation direction:

- Long conversation context may be delegated to an open-source memory/chat-context project later; do not design Forge as if this layer has already been chosen.
- The first-generation core route is `ProductPlan revision -> GeometrySpec -> confirmed generation -> CadQuery/OpenCascade target -> GLB user preview + STL/STEP internal files`.
- The structured generation state describes selected options and physical build state: requested modules, camera/battery decisions, enclosure finish, part positions, mounting holes, interface directions, connector openings, and other geometry-relevant constraints.
- The parts library should keep expanding machine-readable physical metadata such as dimensions, mounting hole patterns, interfaces, clearance needs, and fit notes.
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

- Tune visual density after a stable unrestricted-browser screenshot capture.
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
- Test add-build-input menu
- Test MVP scope popover
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
- Right inspector reads as a live build output surface, not a generic dashboard.
- A normal request produces a ProductPlan revision with scope, parts list (BOM), GeometrySpec, pending prototype structure preview (3D), electronics layout, quote assumptions, and risk limits.
- A confirmed generation request writes a new revision with GLB/STL/STEP, validation report, and placed part volumes in the GLB.
- The 3D preview is visible as an outcome snapshot and allows rotate, zoom, pan, and appearance/component layer switching, but does not introduce modeling-editor behavior.
- A camera/battery request remains reviewable and shows clear human-review risk messaging.
- A motion request is blocked from the standard desktop screen path.
- `提交审核下单` writes a local human review packet and states that no payment or manufacturing has started.
- Browser interaction verification has been completed after local server access is available; screenshot capture should still be repeated when the Browser capture path is stable.

## 10. Immediate Next Steps

1. Capture a stable desktop screenshot in an unrestricted browser session.
2. Tune right inspector spacing and density from that screenshot.
3. Deepen the ProductPlan right-side sections as read-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
