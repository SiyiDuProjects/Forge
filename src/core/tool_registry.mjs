import { clone } from "./workspace_state.mjs";

export const TOOL_PROTOCOL_VERSION = "forge_tool_protocol_v1";

const COMMON_DISALLOWED_TARGETS = [
  "raw GeometrySpec mutation",
  "GLB mutation",
  "STL mutation",
  "STEP mutation",
  "arbitrary project file writes",
  "mesh vertex editing"
];

const TOOL_DEFINITIONS = [
  tool({
    name: "getWorkspaceSummary",
    description: "Return a compact Forge workspace summary for UI or chat context.",
    inputSchema: objectSchema({ workspaceId: stringSchema() }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      workspaceId: stringSchema(),
      currentRevisionId: stringSchema(),
      directEditingAllowed: booleanSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "searchComponentLibrary",
    description: "Search supported ComponentDescriptor v2 records without mutating the workspace.",
    inputSchema: objectSchema({
      query: stringSchema(),
      componentType: stringSchema(),
      limit: numberSchema()
    }),
    outputSchema: objectSchema({ ok: booleanSchema(), results: arraySchema() }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "proposeDesignChange",
    description: "Turn a user message into a structured proposal without creating a revision.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      message: stringSchema()
    }, ["workspaceId", "message"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      proposalId: stringSchema(),
      status: stringSchema(),
      patches: arraySchema(),
      requiresConfirmation: booleanSchema()
    }),
    permission: {
      requiresConfirmation: false,
      reason: "Creates a proposal only; committing it requires a separate confirmation."
    },
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: true,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: false
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write proposals/{proposalId}.json",
      "append events.jsonl proposal_created"
    ],
    rollback: {
      strategy: "reject_or_expire_proposal",
      automatic: false
    }
  }),
  tool({
    name: "stageDesignPatch",
    description: "Persist explicit structured patches as a staged proposal for later commit.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      patches: arraySchema(),
      summary: stringSchema()
    }, ["workspaceId", "patches"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      proposalId: stringSchema(),
      status: stringSchema(),
      canCommit: booleanSchema()
    }),
    permission: {
      requiresConfirmation: false,
      reason: "Stages a proposal only; committing the proposal requires confirmation."
    },
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: true,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: false
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write proposals/{proposalId}.json",
      "append events.jsonl proposal_staged"
    ],
    rollback: {
      strategy: "reject_or_expire_proposal",
      automatic: false
    }
  }),
  tool({
    name: "commitStagedChange",
    description: "Commit a staged or proposed change into a new pending ProductPlan revision without writing GLB/STL/STEP artifacts.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      proposalId: stringSchema()
    }, ["workspaceId", "proposalId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      committed: booleanSchema(),
      newRevisionId: stringSchema(),
      artifactPaths: objectSchema()
    }),
    permission: confirmation("Creates a new pending revision and updates currentRevisionId. It does not write GLB/STL/STEP artifacts."),
    behavior: revisionStateWriteBehavior(),
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "append events.jsonl proposal_committed",
      "write revisions/{revisionId}/...",
      "update project_manifest.currentRevisionId"
    ],
    rollback: {
      strategy: "revert_to_previous_revision",
      automatic: false
    }
  }),
  tool({
    name: "applyDesignPatch",
    description: "Apply explicit structured patches immediately through the same revision generator used by proposal commits.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      message: stringSchema(),
      patches: arraySchema()
    }, ["workspaceId", "patches"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      applied: booleanSchema(),
      newRevisionId: stringSchema(),
      artifactPaths: objectSchema()
    }),
    permission: confirmation("Creates a new pending revision without a separate proposal object. It does not write GLB/STL/STEP artifacts."),
    behavior: revisionStateWriteBehavior(),
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "append events.jsonl revision_created",
      "write revisions/{revisionId}/...",
      "update project_manifest.currentRevisionId"
    ],
    rollback: {
      strategy: "revert_to_previous_revision",
      automatic: false
    }
  }),
  tool({
    name: "regenerateRevision",
    description: "Regenerate artifacts by creating a new revision from an existing revision snapshot.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      revisionId: stringSchema(),
      reason: stringSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      regenerated: booleanSchema(),
      revisionId: stringSchema(),
      sourceRevisionId: stringSchema()
    }),
    permission: confirmation("Writes a regenerated revision and fresh artifacts."),
    behavior: revisionWriteBehavior(),
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "append events.jsonl revision_created",
      "append events.jsonl artifacts_generated",
      "write revisions/{revisionId}/..."
    ],
    rollback: {
      strategy: "revert_to_source_revision",
      automatic: false
    }
  }),
  tool({
    name: "validateDesign",
    description: "Run GeometrySpec validation for the current workspace, a proposal, or explicit patches.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      proposalId: stringSchema(),
      patches: arraySchema(),
      mode: stringSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      status: stringSchema(),
      errors: arraySchema(),
      warnings: arraySchema(),
      blocked: booleanSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [
      "append events.jsonl validation_completed"
    ],
    rollback: noneRollback()
  }),
  tool({
    name: "revertRevision",
    description: "Move currentRevisionId back to an existing immutable revision without deleting history.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      revisionId: stringSchema()
    }, ["workspaceId", "revisionId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      reverted: booleanSchema(),
      currentRevisionId: stringSchema()
    }),
    permission: confirmation("Changes the active revision pointer and appends a revert event."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "append events.jsonl revision_reverted",
      "update project_manifest.currentRevisionId"
    ],
    rollback: {
      strategy: "revert_to_previous_current_revision",
      automatic: false
    }
  }),
  tool({
    name: "getRevisionArtifacts",
    description: "Return compact artifact metadata and paths; never return raw GLB/STL/STEP bytes.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      revisionId: stringSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      revisionId: stringSchema(),
      artifacts: objectSchema(),
      artifactPaths: objectSchema(),
      directEditingAllowed: booleanSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "rejectStagedChange",
    description: "Reject a proposal so it cannot be committed later.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      proposalId: stringSchema(),
      reason: stringSchema()
    }, ["workspaceId", "proposalId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      rejected: booleanSchema(),
      proposalId: stringSchema(),
      status: stringSchema()
    }),
    permission: noConfirmation(),
    behavior: {
      readOnly: false,
      destructive: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: false,
      mutatesProposal: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write proposals/{proposalId}.json",
      "append events.jsonl proposal_rejected"
    ],
    rollback: {
      strategy: "create_new_proposal",
      automatic: false
    }
  }),
  tool({
    name: "submitReviewPacket",
    description: "Write local human-review material for the current ProductPlan revision without starting payment, supplier ordering, or manufacturing.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      revisionId: stringSchema(),
      contactInfo: objectSchema({
        name: stringSchema(),
        email: stringSchema()
      })
    }, ["workspaceId", "contactInfo"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      submitted: booleanSchema(),
      status: stringSchema(),
      reviewId: stringSchema()
    }),
    permission: confirmation("Writes local human-review material and marks the ProductPlan submitted for review."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: true,
      submitsReview: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write review/review_request.json",
      "write review/human_review_notes.md",
      "append events.jsonl review_submitted or review_submission_failed",
      "update runtime_plan.json reviewSubmission"
    ],
    rollback: {
      strategy: "create_followup_review_packet",
      automatic: false
    }
  })
];

export function listToolMetadata() {
  return clone(TOOL_DEFINITIONS);
}

export function getToolMetadata(name) {
  const tool = TOOL_DEFINITIONS.find((item) => item.name === name);
  return tool ? clone(tool) : null;
}

export function toolNames() {
  return TOOL_DEFINITIONS.map((toolDefinition) => toolDefinition.name);
}

function tool(definition) {
  return {
    protocolVersion: TOOL_PROTOCOL_VERSION,
    disallowedTargets: COMMON_DISALLOWED_TARGETS,
    ...definition
  };
}

function objectSchema(properties = {}, required = []) {
  return {
    type: "object",
    additionalProperties: true,
    properties,
    required
  };
}

function stringSchema() {
  return { type: "string" };
}

function numberSchema() {
  return { type: "number" };
}

function booleanSchema() {
  return { type: "boolean" };
}

function arraySchema() {
  return { type: "array" };
}

function noConfirmation() {
  return {
    requiresConfirmation: false,
    reason: null
  };
}

function confirmation(reason) {
  return {
    requiresConfirmation: true,
    reason
  };
}

function readOnlyBehavior() {
  return {
    readOnly: true,
    destructive: false,
    createsRevision: false,
    writesArtifacts: false,
    mutatesCurrentState: false
  };
}

function revisionWriteBehavior() {
  return {
    readOnly: false,
    destructive: false,
    createsRevision: true,
    writesArtifacts: true,
    mutatesCurrentState: true
  };
}

function revisionStateWriteBehavior() {
  return {
    readOnly: false,
    destructive: false,
    createsRevision: true,
    writesArtifacts: false,
    mutatesCurrentState: true
  };
}

function parallelRead() {
  return {
    safeToRunInParallel: true,
    lock: null
  };
}

function workspaceWriteLock() {
  return {
    safeToRunInParallel: false,
    lock: "workspace-write"
  };
}

function noneRollback() {
  return {
    strategy: "none",
    automatic: false
  };
}
