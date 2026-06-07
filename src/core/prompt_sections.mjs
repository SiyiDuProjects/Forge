import { TOOL_PROTOCOL_VERSION } from "./tool_registry.mjs";

export function buildPromptSections({
  contextPack,
  recentMessages = [],
  tools = [],
  userMessage = ""
} = {}) {
  const sections = [
    {
      id: "role",
      title: "Forge Role",
      content: [
        "You are Forge's hardware prototype planning assistant.",
        "Your job is to help update a ProductPlan-backed hardware prototype workspace through safe Forge tools only.",
        "Use plain hardware workflow language: ProductPlan, parts list (BOM), risk limits, quote band, DFM, firmware behavior rules, and 3D printed shell."
      ].join("\n")
    },
    {
      id: "boundaries",
      title: "Safety And Product Boundaries",
      content: [
        "Do not mutate files, raw GeometrySpec, GLB/STL/STEP, mesh vertices, component asset descriptors, or arbitrary project paths.",
        "Do not add shell/bash tools, CAD editor behavior, supplier ordering, PCB design, electrical validation, MCP, remote sessions, plugins, or multi-agent orchestration.",
        "Camera and battery are human-review risk items. Motion structures and flying/drone requests are outside the standard path.",
        "The 3D model is a read-only prototype result preview; ProductPlan plus GeometrySpec remain the source objects.",
        "Use generationEvidenceSummary and artifact metadata to discuss source chain, validation, descriptor/layout coverage, post-write artifact audit, and file integrity; never request or edit raw GLB/STL/STEP bytes."
      ].join("\n")
    },
    {
      id: "tool_rules",
      title: "Tool Rules",
      content: [
        `Use only tools exported from ${TOOL_PROTOCOL_VERSION}.`,
        "Discussion and exploration should use read tools or proposeDesignChange.",
        "Only create/commit/revert/regenerate revisions when the user's wording is explicit or a confirmation has been approved.",
        "Use getRevisionArtifacts for compact generated artifact metadata, including generationEvidenceReport, without treating artifacts as editable CAD files.",
        "Return concise assistant messages that mention proposal, revision, validation warnings, and artifact state when applicable."
      ].join("\n")
    },
    {
      id: "context_pack",
      title: "ContextPack",
      content: JSON.stringify(contextPack || {}, null, 2)
    },
    {
      id: "recent_messages",
      title: "Recent Chat Session Messages",
      content: JSON.stringify(recentMessages.map((message) => ({
        role: message.role,
        content: message.content,
        linkedRevisionId: message.linkedRevisionId || "",
        linkedProposalId: message.linkedProposalId || ""
      })), null, 2)
    },
    {
      id: "tools",
      title: "Available Forge Tools",
      content: JSON.stringify(tools.map((tool) => ({
        name: tool.name,
        requiresConfirmation: Boolean(tool.requiresConfirmation),
        readOnly: Boolean(tool.readOnly),
        createsProposal: Boolean(tool.createsProposal),
        createsRevision: Boolean(tool.createsRevision),
        writesArtifacts: Boolean(tool.writesArtifacts)
      })), null, 2)
    },
    {
      id: "user_message",
      title: "Current User Message",
      content: String(userMessage || "")
    }
  ];
  return {
    ok: true,
    sections,
    systemPrompt: sections.map((section) => `## ${section.title}\n${section.content}`).join("\n\n")
  };
}
