import { registerAsset } from "./assets.mjs";

export function createModelPreview({ spec = {}, modules = [], geometrySpec = null, modelArtifacts = null, geometryValidation = null } = {}) {
  const screenSize = Number(spec.enclosure?.screen_size_in || 5);
  const finish = spec.enclosure?.finish || "woodgrain";
  const widthMm = geometrySpec?.enclosure?.dimensionsMm?.width || Math.round(screenSize * 25.4 * 1.48);
  const heightMm = geometrySpec?.enclosure?.dimensionsMm?.height || Math.round(screenSize * 25.4 * 0.94);
  const depthMm = geometrySpec?.enclosure?.dimensionsMm?.depth || (screenSize >= 7 ? 42 : 36);
  const hasSpeaker = modules.some((module) => module.capabilities?.includes("speaker"));
  const hasAmbient = modules.some((module) => module.capabilities?.includes("ambient_light_sensor"));
  const generatedAssets = modelArtifacts?.artifacts || {};

  const previewAsset = generatedAssets.preview || registerAsset({
    type: "model_preview",
    source: "generated",
    caption: "Prototype structure preview for the standard 3D printed enclosure"
  });
  const glbAsset = generatedAssets.glb || (modelArtifacts ? null : registerAsset({
    type: "glb",
    source: "provider",
    caption: "Future 3D model asset slot; not generated in v1"
  }));
  const stlAsset = generatedAssets.stl || null;
  const stepAsset = generatedAssets.step || (modelArtifacts ? null : registerAsset({
    type: "step",
    source: "provider",
    caption: "Future internal engineering file slot; not generated in v1"
  }));

  const artifactStatus = modelArtifacts?.status || "pending_confirmation";
  return {
    viewerType: generatedAssets.glb
      ? "interactive_glb_preview"
      : artifactStatus === "pending_confirmation"
        ? "pending_generation_preview"
        : "geometry_validation_preview",
    generationMode: modelArtifacts?.provider || "ai_provider_reserved",
    targetProvider: modelArtifacts?.targetProvider || "cadquery_open_cascade",
    interactionPolicy: {
      orbit: true,
      zoom: true,
      pan: true,
      directPartEditing: false,
      geometryEditing: false,
      modificationPath: "conversation_revision_only"
    },
    modelParameters: {
      enclosureFamily: "standard_desktop_display_shell",
      manufacturingPath: "standardized_3d_print",
      finish,
      screenSizeIn: screenSize,
      dimensionsMm: {
        width: widthMm,
        height: heightMm,
        depth: depthMm
      },
      openings: [
        { id: "screen_bezel", type: "display", sizeIn: screenSize },
        { id: "usb_c_rear", type: "connector", side: "back" },
        ...(hasSpeaker ? [{ id: "speaker_grille", type: "audio", side: "bottom" }] : []),
        ...(hasAmbient ? [{ id: "ambient_window", type: "sensor", side: "front" }] : [])
      ],
      mounting: ["standard_core_board_standoffs", "front_bezel_mount"]
    },
    assets: {
      preview: previewAsset,
      glb: glbAsset,
      stl: stlAsset,
      step: stepAsset,
      cad: stepAsset,
      geometrySpec: generatedAssets.geometrySpec || null,
      validationReport: generatedAssets.validationReport || null,
      cadqueryScript: generatedAssets.cadqueryScript || null,
      renders: []
    },
    validation: geometryValidation || modelArtifacts?.validation || null,
    notes: [
      "This is a read-only 3D prototype preview.",
      generatedAssets.glb
        ? "Generated 3D model is for orbit, zoom, and pan preview only; users cannot edit parts or geometry."
        : artifactStatus === "pending_confirmation"
          ? "3D model generation is waiting for explicit confirmation."
          : "No 3D model file is emitted when geometry is blocked or incomplete.",
      "Engineering file generation stays inside the internal review flow.",
      "The v1 shell path stays on standardized 3D printing."
    ]
  };
}
