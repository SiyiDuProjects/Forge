import { workspaceDraftIntegrityStatus } from "./workspace_draft_integrity.mjs";

export const REVISION_LEDGER_VERSION = "forge_revision_ledger_v0";

const GENERATED_ARTIFACT_FILES = {
  glb: "model.glb",
  stl: "model.stl",
  shellFront: "shell_front.stl",
  shellBack: "shell_back.stl",
  step: "model.step"
};

const DERIVED_REVISION_FILES = {
  geometrySpec: "geometry-spec.json",
  componentSelections: "component_selections.json",
  componentDescriptors: "component_descriptors.json",
  componentAssetManifest: "component_asset_manifest.json",
  validationReport: "validation_report.json",
  electronicsSpec: "electronics_spec.json",
  electronicsValidationReport: "electronics_validation_report.json",
  assemblyPlan: "assembly_plan.json",
  developmentBoardScaffold: "development_board_scaffold.json",
  prototypeReadinessReport: "prototype_readiness_report.json",
  generationEvidenceReport: "generation_evidence_report.json",
  designSummary: "design_summary.md",
  generationInputs: "generation_inputs.json"
};

export function buildRevisionLedger({ plan = {}, events = [], rootDir = "" } = {}) {
  const revisions = Array.isArray(plan.revisions) ? plan.revisions : [];
  const proposals = proposalStore(plan);
  const rollbackHistory = rollbackEvents(events);
  const currentRevisionId = plan.currentRevisionId || plan.workspaceState?.currentRevisionId || "";
  const eventTail = Array.isArray(events) ? events.at(-1) : null;
  const revisionRecords = revisions.map((revision) => revisionRecord(revision, currentRevisionId));
  const proposalRecords = proposals.map(proposalRecord);
  const acceptedChanges = acceptedChangeRecords({ revisions, proposals });
  const rejectedChanges = rejectedChangeRecords({ revisions, proposals });

  return {
    version: REVISION_LEDGER_VERSION,
    workspaceId: plan.planId || plan.workspaceState?.workspaceId || "",
    title: plan.workspaceState?.title || revisions.at(-1)?.requestText || "Forge hardware prototype",
    currentRevisionId,
    createdAt: plan.createdAt || "",
    updatedAt: plan.updatedAt || "",
    sourceOfTruth: {
      productPlan: "product_plan.json",
      runtimePlan: "runtime_plan.json",
      productPlanObject: "ProductPlan",
      componentLibrary: "ProductPlan.workspaceState.productPlan.componentLibrary",
      currentRevisionPointer: "ProductPlan.currentRevisionId",
      revisionSnapshots: "ProductPlan.revisions[].productPlanSnapshot",
      proposals: "ProductPlan.workspaceState.proposals",
      events: "events.jsonl",
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    },
    derivedOutputs: {
      geometrySpec: "revisions/<revisionId>/geometry-spec.json",
      validationReport: "revisions/<revisionId>/validation_report.json",
      componentAssetManifest: "revisions/<revisionId>/component_asset_manifest.json",
      generationEvidenceReport: "revisions/<revisionId>/generation_evidence_report.json",
      artifacts: "revisions/<revisionId>/artifacts/"
    },
    componentLibrary: componentLibrarySummary(plan.workspaceState?.productPlan || revisions.at(-1)?.productPlanSnapshot || {}, {
      workspaceId: plan.planId || plan.workspaceState?.workspaceId || "",
      rootDir
    }),
    revisions: revisionRecords,
    proposals: proposalRecords,
    acceptedChanges,
    rejectedChanges,
    diffMetadata: {
      revisionCount: revisionRecords.length,
      revisionIds: revisionRecords.map((revision) => revision.revisionId),
      latestDiff: revisionRecords.at(-1)?.diff || null
    },
    rollback: {
      supported: true,
      action: "revertRevision",
      behavior: "moves currentRevisionId to an existing immutable ProductPlan revision and appends a revision_reverted event",
      currentRevisionId,
      availableRevisionIds: revisionRecords.map((revision) => revision.revisionId),
      history: rollbackHistory
    },
    eventSummary: {
      eventCount: Array.isArray(events) ? events.length : 0,
      latestEventId: eventTail?.eventId || "",
      latestEventType: eventTail?.type || "",
      latestEventTimestamp: eventTail?.timestamp || ""
    },
    directEditingAllowed: false
  };
}

export function summarizeRevisionLedger(ledger = {}) {
  return {
    version: ledger.version || REVISION_LEDGER_VERSION,
    currentRevisionId: ledger.currentRevisionId || "",
    revisionCount: Array.isArray(ledger.revisions) ? ledger.revisions.length : 0,
    proposalCount: Array.isArray(ledger.proposals) ? ledger.proposals.length : 0,
    acceptedChangeCount: Array.isArray(ledger.acceptedChanges) ? ledger.acceptedChanges.length : 0,
    rejectedChangeCount: Array.isArray(ledger.rejectedChanges) ? ledger.rejectedChanges.length : 0,
    rollbackSupported: ledger.rollback?.supported === true,
    rollbackEventCount: Array.isArray(ledger.rollback?.history) ? ledger.rollback.history.length : 0,
    latestEventType: ledger.eventSummary?.latestEventType || "",
    componentLibraryDescriptorCount: ledger.componentLibrary?.descriptorCount || 0,
    activeComponentLibraryDescriptorCount: ledger.componentLibrary?.activeDescriptorCount || 0,
    retiredComponentLibraryDescriptorCount: ledger.componentLibrary?.retiredDescriptorCount || 0,
    directEditingAllowed: false
  };
}

function revisionRecord(revision = {}, currentRevisionId = "") {
  const revisionId = revision.revisionId || "";
  const validation = revision.geometryValidation || revision.modelArtifacts?.validation || {};
  return {
    revisionId,
    parentRevisionId: revision.diff?.fromRevision || "",
    sourceTurnId: revision.sourceTurnId || "",
    requestText: revision.requestText || "",
    createdAt: revision.createdAt || "",
    active: Boolean(revisionId && revisionId === currentRevisionId),
    sourceRecord: {
      productPlanSnapshotPath: revisionPath(revisionId, "product_plan.json"),
      productPlanSnapshotPresent: Boolean(revision.productPlanSnapshot),
      componentLibraryDescriptorCount: componentLibraryDescriptorCount(revision.productPlanSnapshot),
      patchCount: Array.isArray(revision.patches) ? revision.patches.length : 0,
      rejectedPatchCount: Array.isArray(revision.rejectedPatches) ? revision.rejectedPatches.length : 0,
      intent: revision.intent || "",
      generationConfirmed: revision.generationConfirmed === true
    },
    status: {
      productCategory: revision.productCategory || "",
      generationStatus: revision.generationStatus || revision.modelArtifacts?.status || "unknown",
      validationStatus: validation.status || "unknown",
      electronicsValidationStatus: revision.electronicsValidation?.status || "unknown",
      prototypeReadinessStatus: revision.prototypeReadinessStatus || revision.prototypeReadinessReport?.status || "unknown",
      modelArtifactsStatus: revision.modelArtifacts?.status || "unknown",
      generated: revision.modelArtifacts?.status === "generated",
      trustedGenerated: artifactAuditPassed(revision)
    },
    descriptorEvidence: {
      selectedComponentIds: revision.geometrySpec?.componentSelections?.selectedComponentIds || [],
      productPlanComponentLibraryDescriptorIds: componentLibraryDescriptorIds(revision.productPlanSnapshot),
      selectedProductPlanComponentIds: selectedProductPlanComponentIds(revision)
    },
    diff: diffRecord(revision.diff),
    acceptedChanges: (revision.patches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: "accepted",
      revisionId
    })),
    rejectedChanges: (revision.rejectedPatches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: "rejected",
      revisionId
    })),
    artifactManifest: artifactManifestForRevision(revision),
    rollbackTarget: {
      supported: Boolean(revisionId),
      action: "revertRevision",
      revisionId
    },
    directEditingAllowed: false
  };
}

function proposalRecord(proposal = {}) {
  const decision = proposalDecision(proposal);
  return {
    proposalId: proposal.proposalId || "",
    status: proposal.status || "proposed",
    decision,
    createdAt: proposal.createdAt || "",
    updatedAt: proposal.updatedAt || "",
    baseRevisionId: proposal.baseRevisionId || "",
    committedRevisionId: proposal.committedRevisionId || null,
    rejectedAt: proposal.rejectedAt || "",
    rejectionReason: proposal.rejectionReason || "",
    summary: proposal.summary || proposal.assistantSummary || "",
    patchCount: Array.isArray(proposal.patches) ? proposal.patches.length : 0,
    patches: (proposal.patches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision,
      proposalId: proposal.proposalId || ""
    })),
    validationPreview: {
      status: proposal.validationPreview?.status || "",
      blocked: proposal.validationPreview?.blocked === true,
      errorCount: Array.isArray(proposal.validationPreview?.errors) ? proposal.validationPreview.errors.length : 0,
      warningCount: Array.isArray(proposal.validationPreview?.warnings) ? proposal.validationPreview.warnings.length : 0
    }
  };
}

function artifactManifestForRevision(revision = {}) {
  const revisionId = revision.revisionId || "";
  const generatedArtifacts = generatedArtifactRecords(revision);
  const generationEvidence = revision.modelArtifacts?.generationEvidence || null;
  const artifactAudit = generationEvidence?.artifactAudit || {};
  return {
    revisionId,
    sourceProductPlanPath: revisionPath(revisionId, "product_plan.json"),
    derivedOutputs: derivedOutputRecords(revision),
    generatedArtifacts,
    status: revision.modelArtifacts?.status || revision.generationStatus || "unknown",
    generated: revision.modelArtifacts?.status === "generated",
    trustedGenerated: artifactAuditPassed(revision),
    artifactAuditStatus: artifactAudit.status || "unavailable",
    artifactAuditFindingCount: Array.isArray(artifactAudit.findings) ? artifactAudit.findings.length : 0,
    directEditingAllowed: false
  };
}

function componentLibrarySummary(productPlan = {}, { workspaceId = "", rootDir = "" } = {}) {
  const descriptors = Array.isArray(productPlan.componentLibrary?.descriptors)
    ? productPlan.componentLibrary.descriptors
    : [];
  const activeDescriptors = descriptors.filter((entry) => entry?.active !== false && entry?.status !== "retired");
  const retiredDescriptors = descriptors.filter((entry) => entry?.active === false || entry?.status === "retired");
  return {
    version: productPlan.componentLibrary?.version || "product_plan_component_library_v1",
    descriptorCount: descriptors.length,
    activeDescriptorCount: activeDescriptors.length,
    retiredDescriptorCount: retiredDescriptors.length,
    descriptorIds: descriptors.map(componentIdForLibraryEntry).filter(Boolean),
    activeDescriptorIds: activeDescriptors.map(componentIdForLibraryEntry).filter(Boolean),
    retiredDescriptorIds: retiredDescriptors.map(componentIdForLibraryEntry).filter(Boolean),
    descriptors: descriptors.map((entry) => ({
      componentId: componentIdForLibraryEntry(entry),
      componentType: entry.componentType || entry.descriptor?.identity?.category || entry.descriptor?.type || "",
      status: entry.status || "",
      active: entry.active !== false && entry.status !== "retired",
      sourceType: entry.source?.type || "",
      workspaceDraft: entry.source?.workspaceDraft
        ? {
          draftId: entry.source.workspaceDraft.draftId || "",
          packagePath: entry.source.workspaceDraft.packagePath || "",
          descriptorPath: entry.source.workspaceDraft.descriptorPath || "",
          sourcesPath: entry.source.workspaceDraft.sourcesPath || "",
          descriptorSha256: entry.source.workspaceDraft.descriptorSha256 || "",
          sourcesSha256: entry.source.workspaceDraft.sourcesSha256 || "",
          descriptorBytes: Number(entry.source.workspaceDraft.descriptorBytes || 0),
          sourcesBytes: Number(entry.source.workspaceDraft.sourcesBytes || 0),
          specPatch: compactSpecPatch(entry.source.workspaceDraft.specPatch),
          integrityStatus: workspaceDraftIntegrityStatus({
            workspaceId,
            rootDir,
            workspaceDraft: entry.source.workspaceDraft
          })
        }
        : null,
      promotedAt: entry.promotedAt || "",
      retiredAt: entry.retiredAt || "",
      retirementReason: entry.retirementReason || "",
      replacement: compactReplacementAudit(entry.replacement),
      replacementHistory: compactReplacementHistory(entry.replacementHistory),
      directEditingAllowed: false
    })),
    directEditingAllowed: false
  };
}

function componentLibraryDescriptorCount(productPlan = {}) {
  return componentLibraryDescriptorIds(productPlan).length;
}

function componentLibraryDescriptorIds(productPlan = {}) {
  const descriptors = Array.isArray(productPlan?.componentLibrary?.descriptors)
    ? productPlan.componentLibrary.descriptors
    : [];
  return descriptors.map(componentIdForLibraryEntry).filter(Boolean);
}

function selectedProductPlanComponentIds(revision = {}) {
  const productPlanDescriptorIds = new Set(componentLibraryDescriptorIds(revision.productPlanSnapshot));
  return (revision.geometrySpec?.componentSelections?.selectedComponentIds || [])
    .filter((componentId) => productPlanDescriptorIds.has(componentId));
}

function componentIdForLibraryEntry(entry = {}) {
  return entry.componentId || entry.descriptor?.identity?.id || entry.descriptor?.id || entry.identity?.id || entry.id || "";
}

function compactReplacementAudit(replacement = null) {
  if (!replacement) {
    return {
      replacedExisting: false,
      replacementCount: 0,
      directEditingAllowed: false
    };
  }
  return {
    replacedExisting: replacement.replacedExisting === true,
    replacedAt: replacement.replacedAt || "",
    replacementCount: Number(replacement.replacementCount || 0),
    previous: compactReplacementPrevious(replacement.previous),
    directEditingAllowed: false
  };
}

function compactReplacementHistory(history = []) {
  return Array.isArray(history)
    ? history.map((item) => ({
      replacedAt: item.replacedAt || "",
      previous: compactReplacementPrevious(item.previous),
      directEditingAllowed: false
    }))
    : [];
}

function compactReplacementPrevious(previous = null) {
  if (!previous) return null;
  return {
    componentId: previous.componentId || "",
    componentType: previous.componentType || "",
    displayName: previous.displayName || "",
    descriptorVersion: previous.descriptorVersion || "",
    status: previous.status || "",
    active: previous.active === true,
    promotedAt: previous.promotedAt || "",
    sourceType: previous.sourceType || "",
    workspaceDraft: previous.workspaceDraft
      ? {
        draftId: previous.workspaceDraft.draftId || "",
        packagePath: previous.workspaceDraft.packagePath || "",
        descriptorPath: previous.workspaceDraft.descriptorPath || "",
        sourcesPath: previous.workspaceDraft.sourcesPath || "",
        descriptorSha256: previous.workspaceDraft.descriptorSha256 || "",
        sourcesSha256: previous.workspaceDraft.sourcesSha256 || "",
        descriptorBytes: Number(previous.workspaceDraft.descriptorBytes || 0),
        sourcesBytes: Number(previous.workspaceDraft.sourcesBytes || 0),
        specPatch: compactSpecPatch(previous.workspaceDraft.specPatch)
      }
      : null,
    directEditingAllowed: false
  };
}

function compactSpecPatch(specPatch = null) {
  if (!specPatch) {
    return {
      applied: false
    };
  }
  return {
    applied: specPatch.applied === true,
    eventId: specPatch.eventId || "",
    timestamp: specPatch.timestamp || "",
    draftId: specPatch.draftId || "",
    componentId: specPatch.componentId || "",
    componentType: specPatch.componentType || "",
    baseComponentId: specPatch.baseComponentId || "",
    specsSourcePath: specPatch.specsSourcePath || "",
    extractedFields: Array.isArray(specPatch.extractedFields) ? [...specPatch.extractedFields] : [],
    readyForLibraryPromotion: specPatch.readyForLibraryPromotion === true,
    blockingIssueCount: Number(specPatch.blockingIssueCount || 0),
    directGeometryMutationAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

function derivedOutputRecords(revision = {}) {
  const revisionId = revision.revisionId || "";
  const generationEvidence = revision.modelArtifacts?.generationEvidence || null;
  const outputPresence = {
    geometrySpec: Boolean(revision.geometrySpec),
    componentSelections: Boolean(revision.geometrySpec?.componentSelections),
    componentDescriptors: Array.isArray(revision.geometrySpec?.componentDescriptors),
    componentAssetManifest: Boolean(revision.geometrySpec?.componentAssetManifest),
    validationReport: Boolean(revision.geometryValidation || revision.modelArtifacts?.validation),
    electronicsSpec: Boolean(revision.electronicsSpec),
    electronicsValidationReport: Boolean(revision.electronicsValidation),
    assemblyPlan: Boolean(revision.assemblyPlan),
    developmentBoardScaffold: Boolean(revision.developmentBoardScaffold),
    prototypeReadinessReport: Boolean(revision.prototypeReadinessReport),
    generationEvidenceReport: Boolean(generationEvidence),
    designSummary: Boolean(revisionId),
    generationInputs: Boolean(revisionId)
  };
  return Object.entries(DERIVED_REVISION_FILES).map(([key, fileName]) => ({
    key,
    type: key,
    relativePath: revisionPath(revisionId, fileName),
    present: outputPresence[key] === true,
    source: key === "geometrySpec" ? "derived_generation_input" : "derived_revision_output",
    directEditingAllowed: false
  }));
}

function generatedArtifactRecords(revision = {}) {
  const revisionId = revision.revisionId || "";
  const artifacts = revision.modelArtifacts?.artifacts || {};
  const integrity = revision.modelArtifacts?.generationEvidence?.artifactIntegrity || {};
  return Object.entries(GENERATED_ARTIFACT_FILES)
    .filter(([key]) => Boolean(artifacts[key]?.localPath || artifacts[key]?.url || integrity[key]?.present))
    .map(([key, fileName]) => ({
      key,
      type: artifacts[key]?.type || key,
      relativePath: revisionPath(revisionId, `artifacts/${fileName}`),
      present: Boolean(artifacts[key]?.localPath || artifacts[key]?.url || integrity[key]?.present),
      bytes: Number(integrity[key]?.bytes || 0),
      sha256: integrity[key]?.sha256 || "",
      source: "derived_generated_artifact",
      directEditingAllowed: false
    }));
}

function diffRecord(diff = {}) {
  const changes = Array.isArray(diff.changes) ? diff.changes : [];
  return {
    fromRevisionId: diff.fromRevision || "",
    toRevisionId: diff.toRevision || "",
    changeCount: changes.length,
    changes: clone(changes)
  };
}

function acceptedChangeRecords({ revisions = [], proposals = [] } = {}) {
  const revisionChanges = revisions.flatMap((revision) => (
    (revision.patches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: "accepted",
      revisionId: revision.revisionId || ""
    }))
  ));
  const proposalChanges = proposals
    .filter((proposal) => proposal.status === "committed")
    .flatMap((proposal) => (proposal.patches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: "accepted",
      proposalId: proposal.proposalId || "",
      revisionId: proposal.committedRevisionId || ""
    })));
  return [...revisionChanges, ...proposalChanges];
}

function rejectedChangeRecords({ revisions = [], proposals = [] } = {}) {
  const revisionChanges = revisions.flatMap((revision) => (
    (revision.rejectedPatches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: "rejected",
      revisionId: revision.revisionId || ""
    }))
  ));
  const proposalChanges = proposals
    .filter((proposal) => proposal.status === "rejected" || proposal.status === "expired")
    .flatMap((proposal) => (proposal.patches || []).map((patch, index) => patchRecord({
      patch,
      index,
      decision: proposal.status === "expired" ? "expired" : "rejected",
      proposalId: proposal.proposalId || "",
      reason: proposal.rejectionReason || ""
    })));
  return [...revisionChanges, ...proposalChanges];
}

function patchRecord({ patch = {}, index = 0, decision = "pending", proposalId = "", revisionId = "", reason = "" } = {}) {
  return {
    patchId: `${proposalId || revisionId || "patch"}-${index + 1}`,
    proposalId,
    revisionId,
    decision,
    reason,
    type: patch.type || "unknown_patch",
    summary: patchSummary(patch),
    patch: clone(patch)
  };
}

function patchSummary(patch = {}) {
  if (patch.type === "plan_patch") {
    const setKeys = Object.keys(patch.set || {});
    const unsetKeys = patch.unset || [];
    return `plan_patch set:${setKeys.join(",") || "none"} unset:${unsetKeys.join(",") || "none"}`;
  }
  if (patch.type === "component_patch") {
    const added = (patch.add || []).map((item) => item.componentId || item.componentType).filter(Boolean);
    const removed = (patch.remove || []).map((item) => item.componentId || item.componentType).filter(Boolean);
    return `component_patch add:${added.join(",") || "none"} remove:${removed.join(",") || "none"}`;
  }
  if (patch.type === "geometry_preference_patch") {
    return `geometry_preference_patch set:${Object.keys(patch.set || {}).join(",") || "none"}`;
  }
  return patch.type || "unknown_patch";
}

function rollbackEvents(events = []) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => event.type === "revision_reverted")
    .map((event) => ({
      eventId: event.eventId || "",
      timestamp: event.timestamp || "",
      fromRevisionId: event.payload?.fromRevisionId || "",
      toRevisionId: event.payload?.toRevisionId || "",
      currentRevisionId: event.payload?.currentRevisionId || ""
    }));
}

function proposalStore(plan = {}) {
  if (Array.isArray(plan.workspaceState?.proposals)) return plan.workspaceState.proposals;
  if (Array.isArray(plan.proposals)) return plan.proposals;
  return [];
}

function proposalDecision(proposal = {}) {
  if (proposal.status === "committed") return "accepted";
  if (proposal.status === "rejected") return "rejected";
  if (proposal.status === "expired") return "expired";
  return "pending";
}

function artifactAuditPassed(revision = {}) {
  return revision.modelArtifacts?.status === "generated"
    && revision.modelArtifacts?.generationEvidence?.artifactAudit?.passed === true;
}

function revisionPath(revisionId = "", fileName = "") {
  const safeRevisionId = safeSegment(revisionId || "unknown_revision");
  return `revisions/${safeRevisionId}/${fileName}`;
}

function safeSegment(value = "") {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function clone(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}
