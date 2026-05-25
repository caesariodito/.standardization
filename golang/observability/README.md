# Go observability

> **Status: graduated.** Go is the reference implementation. The shared
> observability module lives in your private library, not here.

## What this directory holds

This is a pointer, not a starter. The other languages (.NET, Python) ship
copy-paste starter files because they haven't been used enough across repos
to justify a shared package yet. Go has — so it lives in a real library.

## Using the Go observability library

Reference the private library in your `go.mod`:

```go
require github.com/<your-org>/observability v0.x.y
```

Initialise at process start:

```go
package main

import (
    "context"

    obs "github.com/<your-org>/observability"
)

func main() {
    ctx := context.Background()
    tel, err := obs.Init(ctx, obs.Config{
        ServiceName:    "orders-service",
        ServiceVersion: version, // injected via -ldflags
        Environment:    env,
        OTLPEndpoint:   otlpEndpoint,
    })
    if err != nil {
        panic(err)
    }
    defer tel.Shutdown(ctx)

    // ... start your server
}
```

Wire the standard endpoints (`/healthz`, `/readyz`, `/version`, `/metrics`)
using whichever HTTP router you use. The library exposes handlers; mount
them in the router of your choice.

## Standard fields enforced

The library configures `slog` so every log line carries:

- `ts`, `level`, `service`, `version`, `env`, `trace_id`, `span_id`,
  `request_id` (when in a request scope), `msg`.

The doctor's `[logging.standard-fields]` rule greps for these field names
in your wiring file. If you wrap or rename, the doctor warns.

## Graduation

Go was promoted from a starter file to this library after 3+ repos used the
same wiring unchanged. .NET and Python should follow the same path:

1. Vendor the starter from `dotnet/observability/Observability.cs` or
   `python/observability/observability.py`.
2. After 3+ repos have used it without meaningful divergence for one
   release cycle, extract to a real package and replace the starter with
   a dependency.
3. The vendored starter then becomes a pointer file like this one.
