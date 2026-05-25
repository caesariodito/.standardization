"""
Starter observability module for Python 3.11+ services.

Vendored from org template; promote to a PyPI package once 3+ repos
have used this unchanged for a release cycle.

Wires up:
  - structlog stdout JSON logging with standard fields
  - prometheus_client metrics at /metrics
  - OpenTelemetry tracing (OTLP exporter) with standard resource attrs

Pip packages required:
    structlog
    prometheus-client
    opentelemetry-sdk
    opentelemetry-exporter-otlp
    opentelemetry-instrumentation-fastapi   # or your framework
    opentelemetry-instrumentation-requests

Usage (FastAPI example):

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
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import dataclass
from typing import Callable, Optional

import structlog
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

_START_TIME = time.time()


@dataclass(frozen=True)
class ObservabilityConfig:
    service_name: str
    service_version: str
    environment: str = "dev"
    otlp_endpoint: Optional[str] = None
    log_level: str = "INFO"


def init(cfg: ObservabilityConfig) -> None:
    """Configure structlog + OTel. Call once at process start."""
    _init_logging(cfg)
    _init_tracing(cfg)


def _init_logging(cfg: ObservabilityConfig) -> None:
    level = getattr(logging, cfg.log_level.upper(), logging.INFO)
    logging.basicConfig(format="%(message)s", level=level)

    def _add_standard_fields(_, __, event_dict):
        event_dict.setdefault("service", cfg.service_name)
        event_dict.setdefault("version", cfg.service_version)
        event_dict.setdefault("env", cfg.environment)

        span = trace.get_current_span()
        ctx = span.get_span_context() if span else None
        if ctx and ctx.is_valid:
            event_dict.setdefault("trace_id", format(ctx.trace_id, "032x"))
            event_dict.setdefault("span_id", format(ctx.span_id, "016x"))
        return event_dict

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", key="ts"),
            _add_standard_fields,
            structlog.processors.EventRenamer("msg"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def _init_tracing(cfg: ObservabilityConfig) -> None:
    resource = Resource.create({
        "service.name": cfg.service_name,
        "service.version": cfg.service_version,
        "deployment.environment": cfg.environment,
    })
    provider = TracerProvider(resource=resource)

    endpoint = cfg.otlp_endpoint or os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if endpoint:
        provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=endpoint, insecure=True))
        )

    trace.set_tracer_provider(provider)


def mount_endpoints(
    app,
    cfg: ObservabilityConfig,
    readiness_check: Optional[Callable[[], bool]] = None,
) -> None:
    """
    Mount /healthz, /readyz, /version, /metrics on a FastAPI/Starlette app.
    For other frameworks, copy the handlers and adapt.
    """
    from fastapi import Response  # local import; framework is optional

    @app.get("/healthz")
    def healthz():
        return {
            "status": "ok",
            "service": cfg.service_name,
            "version": cfg.service_version,
            "uptime_s": int(time.time() - _START_TIME),
        }

    @app.get("/version")
    def version():
        return {
            "service": cfg.service_name,
            "version": cfg.service_version,
            "env": cfg.environment,
        }

    @app.get("/readyz")
    def readyz():
        ok = readiness_check() if readiness_check else True
        return Response(
            content='{"status":"ok"}' if ok else '{"status":"down"}',
            status_code=200 if ok else 503,
            media_type="application/json",
        )

    @app.get("/metrics")
    def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
