# .standardization

Central standardization repository for reusable engineering conventions, CI workflows, coding-agent prompts, and project templates.

Use this repo as source-of-truth material when scaffolding, reviewing, or standardizing projects across local repositories.

## What this repository contains

```text
.standardization/
├── AGENTS.md                 # Agent entrypoint; currently references RTK.md
├── RTK.md                    # Rust Token Killer shell-command guidance
├── .codex/                   # Codex CLI configuration, hooks, and skills
├── .github/
│   ├── scripts/              # Release/changelog helper scripts
│   └── workflows/            # Reusable GitHub Actions workflows
├── ci/                       # CI usage docs and client workflow examples
├── dotnet/                   # .NET project standardization docs
├── golang/                   # Go project standardization docs
├── prompts/                  # Reusable agent prompts
│   ├── projects/             # Project scaffolding/standardization prompts
│   ├── reviewer/             # Review prompts for existing projects
│   └── workflows/            # Workflow/orchestration prompts
└── templates/                # Copyable project/workflow templates
    └── agent-work/           # Manual sub-agent coordination template
```

## Agent instructions

Agents should read:

1. `AGENTS.md`
2. `RTK.md`
3. relevant prompt/template for requested work

Current global agent rule from `RTK.md`:

```bash
rtk <command>
```

Use `rtk` prefix for shell commands in environments where RTK is available.

## CI standardization

Reusable GitHub Actions live in:

```text
.github/workflows/
```

Current reusable workflow entrypoints:

```text
.github/workflows/reusable-ci-pr-dotnet.yml
.github/workflows/reusable-ci-pr-go.yml
.github/workflows/reusable-docker-publish.yml
.github/workflows/reusable-pr-preview-image.yml
.github/workflows/reusable-semantic-pr.yml
.github/workflows/reusable-tag-and-release.yml
```

Docs:

```text
ci/README.md
ci/client-repository-guide.md
```

Client repositories should keep thin wrapper workflows and call this repository's reusable workflows by tag, for example:

```text
caesariodito/.standardization/.github/workflows/<workflow-file>@v1
```

Use `@v1` for stable major version updates. Pin to commit SHA when strict supply-chain control is needed.

Go workflows support optional private modules through `private_modules_pattern` and `GH_PRIVATE_MODULES_TOKEN`. Consuming repositories provide the secret; this repository only defines the reusable workflow interface.

## Language/project standards

### .NET

```text
dotnet/README-api.md
dotnet/README-web.md
```

Use for API and web project conventions.

### Go

```text
golang/README-api.md
golang/README-bot-wa.md
```

Use for Go API and bot/WhatsApp platform conventions.

## Prompts

Reusable prompts live in:

```text
prompts/
```

### Project prompts

```text
prompts/projects/go-backend-logging-project.md
prompts/projects/go-backend-logging-project-v1.5.md
prompts/projects/go-backend-logging-project-v2.md
prompts/projects/go-bot-project-standardization.md
```

Use these to scaffold or standardize project structure.

### Reviewer prompts

```text
prompts/reviewer/go-backend-api-standardization-reviewer.md
prompts/reviewer/go-backend-event-driven-standardization-reviewer.md
```

Use these to review existing repositories against standard architecture and naming conventions.

### Workflow prompts

```text
prompts/workflows/manual-subagents-greenfield-development.md
```

Use this to coordinate manual sub-agent style development in pi or another coding agent when building a new application from a PRD.

## Manual sub-agent workflow

The manual sub-agent workflow is for greenfield projects where multiple agent sessions contribute without native sub-agent support.

Core principle:

```text
PRD is direction. Contracts are coordination.
```

Recommended flow:

```text
PRD
  → leader-agent creates acceptance criteria, architecture, contracts, vertical slices
  → slice agents implement against contracts
  → integration-agent assembles slices
  → review agents verify
  → human approves risky/final actions
```

Use prompt:

```text
prompts/workflows/manual-subagents-greenfield-development.md
```

Copy template into target project:

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

Use:

```text
prompts/projects/go-bot-project-standardization.md
```

### Review a Go backend API

Use:

```text
prompts/reviewer/go-backend-api-standardization-reviewer.md
```

### Set up manual sub-agent coordination for new app

1. Put PRD in target repo:

```text
docs/prd.md
```

2. Copy agent-work template:

```bash
cp -r /mnt/f/Documents/_PROJECTS/.standardization/templates/agent-work <target-repo>/docs/agent-work
```

3. Run leader-agent prompt from:

```text
/mnt/f/Documents/_PROJECTS/.standardization/prompts/workflows/manual-subagents-greenfield-development.md
```

## Maintenance notes

- Keep prompts practical and implementation-ready.
- Avoid vague standards that agents cannot verify.
- Prefer explicit folder structures, naming rules, contracts, and acceptance criteria.
- Update this README when adding new standardization areas.
- Version reusable CI workflows with tags before client repositories depend on them.
