import { listToolMetadata } from "./tool_registry.mjs";
import { clone } from "./workspace_state.mjs";

export const TOOL_SCHEMA_EXPORT_VERSION = "forge_tool_schema_export_v1";

export function exportToolsForModel({
  tools = listToolMetadata(),
  provider = "generic",
  includeMutationTools = true
} = {}) {
  const exported = tools
    .filter((tool) => includeMutationTools || tool.behavior?.readOnly || tool.behavior?.createsProposal)
    .map((tool) => modelToolSchema(tool, provider));
  return {
    ok: true,
    version: TOOL_SCHEMA_EXPORT_VERSION,
    provider,
    tools: exported
  };
}

export function modelToolSchema(tool, provider = "generic") {
  const schema = {
    name: tool.name,
    description: tool.description,
    inputSchema: clone(tool.inputSchema || { type: "object", properties: {} }),
    requiresConfirmation: Boolean(tool.permission?.requiresConfirmation),
    readOnly: Boolean(tool.behavior?.readOnly),
    createsProposal: Boolean(tool.behavior?.createsProposal),
    createsRevision: Boolean(tool.behavior?.createsRevision),
    writesArtifacts: Boolean(tool.behavior?.writesArtifacts),
    mutatesCurrentState: Boolean(tool.behavior?.mutatesCurrentState),
    lock: tool.concurrency?.lock || null,
    disallowedTargets: clone(tool.disallowedTargets || [])
  };
  if (provider === "openai") {
    return {
      type: "function",
      name: schema.name,
      description: schema.description,
      parameters: schema.inputSchema,
      strict: false,
      metadata: {
        requiresConfirmation: schema.requiresConfirmation,
        readOnly: schema.readOnly,
        createsRevision: schema.createsRevision,
        writesArtifacts: schema.writesArtifacts
      }
    };
  }
  return schema;
}
