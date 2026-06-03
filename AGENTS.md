# AGENTS.md

Project notes for future Codex/agent work in this repository.

## Project

This repo is `Forge`, a Codex-style hardware MVP planning workbench.

It is not a generic Codex clone. Codex is the interaction reference: left workspace sidebar, central thread, bottom composer, right inspector, settings dialog, and floating menus. The product content, labels, outputs, and workflow belong to Forge.

Primary job:

- Convert a natural-language hardware idea into a practical prototype plan packet.
- Produce parsed intent, scope, parts list (BOM), risk limits, quote band, device behavior rules, and a manufacturing check (DFM) packet.
- Keep camera and battery outside the first MVP unless the product plan changes.
- Keep all MVP enclosures on the standardized 3D printed shell path; surface requests such as woodgrain, sage, graphite, or brand color are finish treatments, not different manufacturing processes.
- Treat `ProductPlan` as the central object. Conversation, revisions, assets, jobs, model preview, electronics layout, quote assumptions, and review submission should hang off the plan or a plan revision.

Product planning source:

- `docs/PROJECT_PLAN.md`

Read that file before making broad UI, workflow, naming, or scope changes.

Current product boundary:

- Build a complete clickable UI prototype.
- Do not add real manufacturing, real upload, real CAD, real checkout, real supplier ordering, or real export behavior unless the user explicitly changes the product direction.
- Do not broaden the enclosure path beyond standardized 3D printing. Do not add woodwork, CNC, injection molding, metal casing, or real CAD generation unless the product direction changes.
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
- `app.js`: browser-side UI-only mock state, rendering, canvas preview, and UI interactions.
- `server.mjs`: static server and JSON API routes.
- `src/contracts/workbench_contract.mjs`: shared contract constants for chain steps, API routes, statuses, and supported languages.
- `src/core/product_plan.mjs`: ProductPlan creation, turn handling, revision creation, and local review submission orchestration.
- `src/core/jobs.mjs`: unified generation job system for model generation, electronics layout, quote estimate, review packet, and AI chat reserved capability.
- `src/core/assets.mjs`: metadata-only asset registration for text, images, references, and generated placeholder assets.
- `src/core/model_preview.mjs`: placeholder 3D/model preview output and future preview/GLB/CAD asset slots.
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
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, CAD, and TFT, but visible labels should explain them in plain Chinese first.
- When adding a feature, update static copy in `index.html`, dynamic bilingual strings in `app.js`, and project rules in `docs/PROJECT_PLAN.md` or `AGENTS.md` when the behavior changes.
- Do not reintroduce old visible labels such as `Copy spec`, `Submit review`, `Review L1`, `Goal`, `Module library`, `Runtime config`, or `Voice note`.

## UI Direction

Preserve Codex-like interaction structure:

- Left sidebar for workbench navigation and build sessions.
- Center thread for user request, bench agent response, and command-style run log.
- Bottom composer for build request entry and scoped actions.
- Right inspector for live build chain outputs.
- Settings dialog and floating menus for secondary controls.

Required UI-only views:

- `对话生成`: central continuous conversation and ProductPlan revision flow.
- `项目历史`: left-side internal drafts/history.
- `审核包`: local human review packet status.

Right inspector guidance:

- It should read as a live output surface, not a generic analytics dashboard.
- Prefer thin dividers, low shadow, dense sections, and restrained visual hierarchy.
- Keep controls usable, but avoid large decorative rounded cards.

Composer guidance:

- Keep actions hardware-specific and understandable, such as `范围`, `零件`, `风险`, and `模型`.
- The send button creates or updates a ProductPlan revision through the backend API when available.
- The `+` menu is for adding build inputs such as sketches, product references, and CAD outlines.
- Do not keep voice, generic goal, or vague guard buttons unless they have a real UI-only flow in this product.

## MVP Workflow

The expected flow is:

1. User describes a hardware idea.
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate blocks deferred modules such as camera and battery.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision and unified generation jobs.
7. Placeholder model preview and electronics layout are attached to the revision.
8. Local human review packet can be written after name/email are provided.

Do not broaden the MVP into real checkout, real supplier ordering, CAD generation, user accounts, or certification workflows unless the user explicitly asks for that product direction change.

Enclosure-specific rule:

- The MVP only supports standardized 3D printed enclosures.
- Treat walnut/woodgrain, sage, graphite, and brand looks as colors or textures on that standard shell.
- The DFM mock should check module fit, screen opening, board standoffs, connector access, print tolerance, and assembly only.
- Motion structures are outside the standard path and should become blocked/manual expansion, not a normal ready packet.

## UI-Only Runtime

The current frontend prefers backend ProductPlan APIs but should keep a local fallback ProductPlan so visual checks do not collapse into a blank `Failed to fetch` state when the local server cannot run inside the sandbox.

The mock UI should stay aligned with the product workflow:

- It should produce request intent, modules, risk limits, quote, blueprint, and device behavior rules.
- It should block camera, battery, and motion structures from the standard path.
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
- Test normal and blocked camera/battery flows.
- Compare the right inspector against the intended Codex-like density.
- Confirm settings exposes language switching and both `简体中文` and `English` are selectable.
- Check server JSON logs for `http_request` and `request_failed` when debugging API behavior.

## Change Hygiene

- Keep `docs/PROJECT_PLAN.md` updated when product scope, UI naming, workflow, or acceptance criteria change.
- Keep `AGENTS.md` updated when commands, architecture, verification, or agent operating rules change.
- If this folder is later initialized as a git repository, commit meaningful code, configuration, and documentation changes unless the user explicitly says not to.
- If unrelated user changes appear, do not revert them. Work around them or ask only if they block the task.

## Source Material And Planning

When the user provides a long requirement, screenshot interpretation, copied product notes, or planning text that should guide future work:

- Summarize the durable decisions into `docs/PROJECT_PLAN.md`.
- If the raw material needs to be preserved, create a small note under `docs/source-materials/`.
- Keep source notes searchable with concrete handles such as button names, screen names, product terms, and blocked decisions.

Prefer explicit uncertainty over invented product logic. If a workflow is not yet decided, mark it as pending in the plan instead of guessing.
