import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const template = (name) => fs.readFileSync(new URL(`../../templates/workflows/${name}`, import.meta.url), "utf8");
const repositoryFile = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("cross-account callers explicitly pass required repository secrets", () => {
  assert.match(template("agent-plan.yml"), /NINE_ROUTER_API_KEY: \$\{\{ secrets\.NINE_ROUTER_API_KEY \}\}/);
  assert.match(template("agent-implement.yml"), /NINE_ROUTER_API_KEY: \$\{\{ secrets\.NINE_ROUTER_API_KEY \}\}/);
  assert.match(template("agent-implement.yml"), /GH_PRIVATE_APP_KEY: \$\{\{ secrets\.GH_PRIVATE_APP_KEY \}\}/);
});

test("implementation bundling preserves useful agent-created commits", () => {
  const workflow = repositoryFile(".github/workflows/reusable-agent-implement.yml");
  assert.match(workflow, /BASE_SHA: \$\{\{ steps\.context\.outputs\.default_sha \}\}/);
  assert.match(workflow, /git diff --quiet "\$BASE_SHA"/);
  assert.match(workflow, /if ! git diff --cached --quiet; then/);
  assert.match(repositoryFile("harness/skills/implementer/SKILL.md"), /Do not create commits/);
});
