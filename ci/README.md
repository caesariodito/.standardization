# Centralized GitHub Actions

This repository is the centralized source for reusable CI workflows.

## Reusable Workflow Entrypoints

- `.github/workflows/reusable-ci-pr-dotnet.yml`
- `.github/workflows/reusable-ci-pr-go.yml`
- `.github/workflows/reusable-docker-publish.yml`
- `.github/workflows/reusable-pr-preview-image.yml`
- `.github/workflows/reusable-semantic-pr.yml`
- `.github/workflows/reusable-tag-and-release.yml`

## Client Repository Usage

In each client repository, keep a thin wrapper workflow in `.github/workflows/` with event triggers and call this repository workflow by tag:

`caesariodito/.standardization/.github/workflows/<workflow-file>@v1`

Use `@v1` for stable major updates. Pin to a commit SHA if you need strict supply-chain control.

Examples live in `ci/examples/client-workflows/`.

Client setup guide:

- `ci/client-repository-guide.md`

## Go Private Modules

Go repositories that import private modules can opt in with:

```yaml
with:
  private_modules_pattern: github.com/deccara-tech/*
secrets:
  GH_PRIVATE_MODULES_TOKEN: ${{ secrets.GH_PRIVATE_MODULES_TOKEN }}
```

`GH_PRIVATE_MODULES_TOKEN` should be provided by the consuming repository or organization, not by this standardization repository. Use a fine-grained token or GitHub App token with read-only access to required private repositories.

Docker workflows also accept optional `GH_PRIVATE_MODULES_TOKEN` for builds that need private modules during `docker build`.

## Release Flow for This Central Repo

1. Update reusable workflows in this repository.
2. Tag a release (`v1.0.0`).
3. Move the major pointer tag (`v1`) to the latest `v1.x.y`.
4. Client wrappers continue calling `@v1`.

## Required GitHub Settings

For private repositories, allow Actions reuse access from this repository in organization/repository Actions settings.
