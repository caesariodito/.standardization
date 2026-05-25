# AGENTS.md

> Agent rules for working **on this repository itself**.
>
> This is the canonical source of the standardization that consuming repos
> vendor. The vendored template lives at `templates/agents/AGENTS.md` and is
> a separate file with a different audience (developers in client repos).
> Do not conflate them.

This repo follows the global routing in `~/.pi/agent/AGENTS.md`. Repo
metadata and opt-outs live in [`agents.config.yml`](./agents.config.yml).

## Working on this repo

Common tasks fall into four shapes:

1. **Editing the vendored template** (`templates/agents/AGENTS.md` and
   siblings). Every change here lands in every consumer on the next standard
   bump. Be deliberate. Keep rule slugs stable.
2. **Editing the rule registry** (`tools/agents-doctor/internal/rules/`).
   New rules ship at `warn` first, promote to `error` after a clean run
   across consumers.
3. **Editing reusable workflows** (`.github/workflows/reusable-*.yml`).
   Tag-pinned by consumers (`@v2`); breaking changes require a major bump.
4. **Editing language standards** (`golang/`, `dotnet/`, `python/`).
   Per-language README + observability starter (or pointer for graduated
   libraries).

## House rules

- Operating principles from the v2 base (Section 1 of `templates/agents/AGENTS.md`)
  apply to changes here too — surgical, simplicity-first, clean own mess,
  verify, match style, no destructive ops without confirmation.
- Rule slugs are public API. Renaming a slug is a breaking change.
- The vendored template's `@`-includes (e.g. `@docs/agents/principles.md`)
  refer to **client repo** paths, not this repo's paths. They are literal
  hints for agents in consumer repos. Do not try to make them resolve here.
- When in doubt, run `agents-doctor --target templates/agents/` to dry-run
  the template against the current rule set.

## Releasing

1. Land changes on a feature branch.
2. Open PR. CI runs the doctor against the template + a sample client
   config to catch breakage.
3. On merge to `main`, tag a release:
   - `vX.Y.Z` patch — typo, copy edit, doctor bug fix.
   - `vX.Y.0` minor — new rule (ships at `warn`), new section in template.
   - `vX.0.0` major — breaking change (rule renamed/removed, semantic shift).
4. The sync-bot (`.github/workflows/sync-standard.yml`) fans out adoption
   PRs to consumers tagged with `caesariodito-standard`.

## CI for client repos

Consuming repos call reusable workflows by tag:

```yaml
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-go.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-dotnet.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-python.yml@v2
uses: caesariodito/.standardization/.github/workflows/reusable-agents-doctor.yml@v2
```

See `ci/client-repository-guide.md` for wrapper examples.
