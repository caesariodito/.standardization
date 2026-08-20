# Client Repository CI Guide

Use this guide when a client repository wants to consume reusable workflows from:

```text
caesariodito/.standardization
```

## Required setup

Create thin wrapper workflows in the client repository under:

```text
.github/workflows/
```

Each wrapper calls a reusable workflow by tag:

```yaml
uses: caesariodito/.standardization/.github/workflows/<workflow-file>@v1
```

Use `@v1` for stable major updates. Pin to a full commit SHA when strict reproducibility is required.

## Engineering agent harness pilot (`@v2` only)

The agent harness is a one-repository pilot and is not installed by the
sync-bot. Copy these files manually:

```text
templates/workflows/agent-plan.yml      -> .github/workflows/agent-plan.yml
templates/workflows/agent-implement.yml -> .github/workflows/agent-implement.yml
```

Create all trigger/state labels and configure the ephemeral runner, 9Router,
Infisical OIDC, and GitHub App prerequisites in `harness/README.md`. Required
repository/organization variables include `AI_PLANNER_RUNNER_LABEL`,
`AI_IMPLEMENTER_RUNNER_LABEL`, `NINE_ROUTER_BASE_URL`, `AI_GITHUB_APP_ID`,
`AI_INFISICAL_IDENTITY_ID`, `AI_INFISICAL_PROJECT_ID`,
`AI_INFISICAL_ENVIRONMENT`, and `AI_INFISICAL_APP_PRIVATE_KEY_SECRET`; provide `NINE_ROUTER_API_KEY` as a secret.

The caller templates grant Planner `contents: read, issues: write`. Implementer
also grants `id-token: write`, used only by the isolated publication job after
approval/drift checks and model execution. Do not add deployment/environment
permissions. Treat `AI_IMPLEMENTER_CHECK_COMMAND` as trusted workflow
configuration, never issue content.

The harness uses mutable `@v2` for fast pilot updates and records its resolved
SHA. Protect tag movement and retain the prior SHA for rollback, or replace
`@v2` with a full SHA when strict reproducibility is required. Complete the
3–5 issue scorecard before wider adoption.

## Available reusable workflows

```text
reusable-ci-pr-go.yml
reusable-ci-pr-dotnet.yml
reusable-docker-publish.yml
reusable-pr-preview-image.yml
reusable-semantic-pr.yml
reusable-tag-and-release.yml
```

Example wrappers live in:

```text
ci/examples/client-workflows/
```

## Recommended client workflow files

Typical service repository:

```text
.github/workflows/ci-pr.yml
.github/workflows/semantic-pr.yml
.github/workflows/tag-and-release.yml
.github/workflows/docker-publish.yml
.github/workflows/pr-preview-image.yml
```

Use only the workflows needed by the repository.

## Go CI

Public Go repo:

```yaml
name: CI PR (Go)

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read

jobs:
  ci:
    uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-go.yml@v1
    with:
      go_version_file: go.mod
      fmt_directories: cmd internal test
      go_test_command: go test ./...
      go_build_command: go build ./...
```

Go repo with private Deccara modules:

```yaml
name: CI PR (Go)

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read

jobs:
  ci:
    uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-go.yml@v1
    with:
      go_version_file: go.mod
      private_modules_pattern: github.com/deccara-tech/*
      fmt_directories: cmd internal test
      go_test_command: go test ./...
      go_build_command: go build ./...
    secrets:
      GH_PRIVATE_MODULES_TOKEN: ${{ secrets.GH_PRIVATE_MODULES_TOKEN }}
```

Or use organization/repository secret inheritance:

```yaml
    secrets: inherit
```

## Private Go module token

`GH_PRIVATE_MODULES_TOKEN` must be configured in the consuming repository or organization.

Recommended token:

- fine-grained PAT or GitHub App token
- read-only access to required private repositories
- minimum permissions:
  - Contents: Read
  - Metadata: Read

Do not store Deccara private tokens in `caesariodito/.standardization`.

## .NET CI

```yaml
name: CI PR (.NET)

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read

jobs:
  ci:
    uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-dotnet.yml@v1
    with:
      solution_path: ApiSurveyor.sln
      dotnet_version: 8.0.x
      configuration: Release
      run_tests: true
```

## Semantic PR title

```yaml
name: Semantic PR Title

on:
  pull_request_target:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read
  pull-requests: read
  statuses: write

jobs:
  semantic:
    uses: caesariodito/.standardization/.github/workflows/reusable-semantic-pr.yml@v1
```

## Tag and release

```yaml
name: Tag and Release

on:
  pull_request:
    types: [closed]
  push:
    tags:
      - "v*"

permissions:
  contents: write
  pull-requests: read

jobs:
  release:
    uses: caesariodito/.standardization/.github/workflows/reusable-tag-and-release.yml@v1
    with:
      main_branch: main
      tag_prefix: v
      changelog_file: CHANGELOG.md
      update_changelog: true
      create_release: true
```

## Docker publish

```yaml
name: Docker Publish

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:
    inputs:
      version:
        description: "Image version/tag (example: v1.2.3)"
        required: false
        default: ""

permissions:
  contents: read
  packages: write

jobs:
  publish:
    uses: caesariodito/.standardization/.github/workflows/reusable-docker-publish.yml@v1
    with:
      image_name: my-service
      dockerfile: ./Dockerfile
      context: .
      version: ${{ github.event.inputs.version || '' }}
      publish_latest_on_stable: true
    secrets: inherit
```

For Docker builds that need private Go modules, ensure `GH_PRIVATE_MODULES_TOKEN` is inherited or explicitly mapped.

## PR preview image

```yaml
name: PR Preview Image

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  packages: write
  pull-requests: write

jobs:
  preview:
    uses: caesariodito/.standardization/.github/workflows/reusable-pr-preview-image.yml@v1
    with:
      image_name: my-service
      dockerfile: ./Dockerfile
      context: .
      comment_on_pr: true
    secrets: inherit
```

## Release/tag convention

This standardization repository uses semver tags:

```text
v1.0.0
v1.0.1
v1.0.2
v1.0.3
```

And a moving major tag:

```text
v1
```

Client repositories should usually reference:

```text
@v1
```

After publishing a new compatible release:

```bash
git tag v1.0.1
git tag -f v1 v1.0.1
git push origin v1.0.1
git push origin v1 --force
```

Use a new major tag, such as `v2`, for breaking workflow input/behavior changes.

## GitHub settings checklist

For private repositories/orgs:

- allow reusable workflow access from `caesariodito/.standardization`
- configure `GH_PRIVATE_MODULES_TOKEN` if private Go modules are imported
- allow `GITHUB_TOKEN` write permissions where needed:
  - release tags
  - changelog commits
  - PR comments
  - GHCR package publishing

## Common mistakes

- referencing `deccara-tech/.standardization` after migration
- forgetting `private_modules_pattern` for private Go modules
- missing `GH_PRIVATE_MODULES_TOKEN`
- insufficient workflow permissions in caller
- forgetting to move `v1` after a new stable release
