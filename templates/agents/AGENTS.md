# AGENTS.md

> **Vendored from `caesariodito/.standardization`.** Do not edit manually except
> to update the `@`-include override files in `docs/agents/`. The bot opens a
> PR when the upstream standard bumps.
>
> **Override semantics (append/extend).** The base sections below are always in
> force. `@`-include files **add** to them; they do not replace. To turn off a
> base rule, list its slug in `agents.config.yml` under `optouts:` with a
> reason and an `expires` date. Run `agents-doctor` to validate.

`standard_version`, `kind`, `language`, `owners`, and opt-outs live in
[`agents.config.yml`](./agents.config.yml).

---

## 1. Operating principles

- `[principles.surgical]` Touch only what the task requires. No drive-by refactors.
- `[principles.simplicity]` Minimal code that solves the requested problem. No speculative abstractions.
- `[principles.clean-own-mess]` Remove imports and vars made unused by your change.
- `[principles.verify]` Run build, tests, typecheck, lint when available before claiming done.
- `[principles.match-style]` Read neighbours before writing new code.
- `[principles.no-destructive-without-confirm]` No `git push --force`, no `rm -rf`, no prod deploys without explicit user approval.

@docs/agents/principles.md

---

## 2. Skills routing

Repo follows the global routing in `~/.pi/agent/AGENTS.md`. Repo-specific overrides go in the include below.

**First-time Pi setup.** If `~/.pi/agent/AGENTS.md` doesn't exist on your machine yet, see [`templates/pi-agent/README.md`](https://github.com/caesariodito/.standardization/blob/main/templates/pi-agent/README.md) in the standardization repo. Three options, in order of preference:

1. Run `/skill:pi-agent-sync` from a machine that already has the setup.
2. Copy `templates/pi-agent/AGENTS.md` from the standardization repo to `~/.pi/agent/AGENTS.md` manually.
3. Skip the global setup — the operating principles in Section 1 below cover the essentials inline.

- Planning / vague idea → `/skill:grill-with-docs`
- Implementing behaviour or fixing a bug → `/skill:tdd`
- Mysterious bug or perf regression → `/skill:diagnose`
- Architecture or refactor → `/skill:improve-codebase-architecture`
- Plan → tickets → `/skill:to-issues`
- Conversation → PRD → `/skill:to-prd`
- Throwaway exploration → `/skill:prototype`

@docs/agents/skills.md

---

## 3. `/healthz`, `/readyz`, `/version`

Applies to repos with `kind: service`.

- `[healthz.liveness]` (error) `GET /healthz` returns 200 if process is up.
- `[healthz.readiness]` (error) `GET /readyz` returns 200 only if dependencies are reachable.
- `[healthz.version-endpoint]` (warn) `GET /version` returns service identity without dep checks.
- `[healthz.payload-shape]` (warn) `/healthz` JSON includes `status`, `service`, `version`.
- `[healthz.no-deps-in-liveness]` (warn) `/healthz` does not call DB, cache, or upstream HTTP.

Standard payload:

```json
{
  "status": "ok",
  "service": "<repo-name>",
  "version": "1.4.2",
  "commit": "<short-sha>",
  "build_time": "2026-05-25T03:00:00Z",
  "uptime_s": 1234,
  "checks": { "db": "ok", "cache": "ok", "upstream:foo": "degraded" }
}
```

Status values: `ok | degraded | down`. Overall status equals worst child.

@docs/agents/healthz.md

---

## 4. Logging, metrics, tracing

Each language has a starter observability module vendored from the standard repo:

| Language | Source | Entry point |
|---|---|---|
| Go | private library (already graduated) | `obs.Init(ctx, cfg)` |
| .NET | `Org.Observability` | `builder.AddOrgObservability(opts)` |
| Python | `observability.py` | `observability.init(cfg)` |

- `[logging.starter-present]` (warn) language-appropriate starter is wired in.
- `[logging.standard-fields]` (warn) every log line carries `ts`, `level`, `service`, `version`, `env`, `trace_id`, `span_id`, `request_id` (when applicable), `msg`.
- Levels: `debug | info | warn | error`. No `fatal`.
- Sinks: stdout JSON only. Aggregation is the platform's job.

Graduation rule: when 3+ repos have used a starter unchanged for one release cycle, promote it to a published package.

@docs/agents/observability.md

---

## 5. API contract (source of truth for API repos)

Applies when `api.is_api: true` in `agents.config.yml`.

- `[api-contract.exists]` (error) `api-contract.md` exists at repo root.
- `[api-contract.required-sections]` (error) file has `## Versioning`, `## Endpoints`, `## Breaking change log`.
- `[api-contract.endpoint-block-shape]` (warn) each endpoint has Auth, Errors, Bruno fields.
- `[api-contract.bruno-coverage]` (error) every endpoint references a `.bru` file that exists.

**Tie-break rule.** When `api-contract.md` and code disagree, **the code is wrong**. Open a contract update PR first, then the code-change PR. Bruno wins on actual behaviour and is the smoke test that the code matches the contract.

Layered roles:

| Artefact | Role |
|---|---|
| `api-contract.md` | Semantic intent, error semantics, breaking change log. Hand-written. |
| `/api/bruno/` | Executable examples, run by QA + Dev for testing/simulation. Hand-maintained, AI-assisted. |
| `/api/openapi.yaml` | Optional. Generated from code if present. For codegen consumers only. |

Endpoint block shape (see `templates/api-contract.example.md`):

```markdown
### `POST /v1/orders` — create order
- **Auth**: Bearer JWT, scope `orders:write`
- **Idempotency**: `Idempotency-Key` header required
- **Errors**: `409` duplicate, `422` validation, `402` payment_required
- **Bruno**: `/api/bruno/orders/create.bru`
- **Changed**: 2026-05-20 — added `metadata` field (additive, non-breaking)
```

@docs/agents/api-contract.md

---

## 6. Bruno

- `[bruno.collection-exists]` (error) `/api/bruno/` exists with ≥1 `.bru` file (API repos only).
- `[bruno.no-secrets-in-files]` (error) no literal API keys in `.bru` files.
- `[bruno.contract-back-reference]` (warn) each `.bru` request links back to a contract anchor.
- Environments live in `/api/bruno/environments/{local,dev,staging,prod}.bru`.
- Secrets resolve via `{{process.env.FOO}}`, injected by Infisical at run time.

@docs/agents/bruno.md

---

## 7. GitHub Actions

Standard workflows under `.github/workflows/`:

| File | Trigger | Reusable source |
|---|---|---|
| `ci.yml` | PR, push to main | `caesariodito/.standardization/.github/workflows/reusable-ci-pr-<lang>.yml@v2` |
| `release.yml` | tag `v*.*.*` | `reusable-tag-and-release.yml@v2` |
| `deploy.yml` | `workflow_dispatch` or `release: published` | per-platform |
| `agents-doctor.yml` | PR | `reusable-agents-doctor.yml@v2` |

- `[ci.workflow-ci]` (error)
- `[ci.workflow-release]` (warn) — service, library, app
- `[ci.workflow-deploy]` (warn) — service, app
- `[ci.workflow-doctor]` (error) — all kinds

Branch protection: `main` requires green `ci.yml` + 1 review. `prod` deploys require manual approval via GitHub environment.

@docs/agents/ci.md

---

## 8. PRDs, ADRs, SOPs

Layout:

- PRDs → `/docs/prd/<NNNN>-<kebab-slug>.md`, index at `/docs/prd/README.md`
- ADRs → `/docs/adr/<NNNN>-<kebab-slug>.md`
- SOPs → `/docs/sop/<NNNN>-<kebab-slug>.md`

`NNNN` is zero-padded, monotonically increasing per type.

Required front-matter (workflow-aware):

```yaml
---
id: 0007
title: Self-serve onboarding
status: draft | in-review | accepted | shipped | superseded | rejected   # PRD
owner: "@handle"
reviewers: ["@alice", "@bob"]
created: 2026-05-20
updated: 2026-05-25
target_release: 2026-Q3                 # PRD only, optional
related_repos: ["orders-service"]       # optional
supersedes: 0003                        # PRD/ADR only, optional
tags: ["onboarding", "growth"]          # optional
---
```

Per-type tweaks:

- **ADR**: drop `target_release`. Status enum: `proposed | accepted | superseded | rejected`. Add `decision_date`, `consequences_reviewed_on`.
- **SOP**: drop `target_release` and `supersedes`. Status enum: `draft | active | retired`. Add `next_review_date`.

Doctor rules:

- `[docs.prd-dir]` (error) `/docs/prd/` exists with `README.md` index.
- `[docs.adr-dir]` (warn) `/docs/adr/` exists if any ADRs.
- `[docs.sop-dir]` (warn) `/docs/sop/` exists if any SOPs.
- `[docs.frontmatter-shape]` (error) required fields present per type.
- `[docs.frontmatter-status-enum]` (error) `status` matches the per-type enum.
- `[docs.frontmatter-id-unique]` (error) no duplicate `id` within a doc type.
- `[docs.frontmatter-supersedes-exists]` (warn) `supersedes` references an existing id.
- `[docs.frontmatter-sop-review]` (warn) SOP `next_review_date` not past today.

@docs/agents/docs.md

---

## 9. Secrets and configuration (Infisical, self-hosted)

**Project layout in Infisical**

- `<service>-nonprod` — dev + staging as folders.
- `<service>-prod` — prod only, isolated identity.
- `shared-nonprod`, `shared-prod` — cross-cutting secrets (OTLP endpoint, Slack webhooks, etc.).

**Local dev**

- `.env.local` (gitignored) refreshed via `infisical export -f dotenv > .env.local`.
- README documents a `make secrets` (or equivalent) task that runs the export.

**CI/CD**

- OIDC machine-identity auth via `Infisical/secrets-action`. No long-lived GitHub Actions secrets.
- One identity per service per environment, scoped to the OIDC subject `repo:caesariodito/<service>:environment:<env>`.

**Doctor rules**

- `[secrets.no-env-files]` (error) no `.env`, `.env.local`, `.env.*` committed (except `.env.example` if generated).
- `[secrets.gitignore-coverage]` (error) `.gitignore` includes `.env*`.
- `[secrets.no-hardcoded-keys]` (warn) naive grep for `AKIA`, `sk_live_`, `ghp_`, `xoxb-`.
- `[secrets.infisical-config-exists]` (warn) `.infisical.json` at repo root.
- `[secrets.infisical-url-https]` (warn) `secrets.infisical_url` in config is HTTPS.

A real secret scan (gitleaks) runs as a separate CI step. The doctor's grep is a smoke test only.

@docs/agents/secrets.md

---

## 10. README and changelog

- `[readme.exists]` (error) `README.md` at repo root.
- `[readme.required-links]` (warn) links to `AGENTS.md`, `CHANGELOG.md`, `/docs/prd/`, and `api-contract.md` if API repo.
- `[readme.length]` (warn) < 200 lines. Push deep content into the right doc.
- `[changelog.exists]` (error) `CHANGELOG.md` at repo root, [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
- `[agents.exists]` (error) `AGENTS.md` at repo root.
- `[agents.no-claude-md]` (warn) no `CLAUDE.md` (the standard ships AGENTS.md only).
- `[pi.global-agents-md]` (info, local-only) `~/.pi/agent/AGENTS.md` exists. Skipped in CI. Courtesy heads-up for new contributors, never blocking.

README is the foyer. `api-contract.md` is the first deep-dive doc for API repos.

@docs/agents/readme.md

---

## 11. Compliance check

Run before opening a PR:

```bash
agents-doctor
# or
agents-doctor --json   # CI mode
```

- Reads `agents.config.yml` for `kind`, `api.is_api`, `optouts`, etc.
- Runs the rule registry (44 rules at v2).
- Severity: `error` fails CI, `warn` reports but passes, `info` is hidden by default.
- Opt-outs: every entry must have `reason`; `expires` recommended (warn if missing, warn when past today).
- New rules ship at `warn` first; promoted to `error` after one bump cycle of clean runs across consumers.

@docs/agents/doctor-overrides.md

---

## Appendix: file map

```
/
├── AGENTS.md                          ← this file (vendored)
├── agents.config.yml                  ← per-repo config (Q6)
├── README.md                          ← foyer (Q5)
├── CHANGELOG.md
├── api-contract.md                    ← API repos (Q4)
├── api/
│   └── bruno/
│       ├── environments/
│       └── *.bru
├── docs/
│   ├── prd/
│   │   └── README.md                  ← index
│   ├── adr/
│   ├── sop/
│   └── agents/                        ← @-include override slots
│       ├── principles.md
│       ├── skills.md
│       ├── healthz.md
│       ├── observability.md
│       ├── api-contract.md
│       ├── bruno.md
│       ├── ci.md
│       ├── docs.md
│       ├── secrets.md
│       ├── readme.md
│       └── doctor-overrides.md
└── .github/
    └── workflows/
        ├── ci.yml
        ├── release.yml
        ├── deploy.yml
        └── agents-doctor.yml
```
