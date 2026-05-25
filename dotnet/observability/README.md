# `dotnet/observability/` — starter observability module for .NET 8+ services

> **Status: starter.** Promote to a NuGet package once 3+ repos use this
> unchanged for one release cycle.

## What this provides

Wires up Serilog stdout JSON logging, prometheus-net metrics at `/metrics`,
and OpenTelemetry tracing with the standard resource attributes. Mounts
`/healthz`, `/readyz`, `/version`.

Standard log fields enforced: `ts`, `level`, `service`, `version`, `env`,
`trace_id`, `span_id`, `msg`.

## How to vendor

Copy `Observability.cs` into your service:

```
src/<YourService>/Observability/Observability.cs
```

Adjust the namespace to match your project. Add the required NuGet packages
(listed at the top of the file).

## Usage

In `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.AddOrgObservability(new ObservabilityOptions
{
    ServiceName    = "orders-service",
    ServiceVersion = "1.4.2",
    Environment    = builder.Environment.EnvironmentName,
    OtlpEndpoint   = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"],
});

var app = builder.Build();

app.UseOrgObservability(opts, readinessCheck: async ct =>
{
    // ping db, cache, upstream, etc.
    return true;
});

app.Run();
```

## Graduation

When this file has been copy-pasted unchanged into 3+ repos for one release
cycle, extract it into a published `Org.Observability` NuGet package and
turn this directory into a pointer (the way `golang/observability/` is now).

The graduation rule is in the v2 standard's Section 4
(`templates/agents/AGENTS.md`).
