import test from "node:test";
import assert from "node:assert/strict";
import { evaluateStart, evaluateApproval, stateLabelsAfter, terminalStateFor, approvalMarker, parseApprovalMarker } from "../scripts/github-state.mjs";

const plan = { commentId: 10, planSha: "p1", repoSha: "r1", expectedFiles: ["src/a.js"] };
const approval = { planCommentId: 10, planSha: "p1" };

test("allows only settled planning and replanning sources", () => {
  assert.equal(evaluateStart({ action: "plan", labels: ["intake-state:needs-review", "agent-trigger:plan"], permission: "write" }).nextState, "agent-state:planning");
  assert.equal(evaluateStart({ action: "replan", labels: ["agent-state:approved", "agent-trigger:replan"], permission: "maintain" }).revokeApproval, true);
  assert.equal(evaluateStart({ action: "replan", labels: ["agent-state:needs-review", "agent-trigger:replan"], permission: "write" }).nextState, "agent-state:planning");
  assert.throws(() => evaluateStart({ action: "plan", labels: ["agent-trigger:plan", "agent-state:approved"], permission: "admin" }), /illegal source/);
  assert.throws(() => evaluateStart({ action: "replan", labels: ["agent-state:needs-input", "agent-trigger:replan"], permission: "admin" }), /illegal source/);
});

test("rejects unauthorized, consumed, stale, and mismatched implementation triggers", () => {
  const labels = ["agent-state:approved", "agent-trigger:implement"];
  assert.throws(() => evaluateStart({ action: "implement", labels, permission: "triage", planMarker: plan, approvalMarker: approval }), /write permission/);
  assert.throws(() => evaluateStart({ action: "implement", labels: ["agent-state:approved"], permission: "write", planMarker: plan, approvalMarker: approval }), /absent or already consumed/);
  assert.throws(() => evaluateStart({ action: "implement", labels, permission: "write", planMarker: plan, approvalMarker: { ...approval, planSha: "old" } }), /not the approved plan/);
  assert.throws(() => evaluateStart({ action: "implement", labels, permission: "write", planMarker: plan, approvalMarker: approval, currentSha: "r2", changedFiles: ["src/a.js"] }), /stale/);
  assert.equal(evaluateStart({ action: "implement", labels, permission: "write", planMarker: plan, approvalMarker: approval, currentSha: "r2", changedFiles: ["README.md"] }).nextState, "agent-state:implementing");
  assert.equal(evaluateStart({ action: "implement", labels: ["agent-state:implementation-failed", "agent-trigger:implement"], permission: "write", planMarker: plan, approvalMarker: approval }).nextState, "agent-state:implementing");
  assert.throws(() => evaluateStart({ action: "implement", labels: ["agent-state:implementation-blocked", "agent-trigger:implement"], permission: "write", planMarker: plan, approvalMarker: approval }), /illegal source/);
});

test("approval and state replacement keep exactly one lifecycle state", () => {
  assert.equal(evaluateApproval({ labels: ["agent-state:needs-review", "agent-trigger:approve"], permission: "write", planMarker: plan }).nextState, "agent-state:approved");
  assert.throws(() => evaluateApproval({ labels: ["agent-state:approved", "agent-trigger:approve"], permission: "write", planMarker: plan }), /requires/);
  assert.deepEqual(stateLabelsAfter(["bug", "agent-state:approved", "agent-state:needs-review"], "agent-state:planning"), ["bug", "agent-state:planning"]);
});

test("maps crash/blocked/success terminal outcomes and round-trips approval markers", () => {
  assert.deepEqual([
    terminalStateFor("plan", "success"), terminalStateFor("plan", "blocked"), terminalStateFor("plan", "failure"),
    terminalStateFor("implement", "success"), terminalStateFor("implement", "blocked"), terminalStateFor("implement", "failure")
  ], ["agent-state:needs-review", "agent-state:needs-input", "agent-state:plan-failed", "agent-state:implementation-review", "agent-state:implementation-blocked", "agent-state:implementation-failed"]);
  const marker = approvalMarker({ planCommentId: 4, planSha: "abc--def" });
  assert.deepEqual(parseApprovalMarker(marker), { planCommentId: 4, planSha: "abc--def" });
});
