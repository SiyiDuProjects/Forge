import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!process.env.FORGE_WORKSPACE_ROOT) {
  process.env.FORGE_WORKSPACE_ROOT = mkdtempSync(join(tmpdir(), "forge-test-workspaces-"));
}
