# Engineering agent harness pilot

This directory is the versioned runtime for one private-repository pilot. It implements explicit plan, replan, approval, and implementation triggers. It does not implement intake, merge, deployment, production access, MCP, or organization-wide distribution.

## Data and trust assumption

Every file committed to a participating repository must be approved for transmission to internal 9Router and the selected upstream model provider. Excluding `.git`, dependencies, build outputs, binaries, local environment files, and files outside the checkout is context hygiene, not sensitive-data classification.

Issue text, comments, repository files, and model output are untrusted data. GitHub API code owns actor authorization, label transitions, approval, drift checks, and token timing; prompts do not.

## Pilot prerequisites

Before copying the caller templates, the platform owner must provide and verify these values. The harness intentionally has no fallback to a personal runner, credential, provider, or PAT.

- Dedicated runner labels in `AI_PLANNER_RUNNER_LABEL` and `AI_IMPLEMENTER_RUNNER_LABEL`. Each job receives a fresh rootless VM/container with no Docker socket, shared home, inbound network, personal Pi files, deployment/cloud secrets, or production network route. Destroy it after one job.
- Node.js 22, Git, Bash, and network access only to GitHub, internal 9Router, and approved package registries.
- `NINE_ROUTER_BASE_URL`, plus a repository/organization secret named `NINE_ROUTER_API_KEY`. The endpoint must expose the OpenAI-compatible `/models` and chat-completions contract. It must advertise the exact logical aliases `engineering-planner` and `engineering-implementer` (or configured overrides), keep their model families stable, and enforce harness quotas.
- A GitHub App installed on the pilot repository with Metadata read, Contents read/write, Issues read/write, and Pull requests read/write. Set its App ID as `AI_GITHUB_APP_ID` and its PEM private key as the repository/organization secret `GH_PRIVATE_APP_KEY`.
- The consumer allows reusable workflows from `caesariodito/.standardization` and defines the labels below.

The 9Router API contract must be smoke-tested against the platform-owned endpoint before a real issue. No endpoint, credential, runner label, or App ID is supplied by this repository.

## Labels

Humans apply only trigger labels:

- `agent-trigger:plan`
- `agent-trigger:replan`
- `agent-trigger:approve`
- `agent-trigger:implement`

Create these bot-owned state labels:

- `agent-state:planning`
- `agent-state:needs-review`
- `agent-state:needs-input`
- `agent-state:approved`
- `agent-state:implementing`
- `agent-state:implementation-review`
- `agent-state:implementation-blocked`
- `agent-state:plan-failed`
- `agent-state:implementation-failed`

Initial planning also requires `intake-state:needs-review`. Exactly one `agent-state:*` is retained. Triggering actors require `write`, `maintain`, or `admin` permission. After `agent-state:implementation-failed`, a human may reapply `agent-trigger:implement`; the harness revalidates the approved plan and repository drift before retrying.

## Install in one pilot repository

1. Copy `templates/workflows/agent-plan.yml` and `agent-implement.yml` into the consumer's `.github/workflows/`.
2. Configure the variables and secrets above. Optionally set `AI_PLANNER_MODEL`, `AI_PLANNER_TIMEOUT_MINUTES`, `AI_IMPLEMENTER_MODEL`, `AI_IMPLEMENTER_TIMEOUT_MINUTES`, and trusted `AI_IMPLEMENTER_CHECK_COMMAND`.
3. Confirm the repository's `AGENTS.md` names runnable checks and local continuation commands.
4. Create a private disposable issue with `intake-state:needs-review`, then apply `agent-trigger:plan` as a collaborator with write access.
5. Inspect the immutable plan marker/evidence, replan if needed, approve, and implement. Never merge the first smoke-test PR.

The Planner has only `contents: read`, `issues: write`, and Pi's read tools. The model-running Implementer job has no App token or App private key. A second ephemeral publishing job receives the App private key only after useful work is bundled, mints a repository-scoped short-lived token, pushes, opens a draft PR, and revokes the token.

## Defaults and evidence

`config/defaults.json` records versioned logical model, timeout, and retry defaults. Caller variables override them. Runner/platform capacity owns organization concurrency; it is not a harness JSON option.

Each plan comment records plan version/SHA, consumer SHA, resolved harness SHA, model alias, workflow URL, prior-plan link, expected files, and run ID. Raw plan/context evidence and credential-free implementation bundles are retained as workflow artifacts for 30 days.

`@v2` is a mutable major tag. This speeds pilot fixes but reduces strict reproducibility. Protect tag movement, test the pilot before moving it, record the prior resolved SHA, and roll back by moving `v2` to that SHA. Pin the caller to a full known-good SHA if immediate rollback or strict reproducibility is more important than updates.

## Pilot gate and scorecard

Run 3–5 real issues before changing sync automation or universal agent templates. For each issue record:

- problem interpretation and evidence paths/symbols are correct;
- unknowns are not invented, and root cause/verification are credible;
- replan addresses human feedback;
- implementation matches the approved plan or explains deviations;
- checks and blocked continuation instructions are accurate;
- duration, model/token cost, human edits, hallucinated references, and repeated runs;
- no secret, egress, runner-isolation, permission, or state-label violation.

Three clean cases establish basic viability; five varied cases are the rollout review target. Keep automatic merge, deployment, production/DB/log access, MCP, sensitive-file classification, automatic intake planning, sync-bot rollout, and personal Pi configuration out of v1.

## Local validation

```bash
npm ci --prefix harness --ignore-scripts
npm test --prefix harness
```

The lockfile pins `@earendil-works/pi-coding-agent` `0.84.2`. Review dependency advisories and the provider extension before moving `v2`; package installation is restricted with `--ignore-scripts` in workflows.
