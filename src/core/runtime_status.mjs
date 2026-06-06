import { readRuntimeBinding } from "./project_workspace.mjs";

export const CODEX_SDK_PACKAGE = "@openai/codex-sdk";

export async function getRuntimeStatus({
  workspaceId = "",
  runtimeProvider = "mock",
  modelProvider = "mock",
  defaultRuntimeProvider = "mock",
  defaultModelProvider = "mock",
  rootDir,
  sdkImporter = (specifier) => import(specifier)
} = {}) {
  const runtimeBinding = workspaceId ? readRuntimeBinding({ workspaceId, rootDir }) : null;
  const codex = await codexSdkStatus({ sdkImporter });
  const codexBinding = runtimeBinding?.provider === "codex" ? runtimeBinding : null;
  const bindingId = codexBinding?.bindingId || "";
  return {
    ok: true,
    workspaceId,
    runtimeProvider,
    modelProvider,
    defaultRuntimeProvider,
    defaultModelProvider,
    runtimes: {
      mock: {
        id: "mock",
        available: true,
        ready: true,
        state: "ready"
      },
      "forge-query-engine": {
        id: "forge-query-engine",
        available: true,
        ready: true,
        state: "ready"
      },
      codex: {
        id: "codex",
        available: codex.available,
        ready: codex.available,
        state: codex.available ? "ready" : "missing_sdk",
        sdkPackage: CODEX_SDK_PACKAGE,
        sdkExport: codex.sdkExport || "",
        message: codex.message || "",
        workspaceId,
        runtimeBinding: codexBinding,
        bindingId,
        threadState: workspaceId
          ? codexBinding?.status === "failed"
            ? "failed"
            : bindingId
              ? "ready"
              : "not_started"
          : "no_workspace"
      }
    }
  };
}

async function codexSdkStatus({ sdkImporter } = {}) {
  try {
    const sdk = await sdkImporter(CODEX_SDK_PACKAGE);
    const hasCodexExport = typeof sdk?.Codex === "function" || typeof sdk?.default?.Codex === "function" || typeof sdk?.default === "function";
    if (!hasCodexExport) {
      return {
        available: false,
        sdkExport: "",
        message: `${CODEX_SDK_PACKAGE} did not export Codex.`
      };
    }
    return {
      available: true,
      sdkExport: sdk?.Codex ? "Codex" : sdk?.default?.Codex ? "default.Codex" : "default"
    };
  } catch (error) {
    return {
      available: false,
      sdkExport: "",
      message: `${CODEX_SDK_PACKAGE} is not available: ${error instanceof Error ? error.message : "unknown error"}`
    };
  }
}
