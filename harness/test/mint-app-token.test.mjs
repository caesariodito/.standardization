import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/mint-app-token.mjs", import.meta.url));

test("requires the GitHub App private key repository secret", () => {
  const result = spawnSync(process.execPath, [script], {
    env: { ...process.env, GITHUB_APP_ID: "1", GITHUB_REPOSITORY: "owner/repo", GH_PRIVATE_APP_KEY: "" },
    encoding: "utf8",
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /GH_PRIVATE_APP_KEY is required/);
});
