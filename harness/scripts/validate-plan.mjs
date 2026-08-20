import fs from "node:fs";

export const MAX_PLAN_BYTES = 100_000;
const keys = ["schemaVersion", "outcome", "problem", "evidence", "background", "unknowns", "proposedSolution", "implementationPlan", "acceptanceCriteria", "risks", "outOfScope", "expectedFiles", "changesFromPreviousPlan", "feedbackAddressed"];
const arrays = ["evidence", "unknowns", "implementationPlan", "acceptanceCriteria", "risks", "outOfScope", "expectedFiles", "changesFromPreviousPlan", "feedbackAddressed"];
const nonEmpty = new Set(["evidence", "implementationPlan", "acceptanceCriteria", "expectedFiles"]);

export function validatePlanText(text) {
  if (Buffer.byteLength(text) > MAX_PLAN_BYTES) throw new Error(`plan exceeds ${MAX_PLAN_BYTES} bytes`);
  let plan;
  try { plan = JSON.parse(text); } catch (error) { throw new Error(`invalid JSON: ${error.message}`); }
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) throw new Error("plan must be an object");
  const actual = Object.keys(plan);
  const missing = keys.filter((key) => !(key in plan));
  const extra = actual.filter((key) => !keys.includes(key));
  if (missing.length) throw new Error(`missing fields: ${missing.join(", ")}`);
  if (extra.length) throw new Error(`unknown fields: ${extra.join(", ")}`);
  if (plan.schemaVersion !== 1) throw new Error("schemaVersion must be 1");
  if (!["ready", "needs-input"].includes(plan.outcome)) throw new Error("outcome must be ready or needs-input");
  for (const key of ["problem", "background", "proposedSolution"]) {
    if (typeof plan[key] !== "string" || !plan[key].trim()) throw new Error(`${key} must be a non-empty string`);
    if (plan[key].length > (key === "proposedSolution" ? 12000 : 8000)) throw new Error(`${key} is too long`);
  }
  for (const key of arrays) {
    if (!Array.isArray(plan[key]) || (nonEmpty.has(key) && plan[key].length === 0) || plan[key].length > 100) throw new Error(`${key} must be ${nonEmpty.has(key) ? "a non-empty" : "an"} array with at most 100 items`);
    if (plan[key].some((item) => typeof item !== "string" || !item.trim() || item.length > 4000)) throw new Error(`${key} entries must be non-empty strings of at most 4000 characters`);
  }
  if (plan.expectedFiles.some((file) => file.startsWith("/") || file.split("/").includes("..") || /[\r\n]/.test(file))) throw new Error("expectedFiles entries must be repository-relative paths");
  return plan;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : fs.readFileSync(0, "utf8");
  try { validatePlanText(input); process.stdout.write("valid\n"); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
