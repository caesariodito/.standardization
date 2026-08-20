import fs from "node:fs";
import crypto from "node:crypto";
import { parsePlanMarker } from "./render-plan.mjs";

export const STATE_PREFIX = "agent-state:";
export const triggerFor = (action) => `agent-trigger:${action}`;
const permissionRank = { none: 0, read: 1, triage: 2, write: 3, maintain: 4, admin: 5 };
const activeState = { plan: "agent-state:planning", replan: "agent-state:planning", implement: "agent-state:implementing" };
const legalSource = {
  plan: (labels) => labels.includes("intake-state:needs-review") && !labels.some((x) => x.startsWith(STATE_PREFIX)),
  replan: (labels) => ["agent-state:needs-review", "agent-state:approved"].some((x) => labels.includes(x)),
  implement: (labels) => labels.includes("agent-state:approved")
};

export function evaluateStart({ action, labels, permission, planMarker, approvalMarker, currentSha, changedFiles = [] }) {
  if (!legalSource[action]) throw new Error(`unsupported action: ${action}`);
  if ((permissionRank[permission] ?? 0) < permissionRank.write) throw new Error("triggering actor requires write permission");
  if (!labels.includes(triggerFor(action))) throw new Error(`trigger ${triggerFor(action)} is absent or already consumed`);
  if (!legalSource[action](labels)) throw new Error(`illegal source state for ${action}`);
  if (action === "implement") {
    if (!planMarker || !approvalMarker || approvalMarker.planCommentId !== planMarker.commentId || approvalMarker.planSha !== planMarker.planSha) throw new Error("latest plan is not the approved plan");
    if (currentSha && currentSha !== planMarker.repoSha) {
      const expected = new Set(planMarker.expectedFiles ?? []);
      const overlap = changedFiles.filter((file) => expected.has(file));
      if (overlap.length) throw new Error(`approved plan is stale; planned files changed: ${overlap.join(", ")}`);
    }
  }
  return { removeTrigger: triggerFor(action), nextState: activeState[action], revokeApproval: action === "replan" };
}

export function evaluateApproval({ labels, permission, planMarker }) {
  if ((permissionRank[permission] ?? 0) < permissionRank.write) throw new Error("triggering actor requires write permission");
  if (!labels.includes(triggerFor("approve")) || !labels.includes("agent-state:needs-review")) throw new Error("approval requires its trigger and agent-state:needs-review");
  if (!planMarker) throw new Error("no bot-owned plan marker found");
  return { removeTrigger: triggerFor("approve"), nextState: "agent-state:approved" };
}

export function stateLabelsAfter(labels, nextState) {
  return [...labels.filter((label) => !label.startsWith(STATE_PREFIX)), nextState];
}

export function terminalStateFor(action, outcome) {
  const states = {
    plan: { success: "agent-state:needs-review", blocked: "agent-state:needs-input", failure: "agent-state:plan-failed" },
    replan: { success: "agent-state:needs-review", blocked: "agent-state:needs-input", failure: "agent-state:plan-failed" },
    implement: { success: "agent-state:implementation-review", blocked: "agent-state:implementation-blocked", failure: "agent-state:implementation-failed" }
  };
  const state = states[action]?.[outcome];
  if (!state) throw new Error(`invalid outcome ${outcome} for ${action}`);
  return state;
}

const approvalPrefix = "<!-- agent-approval:v1 ";
export function approvalMarker(metadata) { return `${approvalPrefix}${JSON.stringify(metadata).replaceAll("--", "\\u002d\\u002d")} -->`; }
export function parseApprovalMarker(body) {
  const start = body.indexOf(approvalPrefix); if (start < 0) return null;
  const end = body.indexOf(" -->", start); if (end < 0) return null;
  try { return JSON.parse(body.slice(start + approvalPrefix.length, end)); } catch { return null; }
}

class GitHub {
  constructor({ repository, token }) {
    if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");
    this.base = `https://api.github.com/repos/${repository}`;
    this.headers = { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
  }
  async request(path, options = {}) {
    const response = await fetch(path.startsWith("https:") ? path : `${this.base}${path}`, { ...options, headers: { ...this.headers, ...options.headers } });
    if (!response.ok) throw new Error(`GitHub API ${options.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
    return response.status === 204 ? null : response.json();
  }
  async comments(issue) {
    const all = []; let page = 1;
    for (;;) { const batch = await this.request(`/issues/${issue}/comments?per_page=100&page=${page++}`); all.push(...batch); if (batch.length < 100) return all; }
  }
  async issue(issue) { return this.request(`/issues/${issue}`); }
  async permission(actor) { return (await this.request(`/collaborators/${encodeURIComponent(actor)}/permission`)).permission; }
  async removeLabel(issue, label) {
    const response = await fetch(`${this.base}/issues/${issue}/labels/${encodeURIComponent(label)}`, { method: "DELETE", headers: this.headers });
    if (!response.ok && response.status !== 404) throw new Error(`failed to remove label ${label}: ${response.status} ${await response.text()}`);
  }
  async setState(issue, state) {
    const data = await this.issue(issue);
    for (const label of data.labels.map((x) => x.name).filter((x) => x.startsWith(STATE_PREFIX) && x !== state)) await this.removeLabel(issue, label);
    if (!data.labels.some((x) => x.name === state)) await this.request(`/issues/${issue}/labels`, { method: "POST", body: JSON.stringify({ labels: [state] }), headers: { "content-type": "application/json" } });
  }
  async comment(issue, body) { return this.request(`/issues/${issue}/comments`, { method: "POST", body: JSON.stringify({ body }), headers: { "content-type": "application/json" } }); }
}

function latestMarkers(comments) {
  const expectedRunUrl = (runId) => `${process.env.GITHUB_SERVER_URL || "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${runId}`;
  const plans = comments.filter((x) => x.user?.login === "github-actions[bot]").map((x) => ({ comment: x, marker: parsePlanMarker(x.body ?? "") })).filter((x) => x.marker && Number.isSafeInteger(x.marker.planVersion) && /^[0-9a-f]{64}$/.test(x.marker.planSha) && /^[0-9a-f]{40}$/.test(x.marker.repoSha) && Array.isArray(x.marker.expectedFiles) && x.marker.workflowUrl === expectedRunUrl(x.marker.runId));
  const approvals = comments.filter((x) => x.user?.login === "github-actions[bot]").map((x) => ({ comment: x, marker: parseApprovalMarker(x.body ?? "") })).filter((x) => x.marker && Number.isSafeInteger(x.marker.planCommentId) && /^[0-9a-f]{64}$/.test(x.marker.planSha));
  const plan = plans.at(-1); const approval = approvals.at(-1);
  return {
    plan: plan ? { ...plan.marker, commentId: plan.comment.id, url: plan.comment.html_url } : null,
    approval: approval ? approval.marker : null,
    planVersion: plan?.marker.planVersion ?? 0
  };
}
function output(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const delimiter = `agent_${crypto.randomUUID()}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}<<${delimiter}\n${value ?? ""}\n${delimiter}\n`).join(""));
}
function arg(name) { const i = process.argv.indexOf(`--${name}`); return i < 0 ? undefined : process.argv[i + 1]; }

async function main() {
  const command = process.argv[2];
  const issue = Number(arg("issue") ?? process.env.ISSUE_NUMBER);
  const actor = arg("actor") ?? process.env.TRIGGER_ACTOR;
  if (!Number.isSafeInteger(issue) || issue < 1) throw new Error("valid --issue is required");
  const github = new GitHub({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN });
  if (command === "comment") { const file = arg("file"); if (!file) throw new Error("--file is required"); const result = await github.comment(issue, fs.readFileSync(file, "utf8")); output({ comment_id: result.id, comment_url: result.html_url }); return; }
  if (command === "finish") {
    const action = arg("action"); const data = await github.issue(issue); const labels = data.labels.map((x) => x.name);
    if (!labels.includes(activeState[action])) throw new Error(`cannot finish ${action} outside ${activeState[action] ?? "its active state"}`);
    await github.setState(issue, terminalStateFor(action, arg("outcome"))); return;
  }
  if (command === "fail") {
    const action = arg("action"); const data = await github.issue(issue); const labels = data.labels.map((x) => x.name);
    if (labels.includes(activeState[action])) {
      let outcome = "failure";
      if (action === "implement" && arg("branch")) {
        const owner = process.env.GITHUB_REPOSITORY.split("/")[0];
        const pulls = await github.request(`/pulls?state=open&head=${encodeURIComponent(`${owner}:${arg("branch")}`)}`);
        if (pulls.length) outcome = "blocked";
      }
      await github.setState(issue, terminalStateFor(action, outcome));
    }
    return;
  }
  if (!actor) throw new Error("--actor is required");
  const [data, permission, comments] = await Promise.all([github.issue(issue), github.permission(actor), github.comments(issue)]);
  const labels = data.labels.map((x) => x.name); const markers = latestMarkers(comments);
  if (command === "inspect-implementation") {
    evaluateStart({ action: "implement", labels, permission, planMarker: markers.plan, approvalMarker: markers.approval });
    output({ plan_sha: markers.plan.planSha, repo_sha: markers.plan.repoSha, expected_files: JSON.stringify(markers.plan.expectedFiles), plan_comment_id: markers.plan.commentId }); return;
  }
  if (command === "approve") {
    const transition = evaluateApproval({ labels, permission, planMarker: markers.plan });
    await github.removeLabel(issue, transition.removeTrigger);
    await github.comment(issue, `${approvalMarker({ planCommentId: markers.plan.commentId, planVersion: markers.plan.planVersion, planSha: markers.plan.planSha, repoSha: markers.plan.repoSha, actor, runId: process.env.GITHUB_RUN_ID })}\nApproved Plan Draft v${markers.plan.planVersion} for implementation.`);
    await github.setState(issue, "agent-state:approved"); return;
  }
  if (command === "start") {
    const action = arg("action");
    let changedFiles = [];
    if (arg("changed-files")) changedFiles = JSON.parse(fs.readFileSync(arg("changed-files"), "utf8"));
    let transition;
    try {
      transition = evaluateStart({ action, labels, permission, planMarker: markers.plan, approvalMarker: markers.approval, currentSha: arg("current-sha"), changedFiles });
    } catch (error) {
      if (action === "implement" && error.message.startsWith("approved plan is stale;")) {
        await github.removeLabel(issue, triggerFor(action));
        await github.setState(issue, "agent-state:needs-review");
      }
      throw error;
    }
    await github.removeLabel(issue, transition.removeTrigger);
    await github.setState(issue, transition.nextState);
    output({ plan_version: markers.planVersion + 1, prior_plan_url: markers.plan?.url ?? "", approved_repo_sha: markers.plan?.repoSha ?? "" }); return;
  }
  throw new Error(`unknown command: ${command}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
