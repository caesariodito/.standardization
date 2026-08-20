import fs from "node:fs";
import { validatePlanText } from "./validate-plan.mjs";

const markerPrefix = "<!-- agent-plan:v1 ";
const headings = [
  ["Problem", "problem"], ["Evidence", "evidence"], ["Background", "background"], ["Unknowns", "unknowns"],
  ["Proposed solution", "proposedSolution"], ["Implementation plan", "implementationPlan"], ["Acceptance criteria", "acceptanceCriteria"],
  ["Risks", "risks"], ["Out of scope", "outOfScope"], ["Expected files", "expectedFiles"],
  ["Changes from previous plan", "changesFromPreviousPlan"], ["Human questions/feedback addressed", "feedbackAddressed"]
];
function safe(value) { return String(value).replaceAll("<!--", "&lt;!--").replaceAll("-->", "--&gt;"); }
function section(value) { return Array.isArray(value) ? (value.length ? value.map((x) => `- ${safe(x)}`).join("\n") : "- None recorded.") : safe(value); }
export function planMarker(metadata) {
  const marker = { planVersion: metadata.planVersion, planSha: metadata.planSha, repoSha: metadata.repoSha, harnessSha: metadata.harnessSha, workflowUrl: metadata.workflowUrl, priorPlanUrl: metadata.priorPlanUrl || null, model: metadata.model, expectedFiles: metadata.expectedFiles, runId: metadata.runId };
  return `${markerPrefix}${JSON.stringify(marker).replaceAll("--", "\\u002d\\u002d")} -->`;
}
export function parsePlanMarker(body) {
  const start = body.indexOf(markerPrefix); if (start < 0) return null;
  const end = body.indexOf(" -->", start); if (end < 0) return null;
  try { return JSON.parse(body.slice(start + markerPrefix.length, end)); } catch { return null; }
}
export function renderPlan(plan, metadata) {
  const marker = planMarker({ ...metadata, expectedFiles: plan.expectedFiles });
  const title = `# Plan Draft v${metadata.planVersion}`;
  const sections = headings.map(([titleText, key]) => `## ${titleText}\n\n${section(plan[key])}`).join("\n\n");
  const audit = `Plan SHA: \`${metadata.planSha}\` · Repository SHA: \`${metadata.repoSha}\` · Harness SHA: \`${metadata.harnessSha}\` · Model: \`${safe(metadata.model)}\` · [Workflow run](${safe(metadata.workflowUrl)})${metadata.priorPlanUrl ? ` · [Supersedes prior plan](${safe(metadata.priorPlanUrl)})` : ""}`;
  return `${marker}\n${title}\n\n> ${audit}\n\n${sections}\n`;
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error("usage: render-plan.mjs PLAN_JSON OUTPUT_MD (metadata from environment)");
  const plan = validatePlanText(fs.readFileSync(input, "utf8"));
  const required = ["PLAN_VERSION", "PLAN_SHA", "REPO_SHA", "HARNESS_SHA", "WORKFLOW_URL", "MODEL", "RUN_ID"];
  for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);
  fs.writeFileSync(output, renderPlan(plan, { planVersion: Number(process.env.PLAN_VERSION), planSha: process.env.PLAN_SHA, repoSha: process.env.REPO_SHA, harnessSha: process.env.HARNESS_SHA, workflowUrl: process.env.WORKFLOW_URL, priorPlanUrl: process.env.PRIOR_PLAN_URL || null, model: process.env.MODEL, runId: process.env.RUN_ID }));
}
