# Parametric Model Generation Notes

- received_date: 2026-06-03
- source_context: Forge conversation/product direction notes for parametric model generation
- related_task: Forge future parameter-file and CadQuery-style generation direction
- status: summarized planning note / future direction
- key_handles: product parameter file, parts library dimensions, CadQuery Python model generation, OpenAI API tool calling, clarifying questions prompt


Date: 2026-06-03

## Source Summary

The product direction is to keep Forge as a conversation-led hardware planning workbench while eventually making the 3D preview generation more real through structured parameters and parametric model code.

Durable decisions:

- Do not implement this now; record it as future direction.
- Long conversation context can be solved later by evaluating open-source projects instead of building that layer immediately.
- The foundation should be a maintained product parameter file tied to the plan or revision.
- The parameter file should include user choices and build constraints such as camera, battery, product shape, part placement, mounting holes, interface positions, and other physical parameters.
- The parts library should hold structured physical metadata: dimensions, hole positions, interfaces, clearances, and fit rules.
- Future model generation can use Python plus CadQuery-style code to generate and update the 3D model from the parameter file.
- OpenAI API usage should be tool-based. Prompts should guide the model to explain tradeoffs and costs, ask enough clarifying questions, and then call tools such as parameter update, model generation, or conversation update.

## Search Handles

- long conversation context
- open-source memory project
- product parameter file
- parts library dimensions hole positions interfaces
- CadQuery Python model generation
- camera battery options
- part placement mounting holes
- OpenAI API tool calling
- clarifying questions prompt

## Current Boundary

This is not a request to implement CadQuery, real CAD, real manufacturing, checkout, supplier ordering, or production export. It is a planning note for a future generation architecture.
