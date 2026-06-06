---
received_date: 2026-06-06
source_context: User-provided P4 implementation plan and screenshots for Codex-style workflow display
related_task: Codex-style processed transcript without internal trace
status: implemented
key_handles: P4, processed transcript, 已处理, 处理中, 已探索, 已运行, 已编辑, no internal trace, no raw command, no file path
---

# Codex-Style Processed Transcript P4

The user requested replacing the P3 per-item Codex workflow display with a Codex-client-style processed transcript:

- Completed work shows a header such as `已处理 13m 52s >`.
- Running work stays expanded and updates live.
- Completed work collapses automatically, while final assistant text remains visible as normal-size message text.
- Expanded work details show SDK-provided natural-language text from `agent_message` / `reasoning`, todo progress, and safe aggregate rows such as `已探索`, `已运行`, and `已编辑`.
- `已探索` and similar action labels are gray, but the actual work text uses normal message styling.
- The main UI must not render runtime binding, model request/response, raw `tool_call` labels, model provider details, command output, file contents, or raw tool input/output.
- Later clarification: exact command/path/tool specifics may be shown as second-level details under aggregate `已...` rows such as `已运行` / `已编辑`, while the first expanded layer stays summarized and natural-language text redacts exact command/path strings.
- If the SDK does not provide natural-language progress text, the UI should only show factual aggregate counts instead of fabricating first-person Codex narration.
- Do not change the backend event source, Codex SDK, ProductPlan behavior, GeometrySpec behavior, or 3D generation behavior.

Implementation handles:

- `processedTranscriptViewModel`
- `renderProcessedTranscriptHeader`
- `renderProcessedWorkDetails`
- `formatProcessedDuration`
- `expandedProcessedTurns`
- `expandedProcessedDetails`
- `data-processed-toggle`
- `data-processed-detail-toggle`
- `.processed-transcript-head`
- `.processed-action-row`
- `.processed-detail-list`
