# Centralized GitHub Actions

This repository is the centralized source for reusable CI workflows.

## Reusable Workflow Entrypoints

- `.github/workflows/reusable-ci-pr-dotnet.yml`
- `.github/workflows/reusable-docker-publish.yml`
- `.github/workflows/reusable-pr-preview-image.yml`
- `.github/workflows/reusable-semantic-pr.yml`
- `.github/workflows/reusable-tag-and-release.yml`

## Client Repository Usage

In each client repository, keep a thin wrapper workflow in `.github/workflows/` with event triggers and call this repository workflow by tag:

`caesariodito/.standardization/.github/workflows/<workflow-file>@v1`

Use `@v1` for stable major updates. Pin to a commit SHA if you need strict supply-chain control.

Examples live in `ci/examples/client-workflows/`.

## Release Flow for This Central Repo

1. Update reusable workflows in this repository.
2. Tag a release (`v1.0.0`).
3. Move the major pointer tag (`v1`) to the latest `v1.x.y`.
4. Client wrappers continue calling `@v1`.

## Required GitHub Settings

For private repositories, allow Actions reuse access from this repository in organization/repository Actions settings.
