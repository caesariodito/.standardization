You are a senior Go platform engineer and observability architect.

Your task is to create a **production-ready Go package project** that implements an organization-wide observability foundation based on the design below.

This is not a toy example. Build it as a real project skeleton with clear module boundaries, compilable code, practical defaults, tests, documentation, and example usage.

## Primary goal

Create a reusable Go observability foundation that standardizes:

* structured logging
* metrics
* trace correlation
* semantic conventions
* redaction and safety controls
* log level / sampling governance
* migration from existing logging libraries
* backend flexibility across OpenTelemetry, Prometheus, Alloy, and stdout

The package must allow all services to depend on one stable internal contract while keeping exporters and collectors replaceable.

## Core design requirements

Implement the project as **one repository with multiple Go modules**.

Recommended repo layout:

```text
github.com/yourorg/observe/
├── docs/
│   ├── architecture.md
│   ├── migration.md
│   ├── semconv.md
│   ├── redaction.md
│   └── metrics-governance.md
├── examples/
│   ├── http-service/
│   ├── worker/
│   └── migration-zap/
├── observe-core/
│   ├── go.mod
│   ├── doc.go
│   ├── provider/
│   ├── logger/
│   ├── metrics/
│   ├── trace/
│   ├── semconv/
│   ├── redact/
│   ├── control/
│   ├── testkit/
│   ├── middleware/
│   └── internal/
├── observe-otel/
│   ├── go.mod
│   ├── provider/
│   ├── resource/
│   ├── logs/
│   ├── metrics/
│   ├── trace/
│   └── bridge/
├── observe-prometheus/
│   ├── go.mod
│   ├── registry/
│   ├── exporter/
│   ├── http/
│   └── bridge/
├── observe-slog/
│   ├── go.mod
│   ├── handler/
│   └── bridge/
└── observe-zap/
    ├── go.mod
    └── bridge/
```

## Architectural rules

Follow these rules strictly:

1. Application code should primarily depend on `observe-core`.
2. `observe-core` should be dependency-light and avoid vendor SDK coupling where practical.
3. OpenTelemetry, Prometheus, slog bridge wiring, and Zap migration support must live in separate modules.
4. Standardize the **contract and semantic conventions**, not the backend vendor.
5. Logging is only one signal; metrics and traces are first-class.
6. Governance is required, not optional:

   * redaction
   * metric cardinality control
   * log level control
   * sampling / burst suppression
7. The project must support gradual adoption and migration.

## What to build

Build the repository with real code, not placeholders.

### 1. `observe-core`

Implement these packages with real public APIs and internal glue:

#### `provider`

Provide a central app-facing provider interface and implementation.

Target shape:

```go
type Provider interface {
    Logger() logger.Logger
    Meter() metrics.Meter
    Tracer() trace.Tracer
    Shutdown(ctx context.Context) error
}
```

Include:

* a default provider implementation
* noop fallbacks
* lifecycle handling
* configuration support

#### `logger`

Implement a structured logger contract:

```go
type Logger interface {
    Debug(msg string, fields ...Field)
    Info(msg string, fields ...Field)
    Warn(msg string, fields ...Field)
    Error(msg string, err error, fields ...Field)

    With(fields ...Field) Logger
    WithContext(ctx context.Context) Logger
    WithGroup(name string) Logger
}
```

Implement:

* levels
* groups
* context enrichment
* error logging
* caller support if appropriate
* serialization helpers

Do **not** expose `type Field = slog.Attr`.

Instead implement something like:

```go
type Field struct {
    Key   string
    Value any
    Kind  Kind
    Meta  Meta
}

type Meta struct {
    Sensitivity Sensitivity
    MetricSafe  bool
    Indexed     bool
}
```

Include constructors such as:

* `String`
* `Int`
* `Bool`
* `Float64`
* `Duration`
* `Time`
* `ErrorField`
* `SensitiveString`

#### `metrics`

Implement a safe metrics abstraction:

* `Meter`
* `Counter`
* `Histogram`
* `Gauge`
* label helpers
* metric spec registration

Enforce metric dimension governance:

* declare dimensions up front
* reject forbidden or high-cardinality labels in strict mode
* support approved-dimension registration

#### `trace`

Implement a lightweight tracing abstraction:

* span start helpers
* correlation helpers
* context propagation helpers
* extraction of trace/span IDs for logs

#### `semconv`

Implement organization semantic conventions as constants and helper sets:

* resource keys
* log field names
* event names
* metric names
* approved metric dimensions
* error classification keys

#### `redact`

Implement first-class redaction:

* sensitivity classes
* denylist for secrets/tokens/passwords/cookies/auth headers
* configurable masking/hashing/drop rules
* final emission safety net

#### `control`

Implement runtime governance controls:

* default log level
* per-component overrides
* reloadable settings where practical
* sampling policy
* burst suppression / duplicate suppression

#### `testkit`

Implement test utilities:

* in-memory log sink
* in-memory metric recorder
* helpers to assert required fields
* helpers to assert metric increments and labels
* semconv validation helpers

#### `middleware`

Implement reusable middleware/interceptors for:

* HTTP
* worker/job processing

HTTP middleware should include:

* request logging
* panic recovery
* latency metric
* in-flight gauge
* request ID extraction/generation
* trace correlation
* redacted request metadata

Worker middleware should include:

* job lifecycle logs
* retry fields
* duration metrics
* correlation propagation

### 2. `observe-slog`

Build a real bridge/handler so the core logging model can interoperate with `log/slog`.

Requirements:

* convert core `Field` values to `slog.Attr`
* allow structured output
* support context enrichment
* preserve room for redaction and policy enforcement
* provide an example of adopting it in a service

### 3. `observe-zap`

Build a migration bridge for existing Zap-based services.

Requirements:

* adapter or bridge for gradual migration
* examples showing how a service can keep Zap temporarily while adopting core semantics and fields
* document limitations clearly

### 4. `observe-prometheus`

Build Prometheus integration with:

* registry setup
* HTTP exporter `/metrics`
* mapping from approved metric specs to Prometheus collectors
* example service wiring

Strictly enforce label safety rules from core.

### 5. `observe-otel`

Build OpenTelemetry integration with:

* provider wiring
* OTLP export support
* trace provider
* metric provider
* optional logs bridge if practical, but do not make app code depend on OTel logs SDK directly
* resource detection enrichment
* correlation of trace IDs into logs

Use explicit config plus runtime resource detection:

* explicit config is authoritative for service identity
* runtime detectors enrich with host/container/k8s/cloud metadata where available

## Documentation to generate

Create strong docs in `/docs`:

### `architecture.md`

Explain:

* overall architecture
* why core is thin
* why integrations are split
* how collectors like Alloy fit in
* why apps should not directly depend on vendor SDKs

### `migration.md`

Explain a phased migration path:

1. logging-first adoption
2. middleware rollout
3. metrics standardization
4. tracing standardization
5. governance tightening

Include migration examples from:

* plain `slog`
* Zap

### `semconv.md`

Document all standard keys and naming guidance.

### `redaction.md`

Document:

* sensitivity classes
* forbidden data
* body logging policy
* recommended defaults

### `metrics-governance.md`

Document:

* approved labels
* forbidden labels
* cardinality rules
* naming conventions
* examples of good and bad instrumentation

## Examples to generate

Create runnable examples in `/examples`:

### `http-service`

A small HTTP service showing:

* provider bootstrap
* request middleware
* logs with trace correlation
* metrics
* graceful shutdown

### `worker`

A background worker example showing:

* job lifecycle logs
* retry behavior
* duration metrics
* trace/log correlation

### `migration-zap`

A service that demonstrates gradual migration from Zap to the new foundation.

## Implementation details and quality bar

The project must be:

* idiomatic Go
* organized for maintainability
* runnable
* easy to extend
* not overengineered

Also:

* include tests for all core packages
* include at least one integration-style test for middleware
* include sensible defaults and no-op behavior
* avoid giant god-packages
* keep public interfaces small
* keep comments and docs useful

## Governance and safety requirements

These requirements are mandatory:

### Redaction

Build safe-by-default redaction.
Never log:

* auth tokens
* passwords
* secrets
* cookies
* API keys
* raw sensitive headers

Mask, hash, or drop sensitive values according to policy.

### Metric cardinality

Prevent unsafe metrics usage.
Do not allow these as labels by default:

* request_id
* trace_id
* user_id
* session_id
* email
* raw_path
* arbitrary UUIDs

Allow examples such as:

* method
* route template
* status_class
* operation
* result
* dependency

### Log volume control

Implement:

* sampling support for high-volume info/debug logs
* duplicate or burst suppression for repeated errors
* dynamic or configurable log levels

### Error handling

Implement a stable error logging policy:

* structured error fields
* causal chain support if practical
* stack trace capture strategy or integration
* configurable capture behavior

## Preferred developer experience

The end-state API should feel like this:

```go
p := provider.New(cfg)

log := p.Logger().With(
    logger.String("component", "http"),
)

ctx, span := p.Tracer().Start(ctx, semconv.HTTPServerRequest)
defer span.End()

log.WithContext(ctx).Info("request started",
    logger.String("http.route", "/orders/{id}"),
)

reqs := p.Meter().Counter(semconv.HTTPRequestsTotal)
reqs.Add(ctx, 1,
    metrics.Label("method", "GET"),
    metrics.Label("route", "/orders/{id}"),
    metrics.Label("status_class", "2xx"),
)
```

The developer should not need to care whether the backend is:

* stdout
* OpenTelemetry OTLP
* Prometheus
* Alloy pipeline

## Output requirements

Produce the result as if you are creating the actual repository.

I want:

1. the full repository tree
2. all important source files with real code
3. `go.mod` files for each module
4. tests
5. docs
6. runnable examples
7. any setup instructions needed
8. a short explanation of design decisions where useful

Do not stop at a high-level design. Implement the working project skeleton.

If you need to make tradeoffs, choose the most practical and maintainable option and state the tradeoff briefly.

Prefer a solid, usable v1 implementation of this v2 architecture over a huge but half-finished design.

When in doubt:

* keep the core contract thin
* push vendor-specific logic into integration modules
* enforce safety and governance in core
* optimize for adoption across many services
