import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const template = (name) => fs.readFileSync(new URL(`../../templates/workflows/${name}`, import.meta.url), "utf8");

test("cross-account callers explicitly pass required repository secrets", () => {
  assert.match(template("agent-plan.yml"), /NINE_ROUTER_API_KEY: \$\{\{ secrets\.NINE_ROUTER_API_KEY \}\}/);
  assert.match(template("agent-implement.yml"), /NINE_ROUTER_API_KEY: \$\{\{ secrets\.NINE_ROUTER_API_KEY \}\}/);
  assert.match(template("agent-implement.yml"), /GH_PRIVATE_APP_KEY: \$\{\{ secrets\.GH_PRIVATE_APP_KEY \}\}/);
});
