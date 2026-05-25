# Python API project standardization

> Conventions for Python (3.11+) HTTP API services. Web framework agnostic
> in principle; FastAPI examples shown because that's the common shape.

## Layout

```
<service>/
├── AGENTS.md                              # vendored from .standardization/templates/agents
├── agents.config.yml                      # repo-specific config
├── README.md
├── CHANGELOG.md
├── api-contract.md                        # source of truth for API intent
├── api/
│   └── bruno/                             # executable examples
├── docs/
│   ├── prd/
│   ├── adr/
│   └── sop/
├── src/
│   └── <service_pkg>/
│       ├── __init__.py
│       ├── main.py                        # entrypoint, wires AddOrgObservability equivalent
│       ├── observability/
│       │   └── __init__.py                # vendored from .standardization/python/observability
│       ├── api/                           # route handlers
│       ├── domain/                        # business logic
│       └── adapters/                      # db, http clients, etc.
├── tests/
├── pyproject.toml
└── .github/workflows/
    ├── ci.yml                             # wraps reusable Python CI workflow
    ├── release.yml
    ├── deploy.yml
    └── agents-doctor.yml                  # wraps reusable agents-doctor workflow
```

## Tooling baseline

| Concern | Choice |
|---|---|
| Python version | 3.11+ |
| Package manager | `uv` or `poetry` (pick one per repo, document in README) |
| Web framework | FastAPI (default) |
| Logger | structlog JSON (via `python/observability/`) |
| Metrics | prometheus_client (via `python/observability/`) |
| Tracing | OpenTelemetry SDK + OTLP exporter (via `python/observability/`) |
| Linter | ruff |
| Type checker | mypy or pyright (pick one per repo) |
| Test runner | pytest |
| Secret scanner | gitleaks (CI step, separate from agents-doctor) |

## Required endpoints

Per the v2 standard's Section 3:

- `GET /healthz` — liveness, no dep checks.
- `GET /readyz` — readiness, allowed to hit deps.
- `GET /version` — service identity, no dep checks.
- `GET /metrics` — Prometheus exposition format.

All four are mounted by `observability.mount_endpoints(app, cfg, readiness_check=...)`.

## Required logging fields

Every log line carries: `ts`, `level`, `service`, `version`, `env`,
`trace_id`, `span_id`, `request_id` (when in a request scope), `msg`.

`observability.init(cfg)` configures structlog to add these automatically.

## Configuration

Read configuration from environment variables. Use Pydantic Settings or
a similar typed-config library. Standard env vars:

- `SERVICE_NAME`, `SERVICE_VERSION`, `ENVIRONMENT`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `LOG_LEVEL`
- service-specific vars beyond these are repo's call

Local dev uses `.env.local` (gitignored), refreshed via `infisical export`.
See Section 9 of the AGENTS.md template.

## CI workflow

Wrap the reusable workflow:

```yaml
# .github/workflows/ci.yml
name: ci
on: [pull_request, push]
jobs:
  ci:
    uses: caesariodito/.standardization/.github/workflows/reusable-ci-pr-python.yml@v2
    with:
      python_version: "3.12"
```

## Doctor compliance

The 45-rule registry applies to Python repos with these kind-aware tweaks:

- `kind: service` enables healthz, observability, secrets, ci checks.
- `api.is_api: true` enables api-contract.md and bruno checks.
- `language: py` lets the doctor look for the right wiring file
  (`src/<pkg>/observability/__init__.py` or `observability.py`) when checking
  `[logging.standard-fields]`.
