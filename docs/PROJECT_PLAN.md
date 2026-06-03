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
- Placeholder 3D/model and electronics-layout generation jobs

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
- CAD generation
- Real supplier ordering
- User accounts and team permissions
- Real AI memory or external data integrations

Enclosure boundary:

- All MVP enclosures use standardized 3D printing only.
- Woodgrain, sage, graphite, brand color, and similar requests are treated as surface finish or texture choices on the same 3D printed enclosure family.
- Do not represent walnut, wood, metal, CNC, injection molding, or other enclosure processes as available MVP manufacturing paths.
- Enclosure review should focus on screen fit, board standoffs, connector access, print tolerance, and assembly, not real CAD generation.

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
- ProductPlan revision run log
- Bottom composer with hardware-specific controls

Composer actions:

- `+` add build input
- `范围`
- `零件`
- `风险`
- `模型`
- Send/update ProductPlan button

### Right Inspector

Purpose: Live structured output, not a generic dashboard.

Current sections:

- `范围`
- `零件清单（BOM）`
- `结构/3D 预览占位`
- `电子零件布局`
- `估算+假设`
- `风险限制`
- `审核提交状态`

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
- 结构/3D 预览 popover
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
- Unified generation jobs for model placeholder, electronics layout placeholder, quote estimate, review packet, and AI chat reserved capability
- Asset metadata registration for text, image, and reference URL inputs
- Placeholder model preview with future preview/GLB/CAD asset slots
- Placeholder electronics layout with positions, interface directions, cable notes, and conflict checks
- Conversation-first UI that calls the backend ProductPlan pipeline and falls back locally if needed
- Codex-like shell layout
- Floating layer and popovers
- Bench settings dialog
- Hardware-specific button labels
- Right inspector changed toward flat section styling
- Local fallback when API fetch fails, so the UI can still render a complete bench draft
- Conversation-first ProductPlan flow with project history, center chat, and live right-side plan packet
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
2. Parser extracts product type, 3D printed enclosure finish, screen size, and options.
3. Module matcher builds a parts list (BOM) from known modules.
4. Risk-limit gate blocks deferred modules such as camera, battery, and motion structures from the standard path.
5. Quote estimator creates hardware/build/manufacturing-check cost bands.
6. ProductPlan creates a new revision from the conversation turn.
7. Generation jobs attach a placeholder 3D/model preview, electronics layout, and quote assumptions.
8. User enters name and email, then clicks `提交审核下单`.
9. The app writes a local human review packet; no payment or manufacturing starts.

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

Status: ProductPlan API and conversation-first v1 pass complete.

- Keep user turns creating ProductPlan revisions.
- Keep 3D/model, electronics layout, quote, and review submission on unified jobs.
- Keep model/layout as placeholder outputs until a provider adapter or skill integration is selected.
- Keep non-standard hardware in `manual_expansion_draft`.

Next:

- Tune visual density after real Browser screenshot verification.
- Add richer contact/review affordances after internal testing.
- Decide later which AI/skill provider adapter should back model generation.

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
- Test 3D/model placeholder popover
- Test blocked camera/battery flow
- Test successful local human review packet flow
- Compare right inspector against the intended Codex-style density

## 9. Acceptance Criteria

The project should not be considered done until:

- The first viewport looks like a coherent Codex-style workbench.
- All visible buttons use Forge hardware language.
- Unneeded Codex-style buttons are removed.
- Settings and floating menus open, close, and show useful product-specific content.
- Right inspector reads as a live build output surface, not a generic dashboard.
- A normal request produces a ProductPlan revision with scope, parts list (BOM), model placeholder, electronics layout, quote assumptions, and risk limits.
- A camera/battery request is blocked with clear risk-limit messaging.
- A motion request is blocked from the standard desktop screen path.
- `提交审核下单` writes a local human review packet and states that no payment or manufacturing has started.
- Browser screenshot verification has been completed after local server access is available.

## 10. Immediate Next Steps

1. Review the updated interface visually once Browser/local server access is available.
2. Tune right inspector spacing and density from the screenshot.
3. Deepen the ProductPlan right-side sections only as UI-only workflow surfaces unless the product boundary changes.
4. Audit every visible button after each UI pass; no button should remain if it has no visible result.
5. Add focused tests around blocked-module behavior and bilingual-copy regression.
6. Keep `src/contracts/workbench_contract.mjs` updated when API routes, statuses, languages, or chain steps change.
