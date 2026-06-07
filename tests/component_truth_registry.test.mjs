import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  COMMON_HARDWARE_MODULE_TYPES,
  COMPONENT_TRUTH_REGISTRY_VERSION,
  createComponentTruthRegistryReport,
  lintComponentDescriptorForRegistry,
  missingRegistryFields
} from "../src/core/component_truth_registry.mjs";
import { validateComponentDescriptorV2 } from "../src/core/component_descriptor_schema.mjs";

test("Component Truth Registry reports trusted descriptor readiness without geometry mutation", () => {
  const report = createComponentTruthRegistryReport();

  assert.equal(report.version, COMPONENT_TRUTH_REGISTRY_VERSION);
  assert.equal(report.source, "component_descriptor_v2");
  assert.equal(report.summary.componentCount, 10);
  assert.equal(report.summary.schemaValidCount, 10);
  assert.equal(report.summary.registryReadyCount, 10);
  assert.equal(report.summary.readyForTrustedPreviewCount, 10);
  assert.equal(report.summary.missingFieldCount, 0);
  assert.equal(report.summary.descriptorsWithMissingFields, 0);
  assert.deepEqual(report.summary.trustLevelCounts, { proxy_seed: 10 });
  assert.deepEqual(report.summary.reviewStatusCounts, { reviewable: 10 });
  assert.deepEqual(report.commonHardwareModuleTypes, COMMON_HARDWARE_MODULE_TYPES);
  assert.equal(report.boundaries.readOnlyRegistry, true);
  assert.equal(report.boundaries.directGeometryMutationAllowed, false);
  assert.equal(report.boundaries.rawArtifactMutationAllowed, false);
  assert.equal(report.boundaries.layoutAlgorithmModifiedByRegistry, false);
  assert.equal(report.boundaries.geometrySpecGeneratedByRegistry, false);

  for (const componentType of COMMON_HARDWARE_MODULE_TYPES) {
    const coverage = report.summary.commonHardwareCoverage.find((item) => item.componentType === componentType);
    assert.equal(coverage.present, true, componentType);
    assert.ok(coverage.registryReadyCount >= 1, componentType);
    assert.equal(coverage.missingFieldCount, 0, componentType);
  }

  const button = report.entries.find((entry) => entry.componentId === "button_6mm");
  assert.equal(button.registryReady, true);
  assert.equal(button.readyForTrustedPreview, true);
  assert.equal(button.trustLevel, "proxy_seed");
  assert.equal(button.reviewStatus, "reviewable");
  assert.equal(button.sourceEvidence.sourcesFilePresent, true);
  assert.match(button.descriptorPath, /src\/core\/component_assets\/button_6mm\/descriptor\.json/);
  assert.match(button.sourcesPath, /src\/core\/component_assets\/button_6mm\/sources\.md/);
  assert.ok(button.sourceEvidence.references.some((reference) => reference.path === "sources.md"));

  assert.ok(report.summary.riskReviewComponentIds.includes("camera_module_basic"));
  assert.ok(report.summary.riskReviewComponentIds.includes("battery_lipo_2000"));
});

test("Component Truth Registry lint reports missing evidence fields", async () => {
  const rawDescriptor = JSON.parse(await readFile(
    new URL("../src/core/component_assets/button_6mm/descriptor.json", import.meta.url),
    "utf8"
  ));
  delete rawDescriptor.sourceEvidence;
  delete rawDescriptor.trustLevel;
  delete rawDescriptor.reviewStatus;

  const missingFields = missingRegistryFields(rawDescriptor).map((item) => item.path);
  assert.ok(missingFields.includes("sourceEvidence.sourceType"));
  assert.ok(missingFields.includes("sourceEvidence.sourceConfidence"));
  assert.ok(missingFields.includes("sourceEvidence.measurementBasis"));
  assert.ok(missingFields.includes("sourceEvidence.lastReviewed"));
  assert.ok(missingFields.includes("sourceEvidence.references"));
  assert.ok(missingFields.includes("trustLevel"));
  assert.ok(missingFields.includes("reviewStatus"));

  const lint = lintComponentDescriptorForRegistry(rawDescriptor, {
    descriptorPath: "fixture/button_6mm/descriptor.json",
    sourcesPath: "fixture/button_6mm/sources.md",
    sourcesFileExists: true
  });
  assert.equal(lint.valid, false);
  assert.ok(lint.errors.some((error) => error.code === "missing_registry_field" && error.field === "sourceEvidence.sourceType"));
  assert.ok(lint.errors.some((error) => error.code === "missing_registry_field" && error.field === "trustLevel"));
  assert.ok(lint.errors.some((error) => error.code === "missing_registry_field" && error.field === "reviewStatus"));

  const validation = validateComponentDescriptorV2(rawDescriptor, {
    expectedId: "button_6mm",
    sourcesFileExists: true
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("sourceEvidence")));
  assert.ok(validation.errors.some((error) => error.includes("trustLevel")));
  assert.ok(validation.errors.some((error) => error.includes("reviewStatus")));
});

test("ComponentDescriptor schema blocks inconsistent registry trust", async () => {
  const rawDescriptor = JSON.parse(await readFile(
    new URL("../src/core/component_assets/button_6mm/descriptor.json", import.meta.url),
    "utf8"
  ));
  rawDescriptor.trustLevel = "engineer_verified";
  rawDescriptor.reviewStatus = "approved";

  const validation = validateComponentDescriptorV2(rawDescriptor, {
    expectedId: "button_6mm",
    sourcesFileExists: true
  });
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => (
    error.includes("trustLevel engineer_verified does not match assetQuality/validationStatus derived level proxy_seed")
  )));
});
