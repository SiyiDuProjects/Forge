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

## Ready-To-Send GPT Pro Question

```text
我在做一个叫 Forge 的项目，想把它做成“硬件版 Codex / Claude Code”：用户用自然语言描述一个硬件原型，系统不是只生成聊天回复，而是真的维护一个项目文件夹，里面有源文件、revision、验证报告和生成物。

我已经把 liuup/claude-code-analysis 这个 Claude Code 源码分析仓库拉到本地，并阅读了 analysis 与 src 的主要结构。它大致是这样的：

- entrypoints/cli.tsx、main.tsx：多入口启动层，负责 CLI fast path、REPL、SDK/headless、MCP、remote/bridge、后台 session 等初始化编排。
- QueryEngine.ts、query.ts：核心执行循环。负责组装 system/user context、调用模型、处理 tool_use/tool_result、streaming event、compact、retry、消息回流。
- Tool.ts、tools.ts、services/tools/*：Tool 是协议对象，不是普通函数。每个工具有 schema、description/prompt、validateInput、checkPermissions、readOnly/destructive/concurrency flags、progress、结果映射和 UI rendering metadata。工具调度会把 concurrency-safe 的工具并发执行，把可能改状态的工具串行执行。
- services/compact/*、memdir/*、utils/sessionStorage.ts：长期任务状态治理。memory 是文件化 Markdown + index，session 是 append-only JSONL transcript，compact 后会把关键文件、plan、工具能力重新注入上下文。
- constants/prompts.ts、utils/systemPrompt.ts、context.ts：prompt runtime 是分区的，不是一个大字符串；包含默认规则、动态上下文、append/override prompt、专项 prompt、cache boundary。
- components/*：TUI 中消息流、输入框、权限确认、任务状态、memory、skills、MCP、sandbox 等是控制面。
- MCP、remote、swarm、sandbox、telemetry 等属于完整平台能力，我们大概率不需要复制。

我们的 Forge 当前结构和边界：

- ProductPlan 是中心对象，表示硬件原型计划：需求、零件清单（BOM）、风险限制、报价区间、设备行为规则、review 状态。
- ComponentDescriptor v2 是组件机械代理信息的 source of truth。
- GeometrySpec 是锁定 revision 的唯一 3D 生成输入。
- 现有 Forge action contract 已经有这些受控动作：getWorkspaceSummary、searchComponentLibrary、proposeDesignChange、stageDesignPatch、commitStagedChange、applyDesignPatch、validateDesign、regenerateRevision、revertRevision、getRevisionArtifacts。
- 未来 chat/agent 层必须调用这些 action，不能直接改 GeometrySpec、GLB、STL、STEP 或任意文件。
- 当前生成链路已经接近：ProductPlan revision -> ComponentDescriptor selections -> GeometrySpec -> validation -> confirmed artifacts。它会写 product_plan.json、geometry-spec.json、component_descriptors.json、component_asset_manifest.json、validation_report.json、design_summary.md、generate_model.py，并在明确确认生成后写 GLB/STL/STEP。
- MVP 边界：标准 3D 打印外壳；camera/battery 是人工审核风险；motion structures 是 manual expansion；3D 视图是可旋转查看的原型预览，不是 CAD 编辑器。

我正在考虑的项目文件夹结构类似：

ForgeProject/
  ProductPlan.md 或 product_plan.json
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

请你站在产品架构和工程实现角度，给我具体建议：

1. 从 Claude Code 的源码结构里，Forge 应该借鉴哪 5-8 个“小机制”？比如 tool protocol、append-only transcript、context compact、memory index、permission/concurrency flags、prompt sections 等。哪些机制明确不要借？
2. Forge 的 on-disk project layout 应该怎么设计？哪些文件是 source of truth，哪些是 derived artifacts，哪些是 append-only event/history？
3. 现有 Forge action contract 应该怎么扩展成类似 Tool protocol 的安全边界？需要哪些字段：schema、validation、permission、readOnly/destructive、concurrency、sideEffects、rollback？
4. Chat/runtime 应该如何读取项目文件夹上下文，避免把所有历史和模型文件塞进 prompt？是否需要类似 MEMORY.md、WORK_INDEX.md、manifest、compact/reinject？
5. Revision、proposal、generation confirmation、artifact regeneration、review submission 应该用什么状态机？如何避免 raw chat 直接写几何或模型文件？
6. 请给一个最小可落地的 V1 实施顺序：先改哪些模块、文件格式、API 和测试，避免一上来做成完整 Claude Code、CAD 平台或工具市场。

重点给可执行架构建议。不要泛泛讲 AI agent，也不要建议复制 Claude Code 全量功能。我们的目标是只吸收其中一小部分能力，做成文件夹化的硬件原型项目工作台。
```
