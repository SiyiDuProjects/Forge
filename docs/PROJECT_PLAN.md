# Y Workbench Project Plan

## 1. Project Goal

Y Workbench is a hardware-build workbench inspired by Codex's product experience, but it is not a clone of Codex content.

The product should let a user describe a custom desk hardware idea, then convert that request into a practical MVP prototype plan packet:

- Parsed product intent
- Hardware scope
- Parts list (BOM) and stocked parts
- Risk limit / risk report
- Quote band
- Device behavior rules (firmware preview)
- Manufacturing check (DFM) packet for human review

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

Codex is the interaction reference. Y Workbench is the product. The implementation should borrow structure, density, and behaviors, but the information architecture should be for hardware prototyping.

## 3. Product Positioning

Y Workbench is for early hardware MVP planning.

Primary user:

- Founder or product builder describing a custom hardware object
- Hardware operator checking feasibility, cost, and manufacturing readiness
- Internal reviewer deciding whether a prototype can move forward

Primary job:

Turn a natural-language hardware idea into a constrained, priced, reviewable prototype plan packet.

Non-goals for the first MVP:

- Real manufacturing checkout
- Camera/battery certification workflow
- CAD generation
- Real supplier ordering
- User accounts and team permissions

## 4. Interface Scope

### Left Sidebar

Purpose: Navigate build sessions and hardware workbench areas.

Current direction:

- `开始做原型`
- `零件清单（BOM）`
- `生产可行性（DFM）`
- `设备行为规则（固件）`
- Workbench project: `Y Lab`
- Sessions such as `核桃木桌面屏`, `运动陪伴屏`, `展台计数屏`
- `工作台设置`

Avoid:

- Generic Codex labels that do not map to hardware
- Extra placeholder buttons with no workflow meaning

### Center Thread

Purpose: Show the build request, agent summary, and command-style run log.

Required content:

- User request bubble
- Bench agent response
- Chain/run log
- Bottom composer with hardware-specific controls

Composer actions:

- `+` add build input
- `范围`
- `零件`
- `风险`
- `可行性`
- Run build chain button

### Right Inspector

Purpose: Live structured output, not a generic dashboard.

Current sections:

- `范围`
- `零件清单（BOM）`
- `风险限制`
- `报价`
- `设备行为`
- `生产检查包（DFM）`

Visual direction:

- More like Codex inspector output than rounded dashboard cards
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
- 生产可行性等级（DFM）popover
- 工作台设置 dialog

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
- Codex-like shell layout
- Floating layer and popovers
- Bench settings dialog
- Hardware-specific button labels
- Right inspector changed toward flat section styling
- Local fallback when API fetch fails, so the UI can still render a complete bench draft
- Full mock UI flow with four workspace views: Start prototype, Parts list (BOM), Manufacturing check (DFM), and Device behavior rules
- Three complete mock scenarios: Walnut desk display, Motion companion, and Booth counter unit
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
- Mock actions should change visible UI state, view, queue filter, or popover content.
- Current visible UI language supports Simplified Chinese and English.
- Do not add real upload, real CAD, real checkout, real supplier ordering, or real manufacturing calls without a product direction change.

Known blocker:

- Browser visual verification is not complete because the sandbox blocked local server binding with `listen EPERM`, and the Browser tool blocked `file://` loading by URL policy. This means screenshot-level validation still needs to be repeated once local browser access is available.

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
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, CAD, and TFT, but visible labels should explain the term in Chinese first.
- The settings dialog language switch must keep both `简体中文` and `English` selectable.

## 7. MVP Flow

1. User describes a hardware idea.
2. Parser extracts product type, finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate blocks deferred modules such as camera and battery.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. Blueprint JSON is rendered.
7. Device behavior rules (firmware preview) are compiled from behavior text.
8. Manufacturing check (DFM) packet can be queued when risk limits pass.

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

Status: first UI-only pass complete.

- Make `Parts list (BOM)` show a focused parts/library view
- Make `Manufacturing check (DFM)` show queued packets and blocked packets
- Make `Device behavior rules` focus the firmware preview section and expose compiled rules
- Add editable assumptions for quote band
- Add clear state for blocked modules with suggested scope edits

Next:

- Tune visual density after real Browser screenshot verification.
- Convert any remaining text-only mock surfaces into richer, inspectable UI states when the flow needs it.
- Decide later whether any mock action should become real functionality.

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
- Test manufacturing check (DFM) popover
- Test blocked camera/battery flow
- Test successful manufacturing check (DFM) packet flow
- Compare right inspector against the intended Codex-style density

## 9. Acceptance Criteria

The project should not be considered done until:

- The first viewport looks like a coherent Codex-style workbench.
- All visible buttons use Y Workbench hardware language.
- Unneeded Codex-style buttons are removed.
- Settings and floating menus open, close, and show useful product-specific content.
- Right inspector reads as a live build output surface, not a generic dashboard.
- A normal request produces a complete blueprint, parts list (BOM), quote, device behavior, and manufacturing check (DFM) packet.
- A camera/battery request is blocked with clear risk-limit messaging.
- Browser screenshot verification has been completed after local server access is available.

## 10. Immediate Next Steps

1. Review the updated interface visually once Browser/local server access is available.
2. Tune right inspector spacing and density from the screenshot.
3. Deepen the existing `零件清单（BOM）`, `生产可行性（DFM）`, and `设备行为规则（固件）` views only as UI-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
