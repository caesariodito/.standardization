# `python/observability/` — starter observability module for Python 3.11+ services

> **Status: starter.** Promote to a PyPI package once 3+ repos use this
> unchanged for one release cycle.

## What this provides

Wires up structlog stdout JSON logging, prometheus_client metrics at
`/metrics`, and OpenTelemetry tracing with the standard resource attributes.
Mounts `/healthz`, `/readyz`, `/version` for FastAPI / Starlette apps; for
other frameworks, copy the handlers and adapt.

Standard log fields enforced: `ts`, `level`, `service`, `version`, `env`,
`trace_id`, `span_id`, `msg`.

## How to vendor

Copy `observability.py` into your service:

```
src/<your_service>/observability/__init__.py
```

Or keep it as `observability.py` next to your app entrypoint. Add the
required pip packages (listed at the top of the file).

## Usage

```python
from fastapi import FastAPI
from observability import init, ObservabilityConfig, mount_endpoints

cfg = ObservabilityConfig(
    service_name="orders-service",
    service_version="1.4.2",
    environment="dev",
    otlp_endpoint="http://otel-collector:4317",
)
init(cfg)

app = FastAPI()
mount_endpoints(app, cfg, readiness_check=lambda: True)
```

## Graduation

When this file has been copy-pasted unchanged into 3+ repos for one release
cycle, extract it into a published `org-observability` PyPI package and turn
this directory into a pointer (the way `golang/observability/` is now).

The graduation rule is in the v2 standard's Section 4
(`templates/agents/AGENTS.md`).
