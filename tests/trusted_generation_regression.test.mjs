import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
  getRevisionArtifacts,
  regenerateRevision,
  validateDesign
} from "../src/core/forge_actions.mjs";
import {
  createGeometrySpec,
  generateModelArtifacts
} from "../src/core/geometry_generation.mjs";
import {
  addProductPlanTurn,
  createProductPlan,
  getProductPlan
} from "../src/core/product_plan.mjs";
import { projectWorkspacePath } from "../src/core/project_workspace.mjs";
import { validatePrototypeGeometry } from "../src/core/validation_engine.mjs";

const GOLDEN_REQUEST = [
  "Small 5 inch graphite desktop display with photos, weather, USB-C power,",
  "an ambient light sensor, camera recognition, battery power, speaker alerts,",
  "and two side buttons."
].join(" ");

function createTrustedGenerationFixture() {
  const { productPlan } = createProductPlan({
    initialMessage: GOLDEN_REQUEST,
    language: "en"
  });
  const generated = addProductPlanTurn({
    planId: productPlan.planId,
    message: "Generate model now."
  });
  return {
    productPlan: generated.productPlan,
    revision: generated.revision,
    geometrySpec: generated.revision.geometrySpec
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function descriptorMap(geometrySpec) {
  return new Map((geometrySpec.componentDescriptors || []).map((descriptor) => [descriptor.id, descriptor]));
}

function componentSelectionFromSpec(geometrySpec, componentDescriptors = geometrySpec.componentDescriptors) {
  return {
    ...clone(geometrySpec.componentSelections || {}),
    componentDescriptors: clone(componentDescriptors)
  };
}

function layoutFromSpec(geometrySpec, overrides = {}) {
  return {
    enclosure: clone(overrides.enclosure || geometrySpec.enclosure),
    placements: clone(overrides.placements || geometrySpec.placements),
    routes: clone(overrides.routes || geometrySpec.routes),
    features: clone(overrides.features || geometrySpec.features),
    warnings: clone(overrides.warnings || [])
  };
}

function findDescriptorFeature(geometrySpec, feature) {
  const descriptor = descriptorMap(geometrySpec).get(feature.targetComponentId);
  return (descriptor?.externalFeatures || []).find((item) => {
    return item.id === feature.targetFeatureId && item.type === feature.type;
  });
}

function sameSize2d(actual = [], expected = []) {
  return Math.abs(Number(actual?.[0] || 0) - Number(expected?.[0] || 0)) < 0.001
    && Math.abs(Number(actual?.[1] || 0) - Number(expected?.[1] || 0)) < 0.001;
}

function assertDescriptorCompleteness(geometrySpec) {
  const selectedIds = geometrySpec.componentSelections.selectedComponentIds;
  const descriptors = descriptorMap(geometrySpec);

  for (const componentId of selectedIds) {
    const descriptor = descriptors.get(componentId);
    assert.ok(descriptor, `${componentId} should have a ComponentDescriptor v2 snapshot`);
    assert.equal(descriptor.schemaValidation?.valid, true, `${componentId} descriptor schema should validate`);
    assert.equal(descriptor.assetQuality, "mechanical_proxy");
    assert.equal(descriptor.validationStatus, "unverified_proxy");
    assert.ok(descriptor.descriptorPath, `${componentId} should preserve descriptor provenance`);
    assert.ok(descriptor.sourcesPath, `${componentId} should preserve source-note provenance`);
    assert.ok(Number(descriptor.dimensionsMm?.width) > 0, `${componentId} width should be descriptor-backed`);
    assert.ok(Number(descriptor.dimensionsMm?.height) > 0, `${componentId} height should be descriptor-backed`);
    assert.ok(Number(descriptor.dimensionsMm?.depth) > 0, `${componentId} depth should be descriptor-backed`);
    assert.ok(descriptor.mechanicalProxy?.mountingMethod, `${componentId} should declare mounting metadata`);
    assert.ok(Array.isArray(descriptor.connectors), `${componentId} should declare connectors`);
  }

  const coverage = geometrySpec.mechanicalConstraints.coverage;
  assert.equal(coverage.componentCount, selectedIds.length);
  assert.ok(coverage.connectorCount >= selectedIds.length);
  assert.ok(coverage.externalFeatureCount >= 4);
  assert.ok(coverage.accessVolumeCount >= 3);
  assert.equal(coverage.unverifiedProxyCount, selectedIds.length);
  assert.equal(geometrySpec.metadata.directEditingAllowed, false);
}

function assertFeatureSizesMatchDescriptors(geometrySpec) {
  for (const feature of geometrySpec.features || []) {
    const descriptorFeature = findDescriptorFeature(geometrySpec, feature);
    if (!descriptorFeature?.openingSizeMm) continue;
    assert.deepEqual(
      feature.sizeMm,
      descriptorFeature.openingSizeMm,
      `${feature.id} size should match ${feature.targetComponentId}.${feature.targetFeatureId}`
    );
  }
}

function assertLayoutExplanationCoverage(geometrySpec) {
  const report = geometrySpec.layoutExplanation;
  const descriptorBackedPlacementIds = (geometrySpec.placements || [])
    .filter((placement) => placement.componentId)
    .map((placement) => placement.componentId);
  const explainedPlacementIds = report.placements.map((placement) => placement.componentId);
  assert.equal(report.version, "layout_explanation_v1");
  assert.equal(report.directEditingAllowed, false);
  assert.equal(report.coverage.placementCount, report.placements.length);
  assert.equal(report.coverage.featureCount, report.features.length);
  assert.equal(report.coverage.routeCount, report.routes.length);
  assert.equal(report.coverage.explainedPlacementCount, report.coverage.placementCount);
  assert.equal(report.coverage.explainedFeatureCount, report.coverage.featureCount);
  assert.equal(report.coverage.explainedRouteCount, report.coverage.routeCount);
  assert.ok(report.coverage.descriptorDrivenFeatureCount >= geometrySpec.features.length - 1);
  for (const componentId of descriptorBackedPlacementIds) {
    assert.ok(explainedPlacementIds.includes(componentId), `${componentId} should have placement explanation coverage`);
  }

  for (const placement of report.placements) {
    assert.ok(placement.reason, `${placement.id} should explain placement`);
    assert.ok(placement.ruleId, `${placement.id} should carry a placement rule`);
    assert.equal(placement.directEditingAllowed, false);
    assert.equal(placement.descriptorInputs?.componentId, placement.componentId);
  }
  for (const feature of report.features) {
    assert.ok(feature.reason, `${feature.id} should explain feature generation`);
    assert.ok(feature.ruleId, `${feature.id} should carry a feature rule`);
    assert.equal(feature.directEditingAllowed, false);
    if (feature.targetComponentId) {
      assert.equal(feature.descriptorInputs?.componentId, feature.targetComponentId);
    }
  }
  for (const route of report.routes) {
    assert.ok(route.reason, `${route.id} should explain route generation`);
    assert.equal(route.ruleId, "descriptor_connector_coarse_route");
    assert.equal(route.directEditingAllowed, false);
    assert.equal(route.descriptorInputs.length, 2);
    assert.ok(route.pointCount >= 3);
  }
}

async function assertConfirmedArtifactContracts({ productPlan, revision }) {
  const modelArtifacts = revision.modelArtifacts;
  const artifacts = modelArtifacts.artifacts;
  const evidence = modelArtifacts.generationEvidence;

  assert.equal(modelArtifacts.status, "generated");
  assert.equal(modelArtifacts.provider, "internal_parametric_v1");
  assert.equal(modelArtifacts.targetProvider, "cadquery_open_cascade");
  assert.equal(modelArtifacts.validation.canGenerateArtifacts, true);
  for (const key of [
    "productPlan",
    "geometrySpec",
    "componentSelections",
    "componentDescriptors",
    "componentAssetManifest",
    "validationReport",
    "generationEvidenceReport",
    "designSummary",
    "cadqueryScript",
    "glb",
    "stl",
    "shellFront",
    "shellBack",
    "step"
  ]) {
    assert.ok(artifacts[key]?.localPath, `${key} artifact should have a local path`);
    assert.ok(existsSync(artifacts[key].localPath), `${key} artifact file should exist`);
  }

  assert.equal(evidence.version, "generation_evidence_report_v1");
  assert.equal(evidence.status, "generated");
  assert.equal(evidence.source, "product_plan_revision_and_geometry_spec");
  assert.deepEqual(evidence.artifactGroups.generated, ["glb", "stl", "shellFront", "shellBack", "step"]);
  assert.equal(evidence.sourceOfTruth.productPlan, "product_plan.json");
  assert.equal(evidence.sourceOfTruth.geometrySpec, "geometry-spec.json");
  assert.equal(evidence.sourceOfTruth.generatedFromRawChat, false);
  assert.equal(evidence.sourceOfTruth.directEditingAllowed, false);
  assert.equal(evidence.directEditingAllowed, false);
  assert.equal(evidence.userFacingCadExport, false);
  assert.equal(evidence.generatedArtifactsPresent, true);
  assert.equal(evidence.validation.canGenerateArtifacts, true);
  assert.equal(evidence.artifactAudit.status, "passed");
  assert.equal(evidence.artifactAudit.passed, true);
  assert.equal(evidence.artifactAudit.findings.length, 0);
  assert.equal(evidence.artifactAudit.checks.glb.passed, true);
  assert.equal(evidence.artifactAudit.checks.glb.thinMeshPrimitiveCount, 0);
  assert.equal(evidence.artifactAudit.checks.glb.minimumMeshSpanMm, 1.15);
  assert.equal(evidence.artifactAudit.checks.stl.passed, true);
  assert.equal(evidence.artifactAudit.checks.stl.geometry.degenerateFacetCount, 0);
  assert.equal(evidence.artifactAudit.checks.stl.geometry.thinAxisCount, 0);
  assert.equal(evidence.artifactAudit.checks.stl.geometry.vertexCount > 0, true);
  assert.equal(evidence.artifactAudit.checks.shellFront.passed, true);
  assert.equal(evidence.artifactAudit.checks.shellFront.geometry.degenerateFacetCount, 0);
  assert.equal(evidence.artifactAudit.checks.shellFront.geometry.thinAxisCount, 0);
  assert.equal(evidence.artifactAudit.checks.shellBack.passed, true);
  assert.equal(evidence.artifactAudit.checks.shellBack.geometry.degenerateFacetCount, 0);
  assert.equal(evidence.artifactAudit.checks.shellBack.geometry.thinAxisCount, 0);
  assert.equal(evidence.artifactAudit.checks.step.passed, true);
  assert.equal(evidence.artifactAudit.checks.step.format.hasShellDimensions, true);
  assert.equal(evidence.artifactAudit.checks.step.format.hasComponentAssetManifest, true);
  assert.equal(evidence.artifactAudit.checks.step.metadata.shellDimensionsPositive, true);
  assert.equal(evidence.artifactAudit.checks.step.metadata.directEditingBoundaryPresent, true);

  for (const key of evidence.artifactGroups.generated) {
    assert.equal(evidence.artifactIntegrity[key].present, true, `${key} should be present`);
    assert.ok(evidence.artifactIntegrity[key].bytes > 0, `${key} should not be empty`);
    assert.match(evidence.artifactIntegrity[key].sha256, /^[a-f0-9]{64}$/);
  }

  const glb = await readFile(artifacts.glb.localPath);
  assert.equal(glb.slice(0, 4).toString("utf8"), "glTF");
  assert.match(readFileSync(artifacts.stl.localPath, "utf8"), /^solid /);
  assert.match(readFileSync(artifacts.step.localPath, "utf8"), /layout_explanation/);

  const workspacePath = projectWorkspacePath(productPlan.planId);
  const revisionPath = join(workspacePath, "revisions", revision.revisionId);
  const persistedEvidence = JSON.parse(await readFile(join(revisionPath, "generation_evidence_report.json"), "utf8"));
  assert.equal(persistedEvidence.artifactAudit.status, "passed");
  assert.equal(persistedEvidence.artifactIntegrity.glb.sha256, evidence.artifactIntegrity.glb.sha256);

  const retrieved = getRevisionArtifacts({
    workspaceId: productPlan.planId,
    revisionId: revision.revisionId
  });
  assert.equal(retrieved.ok, true);
  assert.equal(retrieved.directEditingAllowed, false);
  assert.equal(retrieved.artifactStatus.generated, true);
  assert.equal(retrieved.artifactStatus.trustedGenerated, true);
  assert.equal(retrieved.artifactStatus.artifactAuditStatus, "passed");
  assert.equal(retrieved.artifactStatus.artifactAuditPassed, true);
  assert.equal(retrieved.artifactStatus.artifactAuditFindingCount, 0);
}

test("trusted generation golden case preserves descriptor, explanation, provenance, and artifact contracts", async () => {
  const { productPlan, revision, geometrySpec } = createTrustedGenerationFixture();

  assert.equal(revision.geometryValidation.status, "passed_with_warnings");
  assert.deepEqual(geometrySpec.componentSelections.selectedComponentIds, [
    "core_board_esp32_s3",
    "display_5_tft",
    "usb_c_breakout",
    "ambient_sensor_basic",
    "speaker_20mm",
    "button_6mm",
    "camera_module_basic",
    "battery_lipo_2000"
  ]);
  assertDescriptorCompleteness(geometrySpec);
  assertFeatureSizesMatchDescriptors(geometrySpec);
  assertLayoutExplanationCoverage(geometrySpec);
  assert.ok(revision.geometryValidation.checks.includes("preview_solid_dimensions"));
  await assertConfirmedArtifactContracts({ productPlan, revision });
});

test("trusted generation failure cases block descriptor, feature-size, route, and artifact drift", () => {
  const { productPlan, revision, geometrySpec } = createTrustedGenerationFixture();
  const baseSelection = componentSelectionFromSpec(geometrySpec);

  const missingButtonDescriptor = validatePrototypeGeometry({
    productPlan: geometrySpec.productPlan,
    componentSelection: componentSelectionFromSpec(
      geometrySpec,
      geometrySpec.componentDescriptors.filter((descriptor) => descriptor.id !== "button_6mm")
    ),
    layout: layoutFromSpec(geometrySpec)
  });
  assert.equal(missingButtonDescriptor.canGenerateArtifacts, false);
  assert.ok(missingButtonDescriptor.errors.some((error) => (
    error.type === "missing_component_descriptor"
    && error.componentId === "button_6mm"
  )));
  assert.ok(missingButtonDescriptor.errors.some((error) => (
    error.type === "placement_missing_descriptor"
    && error.componentId === "button_6mm"
  )));

  const mismatchedFeatures = clone(geometrySpec.features);
  const usbCutout = mismatchedFeatures.find((feature) => feature.type === "usb_cutout");
  usbCutout.sizeMm = [99, 42];
  const openingSizeMismatch = validatePrototypeGeometry({
    productPlan: geometrySpec.productPlan,
    componentSelection: baseSelection,
    layout: layoutFromSpec(geometrySpec, { features: mismatchedFeatures })
  });
  assert.equal(openingSizeMismatch.canGenerateArtifacts, false);
  assert.ok(openingSizeMismatch.errors.some((error) => (
    error.type === "external_feature_opening_size_mismatch"
    && error.componentId === "usb_c_breakout"
    && sameSize2d(error.expectedSizeMm, [11, 5])
    && sameSize2d(error.actualSizeMm, [99, 42])
  )));

  const zeroDepthPlacements = clone(geometrySpec.placements);
  zeroDepthPlacements.find((placement) => placement.componentId === "display_5_tft").dimensionsMm.depth = 0;
  const zeroDepthPlacement = validatePrototypeGeometry({
    productPlan: geometrySpec.productPlan,
    componentSelection: baseSelection,
    layout: layoutFromSpec(geometrySpec, { placements: zeroDepthPlacements })
  });
  assert.equal(zeroDepthPlacement.canGenerateArtifacts, false);
  assert.ok(zeroDepthPlacement.errors.some((error) => (
    error.type === "preview_solid_dimension_too_thin"
    && error.componentId === "display_5_tft"
    && error.source === "placement.dimensionsMm"
    && error.axis === "depth"
  )));

  const missingCameraRoute = validatePrototypeGeometry({
    productPlan: geometrySpec.productPlan,
    componentSelection: baseSelection,
    layout: layoutFromSpec(geometrySpec, {
      routes: geometrySpec.routes.filter((route) => route.id !== "route.camera_to_core_board")
    })
  });
  assert.equal(missingCameraRoute.canGenerateArtifacts, false);
  assert.ok(missingCameraRoute.errors.some((error) => (
    error.type === "missing_descriptor_connector_route"
    && error.componentId === "camera_module_basic"
    && error.to.connectorId === "gpio"
  )));

  const collapsedRoutes = clone(geometrySpec.routes);
  collapsedRoutes[0].pathMm = [
    collapsedRoutes[0].pathMm[0],
    collapsedRoutes[0].pathMm[0]
  ];
  collapsedRoutes[0].pointsMm = collapsedRoutes[0].pathMm.map(([x, y, z]) => ({ x, y, z }));
  const collapsedRouteGeometry = validatePrototypeGeometry({
    productPlan: geometrySpec.productPlan,
    componentSelection: baseSelection,
    layout: layoutFromSpec(geometrySpec, { routes: collapsedRoutes })
  });
  assert.equal(collapsedRouteGeometry.canGenerateArtifacts, false);
  assert.ok(collapsedRouteGeometry.errors.some((error) => (
    error.type === "preview_route_segment_too_short"
    && error.routeId === collapsedRoutes[0].id
  )));

  const thinFeatureGeometrySpec = clone(geometrySpec);
  thinFeatureGeometrySpec.validationErrors = [];
  thinFeatureGeometrySpec.features.find((feature) => feature.type === "screen_opening").sizeMm = [0, 24];
  const thinFeatureArtifacts = generateModelArtifacts({
    geometrySpec: thinFeatureGeometrySpec,
    planId: productPlan.planId,
    revisionId: `${revision.revisionId}-thin-feature-contract`,
    generateArtifacts: true
  });
  assert.equal(thinFeatureArtifacts.status, "blocked");
  assert.equal(thinFeatureArtifacts.validation.canGenerateArtifacts, false);
  assert.equal(thinFeatureArtifacts.artifacts.glb, null);
  assert.ok(thinFeatureArtifacts.validation.issues.some((issue) => (
    issue.code === "preview_solid_dimension_too_thin"
    && issue.featureId === "feature.opening.screen"
    && issue.axis === "width"
  )));
  assert.equal(thinFeatureArtifacts.generationEvidence.status, "blocked");
  assert.equal(thinFeatureArtifacts.generationEvidence.validation.canGenerateArtifacts, false);

  const blockedGeometrySpec = clone(geometrySpec);
  blockedGeometrySpec.validationErrors = [
    {
      type: "external_feature_opening_size_mismatch",
      severity: "blocked",
      moduleId: "usb_c_breakout",
      componentId: "usb_c_breakout",
      message: "Regression harness injected a descriptor opening mismatch."
    }
  ];
  const blockedArtifacts = generateModelArtifacts({
    geometrySpec: blockedGeometrySpec,
    planId: productPlan.planId,
    revisionId: `${revision.revisionId}-blocked-contract`,
    generateArtifacts: true
  });
  assert.equal(blockedArtifacts.status, "blocked");
  assert.equal(blockedArtifacts.validation.canGenerateArtifacts, false);
  assert.equal(blockedArtifacts.artifacts.glb, null);
  assert.equal(blockedArtifacts.artifacts.stl, null);
  assert.equal(blockedArtifacts.artifacts.step, null);
  assert.equal(blockedArtifacts.generationEvidence.status, "blocked");
  assert.equal(blockedArtifacts.generationEvidence.generatedArtifactsPresent, false);
  assert.deepEqual(blockedArtifacts.generationEvidence.artifactGroups.generated, []);
  assert.equal(blockedArtifacts.generationEvidence.artifactAudit.status, "not_required_blocked");
  assert.equal(blockedArtifacts.generationEvidence.artifactAudit.passed, true);
});

test("revision revalidation keeps regenerated artifacts trusted without mutating the source revision", async () => {
  const { productPlan, revision } = createTrustedGenerationFixture();
  const validation = validateDesign({ workspaceId: productPlan.planId });
  assert.equal(validation.ok, true);
  assert.equal(validation.status, "warning");
  assert.equal(validation.blocked, false);
  assert.equal(validation.geometryValidation.canGenerateArtifacts, true);

  const regenerated = regenerateRevision({
    workspaceId: productPlan.planId,
    revisionId: revision.revisionId,
    reason: "trusted generation regression revalidation"
  });
  assert.equal(regenerated.ok, true);
  assert.equal(regenerated.regenerated, true);
  assert.equal(regenerated.sourceRevisionId, revision.revisionId);
  assert.notEqual(regenerated.revisionId, revision.revisionId);
  assert.ok(regenerated.artifactPaths.modelGlb);
  assert.equal(regenerated.validationReport.canGenerateArtifacts, true);

  const planAfterRegeneration = getProductPlan(productPlan.planId);
  const regeneratedRevision = planAfterRegeneration.revisions.find((item) => item.revisionId === regenerated.revisionId);
  const sourceRevision = planAfterRegeneration.revisions.find((item) => item.revisionId === revision.revisionId);
  assert.ok(regeneratedRevision);
  assert.ok(sourceRevision);
  assert.equal(planAfterRegeneration.currentRevisionId, regenerated.revisionId);
  assert.equal(sourceRevision.modelArtifacts.status, "generated");
  assert.equal(sourceRevision.modelArtifacts.generationEvidence.artifactAudit.status, "passed");
  assert.deepEqual(
    regeneratedRevision.geometrySpec.componentSelections.selectedComponentIds,
    sourceRevision.geometrySpec.componentSelections.selectedComponentIds
  );
  assert.equal(regeneratedRevision.modelArtifacts.status, "generated");
  assert.equal(regeneratedRevision.modelArtifacts.generationEvidence.artifactAudit.status, "passed");
  assert.equal(regeneratedRevision.modelArtifacts.generationEvidence.artifactAudit.passed, true);

  const regeneratedGeometrySpec = createGeometrySpec({
    productPlan: regeneratedRevision.productPlanSnapshot,
    spec: regeneratedRevision.spec,
    modules: regeneratedRevision.modules,
    riskReport: regeneratedRevision.riskReport
  });
  assert.deepEqual(
    regeneratedGeometrySpec.componentSelections.selectedComponentIds,
    regeneratedRevision.geometrySpec.componentSelections.selectedComponentIds
  );
  assertLayoutExplanationCoverage(regeneratedGeometrySpec);

  const artifacts = getRevisionArtifacts({
    workspaceId: productPlan.planId,
    revisionId: regenerated.revisionId
  });
  assert.equal(artifacts.ok, true);
  assert.equal(artifacts.artifactStatus.trustedGenerated, true);
  assert.equal(artifacts.artifactStatus.artifactAuditStatus, "passed");
  assert.equal(artifacts.artifactStatus.artifactAuditFindingCount, 0);
  assert.match(await readFile(artifacts.artifacts.generationEvidenceReport.localPath, "utf8"), /generation_evidence_report_v1/);
});
