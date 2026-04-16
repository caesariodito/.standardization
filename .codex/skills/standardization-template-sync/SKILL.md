---
name: standardization-template-sync
description: Apply and sync a canonical repository standardization template by copying `.codex/`, `AGENTS.md`, and `RTK.md` into target repositories with safe merge behavior. Use when bootstrapping a new repo with Codex/RTK/caveman conventions, or when propagating updates from `/mnt/f/Documents/_PROJECTS/.standardization` to other repos.
---

# Standardization Template Sync

## Overview

Apply a baseline Codex configuration from a template repo into a destination repo, without clobbering existing repo-specific instructions by default.

## Workflow

1. Confirm source template path and target repository path.
2. Run `scripts/apply_template.sh` with `--dry-run` first.
3. Run again without `--dry-run` to apply.
4. Review resulting files and report what was copied, merged, or skipped.

## Commands

Use the script for deterministic behavior:

```bash
scripts/apply_template.sh /path/to/target-repo --dry-run
scripts/apply_template.sh /path/to/target-repo
```

Override the source template path when needed:

```bash
scripts/apply_template.sh /path/to/target-repo --template /path/to/template-repo
```

If `RTK.md` exists and differs, preserve by default. Overwrite only when explicitly requested:

```bash
scripts/apply_template.sh /path/to/target-repo --force-rtk
```

## Behavior Rules

- Merge `.codex/` recursively from template into target.
- Copy `AGENTS.md` when missing.
- Append `@RTK.md` to existing `AGENTS.md` only if not already present.
- Copy `RTK.md` when missing.
- Preserve existing differing `RTK.md` unless `--force-rtk` is provided.

## Reference

Read `references/template-layout.md` when needing exact source layout and file expectations.
