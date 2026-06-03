import { registerAsset } from "./assets.mjs";

export function createModelPreview({ spec = {}, modules = [] } = {}) {
  const screenSize = Number(spec.enclosure?.screen_size_in || 5);
  const finish = spec.enclosure?.finish || "woodgrain";
  const widthMm = Math.round(screenSize * 25.4 * 1.48);
  const heightMm = Math.round(screenSize * 25.4 * 0.94);
  const depthMm = screenSize >= 7 ? 42 : 36;
  const hasSpeaker = modules.some((module) => module.capabilities?.includes("speaker"));
  const hasAmbient = modules.some((module) => module.capabilities?.includes("ambient_light_sensor"));

  const previewAsset = registerAsset({
    type: "model_preview",
    source: "generated",
    caption: "Parametric preview placeholder for the standard 3D printed enclosure"
  });
  const glbAsset = registerAsset({
    type: "glb",
    source: "provider",
    caption: "Future GLB asset slot; not generated in v1"
  });
  const cadAsset = registerAsset({
    type: "cad_placeholder",
    source: "provider",
    caption: "Future CAD/STEP asset slot; not generated in v1"
  });

  return {
    viewerType: "placeholder_3d",
    generationMode: "ai_provider_reserved",
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
      cad: cadAsset,
      renders: []
    },
    notes: [
      "This is a structure preview placeholder, not final CAD.",
      "Future provider adapters can attach generated GLB, render, or CAD assets to these slots.",
      "The v1 shell path stays on standardized 3D printing."
    ]
  };
}
