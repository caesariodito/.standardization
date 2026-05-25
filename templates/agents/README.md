# `templates/agents/` — the vendored standardization template

This is the canonical AGENTS.md template that consuming repositories vendor.
The sync-bot copies these files into client repos when the standard bumps.

## What's in here

| File | Goes to | Notes |
|---|---|---|
| `AGENTS.md` | `<repo>/AGENTS.md` | The base template. Vendored, not edited per repo. |
| `agents.config.example.yml` | `<repo>/agents.config.yml` | Per-repo config. Edited per repo. |
| `agents.config.v1.schema.json` | (validated by doctor) | JSON Schema for the config above. |
| `optouts.example.yml` | optional, merged into `agents.config.yml` | Example of the `optouts:` section. |
| `api-contract.example.md` | `<repo>/api-contract.md` (API repos only) | Source of truth for endpoint semantics. |
| `docs/prd-skeleton.md` | `<repo>/docs/prd/<NNNN>-<slug>.md` | New PRD starter. |
| `docs/adr-skeleton.md` | `<repo>/docs/adr/<NNNN>-<slug>.md` | New ADR starter. |
| `docs/sop-skeleton.md` | `<repo>/docs/sop/<NNNN>-<slug>.md` | New SOP starter. |

## How adoption works

1. A consumer repo adds the GitHub topic `caesariodito-standard`.
2. The sync-bot (`.github/workflows/sync-standard.yml` in this repo) opens an
   adoption PR on tag pushes, copying `AGENTS.md` and the example configs.
3. The repo owner edits `agents.config.yml` for repo-specific values
   (`kind`, `language`, `owners`, `optouts`, etc.).
4. `agents-doctor` runs in CI on every PR; it parses `agents.config.yml`
   and applies the rule registry (45 rules, kind-aware).

## How to update the template

1. Edit `AGENTS.md` here.
2. Open a PR. CI runs `agents-doctor` against the template itself plus a
   sample client config to catch breakage.
3. On merge to `main`, tag a new release (`v2.x.y`).
4. The bot fans out adoption PRs to consumer repos. Auto-merge respects each
   consumer's `standard.auto_merge` setting in `agents.config.yml`.

## Local override files

Consuming repos extend (not replace) sections by creating files referenced via
`@`-includes in `AGENTS.md`. Override files live in `<repo>/docs/agents/`:

```
docs/agents/
├── principles.md
├── skills.md
├── healthz.md
├── observability.md
├── api-contract.md
├── bruno.md
├── ci.md
├── docs.md
├── secrets.md
├── readme.md
└── doctor-overrides.md
```

Append/extend semantics: base sections in `AGENTS.md` are always in force.
Override files **add** to them. To turn off a base rule, list its slug in
`agents.config.yml` under `optouts:` with a reason and an `expires` date.
