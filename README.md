# .standardization

Central standardization repository for reusable engineering conventions, CI
workflows, coding-agent prompts, language standards, and the v2 AGENTS.md
template that consuming repos vendor.

Use this repo as the source of truth when scaffolding, reviewing, or
standardizing projects across local repositories.

## What this repository contains

```text
.standardization/
├── AGENTS.md                          # rules for working ON this repo
├── agents.config.yml                  # this repo's own config (kind: docs)
├── README.md                          # you are here
├── .github/
│   ├── scripts/                       # release/changelog helpers
│   └── workflows/
│       ├── reusable-ci-pr-go.yml
│       ├── reusable-ci-pr-dotnet.yml
│       ├── reusable-ci-pr-python.yml
│       ├── reusable-docker-publish.yml
│       ├── reusable-pr-preview-image.yml
│       ├── reusable-semantic-pr.yml
│       ├── reusable-tag-and-release.yml
│       ├── reusable-agents-doctor.yml # consumers call this from their CI
│       └── sync-standard.yml          # the sync-bot
├── ci/                                # CI docs + client wrapper examples
├── dotnet/
│   ├── README-api.md
│   ├── README-web.md
│   └── observability/                 # starter (vendor into your service)
├── golang/
│   ├── README-api.md
│   ├── README-bot-wa.md
│   └── observability/                 # pointer to the graduated private library
├── python/
│   ├── README-api.md
│   └── observability/                 # starter (vendor into your service)
├── harness/                          # pilot issue planning/implementation runtime
├── prompts/
│   ├── projects/
│   ├── reviewer/
│   └── workflows/
├── schemas/
│   └── agents.config.v1.json          # JSON Schema for agents.config.yml
├── templates/
│   ├── agents/                        # the vendored AGENTS.md template (v2)
│   ├── agent-work/                    # manual sub-agent coordination template
│   └── pi-agent/                      # reference snapshot of ~/.pi/agent/AGENTS.md
└── tools/
    └── agents-doctor/                 # Go CLI that validates a repo against the standard
```

## v2 standardization

Consuming repos vendor the AGENTS.md template from `templates/agents/`. Per-repo
configuration lives in `agents.config.yml` (validated against
`schemas/agents.config.v1.json`). The `agents-doctor` Go CLI in `tools/`
runs in CI and validates the consumer against the rule registry (45 rules).

The flow is:

1. Consumer repo adds the GitHub topic `caesariodito-standard`.
2. Sync-bot opens an adoption PR copying `templates/agents/AGENTS.md` and the
   example `agents.config.yml`.
3. Consumer fills in `kind`, `language`, `owners`, opt-outs, etc.
4. Consumer's CI calls `reusable-agents-doctor.yml` on every PR.

See `templates/agents/README.md` for the adoption flow detail and override
semantics.

## CI standardization

Reusable GitHub Actions live under `.github/workflows/reusable-*.yml`.
Client repos call them by tag:

```yaml
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-go.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-dotnet.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-python.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-agents-doctor.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-docker-publish.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-pr-preview-image.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-semantic-pr.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-tag-and-release.yml@v2
```

Use `@v2` for stable major version updates. Pin to commit SHA when strict
supply-chain control is needed.

Docs:

- `ci/README.md`
- `ci/client-repository-guide.md`
- `harness/README.md` — one-repository agent harness pilot

### Engineering agent harness pilot

The pilot adds reusable plan/replan/approve and implement workflows plus thin
consumer callers:

```yaml
uses: caesariodito/.standardization/.github/workflows/reusable-agent-plan.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-agent-implement.yml@v2
```

Copy callers from `templates/workflows/` manually; `sync-standard.yml` does
not distribute them during the pilot. The label state machine, isolated runner
requirements, 9Router/Infisical/GitHub App prerequisites, rollback procedure,
and 3–5 issue scorecard are in `harness/README.md`.

These callers deliberately use mutable `@v2` for fast pilot fixes. Every run
records the resolved harness SHA, and maintainers must retain the previous SHA
for rollback. Pin a full SHA instead when strict reproducibility is required.

Go workflows support optional private modules through `private_modules_pattern`
and `GH_PRIVATE_MODULES_TOKEN`. Consuming repositories provide the secret;
this repository only defines the reusable workflow interface.

## Language standards

### Go

```text
golang/README-api.md
golang/README-bot-wa.md
golang/observability/README.md     # pointer to the graduated private library
```

### .NET

```text
dotnet/README-api.md
dotnet/README-web.md
dotnet/observability/Observability.cs  # starter (vendor into your service)
```

### Python

```text
python/README-api.md
python/observability/observability.py  # starter (vendor into your service)
```

Each language ships either a starter file (vendored into the consumer) or a
pointer to a graduated private library. Promotion criterion: 3+ repos have
used a starter unchanged for one release cycle. Go has graduated; .NET and
Python remain starters.

## agents-doctor

The Go CLI under `tools/agents-doctor/` validates a repository against the
v2 rule registry. Status: scaffold + 45-rule registry; per-rule Check
implementations land in follow-up PRs.

```bash
cd tools/agents-doctor
go build -o ./bin/agents-doctor ./cmd/agents-doctor
./bin/agents-doctor --version
```

See `tools/agents-doctor/README.md` for architecture, severity model, and
slug convention.

## Prompts

Reusable agent prompts live under `prompts/`.

- `prompts/projects/` — project scaffolding/standardization prompts
- `prompts/reviewer/` — review prompts for existing projects
- `prompts/workflows/` — workflow/orchestration prompts

## Manual sub-agent workflow

For greenfield projects where multiple agent sessions contribute without
native sub-agent support. Core principle: **PRD is direction. Contracts are
coordination.**

Flow:

```text
PRD
  → leader-agent creates acceptance criteria, architecture, contracts, vertical slices
  → slice agents implement against contracts
  → integration-agent assembles slices
  → review agents verify
  → human approves risky/final actions
```

Use the prompt at `prompts/workflows/manual-subagents-greenfield-development.md`
and copy the template:

```bash
cp -r templates/agent-work <target-project>/docs/agent-work
```

Expected target structure:

```text
docs/
├── prd.md
└── agent-work/
    ├── README.md
    ├── status.md
    ├── leader-plan.md
    ├── acceptance-criteria.md
    ├── architecture.md
    ├── work-packages.md
    ├── integration-plan.md
    ├── integration-report.md
    ├── decisions.md
    ├── contracts/
    │   ├── api.md
    │   ├── database.md
    │   ├── routes.md
    │   ├── ui.md
    │   └── events.md
    ├── findings/
    ├── reviews/
    └── slices/
        └── 001-tbd/
            ├── task.md
            ├── handoff.md
            └── blocker.md
```

## Common usage examples

### Scaffold a Go bot platform

```text
prompts/projects/go-bot-project-standardization.md
```

### Review a Go backend API

```text
prompts/reviewer/go-backend-api-standardization-reviewer.md
```

### Adopt the v2 standard in a repo

1. Add the GitHub topic `caesariodito-standard` to the repo.
2. Wait for the sync-bot adoption PR, or run it manually:
   `gh workflow run sync-standard.yml -f dry_run=false -f tag=v2.0.0`.
3. Edit the seeded `agents.config.yml` for `kind`, `language`, `owners`.
4. Add `agents-doctor.yml` workflow that calls `reusable-agents-doctor.yml@v2`.

## Releases

- `vX.Y.Z` patch — typo, copy edit, doctor bug fix.
- `vX.Y.0` minor — new rule (ships at `warn`), new section in template.
- `vX.0.0` major — breaking change (rule renamed/removed, semantic shift).

Tagging triggers the sync-bot via `sync-standard.yml` (currently manual via
`workflow_dispatch`; promotion to `release: published` deferred until the
first proven run).

## Maintenance notes

- Keep prompts and templates implementation-ready. Vague standards are
  worse than no standard — agents can't verify them.
- Rule slugs in the doctor's registry are public API. Renaming a slug is a
  breaking change.
- New doctor rules ship at `warn` first; promote to `error` after a clean
  run cycle across consumers.
