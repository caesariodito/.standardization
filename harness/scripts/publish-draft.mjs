import fs from "node:fs";

const token = process.env.GITHUB_APP_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
const issue = Number(process.env.ISSUE_NUMBER);
const branch = process.env.BRANCH_NAME;
const base = process.env.BASE_BRANCH;
const outcome = process.env.IMPLEMENTATION_OUTCOME;
if (!token || !repository || !issue || !branch || !base || !["success", "blocked"].includes(outcome)) throw new Error("draft PR publishing environment is incomplete");
const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
const api = async (path, options = {}) => {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`GitHub API ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
};
const issueData = await api(`/issues/${issue}`);
const reportPath = process.env.IMPLEMENTATION_REPORT;
const report = reportPath && fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf8").slice(-20_000) : "No model report was captured.";
const checksPath = process.env.CHECK_REPORT;
const checks = checksPath && fs.existsSync(checksPath) ? fs.readFileSync(checksPath, "utf8").slice(-8_000) : "No separate check command was configured.";
const body = [
  `Implements #${issue} from the approved Plan Draft.`,
  `Harness outcome: **${outcome}**. Human review and merge are required.`,
  "## Implementer handoff", "```text", report.replaceAll("```", "` ` `"), "```",
  "## Repository check output", "```text", checks.replaceAll("```", "` ` `"), "```",
  `Harness SHA: \`${process.env.HARNESS_SHA || "unknown"}\``,
  `Model: \`${process.env.MODEL || "unknown"}\``,
  `Workflow: ${process.env.WORKFLOW_URL || "unknown"}`,
  `Continue locally: \`git fetch origin ${branch} && git switch ${branch}\``
].join("\n\n");
const pr = await api("/pulls", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: `[Agent] ${issueData.title}`.slice(0, 250), head: branch, base, body, draft: true }) });
process.stdout.write(`${pr.html_url}\n`);
