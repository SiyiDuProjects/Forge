import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  defaultProjectWorkspaceRoot,
  projectWorkspacePath,
  readRevisionLedger,
  readWorkspaceEvents,
  runtimeBindingFromSources
} from "./project_workspace.mjs";
import { summarizeRevisionLedger } from "./revision_ledger.mjs";
import { listToolMetadata } from "./tool_registry.mjs";
import { workspaceDraftIntegrityStatus } from "./workspace_draft_integrity.mjs";

export function buildContextPack({
  workspaceId,
  rootDir = defaultProjectWorkspaceRoot(),
  recentEventLimit = 8
} = {}) {
  if (!workspaceId) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_WORKSPACE",
        message: "workspaceId is required."
      }
    };
  }

  const workspacePath = projectWorkspacePath(workspaceId, { rootDir });
  const manifest = readJson(join(workspacePath, "project_manifest.json"));
  if (!manifest) {
    return {
      ok: false,
      error: {
        code: "WORKSPACE_FOLDER_NOT_FOUND",
        message: `No Forge project folder found for ${workspaceId}.`
      }
    };
  }

  const productPlan = readJson(join(workspacePath, manifest.currentProductPlanPath || "product_plan.json")) || {};
  const runtimeBinding = runtimeBindingFromSources({ manifest, productPlan });
  const currentRevisionId = manifest.currentRevisionId || "";
  const revisionPath = currentRevisionId
    ? join(workspacePath, "revisions", currentRevisionId)
    : "";
  const revisionManifest = revisionPath ? readJson(join(revisionPath, "revision_manifest.json")) : null;
  const validationReport = revisionPath ? readJson(join(revisionPath, "validation_report.json")) : null;
  const generationEvidenceReport = revisionPath ? readJson(join(revisionPath, "generation_evidence_report.json")) : null;
  const revisionLedger = readRevisionLedger({ workspaceId, rootDir }) || {};
  const proposals = readProposalSummaries(join(workspacePath, "proposals"));
  const events = readWorkspaceEvents({
    workspaceId,
    rootDir,
    limit: recentEventLimit
  });
  const allowedTools = listToolMetadata().map((tool) => ({
    name: tool.name,
    requiresConfirmation: Boolean(tool.permission?.requiresConfirmation),
    readOnly: Boolean(tool.behavior?.readOnly),
    mutatesCurrentState: Boolean(tool.behavior?.mutatesCurrentState),
    writesArtifacts: Boolean(tool.behavior?.writesArtifacts),
    safeToRunInParallel: Boolean(tool.concurrency?.safeToRunInParallel),
    lock: tool.concurrency?.lock || null
  }));

  return {
    ok: true,
    workspaceId,
    projectSummary: {
      title: manifest.title,
      status: manifest.status,
      currentRevisionId,
      runtimeBinding,
      projectPath: workspacePath,
      updatedAt: manifest.updatedAt,
      eventsPath: manifest.eventsPath || "events.jsonl"
    },
    currentProductPlanSummary: productPlanSummary(productPlan, { workspaceId, rootDir }),
    currentRevisionSummary: revisionSummary(revisionManifest, validationReport, generationEvidenceReport),
    revisionLedgerSummary: summarizeRevisionLedger(revisionLedger),
    openProposals: proposals.filter((proposal) => ["proposed", "staged"].includes(proposal.status)),
    recentEvents: events.map((event) => ({
      eventId: event.eventId,
      timestamp: event.timestamp,
      type: event.type,
      actor: event.actor,
      summary: eventSummary(event)
    })),
    recentDecisions: decisionSummary(productPlan),
    validationWarnings: validationWarnings(validationReport),
    generationEvidenceSummary: generationEvidenceSummary(generationEvidenceReport),
    allowedTools,
    artifactSummary: (revisionManifest?.artifactSummary || []).map((artifact) => ({
      artifactKey: artifact.artifactKey,
      type: artifact.type,
      relativePath: artifact.relativePath,
      bytes: artifact.bytes,
      caption: artifact.caption
    })),
    exclusions: [
      "raw GLB/STL/STEP bytes",
      "raw descriptor source/spec text",
      "full events.jsonl",
      "arbitrary project file contents",
      "direct GeometrySpec mutation instructions"
    ]
  };
}

function productPlanSummary(productPlan = {}, { workspaceId = "", rootDir = defaultProjectWorkspaceRoot() } = {}) {
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  const geometryPreferences = productPlan.geometryPreferences || {};
  const selectedComponents = [];
  if (requirements.display) selectedComponents.push("display");
  if (requirements.usbC) selectedComponents.push("usb_c");
  if (requirements.ambientSensor) selectedComponents.push("ambient_sensor");
  if (requirements.buttons) selectedComponents.push(`${requirements.buttons} button(s)`);
  if (requirements.speaker) selectedComponents.push("speaker");
  if (requirements.buzzer) selectedComponents.push("buzzer");
  if (requirements.camera) selectedComponents.push("camera_review");
  if (requirements.battery) selectedComponents.push("battery_review");
  return {
    productType: productPlan.productType || "desktop_display",
    userIntent: productPlan.userIntent || "",
    requirements: {
      displaySizeInches: requirements.displaySizeInches || null,
      usbC: Boolean(requirements.usbC),
      camera: Boolean(requirements.camera),
      battery: Boolean(requirements.battery),
      buttons: Number(requirements.buttons || 0)
    },
    components: selectedComponents,
    componentLibrary: productPlanComponentLibrarySummary(productPlan, { workspaceId, rootDir }),
    manufacturingMethod: constraints.manufacturingMethod || "fdm_3d_printing",
    finish: constraints.finish || "",
    shapeProfile: geometryPreferences.enclosure?.shapeProfile || constraints.preferredStyle || "rounded_rect"
  };
}

function productPlanComponentLibrarySummary(productPlan = {}, { workspaceId = "", rootDir = defaultProjectWorkspaceRoot() } = {}) {
  const descriptors = Array.isArray(productPlan.componentLibrary?.descriptors)
    ? productPlan.componentLibrary.descriptors
    : [];
  const activeDescriptors = descriptors.filter((entry) => entry?.active !== false && entry?.status !== "retired");
  const retiredDescriptors = descriptors.filter((entry) => entry?.active === false || entry?.status === "retired");
  return {
    version: productPlan.componentLibrary?.version || "product_plan_component_library_v1",
    descriptorCount: descriptors.length,
    promotedComponentIds: descriptors.map(componentIdForLibraryEntry).filter(Boolean),
    activeComponentIds: activeDescriptors.map(componentIdForLibraryEntry).filter(Boolean),
    retiredComponentIds: retiredDescriptors.map(componentIdForLibraryEntry).filter(Boolean),
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

function revisionSummary(revisionManifest, validationReport, generationEvidenceReport) {
  if (!revisionManifest) {
    return {
      revisionId: "",
      generationStatus: "none",
      validationStatus: "unknown",
      directEditingAllowed: false
    };
  }
  return {
    revisionId: revisionManifest.revisionId,
    generationStatus: revisionManifest.generationStatus,
    validationStatus: revisionManifest.validationStatus || validationReport?.status || "unknown",
    sourceOfTruth: revisionManifest.sourceOfTruth || {},
    derivedArtifacts: revisionManifest.derivedArtifacts || {},
    generationEvidence: generationEvidenceReport
      ? {
        version: generationEvidenceReport.version || "",
        status: generationEvidenceReport.status || "",
        generatedArtifactsPresent: Boolean(generationEvidenceReport.generatedArtifactsPresent),
        artifactAudit: {
          status: generationEvidenceReport.artifactAudit?.status || "",
          passed: generationEvidenceReport.artifactAudit?.passed === true,
          findingCount: (generationEvidenceReport.artifactAudit?.findings || []).length,
          diagnostics: compactArtifactAuditDiagnostics(generationEvidenceReport.artifactAudit || {})
        },
        directEditingAllowed: generationEvidenceReport.directEditingAllowed === true
      }
      : null,
    artifactCount: Array.isArray(revisionManifest.artifactSummary) ? revisionManifest.artifactSummary.length : 0,
    directEditingAllowed: false
  };
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

function generationEvidenceSummary(report) {
  if (!report) {
    return {
      available: false,
      artifactAudit: {
        available: false
      }
    };
  }
  return {
    available: true,
    version: report.version || "",
    status: report.status || "",
    source: report.source || "",
    sourceOfTruth: report.sourceOfTruth || {},
    generatedArtifactsPresent: Boolean(report.generatedArtifactsPresent),
    validation: {
      status: report.validation?.status || "",
      canGenerateArtifacts: Boolean(report.validation?.canGenerateArtifacts),
      issueCounts: report.validation?.issueCounts || {}
    },
    descriptorEvidence: {
      descriptorVersion: report.descriptorEvidence?.descriptorVersion || "",
      selectedComponentIds: report.descriptorEvidence?.selectedComponentIds || [],
      componentOrigins: compactComponentOrigins(report.descriptorEvidence?.componentOrigins || []),
      mechanicalConstraintCoverage: report.descriptorEvidence?.mechanicalConstraintCoverage || {}
    },
    layoutEvidence: {
      version: report.layoutEvidence?.version || "",
      coverage: report.layoutEvidence?.coverage || {},
      directEditingAllowed: report.layoutEvidence?.directEditingAllowed === true
    },
    artifactIntegrity: compactArtifactIntegrity(report.artifactIntegrity || {}),
    artifactAudit: compactArtifactAudit(report.artifactAudit || {}),
    directEditingAllowed: report.directEditingAllowed === true,
    userFacingCadExport: report.userFacingCadExport === true
  };
}

function compactComponentOrigins(componentOrigins = []) {
  return Array.isArray(componentOrigins)
    ? componentOrigins.map(compactComponentOrigin).filter((origin) => origin.componentId)
    : [];
}

function compactComponentOrigin(origin = {}) {
  return {
    componentId: origin.componentId || "",
    descriptorPath: origin.descriptorPath || "",
    sourcesPath: origin.sourcesPath || "",
    libraryScope: origin.libraryScope || "",
    sourceType: origin.sourceType || "",
    workspaceDraft: compactOriginWorkspaceDraft(origin.workspaceDraft),
    replacement: compactReplacementAudit(origin.replacement),
    replacementHistory: compactReplacementHistory(origin.replacementHistory),
    directEditingAllowed: false,
    rawArtifactMutationAllowed: false
  };
}

function compactOriginWorkspaceDraft(workspaceDraft = null) {
  if (!workspaceDraft) return null;
  return {
    draftId: workspaceDraft.draftId || "",
    packagePath: workspaceDraft.packagePath || "",
    descriptorPath: workspaceDraft.descriptorPath || "",
    sourcesPath: workspaceDraft.sourcesPath || "",
    descriptorSha256: workspaceDraft.descriptorSha256 || "",
    sourcesSha256: workspaceDraft.sourcesSha256 || "",
    descriptorBytes: Number(workspaceDraft.descriptorBytes || 0),
    sourcesBytes: Number(workspaceDraft.sourcesBytes || 0),
    specPatch: compactSpecPatch(workspaceDraft.specPatch)
  };
}

function compactArtifactIntegrity(artifactIntegrity = {}) {
  return Object.fromEntries(
    Object.entries(artifactIntegrity).map(([key, value]) => [key, {
      present: Boolean(value?.present),
      type: value?.type || "",
      bytes: Number(value?.bytes || 0),
      sha256: value?.sha256 || ""
    }])
  );
}

function compactArtifactAudit(artifactAudit = {}) {
  if (!artifactAudit.version) {
    return {
      available: false
    };
  }
  return {
    available: true,
    version: artifactAudit.version || "",
    status: artifactAudit.status || "",
    passed: artifactAudit.passed === true,
    generatedArtifactKeys: artifactAudit.generatedArtifactKeys || [],
    findingCount: (artifactAudit.findings || []).length,
    findingCodes: (artifactAudit.findings || []).slice(0, 8).map((finding) => ({
      artifactKey: finding.artifactKey || "",
      level: finding.level || "",
      code: finding.code || ""
    })),
    diagnostics: compactArtifactAuditDiagnostics(artifactAudit),
    checks: Object.fromEntries(
      Object.entries(artifactAudit.checks || {}).map(([key, value]) => [key, {
        passed: value?.passed === true,
        present: value?.present === true,
        bytes: Number(value?.bytes || 0),
        sha256Recorded: value?.sha256Recorded === true,
        diagnostics: compactArtifactCheckDiagnostics(key, value)
      }])
    )
  };
}

function compactArtifactAuditDiagnostics(artifactAudit = {}) {
  const checks = artifactAudit.checks || {};
  const glb = checks.glb || {};
  const stl = checks.stl || {};
  const shellFront = checks.shellFront || {};
  const shellBack = checks.shellBack || {};
  const step = checks.step || {};
  return {
    glb: {
      passed: glb.passed === true,
      linePrimitiveCount: Number(glb.linePrimitiveCount || 0),
      thinMeshPrimitiveCount: Number(glb.thinMeshPrimitiveCount || 0),
      vec3AccessorMissingBoundsCount: Number(glb.vec3AccessorMissingBoundsCount || 0),
      meshPrimitiveCount: Number(glb.meshPrimitiveCount || 0)
    },
    stl: {
      passed: stl.passed === true,
      degenerateFacetCount: Number(stl.geometry?.degenerateFacetCount || 0),
      thinAxisCount: Number(stl.geometry?.thinAxisCount || 0),
      shellFrontThinAxisCount: Number(shellFront.geometry?.thinAxisCount || 0),
      shellBackThinAxisCount: Number(shellBack.geometry?.thinAxisCount || 0)
    },
    step: {
      passed: step.passed === true,
      shellDimensionsPositive: step.metadata?.shellDimensionsPositive === true,
      componentAssetManifestPresent: step.format?.hasComponentAssetManifest === true,
      directEditingBoundaryPresent: step.metadata?.directEditingBoundaryPresent === true
    }
  };
}

function compactArtifactCheckDiagnostics(key, value = {}) {
  if (key === "glb") {
    return {
      format: {
        glbMagic: value.format?.glbMagic === true,
        version: Number(value.format?.version || 0),
        parsedJson: value.format?.parsedJson === true,
        binaryChunkPresent: value.format?.binaryChunkPresent === true
      },
      semanticNodePrefixes: value.semanticNodePrefixes || {},
      linePrimitiveCount: Number(value.linePrimitiveCount || 0),
      thinMeshPrimitiveCount: Number(value.thinMeshPrimitiveCount || 0),
      minimumMeshSpanMm: Number(value.minimumMeshSpanMm || 0),
      vec3AccessorMissingBoundsCount: Number(value.vec3AccessorMissingBoundsCount || 0),
      meshPrimitiveCount: Number(value.meshPrimitiveCount || 0)
    };
  }
  if (key === "stl" || key === "shellFront" || key === "shellBack") {
    return {
      format: {
        startsWithSolid: value.format?.startsWithSolid === true,
        hasEndSolid: value.format?.hasEndSolid === true,
        facetCount: Number(value.format?.facetCount || 0)
      },
      geometry: {
        vertexCount: Number(value.geometry?.vertexCount || 0),
        degenerateFacetCount: Number(value.geometry?.degenerateFacetCount || 0),
        thinAxisCount: Number(value.geometry?.thinAxisCount || 0),
        spanMm: value.geometry?.spanMm || null,
        minimumSpanMm: Number(value.geometry?.minimumSpanMm || 0)
      }
    };
  }
  if (key === "step") {
    return {
      format: {
        hasStepHeader: value.format?.hasStepHeader === true,
        hasStepFooter: value.format?.hasStepFooter === true,
        hasShellDimensions: value.format?.hasShellDimensions === true,
        hasModulePlacements: value.format?.hasModulePlacements === true,
        hasComponentAssetManifest: value.format?.hasComponentAssetManifest === true,
        hasMechanicalConstraints: value.format?.hasMechanicalConstraints === true,
        hasLayoutExplanation: value.format?.hasLayoutExplanation === true
      },
      metadata: {
        shellDimensionsPositive: value.metadata?.shellDimensionsPositive === true,
        directEditingBoundaryPresent: value.metadata?.directEditingBoundaryPresent === true
      }
    };
  }
  return {};
}

function readProposalSummaries(proposalDir) {
  if (!existsSync(proposalDir)) return [];
  return readdirSync(proposalDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => readJson(join(proposalDir, fileName)))
    .filter(Boolean)
    .map((proposal) => ({
      proposalId: proposal.proposalId,
      status: proposal.status,
      summary: proposal.summary || proposal.assistantSummary || "",
      baseRevisionId: proposal.baseRevisionId || "",
      committedRevisionId: proposal.committedRevisionId || null,
      patchCount: Array.isArray(proposal.patches) ? proposal.patches.length : 0,
      updatedAt: proposal.updatedAt || proposal.createdAt || ""
    }));
}

function validationWarnings(validationReport = {}) {
  return (validationReport?.issues || [])
    .filter((issue) => issue.level === "warn" || issue.level === "block")
    .map((issue) => ({
      level: issue.level,
      code: issue.code || "",
      moduleId: issue.moduleId || "",
      message: issue.message || ""
    }));
}

function decisionSummary(productPlan = {}) {
  const requirements = productPlan.requirements || {};
  const constraints = productPlan.constraints || {};
  return [
    `Manufacturing path: ${constraints.manufacturingMethod || "fdm_3d_printing"}`,
    `Finish treatment: ${constraints.finish || "unspecified"}`,
    requirements.usbC ? "USB-C desktop power is in scope." : "Power method remains open.",
    requirements.battery ? "Battery is a human-review risk." : "Battery is excluded from the current standard path.",
    requirements.camera ? "Camera is a human-review risk." : "Camera is excluded from the current standard path.",
    "GeometrySpec is the only 3D-generation input for locked revisions."
  ];
}

function eventSummary(event = {}) {
  const payload = event.payload || {};
  if (payload.summary) return payload.summary;
  if (payload.revisionId) return `${event.type}: ${payload.revisionId}`;
  if (payload.proposalId) return `${event.type}: ${payload.proposalId}`;
  if (payload.status) return `${event.type}: ${payload.status}`;
  return event.type || "";
}

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  if (statSync(filePath).size === 0) return null;
  return JSON.parse(readFileSync(filePath, "utf8"));
}
