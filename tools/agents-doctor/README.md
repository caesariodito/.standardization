# `tools/agents-doctor/`

Go CLI that validates a repository against the v2 standard's rule registry.

## Status

**Scaffold.** The rule registry (`internal/rules/registry.go`) declares all 45
rules with their slugs, severity, and kind-applicability. Per-rule `Check`
implementations land in follow-up PRs grouped by rule family (one PR per
group: healthz, secrets, api-contract, etc.).

## Build

```bash
go build -o ./bin/agents-doctor ./cmd/agents-doctor
./bin/agents-doctor --version
```

## Usage

```bash
agents-doctor                  # check current dir
agents-doctor --target ./svc   # check a different dir
agents-doctor --json           # JSON output for CI
agents-doctor --verbose        # include info findings
```

## Distribution

Per Q9, `goreleaser` will publish:

- A native binary on GitHub Releases for Linux/macOS/Windows × amd64/arm64.
- A Docker image at `ghcr.io/caesariodito/agents-doctor:vX.Y.Z`.

Both are produced from the same release pipeline (`.github/workflows/release-doctor.yml`,
to be added in a follow-up).

## Architecture

```
tools/agents-doctor/
├── cmd/agents-doctor/main.go      # CLI entrypoint
├── internal/
│   ├── rules/                     # rule registry + per-group Check funcs
│   │   ├── registry.go            # canonical list of 45 rules
│   │   ├── healthz.go             # (TBD) Check funcs for healthz.* slugs
│   │   ├── secrets.go             # (TBD)
│   │   ├── api_contract.go        # (TBD)
│   │   ├── bruno.go               # (TBD)
│   │   ├── ci.go                  # (TBD)
│   │   ├── docs.go                # (TBD)
│   │   └── readme.go              # (TBD)
│   ├── config/                    # agents.config.yml parsing + JSON Schema validation
│   ├── plugin/                    # local YAML plugin slot for repo-specific rules
│   └── report/                    # human + JSON output formatters
├── go.mod
└── README.md
```

## Severity model

| Level | Behaviour |
|---|---|
| `error` | Fails CI. Always reported. |
| `warn`  | Reported, doesn't fail CI. |
| `info`  | Hidden by default, surfaced with `--verbose`. |

New rules ship at `warn` first. Promote to `error` after one bump cycle of
clean runs across consumers.

## Rule slug convention

`<group>.<rule-name>`, lowercase kebab. Examples:

- `healthz.liveness`
- `secrets.no-env-files`
- `api-contract.bruno-coverage`

Slugs are public API. Renaming a slug is a breaking change in the standard.
