import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeComponentDescriptor,
  validateComponentDescriptorV2
} from "./component_descriptor_schema.mjs";

const componentAssetsRoot = fileURLToPath(new URL("./component_assets/", import.meta.url));

let descriptorCache = null;
let validationCache = null;

export function listComponentDescriptors() {
  return loadDescriptors().map(cloneDescriptor);
}

export function getComponentDescriptor(componentId) {
  return loadDescriptorMap().get(componentId)
    ? cloneDescriptor(loadDescriptorMap().get(componentId))
    : null;
}

export function getComponentDescriptors(componentIds = []) {
  return componentIds.map(getComponentDescriptor).filter(Boolean);
}

export function listComponentDescriptorValidation() {
  loadDescriptors();
  return validationCache.map((item) => ({
    ...item,
    errors: [...item.errors],
    warnings: [...item.warnings]
  }));
}

export function componentAssetsDirectory() {
  return componentAssetsRoot;
}

function loadDescriptorMap() {
  return new Map(loadDescriptors().map((descriptor) => [descriptor.id, descriptor]));
}

function loadDescriptors() {
  if (descriptorCache) return descriptorCache;
  if (!existsSync(componentAssetsRoot)) {
    descriptorCache = [];
    validationCache = [];
    return descriptorCache;
  }

  const folders = readdirSync(componentAssetsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const validations = [];
  const descriptors = [];
  for (const folder of folders) {
    const descriptorPath = join(componentAssetsRoot, folder, "descriptor.json");
    if (!existsSync(descriptorPath)) continue;
    const raw = JSON.parse(readFileSync(descriptorPath, "utf8"));
    const validation = validateComponentDescriptorV2(raw, { expectedId: folder });
    validations.push({
      componentId: raw.identity?.id || raw.id || folder,
      descriptorPath: relativeToCore(descriptorPath),
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings
    });
    descriptors.push({
      ...normalizeComponentDescriptor(raw),
      descriptorPath: relativeToCore(descriptorPath),
      sourcesPath: relativeToCore(join(dirname(descriptorPath), "sources.md")),
      schemaValidation: validation
    });
  }

  descriptorCache = descriptors;
  validationCache = validations;
  return descriptorCache;
}

function relativeToCore(pathname) {
  return pathname.replace(fileURLToPath(new URL("./", import.meta.url)), "src/core/");
}

function cloneDescriptor(descriptor) {
  return JSON.parse(JSON.stringify(descriptor));
}
