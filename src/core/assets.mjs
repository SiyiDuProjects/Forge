import { ASSET_SOURCES, ASSET_TYPES } from "../contracts/workbench_contract.mjs";
import { makeId } from "./utils.mjs";

const assets = new Map();

export function registerAsset(metadata = {}) {
  const type = ASSET_TYPES.includes(metadata.type) ? metadata.type : "text";
  const source = ASSET_SOURCES.includes(metadata.source) ? metadata.source : "user";
  const now = new Date().toISOString();
  const asset = {
    assetId: metadata.assetId || makeId("asset"),
    type,
    source,
    url: metadata.url || "",
    localPath: metadata.localPath || "",
    caption: metadata.caption || "",
    linkedJobId: metadata.linkedJobId || "",
    createdAt: metadata.createdAt || now
  };
  assets.set(asset.assetId, asset);
  return asset;
}

export function registerAssets(items = []) {
  return items.map((item) => registerAsset(item));
}

export function getAsset(assetId) {
  return assets.get(assetId);
}

export function listAssets() {
  return [...assets.values()];
}
