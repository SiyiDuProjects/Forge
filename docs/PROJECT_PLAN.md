# Y Workbench Project Plan

## 1. Project Goal

Y Workbench is a hardware-build workbench inspired by Codex's product experience, but it is not a clone of Codex content.

The product should let a user describe a custom desk hardware idea, then convert that request into a practical MVP build packet:

- Parsed product intent
- Hardware scope
- BOM and stocked parts
- Guardrail / risk report
- Quote band
- Firmware behavior rules
- DFM packet for human review

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
- Hardware operator checking feasibility, cost, and DFM readiness
- Internal reviewer deciding whether a prototype can move forward

Primary job:

Turn a natural-language hardware idea into a constrained, priced, reviewable bench packet.

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

- `开始打样`
- `零件架`
- `DFM 队列`
- `固件规则`
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
- `BOM`
- `护栏`
- `DFM`
- Run build chain button

### Right Inspector

Purpose: Live structured output, not a generic dashboard.

Current sections:

- `范围`
- `BOM`
- `护栏`
- `报价`
- `固件`
- `DFM 打样包`

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
- 已选 BOM popover
- 护栏 popover
- DFM 等级 popover
- 工作台设置 dialog

Settings sections:

- 工作室
- 零件
- DFM
- 固件
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
- Review/DFM submission path
- Codex-like shell layout
- Floating layer and popovers
- Bench settings dialog
- Hardware-specific button labels
- Right inspector changed toward flat section styling
- Local fallback when API fetch fails, so the UI can still render a complete bench draft
- Full mock UI flow with four workspace views: Start build, Parts shelf, DFM queue, and Firmware rules
- Three complete mock scenarios: Walnut desk display, Motion companion, and Booth counter unit
- Expanded UI-only flow states for request parsing, scope, BOM, guardrails, quote, firmware, and DFM packet
- Popovers for add input, scope, BOM, guardrails, DFM, thread actions, and bench settings
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

Use hardware workflow language:

- 打样包
- BOM
- 零件架
- 护栏
- 报价区间
- DFM
- 固件规则
- 范围
- 台架供电

Avoid generic inherited labels from earlier Codex-style drafts:

- Generic copy/review labels that do not describe a bench packet action
- Generic goal labels with no product-specific scope surface
- Sidebar labels that do not map to parts, DFM, firmware, or build flow

Rule:

A button should exist only if it maps to a real hardware-build workflow. If a Codex button does not have a useful equivalent, remove it instead of renaming it vaguely.

Language rule:

- The current product UI must preserve both Simplified Chinese and English versions.
- New visible buttons, statuses, dialogs, inspector sections, empty states, mock data, and docs must update both languages in the same change.
- English acronyms are allowed in Chinese copy when they are normal hardware/product terms, such as BOM, DFM, USB-C, API, CAD, and TFT.
- The settings dialog language switch must keep both `简体中文` and `English` selectable.

## 7. MVP Flow

1. User describes a hardware idea.
2. Parser extracts product type, finish, screen size, and options.
3. Module matcher builds a BOM from known modules.
4. Guardrail gate blocks deferred modules such as camera and battery.
5. Quote estimator creates hardware/build/DFM cost bands.
6. Blueprint JSON is rendered.
7. Firmware rules are compiled from behavior text.
8. DFM packet can be queued when guardrails pass.

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

- Make `Parts shelf` show a focused parts/library view
- Make `DFM queue` show queued packets and blocked packets
- Make `Firmware rules` focus the firmware section and expose compiled rules
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
- Test DFM popover
- Test blocked camera/battery flow
- Test successful DFM packet flow
- Compare right inspector against the intended Codex-style density

## 9. Acceptance Criteria

The project should not be considered done until:

- The first viewport looks like a coherent Codex-style workbench.
- All visible buttons use Y Workbench hardware language.
- Unneeded Codex-style buttons are removed.
- Settings and floating menus open, close, and show useful product-specific content.
- Right inspector reads as a live build output surface, not a generic dashboard.
- A normal request produces a complete blueprint/BOM/quote/firmware/DFM packet.
- A camera/battery request is blocked with clear guardrail messaging.
- Browser screenshot verification has been completed after local server access is available.

## 10. Immediate Next Steps

1. Review the updated interface visually once Browser/local server access is available.
2. Tune right inspector spacing and density from the screenshot.
3. Deepen the existing `零件架`, `DFM 队列`, and `固件规则` views only as UI-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
