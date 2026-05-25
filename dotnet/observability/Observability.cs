// Observability.cs
// Starter observability module for .NET 8+ services.
// Vendored from org template; promote to a NuGet package once 3+ repos
// have used this unchanged for a release cycle.
//
// Wires up:
//   - Serilog stdout JSON logging with standard fields
//   - prometheus-net metrics at /metrics
//   - OpenTelemetry tracing (OTLP exporter) with standard resource attrs
//
// NuGet packages required:
//   Serilog.AspNetCore
//   Serilog.Formatting.Compact
//   Serilog.Enrichers.Environment
//   prometheus-net.AspNetCore
//   OpenTelemetry.Extensions.Hosting
//   OpenTelemetry.Instrumentation.AspNetCore
//   OpenTelemetry.Instrumentation.Http
//   OpenTelemetry.Exporter.OpenTelemetryProtocol

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Prometheus;
using Serilog;
using Serilog.Formatting.Compact;

namespace Org.Observability;

public sealed class ObservabilityOptions
{
    public required string ServiceName { get; init; }
    public required string ServiceVersion { get; init; }
    public string Environment { get; init; } = "dev";
    public string? OtlpEndpoint { get; init; } // e.g. http://otel-collector:4317
}

public static class ObservabilityExtensions
{
    /// <summary>
    /// Registers logging, metrics, and tracing with the org standard fields.
    /// Call before <c>builder.Build()</c>.
    /// </summary>
    public static WebApplicationBuilder AddOrgObservability(
        this WebApplicationBuilder builder,
        ObservabilityOptions opts)
    {
        // --- Logging (Serilog, stdout JSON, standard fields) ---
        builder.Host.UseSerilog((ctx, lc) =>
        {
            lc.MinimumLevel.Information()
              .Enrich.FromLogContext()
              .Enrich.WithProperty("service", opts.ServiceName)
              .Enrich.WithProperty("version", opts.ServiceVersion)
              .Enrich.WithProperty("env", opts.Environment)
              .WriteTo.Console(new CompactJsonFormatter());
        });

        // --- Tracing (OTel, OTLP) ---
        builder.Services.AddOpenTelemetry()
            .ConfigureResource(r => r
                .AddService(opts.ServiceName, serviceVersion: opts.ServiceVersion)
                .AddAttributes(new[]
                {
                    new KeyValuePair<string, object>("deployment.environment", opts.Environment),
                }))
            .WithTracing(t =>
            {
                t.AddAspNetCoreInstrumentation()
                 .AddHttpClientInstrumentation();

                if (!string.IsNullOrWhiteSpace(opts.OtlpEndpoint))
                {
                    t.AddOtlpExporter(o => o.Endpoint = new Uri(opts.OtlpEndpoint));
                }
            });

        return builder;
    }

    /// <summary>
    /// Registers /metrics, /healthz, /readyz, /version endpoints.
    /// Call after <c>app.Build()</c>.
    /// </summary>
    public static WebApplication UseOrgObservability(
        this WebApplication app,
        ObservabilityOptions opts,
        Func<CancellationToken, Task<bool>>? readinessCheck = null)
    {
        app.UseSerilogRequestLogging();
        app.MapMetrics(); // /metrics

        app.MapGet("/healthz", () => Results.Ok(new
        {
            status = "ok",
            service = opts.ServiceName,
            version = opts.ServiceVersion,
        }));

        app.MapGet("/version", () => Results.Ok(new
        {
            service = opts.ServiceName,
            version = opts.ServiceVersion,
            env = opts.Environment,
        }));

        app.MapGet("/readyz", async (CancellationToken ct) =>
        {
            var ok = readinessCheck is null || await readinessCheck(ct);
            return ok
                ? Results.Ok(new { status = "ok" })
                : Results.StatusCode(503);
        });

        return app;
    }
}

// Usage in Program.cs:
//
// var builder = WebApplication.CreateBuilder(args);
// builder.AddOrgObservability(new ObservabilityOptions
// {
//     ServiceName = "orders-service",
//     ServiceVersion = ThisAssembly.Git.SemVer.Major + "." +
//                      ThisAssembly.Git.SemVer.Minor + "." +
//                      ThisAssembly.Git.SemVer.Patch,
//     Environment = builder.Environment.EnvironmentName,
//     OtlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"],
// });
//
// var app = builder.Build();
// app.UseOrgObservability(opts, readinessCheck: async ct =>
// {
//     // ping db, cache, etc.
//     return true;
// });
// app.Run();
