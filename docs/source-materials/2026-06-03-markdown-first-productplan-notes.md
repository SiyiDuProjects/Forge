# Markdown-First ProductPlan Notes

- received_date: 2026-06-03
- source_context: Forge conversation/product direction notes for Markdown-first ProductPlan architecture
- related_task: Forge future ProductPlan revision and context-management direction
- status: summarized planning note / future direction
- key_handles: Markdown ProductPlan, main.md, revision snapshot, conversation change file, generated 3D only, pending generation instruction


Date: 2026-06-03

## Source Summary

The future ProductPlan direction is Markdown-first and local-file based. Forge should preserve conversation as the input surface, but the model generation source of truth should be a visible main Markdown file that represents the current buildable plan state.

Durable decisions:

- Do not implement this now; record it as a future direction.
- The main Markdown file stores the current plan state.
- Each relevant conversation round can update the visible pending generation instruction or main-file draft.
- Forge should not regenerate a model after every user message.
- When the user confirms that the idea is ready, Forge should lock the current main file and create a new revision.
- Each revision should keep a main-file snapshot, the conversation-change file for that round, generated 3D output, quote output, and review packet.
- Rollback should restore a prior main-file snapshot and allow continued editing from the related conversation-change file.
- The 3D preview should show only actual generated output. If no model exists or information is insufficient, the UI should show pending-generation or insufficient-information state.
- Camera and battery can enter structure preview, but must be marked as human-review risks.
- Motion structures remain outside the standard MVP path and should become manual expansion drafts.
- Future quoting should use 3D print quote, parts costs, labor cost, and profit/risk buffer.
- Tool calling should include updating the main file, checking parts, generating structure, estimating price, and generating the review packet.
- Separate conversation summarization is not required because the pending generation instruction or main file is the maintained source of truth.

## Search Handles

- Markdown ProductPlan
- main.md
- revision snapshot
- conversation change file
- generated 3D only
- camera battery risk
- 3D print quote
- tool calling boundary
- pending generation instruction
- insufficient information state

## Current Boundary

This is not a request to implement a Markdown file system, real 3D model generation, real pricing, real review automation, real CAD, checkout, supplier ordering, or manufacturing. It is a planning note for a future ProductPlan architecture.
