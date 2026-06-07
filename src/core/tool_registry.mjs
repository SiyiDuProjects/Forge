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
    name: "createProductPlan",
    description: "Create the first ProductPlan for a clean Forge conversation workspace from an explicit hardware request. Does not generate GLB/STL/STEP artifacts.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      initialMessage: stringSchema(),
      language: stringSchema()
    }, ["workspaceId", "initialMessage"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      created: booleanSchema(),
      planId: stringSchema(),
      revisionId: stringSchema(),
      generationStatus: stringSchema(),
      artifactPaths: objectSchema()
    }),
    permission: confirmation("Creates the first ProductPlan and a pending revision. It does not write GLB/STL/STEP artifacts."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: true,
      writesArtifacts: false,
      mutatesCurrentState: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write runtime_plan.json",
      "write product_plan.json",
      "write revisions/{revisionId}/...",
      "append events.jsonl user_message",
      "append events.jsonl assistant_message"
    ],
    rollback: {
      strategy: "start_new_clean_conversation_or_revert_revision",
      automatic: false
    }
  }),
  tool({
    name: "searchComponentLibrary",
    description: "Search supported ComponentDescriptor v2 records without mutating the workspace.",
    inputSchema: objectSchema({
      query: stringSchema(),
      componentType: stringSchema(),
      limit: numberSchema()
    }),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      results: arraySchema(objectSchema({
        componentId: stringSchema(),
        componentType: stringSchema(),
        displayName: stringSchema(),
        supported: booleanSchema(),
        assetQuality: stringSchema(),
        validationStatus: stringSchema(),
        mechanicalConstraints: objectSchema({
          trustLevel: stringSchema(),
          productionReady: booleanSchema(),
          requiresHumanValidation: booleanSchema(),
          dimensionsMm: objectSchema(),
          mounting: objectSchema(),
          interfaces: objectSchema(),
          shellFeatures: objectSchema(),
          clearances: objectSchema(),
          sourceEvidence: objectSchema(),
          warnings: arraySchema(stringSchema())
        }),
        risk: objectSchema({
          requiresManualValidation: booleanSchema(),
          severity: stringSchema(),
          reason: stringSchema()
        })
      }))
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "inspectComponentPackage",
    description: "Inspect one ComponentDescriptor package readiness report without mutating the workspace.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      componentId: stringSchema()
    }, ["componentId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      packageStatus: stringSchema(),
      supported: booleanSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      productionReady: booleanSchema(),
      descriptorValidation: objectSchema({
        valid: booleanSchema(),
        errors: arraySchema(stringSchema()),
        warnings: arraySchema(stringSchema())
      }),
      sourceEvidence: objectSchema({
        descriptorPath: stringSchema(),
        sourcesPath: stringSchema(),
        sourcesFilePresent: booleanSchema(),
        sourceType: stringSchema(),
        workspaceDraft: objectSchema(),
        workspaceDraftIntegrity: objectSchema(),
        sourceConfidence: stringSchema(),
        summary: stringSchema()
      }),
      mechanicalCoverage: objectSchema(),
      replacementPolicy: objectSchema({
        canSelectSameType: booleanSchema(),
        componentPreferencePath: stringSchema(),
        requiresProductPlanRevision: booleanSchema(),
        directGeometryMutationAllowed: booleanSchema(),
        rawArtifactMutationAllowed: booleanSchema(),
        newCategoryRequiresCodeSupport: booleanSchema()
      }),
      blockingIssues: arraySchema(objectSchema()),
      reviewWarnings: arraySchema(objectSchema()),
      risk: objectSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "inspectComponentDescriptorDraft",
    description: "Inspect a proposed ComponentDescriptor v2 draft package before it is added to the loaded component library.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      descriptor: objectSchema(),
      descriptorJson: stringSchema(),
      expectedId: stringSchema(),
      sourcesText: stringSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      draft: booleanSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      packageStatus: stringSchema(),
      supported: booleanSchema(),
      readyForLibraryPromotion: booleanSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      descriptorValidation: objectSchema({
        valid: booleanSchema(),
        errors: arraySchema(stringSchema()),
        warnings: arraySchema(stringSchema())
      }),
      sourceEvidence: objectSchema({
        descriptorPath: stringSchema(),
        sourcesPath: stringSchema(),
        sourcesFilePresent: booleanSchema(),
        sourceConfidence: stringSchema(),
        summary: stringSchema()
      }),
      mechanicalCoverage: objectSchema(),
      replacementPolicy: objectSchema({
        canSelectSameType: booleanSchema(),
        componentPreferencePath: stringSchema(),
        requiresProductPlanRevision: booleanSchema(),
        directGeometryMutationAllowed: booleanSchema(),
        rawArtifactMutationAllowed: booleanSchema(),
        newCategoryRequiresCodeSupport: booleanSchema(),
        loadedLibraryRequired: booleanSchema(),
        readyAfterLibraryPromotion: booleanSchema()
      }),
      libraryStatus: objectSchema({
        loadedComponentExists: booleanSchema(),
        loadedComponentId: stringSchema(),
        canPromoteToLibrary: booleanSchema(),
        targetDirectory: stringSchema(),
        requiresDescriptorJson: booleanSchema(),
        requiresSourcesMd: booleanSchema()
      }),
      blockingIssues: arraySchema(objectSchema()),
      reviewWarnings: arraySchema(objectSchema()),
      risk: objectSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "inspectWorkspaceComponentDescriptorDrafts",
    description: "Inspect ComponentDescriptor draft packages already placed under the Forge project workspace component-drafts directory.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      draftId: stringSchema(),
      limit: numberSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      workspaceId: stringSchema(),
      draftCount: numberSchema(),
      readyForPromotionCount: numberSchema(),
      drafts: arraySchema(objectSchema({
        ok: booleanSchema(),
        draftId: stringSchema(),
        packagePath: stringSchema(),
        descriptorPath: stringSchema(),
        sourcesPath: stringSchema(),
        packageIntegrity: objectSchema(),
        specPatch: objectSchema(),
        promotion: objectSchema(),
        componentId: stringSchema(),
        componentType: stringSchema(),
        readyForLibraryPromotion: booleanSchema(),
        readyForSelection: booleanSchema(),
        readyForReviewableGeneration: booleanSchema(),
        libraryStatus: objectSchema(),
        replacementPolicy: objectSchema()
      })),
      directGeometryMutationAllowed: booleanSchema(),
      rawArtifactMutationAllowed: booleanSchema()
    }),
    permission: noConfirmation(),
    behavior: readOnlyBehavior(),
    concurrency: parallelRead(),
    sideEffects: [],
    rollback: noneRollback()
  }),
  tool({
    name: "scaffoldWorkspaceComponentDescriptorDraft",
    description: "Create a non-promotable ComponentDescriptor draft package skeleton under component-drafts/<draftId>/ for a same-type replacement part.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      draftId: stringSchema(),
      componentType: stringSchema(),
      displayName: stringSchema(),
      overwrite: booleanSchema()
    }, ["workspaceId", "draftId", "componentType"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      scaffolded: booleanSchema(),
      draftId: stringSchema(),
      componentType: stringSchema(),
      packagePath: stringSchema(),
      descriptorPath: stringSchema(),
      sourcesPath: stringSchema(),
      overwritten: booleanSchema(),
      readyForLibraryPromotion: booleanSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      directGeometryMutationAllowed: booleanSchema(),
      rawArtifactMutationAllowed: booleanSchema(),
      authoringChecklist: arraySchema(stringSchema()),
      draftReport: objectSchema()
    }),
    permission: confirmation("Writes a descriptor draft skeleton under component-drafts. It does not promote the descriptor, create a revision, or generate artifacts."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: false,
      mutatesComponentLibrary: false,
      writesWorkspaceDraft: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "write component-drafts/<draftId>/descriptor.json",
      "write component-drafts/<draftId>/sources.md",
      "append events.jsonl component_descriptor_draft_scaffolded"
    ],
    rollback: {
      strategy: "overwrite the draft scaffold with corrected draft files or leave it unpromoted",
      automatic: false
    }
  }),
  tool({
    name: "applyWorkspaceDescriptorDraftSpecs",
    description: "Apply explicit source-spec text to an existing workspace ComponentDescriptor draft package without promoting, selecting, or generating artifacts.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      draftId: stringSchema(),
      specsText: stringSchema(),
      specsSourcePath: stringSchema(),
      baseComponentId: stringSchema(),
      markReviewable: booleanSchema()
    }, ["workspaceId", "draftId", "specsText"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      specsApplied: booleanSchema(),
      draftId: stringSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      packagePath: stringSchema(),
      descriptorPath: stringSchema(),
      sourcesPath: stringSchema(),
      specsSourcePath: stringSchema(),
      baseComponentId: stringSchema(),
      extractedFields: arraySchema(stringSchema()),
      specPatch: objectSchema(),
      readyForLibraryPromotion: booleanSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      blockingIssues: arraySchema(objectSchema()),
      reviewWarnings: arraySchema(objectSchema()),
      draftReport: objectSchema(),
      directGeometryMutationAllowed: booleanSchema(),
      rawArtifactMutationAllowed: booleanSchema()
    }),
    permission: confirmation("Writes explicit source-spec data into an existing workspace descriptor draft. It does not promote, select, create a revision, or generate artifacts."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: false,
      mutatesComponentLibrary: false,
      writesWorkspaceDraft: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "read component-drafts/<draftId>/descriptor.json",
      "read component-drafts/<draftId>/sources.md",
      "write component-drafts/<draftId>/descriptor.json",
      "write component-drafts/<draftId>/sources.md",
      "append events.jsonl component_descriptor_draft_specs_applied"
    ],
    rollback: {
      strategy: "apply a corrected spec patch, overwrite the draft scaffold, or leave the draft unpromoted",
      automatic: false
    }
  }),
  tool({
    name: "promoteComponentDescriptorDraft",
    description: "Promote a valid ComponentDescriptor draft into the ProductPlan component library so later ProductPlan revisions can select it.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      descriptor: objectSchema(),
      descriptorJson: stringSchema(),
      expectedId: stringSchema(),
      sourcesText: stringSchema(),
      replaceExisting: booleanSchema()
    }, ["workspaceId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      promoted: booleanSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      packageStatus: stringSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      componentPreferencePath: stringSchema(),
      libraryStatus: objectSchema({
        scope: stringSchema(),
        loadedComponentExists: booleanSchema(),
        promotedComponentExists: booleanSchema(),
        descriptorCount: numberSchema()
      }),
      source: objectSchema(),
      replacement: objectSchema(),
      replacementPolicy: objectSchema({
        canSelectSameType: booleanSchema(),
        requiresProductPlanRevision: booleanSchema(),
        directGeometryMutationAllowed: booleanSchema(),
        rawArtifactMutationAllowed: booleanSchema()
      }),
      draftReport: objectSchema()
    }),
    permission: confirmation("Adds a descriptor to this ProductPlan component library. Selecting it still requires a separate ProductPlan revision."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: true,
      mutatesComponentLibrary: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "update runtime_plan.json workspaceState.productPlan.componentLibrary",
      "append events.jsonl component_descriptor_promoted"
    ],
    rollback: {
      strategy: "promote replacement with replaceExisting or remove through future component-library management action",
      automatic: false
    }
  }),
  tool({
    name: "promoteWorkspaceComponentDescriptorDraft",
    description: "Promote a valid ComponentDescriptor draft package from component-drafts/<draftId>/ into the ProductPlan component library.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      draftId: stringSchema(),
      replaceExisting: booleanSchema()
    }, ["workspaceId", "draftId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      promoted: booleanSchema(),
      draftId: stringSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      packageStatus: stringSchema(),
      readyForSelection: booleanSchema(),
      readyForReviewableGeneration: booleanSchema(),
      componentPreferencePath: stringSchema(),
      packagePath: stringSchema(),
      descriptorPath: stringSchema(),
      sourcesPath: stringSchema(),
      libraryStatus: objectSchema({
        scope: stringSchema(),
        loadedComponentExists: booleanSchema(),
        promotedComponentExists: booleanSchema(),
        descriptorCount: numberSchema()
      }),
      source: objectSchema(),
      replacement: objectSchema(),
      replacementPolicy: objectSchema(),
      draftReport: objectSchema()
    }),
    permission: confirmation("Promotes a workspace descriptor draft package into this ProductPlan component library. Selecting it still requires a separate ProductPlan revision."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: true,
      mutatesComponentLibrary: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "read component-drafts/<draftId>/descriptor.json",
      "read component-drafts/<draftId>/sources.md",
      "update runtime_plan.json workspaceState.productPlan.componentLibrary",
      "append events.jsonl component_descriptor_promoted"
    ],
    rollback: {
      strategy: "retire the promoted descriptor or promote a replacement descriptor",
      automatic: false
    }
  }),
  tool({
    name: "selectComponentDescriptor",
    description: "Select a loaded ready ComponentDescriptor for its same-type ProductPlan role by creating a pending revision without generating artifacts.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      componentId: stringSchema(),
      quantity: numberSchema(),
      message: stringSchema()
    }, ["workspaceId", "componentId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      selected: booleanSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      quantity: numberSchema(),
      componentPreferencePath: stringSchema(),
      readyForReviewableGeneration: booleanSchema(),
      newRevisionId: stringSchema(),
      diff: objectSchema(),
      validationReport: objectSchema(),
      artifactPaths: objectSchema(),
      packageReport: objectSchema(),
      directGeometryMutationAllowed: booleanSchema(),
      rawArtifactMutationAllowed: booleanSchema()
    }),
    permission: confirmation("Creates a pending ProductPlan revision selecting a ready descriptor. It does not write GLB/STL/STEP artifacts."),
    behavior: revisionStateWriteBehavior(),
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "read ComponentDescriptor package readiness",
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
    name: "retirePromotedComponentDescriptor",
    description: "Retire a ProductPlan-scoped promoted ComponentDescriptor so future ProductPlan revisions cannot select it while audit history is preserved.",
    inputSchema: objectSchema({
      workspaceId: stringSchema(),
      componentId: stringSchema(),
      reason: stringSchema(),
      clearPreference: booleanSchema()
    }, ["workspaceId", "componentId"]),
    outputSchema: objectSchema({
      ok: booleanSchema(),
      retired: booleanSchema(),
      componentId: stringSchema(),
      componentType: stringSchema(),
      previousStatus: stringSchema(),
      clearedComponentPreference: booleanSchema(),
      componentPreferencePath: stringSchema(),
      libraryStatus: objectSchema({
        scope: stringSchema(),
        descriptorCount: numberSchema(),
        activeDescriptorCount: numberSchema(),
        retiredDescriptorCount: numberSchema()
      }),
      directGeometryMutationAllowed: booleanSchema(),
      rawArtifactMutationAllowed: booleanSchema()
    }),
    permission: confirmation("Retires a promoted descriptor in this ProductPlan component library. Historical revisions keep their descriptor evidence."),
    behavior: {
      readOnly: false,
      destructive: false,
      createsProposal: false,
      createsRevision: false,
      writesArtifacts: false,
      mutatesCurrentState: true,
      mutatesComponentLibrary: true
    },
    concurrency: workspaceWriteLock(),
    sideEffects: [
      "update runtime_plan.json workspaceState.productPlan.componentLibrary",
      "append events.jsonl component_descriptor_retired"
    ],
    rollback: {
      strategy: "promote a corrected descriptor draft or explicitly re-promote a replacement descriptor",
      automatic: false
    }
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
      artifacts: objectSchema({
        productPlan: objectSchema(),
        geometrySpec: objectSchema(),
        componentSelections: objectSchema(),
        componentDescriptors: objectSchema(),
        componentAssetManifest: objectSchema(),
        generationEvidenceReport: objectSchema(),
        modelGlb: objectSchema(),
        shellFrontStl: objectSchema(),
        shellBackStl: objectSchema(),
        validationReport: objectSchema(),
        designSummary: objectSchema(),
        cadqueryScript: objectSchema(),
        step: objectSchema()
      }),
      artifactPaths: objectSchema({
        productPlan: stringSchema(),
        geometrySpec: stringSchema(),
        componentSelections: stringSchema(),
        componentDescriptors: stringSchema(),
        componentAssetManifest: stringSchema(),
        generationEvidenceReport: stringSchema(),
        modelGlb: stringSchema(),
        shellFrontStl: stringSchema(),
        shellBackStl: stringSchema(),
        validationReport: stringSchema(),
        designSummary: stringSchema(),
        cadqueryScript: stringSchema(),
        step: stringSchema()
      }),
      artifactStatus: objectSchema({
        status: stringSchema(),
        generated: booleanSchema(),
        trustedGenerated: booleanSchema(),
        hasModelGlb: booleanSchema(),
        hasShellStl: booleanSchema(),
        hasStep: booleanSchema(),
        hasGenerationEvidenceReport: booleanSchema(),
        artifactAuditStatus: stringSchema(),
        artifactAuditPassed: booleanSchema(),
        artifactAuditFindingCount: numberSchema()
      }),
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

function arraySchema(items = undefined) {
  return items ? { type: "array", items } : { type: "array" };
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
