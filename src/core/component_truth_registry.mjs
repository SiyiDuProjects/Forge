import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPONENT_REVIEW_STATUS,
  COMPONENT_TRUST_LEVEL,
  normalizeComponentDescriptor,
  validateComponentDescriptorV2
} from "./component_descriptor_schema.mjs";

export const COMPONENT_TRUTH_REGISTRY_VERSION = "component_truth_registry_v0";

export const COMMON_HARDWARE_MODULE_TYPES = Object.freeze([
  "display",
  "core_board",
  "interface",
  "sensor",
  "speaker",
  "camera",
  "battery",
  "button"
]);

const componentAssetsRoot = fileURLToPath(new URL("./component_assets/", import.meta.url));
const coreRoot = fileURLToPath(new URL("./", import.meta.url));

const REQUIRED_REGISTRY_FIELD_PATHS = Object.freeze([
  "schemaVersion",
  "identity.id",
  "identity.displayName",
  "identity.category",
  "versioning.descriptorVersion",
  "assetQuality",
  "validationStatus",
  "trustLevel",
  "reviewStatus",
  "sourceEvidence.sourceType",
  "sourceEvidence.sourceConfidence",
  "sourceEvidence.measurementBasis",
  "sourceEvidence.lastReviewed",
  "sourceEvidence.references",
  "dimensionsMm.width",
  "dimensionsMm.height",
  "dimensionsMm.depth",
  "coordinateSystem.origin",
  "coordinateSystem.front",
  "visualProxy",
  "mechanicalProxy",
  "mountingHoles",
  "connectors",
  "interfaces",
  "externalFeatures",
  "keepouts",
  "accessVolumes",
  "cableExitDirections",
  "riskFlags",
  "assetPaths",
  "sourceNotes.summary",
  "sourceNotes.sourcesFile",
  "sourceNotes.confidence"
]);

export function componentTruthRegistryDirectory() {
  return componentAssetsRoot;
}

export function listComponentTruthRegistryEntries(options = {}) {
  return createComponentTruthRegistryReport(options).entries;
}

export function createComponentTruthRegistryReport({ root = componentAssetsRoot } = {}) {
  const rawEntries = loadRawDescriptorEntries(root);
  const knownConnectorIdsByComponentId = new Map(rawEntries.map(({ folder, raw }) => [
    raw.identity?.id || raw.id || folder,
    new Set((raw.connectors || []).map((connector) => connector.id).filter(Boolean))
  ]));

  const entries = rawEntries.map(({ folder, descriptorPath, raw }) => {
    const sourcesPath = join(dirname(descriptorPath), raw.sourceNotes?.sourcesFile || "sources.md");
    const sourcesFileExists = existsSync(sourcesPath);
    const descriptorPathLabel = pathLabel(descriptorPath, root);
    const sourcesPathLabel = pathLabel(sourcesPath, root);
    const schemaValidation = validateComponentDescriptorV2(raw, {
      expectedId: folder,
      knownConnectorIdsByComponentId,
      sourcesFileExists
    });
    const lint = lintComponentDescriptorForRegistry(raw, {
      descriptorPath: descriptorPathLabel,
      sourcesPath: sourcesPathLabel,
      sourcesFileExists,
      schemaValidation
    });
    const normalized = normalizeComponentDescriptor(raw);
    const componentType = normalized.descriptorCategory || raw.identity?.category || "unknown";
    const registryReady = schemaValidation.valid && lint.valid;
    return {
      componentId: normalized.id || folder,
      componentType,
      displayName: normalized.displayName || raw.identity?.displayName || folder,
      descriptorPath: descriptorPathLabel,
      sourcesPath: sourcesPathLabel,
      schemaValidation: {
        valid: schemaValidation.valid,
        errors: [...schemaValidation.errors],
        warnings: [...schemaValidation.warnings]
      },
      lint,
      trustLevel: raw.trustLevel || normalized.trustLevel || "unknown",
      reviewStatus: raw.reviewStatus || normalized.reviewStatus || "needs_review",
      sourceEvidence: summarizeSourceEvidence(raw, {
        descriptorPath: descriptorPathLabel,
        sourcesPath: sourcesPathLabel,
        sourcesFileExists
      }),
      missingFields: [...lint.missingFields],
      missingFieldCount: lint.missingFields.length,
      registryReady,
      readyForTrustedPreview: registryReady
        && COMMON_HARDWARE_MODULE_TYPES.includes(componentType)
        && !["blocked", "retired"].includes(raw.reviewStatus || normalized.reviewStatus || ""),
      productionReady: normalized.mechanicalConstraints?.productionReady === true,
      riskReviewRequired: Boolean(normalized.risk?.requiresManualValidation),
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false
    };
  });

  return {
    version: COMPONENT_TRUTH_REGISTRY_VERSION,
    source: "component_descriptor_v2",
    descriptorRoot: pathLabel(root, root),
    commonHardwareModuleTypes: [...COMMON_HARDWARE_MODULE_TYPES],
    entries,
    summary: createRegistrySummary(entries),
    boundaries: {
      readOnlyRegistry: true,
      directGeometryMutationAllowed: false,
      rawArtifactMutationAllowed: false,
      layoutAlgorithmModifiedByRegistry: false,
      geometrySpecGeneratedByRegistry: false
    }
  };
}

export function lintComponentDescriptorForRegistry(
  descriptor = {},
  { descriptorPath = "", sourcesPath = "", sourcesFileExists = null, schemaValidation = null } = {}
) {
  const errors = [];
  const warnings = [];
  const missingFields = missingRegistryFields(descriptor);
  for (const field of missingFields) {
    errors.push({
      code: "missing_registry_field",
      field: field.path,
      severity: field.severity,
      message: `${field.path} is required for Component Truth Registry V0.`
    });
  }

  if (descriptor.trustLevel && !Object.values(COMPONENT_TRUST_LEVEL).includes(descriptor.trustLevel)) {
    errors.push({
      code: "invalid_trust_level",
      field: "trustLevel",
      severity: "error",
      message: `trustLevel must be one of ${Object.values(COMPONENT_TRUST_LEVEL).join(", ")}.`
    });
  }
  if (descriptor.reviewStatus && !Object.values(COMPONENT_REVIEW_STATUS).includes(descriptor.reviewStatus)) {
    errors.push({
      code: "invalid_review_status",
      field: "reviewStatus",
      severity: "error",
      message: `reviewStatus must be one of ${Object.values(COMPONENT_REVIEW_STATUS).join(", ")}.`
    });
  }

  const sourceNotesPath = descriptor.sourceNotes?.sourcesFile || "";
  const references = descriptor.sourceEvidence?.references || [];
  if (sourceNotesPath && Array.isArray(references) && !references.some((reference) => reference.path === sourceNotesPath)) {
    errors.push({
      code: "source_note_reference_missing",
      field: "sourceEvidence.references",
      severity: "error",
      message: `sourceEvidence.references must include ${sourceNotesPath}.`
    });
  }
  if (sourcesFileExists === false) {
    errors.push({
      code: "source_note_file_missing",
      field: "sourceNotes.sourcesFile",
      severity: "error",
      message: `Companion source note file is missing at ${sourcesPath || sourceNotesPath || "sources.md"}.`
    });
  }
  if (descriptor.sourceNotes?.confidence && descriptor.sourceEvidence?.sourceConfidence
    && descriptor.sourceNotes.confidence !== descriptor.sourceEvidence.sourceConfidence) {
    warnings.push({
      code: "source_confidence_mismatch",
      field: "sourceEvidence.sourceConfidence",
      severity: "warning",
      message: "sourceEvidence.sourceConfidence should match sourceNotes.confidence."
    });
  }
  if (descriptor.reviewStatus === "approved" && descriptor.trustLevel !== "engineer_verified") {
    warnings.push({
      code: "approval_without_engineer_verified_trust",
      field: "reviewStatus",
      severity: "warning",
      message: "Approved review status should be reserved for engineer-verified descriptors."
    });
  }
  if (schemaValidation && schemaValidation.valid === false) {
    warnings.push({
      code: "schema_validation_failed",
      field: "schemaValidation",
      severity: "warning",
      message: "Descriptor schema validation failed; registry readiness is blocked."
    });
  }

  return {
    valid: errors.length === 0,
    descriptorPath,
    sourcesPath,
    errors,
    warnings,
    missingFields
  };
}

export function missingRegistryFields(descriptor = {}) {
  return REQUIRED_REGISTRY_FIELD_PATHS
    .filter((fieldPath) => isMissingField(descriptor, fieldPath))
    .map((fieldPath) => ({
      path: fieldPath,
      severity: "error",
      source: "component_truth_registry_v0"
    }));
}

function loadRawDescriptorEntries(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
    .map((folder) => {
      const descriptorPath = join(root, folder, "descriptor.json");
      if (!existsSync(descriptorPath)) return null;
      return {
        folder,
        descriptorPath,
        raw: JSON.parse(readFileSync(descriptorPath, "utf8"))
      };
    })
    .filter(Boolean);
}

function createRegistrySummary(entries) {
  const missingFieldCount = entries.reduce((sum, entry) => sum + entry.missingFieldCount, 0);
  return {
    componentCount: entries.length,
    schemaValidCount: entries.filter((entry) => entry.schemaValidation.valid).length,
    registryReadyCount: entries.filter((entry) => entry.registryReady).length,
    readyForTrustedPreviewCount: entries.filter((entry) => entry.readyForTrustedPreview).length,
    descriptorsWithMissingFields: entries.filter((entry) => entry.missingFieldCount > 0).length,
    missingFieldCount,
    trustLevelCounts: countBy(entries, (entry) => entry.trustLevel),
    reviewStatusCounts: countBy(entries, (entry) => entry.reviewStatus),
    riskReviewComponentIds: entries
      .filter((entry) => entry.riskReviewRequired)
      .map((entry) => entry.componentId),
    commonHardwareCoverage: COMMON_HARDWARE_MODULE_TYPES.map((componentType) => {
      const matching = entries.filter((entry) => entry.componentType === componentType);
      return {
        componentType,
        present: matching.length > 0,
        componentIds: matching.map((entry) => entry.componentId),
        registryReadyCount: matching.filter((entry) => entry.registryReady).length,
        missingFieldCount: matching.reduce((sum, entry) => sum + entry.missingFieldCount, 0)
      };
    })
  };
}

function summarizeSourceEvidence(descriptor, { descriptorPath, sourcesPath, sourcesFileExists }) {
  const sourceEvidence = descriptor.sourceEvidence || {};
  return {
    sourceType: sourceEvidence.sourceType || "",
    sourceConfidence: sourceEvidence.sourceConfidence || descriptor.sourceNotes?.confidence || "",
    measurementBasis: sourceEvidence.measurementBasis || "",
    lastReviewed: sourceEvidence.lastReviewed || "",
    descriptorPath,
    sourcesPath,
    sourcesFilePresent: sourcesFileExists === true,
    summary: descriptor.sourceNotes?.summary || "",
    references: Array.isArray(sourceEvidence.references)
      ? sourceEvidence.references.map((reference) => ({ ...reference }))
      : []
  };
}

function isMissingField(object, fieldPath) {
  const value = fieldPath.split(".").reduce((current, key) => (
    current && Object.hasOwn(current, key) ? current[key] : undefined
  ), object);
  if (Array.isArray(value)) {
    return fieldPath === "sourceEvidence.references" ? value.length === 0 : false;
  }
  if (typeof value === "number") return !(value > 0);
  if (typeof value === "string") return value.trim().length === 0;
  return value === null || value === undefined;
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function pathLabel(pathname, root) {
  if (root === componentAssetsRoot && pathname.startsWith(coreRoot)) {
    return pathname.replace(coreRoot, "src/core/");
  }
  const relativePath = relative(root, pathname);
  return relativePath && !relativePath.startsWith("..") ? relativePath : pathname;
}
