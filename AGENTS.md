# AGENTS.md

Project notes for future Codex/agent work in this repository.

## Project

This repo is `Forge`, a Codex-style hardware MVP planning workbench.

It is not a generic Codex clone. Codex is the interaction reference: left workspace sidebar, central thread, bottom composer, right inspector, settings dialog, and floating menus. The product content, labels, outputs, and workflow belong to Forge.

Primary job:

- Convert a natural-language hardware idea into a practical prototype plan packet.
- Produce parsed intent, scope, parts list (BOM), risk limits, quote band, device behavior rules, and a manufacturing check (DFM) packet.
- Allow camera and battery requests to enter structure preview as human-review risk items; keep motion structures outside the standard MVP path unless the product plan changes.
- Keep all MVP enclosures on the standardized 3D printed shell path; surface requests such as woodgrain, sage, graphite, or brand color are finish treatments, not different manufacturing processes.
- Treat `ProductPlan` as the central object. Conversation, revisions, assets, jobs, model preview, electronics layout, quote assumptions, and review submission should hang off the plan or a plan revision.
- Treat `GeometrySpec` as the only 3D-generation input source for a locked revision. Do not generate model files directly from raw chat prose, and do not write GLB/STL/STEP from ordinary conversation turns before explicit generation confirmation.
- Treat the 3D view as a prototype-result preview, not a modeling editor. It should help users understand what the planned prototype will look like and what must be checked, without exposing CAD/modeling controls.

Product planning source:

- `docs/PROJECT_PLAN.md`

Read that file before making broad UI, workflow, naming, or scope changes.

Current product boundary:

- Build a complete clickable UI prototype.
- The first real 3D core is bounded to `ProductPlan revision -> GeometrySpec -> confirmed deterministic artifacts/CadQuery adapter -> GLB/STL/STEP`. Do not broaden it into a CAD editor or manufacturing system.
- Do not add real manufacturing, real upload, real checkout, real supplier ordering, user-facing CAD export, or real production behavior unless the user explicitly changes the product direction.
- Do not broaden the enclosure path beyond standardized 3D printing. Do not add woodwork, CNC, injection molding, metal casing, or SolidWorks/Onshape as the user generation core unless the product direction changes.
- Every visible button must open a concrete view, state, panel, popover, filter, or mock flow result.

## Commands

- Start local server: `npm start`
- Dev alias: `npm run dev`
- Syntax check: `npm run check`

Current known local limitation:

- In the managed Codex sandbox, binding `127.0.0.1:8765` may fail with `listen EPERM`.
- Browser verification against `file://` may also be blocked by Browser URL policy.
- Do not treat those as app bugs without rerunning in an unrestricted local browser/server environment.

## Architecture

- `index.html`: application shell, sidebar, central thread, composer, inspector, settings, and popovers.
- `styles.css`: Codex-inspired desktop UI styling, button states, inspector layout, responsive behavior.
- `app.js`: browser-side state, rendering, read-only canvas/model preview interactions, and UI interactions.
- `server.mjs`: static server and JSON API routes.
- `src/contracts/workbench_contract.mjs`: shared contract constants for chain steps, API routes, statuses, and supported languages.
- `src/core/product_plan.mjs`: ProductPlan creation, turn handling, revision creation, and local review submission orchestration.
- `src/core/jobs.mjs`: unified generation job system for model generation, electronics layout, quote estimate, review packet, and AI chat reserved capability.
- `src/core/geometry_generation.mjs`: GeometrySpec creation, validation, pending-confirmation handling, deterministic placed-part GLB/STL/STEP artifact writing, and CadQuery/OpenCascade adapter script emission.
- `src/core/assets.mjs`: metadata-only asset registration for text, images, references, and generated placeholder assets.
- `src/core/model_preview.mjs`: prototype structure preview output, generated model artifact references, and read-only viewer policy.
- `src/core/electronics_layout.mjs`: placeholder electronics positions, interface directions, cable notes, and conflict checks.
- `src/core/quote_plan.mjs`: pre-review estimate assumptions without fake low/mid/high tiers.
- `src/core/text_interpreter.mjs`: natural-language request interpretation.
- `src/core/module_catalog.mjs`: stocked/deferred module catalog and matching.
- `src/core/risk_gate.mjs`: MVP guardrails and blocked-scope rules.
- `src/core/quote_estimator.mjs`: hardware/build/DFM quote band.
- `src/core/product_spec.mjs`: blueprint/spec generation.
- `src/core/device_config.mjs`: firmware behavior rule generation.
- `src/core/review_queue.mjs`: DFM/review packet persistence.
- `src/core/observability.mjs`: local JSON logging helpers.
- `src/core/pipeline.mjs`: public core pipeline API used by `server.mjs`.
- `tests/core_pipeline.test.mjs`: Node built-in tests for the core flow, blocking rules, firmware preview, contracts, and bilingual UI assets.
- `.github/workflows/check.yml`: CI workflow that runs `npm run check`.

## Product Language

Use plain-language-first Forge hardware workflow language. Put the understandable label first, with the industry acronym in parentheses when useful:

- 原型方案包
- 零件清单（BOM）
- 风险限制
- 报价区间
- 生产可行性（DFM）
- 设备行为规则（固件）
- 3D 打印标准外壳
- 范围
- USB-C 桌面供电

Avoid using hardware jargon as the whole visible label. Do not make primary buttons or sidebar labels say only `打样`, `BOM`, `护栏`, `DFM`, or `固件规则`; pair them with plain wording such as `零件清单（BOM）` or `生产可行性（DFM）`.

Avoid inherited generic Codex labels unless there is a strong product reason:

- Generic copy/review labels that do not describe a bench packet action
- Generic goal labels with no product-specific scope surface
- Sidebar labels that do not map to parts, manufacturing check, device behavior, or build flow

A button should exist only if it maps to a real hardware-build workflow. If a Codex reference button has no useful Forge equivalent, remove it instead of keeping a vague placeholder.

## Language And Copy

The current product UI preserves both Simplified Chinese and English.

- All new visible UI copy must update both languages: buttons, statuses, tabs, dialogs, inspector sections, empty states, mock scenarios, notices, and canvas labels.
- The settings dialog has a language switch with both `简体中文` and `English`.
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, and TFT, but visible labels should explain them in plain Chinese first.
- User-facing 3D copy should say `3D 模型`, `原型预览`, `零件布局`, and `可旋转查看`. Reserve CAD, SolidWorks, STEP, STL, and GLB wording for internal engineering notes, review packets, and implementation docs unless the user explicitly asks for engineering file details.
- When adding a feature, update static copy in `index.html`, dynamic bilingual strings in `app.js`, and project rules in `docs/PROJECT_PLAN.md` or `AGENTS.md` when the behavior changes.
- Do not reintroduce old visible labels such as `Copy spec`, `Submit review`, `Review L1`, `Goal`, `Module library`, `Runtime config`, or `Voice note`.

## UI Direction

Preserve Codex-like interaction structure:

- Left sidebar for workbench navigation and build sessions.
- Center thread for user request, bench agent response, and command-style run log.
- Bottom composer for build request entry and scoped actions.
- Right inspector for live build chain outputs.
- Settings dialog and floating menus for secondary controls.
- The center thread may show a prominent `原型快照` result card after the bench response; this emphasizes the prototype outcome while preserving conversation as the primary workflow.

Required UI-only views:

- `对话生成`: central continuous conversation and ProductPlan revision flow.
- `项目历史`: left-side internal drafts/history.
- `审核包`: local human review packet status.

Right inspector guidance:

- It should read as a live output surface, not a generic analytics dashboard.
- Keep `原型结构预览（3D）` near the top and expanded by default when possible.
- The 3D preview should use layer states rather than CAD-style front/back/exploded view controls: `外观层` shows the outside shell as the primary product result, and `元器件层` makes the shell transparent so placed components, interface markers, cable routes, and risk colors from GeometrySpec are visible. Orbit rotate, zoom, and pan are allowed. Do not add modeling/editor controls such as drag-to-edit geometry, parametric handles, material authoring, CAD export, timeline tools, or mesh operations.
- Prefer thin dividers, low shadow, dense sections, and restrained visual hierarchy.
- Keep controls usable, but avoid large decorative rounded cards.

Composer guidance:

- Keep actions hardware-specific and understandable, such as `范围`, `零件`, `风险`, and `3D预览`.
- The send button creates or updates a ProductPlan revision through the backend API when available.
- The `+` menu is for adding build inputs such as sketches, product references, and CAD outlines.
- Do not keep voice, generic goal, or vague guard buttons unless they have a real UI-only flow in this product.

## MVP Workflow

The expected flow is:

1. User describes a hardware idea.
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate flags camera and battery for human review and blocks deferred motion structures from the standard path.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision and unified generation jobs.
7. GeometrySpec, validation, pending/generated model state, prototype structure preview, and electronics layout are attached to the revision; GLB/STL/STEP are written only after explicit generation confirmation.
8. Local human review packet can be written after name/email are provided.

Do not broaden the MVP into real checkout, real supplier ordering, user-facing CAD editing/export, user accounts, or certification workflows unless the user explicitly asks for that product direction change.

Enclosure-specific rule:

- The MVP only supports standardized 3D printed enclosures.
- Treat walnut/woodgrain, sage, graphite, and brand looks as colors or textures on that standard shell.
- The DFM mock should check module fit, screen opening, board standoffs, connector access, print tolerance, generated geometry validation, and assembly only.
- Motion structures are outside the standard path and should become blocked/manual expansion, not a normal ready packet.

## UI-Only Runtime

The current frontend prefers backend ProductPlan APIs but should keep a local fallback ProductPlan so visual checks do not collapse into a blank `Failed to fetch` state when the local server cannot run inside the sandbox.

The mock UI should stay aligned with the product workflow:

- It should produce request intent, modules, risk limits, quote, blueprint, and device behavior rules.
- It should flag camera and battery as human-review risks and block motion structures from the standard path.
- It should show clear UI-only status text in both supported languages.

## Verification

For code changes, run:

```bash
npm run check
```

`npm run check` runs syntax checks for `server.mjs` and `app.js`, then runs `node --test tests/*.test.mjs`.

For broader UI or behavior changes, also verify:

- DOM ids used by `app.js` still exist in `index.html`.
- Floating dialogs referenced by `openFloating(...)` exist as `data-dialog`.
- Settings tabs have matching settings panels.
- Old generic button labels have not returned.
- `src/contracts/workbench_contract.mjs` still matches API routes and core statuses.
- Geometry generation still emits GLB/STL/STEP only when validation passes and `generateArtifacts` is true; pending, blocked, or missing geometry must not output fake model files.
- Bilingual UI assets still include Simplified Chinese and English.
- ProductPlan revisions, jobs, and local review packets remain covered by tests when changing core APIs.

Useful checks:

```bash
rg -n "Voice note|voiceToggle|Cost guard|Copy spec|Submit review|Review L1|Goal|Runtime config|Module library|New device" index.html app.js styles.css
rg -n "Start build|Parts shelf|Firmware rules|Bench settings|Manual quote|Queue DFM mock|开始打样|零件架|DFM 队列|护栏|固件规则" index.html app.js
node --check server.mjs
node --check app.js
npm test
```

When local browser access is available, complete visual verification:

- Start the local server.
- Open the app in Browser.
- Capture the first viewport.
- Test bench settings, thread menu, add-build-input menu, MVP scope popover, and manufacturing check (DFM) popover.
- Test normal, camera/battery human-review risk, and blocked motion flows.
- Compare the right inspector against the intended Codex-like density.
- Confirm settings exposes language switching and both `简体中文` and `English` are selectable.
- Check server JSON logs for `http_request` and `request_failed` when debugging API behavior.

## Change Hygiene

- Follow the global documentation and context rules in `/Users/bytedance/.codex/AGENTS.md`.
- Keep `docs/PROJECT_PLAN.md` updated when product scope, UI naming, workflow, or acceptance criteria change.
- Keep this file updated when Forge-specific commands, architecture, verification, or agent operating rules change.
- If unrelated user changes appear, do not revert them. Work around them or ask only if they block the task.

## Source Material And Planning

When the user provides a long requirement, screenshot interpretation, copied product notes, or planning text that should guide future work:

- Summarize the durable decisions into `docs/PROJECT_PLAN.md`.
- If the raw material needs to be preserved, create a small note under `docs/source-materials/` using the metadata pattern from the global rules.
- Keep source notes searchable with concrete handles such as button names, screen names, product terms, and blocked decisions.

Prefer explicit uncertainty over invented product logic. If a workflow is not yet decided, mark it as pending in the plan instead of guessing.
