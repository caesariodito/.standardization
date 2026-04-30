Role: You are an expert Go software architect specializing in hexagonal architecture, asynchronous systems, and transport-agnostic bot platforms.

Objective:
Scaffold a production-minded Golang boilerplate repository for a multi-channel bot platform with strict architecture and naming standardization.

This repository must NOT be “a WhatsApp bot repo”.
It must be a transport-agnostic bot platform where WhatsApp is only one adapter, and specifically where `aldinokemal/go-whatsapp-web-multidevice` (GOWA) is treated as a replaceable transport gateway adapter, not as the shape of the system.

The goal is to generate a clean, scalable starter repository structure, starter code, interfaces, package boundaries, minimal wiring, one real end-to-end vertical slice, and documentation that enforce standardization.

==================================================
ARCHITECTURAL PRINCIPLES
==================================================

Follow these principles strictly:

1. Use Hexagonal / Ports-and-Adapters architecture.
2. Enforce Dependency Inversion strictly.
3. `internal/core` must not import anything from `internal/app`, `internal/adapters`, or provider-specific code.
4. `internal/app` may depend on `internal/core` and `internal/transport`, but must not depend on provider DTOs.
5. Provider-specific logic must stay at the edges in adapters.
6. GOWA must be integrated as a replaceable WhatsApp transport adapter under a provider-specific package.
7. Canonical internal event/message contracts must be defined independently of any client/provider.
8. Package naming must be explicit and responsibility-based.
9. Avoid junk-drawer packages like generic `utils`, `helpers`, or vague `services`.
10. Avoid using `pkg/` unless something is truly intended for external reuse. Prefer `internal/`.
11. Repository should be easy to extend later for Discord, Slack, and other transports.
12. The HTTP server should stay thin; business execution should happen asynchronously in the worker by default.

==================================================
TARGET REPOSITORY STRUCTURE
==================================================

Generate the repository using this structure as the source of truth:

.
├── cmd/
│   ├── bot-server/         # HTTP server: webhooks, internal API, health
│   └── worker/             # Async jobs, AI tasks, media processing, retries
│
├── internal/
│   ├── core/
│   │   ├── domain/         # Canonical entities and value objects
│   │   └── ports/          # Interfaces: Messenger, repositories, queue, AI, logger
│   │
│   ├── app/
│   │   ├── usecase/        # Ingest event, handle message, send reply, etc.
│   │   ├── workflow/       # Stateful conversation flows
│   │   ├── policy/         # Auth, limits, feature flags
│   │   └── shared/         # App-level context/errors only
│   │
│   ├── adapters/
│   │   ├── primary/
│   │   │   └── http/
│   │   │       ├── webhook/
│   │   │       ├── api/
│   │   │       ├── health/
│   │   │       └── middleware/
│   │   │
│   │   └── secondary/
│   │       ├── messaging/
│   │       │   ├── whatsapp/
│   │       │   │   └── gowa/
│   │       │   └── discord/
│   │       ├── persistence/
│   │       │   └── postgres/
│   │       ├── queue/
│   │       │   └── asynq/
│   │       └── ai/
│   │
│   ├── platform/
│   │   ├── config/
│   │   ├── bootstrap/
│   │   ├── db/
│   │   ├── cache/
│   │   └── observability/
│   │
│   └── transport/
│       ├── event/          # Canonical inbound/outbound event contracts
│       └── message/        # Canonical message model
│
├── test/
│   ├── integration/
│   ├── contract/
│   └── fixtures/
│
├── docker-compose.yml
├── Makefile
├── go.mod
└── README.md

==================================================
HIGH-LEVEL EXECUTION MODEL
==================================================

Use this execution model as the default design:

Inbound flow:
Webhook -> Transformer -> Queue.Push

Processing flow:
Worker -> UseCase -> policy/workflow/routing -> optional AI -> Messenger.Send

Important constraints:
- `bot-server` should primarily receive webhooks, transform provider payloads into canonical internal events, and enqueue work.
- `worker` should execute the main business logic.
- Do not force every path through AI. AI should be optional depending on use case.
- Keep one real vertical slice implemented end-to-end: async ping-pong.

==================================================
WHAT TO GENERATE
==================================================

Generate a complete starter repository with:

1. Folder structure and starter files.
2. `go.mod`.
3. Minimal runnable `cmd/bot-server/main.go`.
4. Minimal runnable `cmd/worker/main.go`.
5. Canonical transport contracts.
6. Core ports/interfaces.
7. App use case skeletons.
8. Workflow skeletons.
9. HTTP webhook entrypoint skeleton.
10. GOWA adapter skeleton.
11. Postgres adapter skeleton.
12. Asynq adapter skeleton.
13. AI adapter skeleton.
14. Config/bootstrap skeleton.
15. Observability/logging skeleton.
16. Graceful shutdown in both binaries.
17. Example tests.
18. README documenting the architecture, boundaries, conventions, extension rules, and local development.
19. `docker-compose.yml` including bot-server, worker, gowa, redis, postgres.
20. `Makefile` with common dev commands.

Do NOT generate a fake-complete business implementation.
Generate a real boilerplate with enough structure and stubs to be a standardization foundation.

==================================================
BOUNDARIES AND RULES
==================================================

Enforce these codebase rules:

1. `internal/core/domain` contains canonical entities/value objects only.
2. `internal/core/ports` contains interfaces only.
3. `internal/app/usecase` contains orchestration use cases.
4. `internal/app/workflow` contains stateful, multi-step flow skeletons.
5. `internal/app/policy` contains authorization/rate-limit/feature flag policies.
6. `internal/adapters/primary/http` handles inbound HTTP only.
7. `internal/adapters/secondary` contains all outbound/infrastructure-facing implementations.
8. `internal/platform` contains runtime/bootstrap/config/db/cache/observability setup.
9. `internal/transport` contains canonical inbound/outbound event/message contracts.
10. Provider DTOs must remain local to the adapter package.
11. App and core layers must never import GOWA/provider-specific DTO packages.
12. No `pkg/utils`, no global junk drawer.
13. No direct dependency from app/core to WhatsApp-specific code.
14. GOWA-specific concerns must stay in `internal/adapters/secondary/messaging/whatsapp/gowa/`.
15. The webhook layer acts as a transformer boundary only; it must not contain core business logic.
16. The worker owns the main execution path for queued business processing.

==================================================
IMPORTANT MODELING REQUIREMENTS
==================================================

Define canonical internal contracts that are provider-agnostic.

Do NOT place provider-normalized wire contracts directly in core domain if they are primarily transport-facing.
Use `internal/transport` for canonical inbound/outbound event/message contracts.
Use `internal/core/domain` for actual business/domain entities and value objects.

Create at least these concepts:

A. Canonical inbound event model (`internal/transport/event`)
- event ID
- platform
- account ID
- tenant ID placeholder
- event type
- occurred at
- actor/user reference
- conversation/chat reference
- optional message payload
- metadata map
- raw reference placeholder

B. Canonical outbound message model (`internal/transport/message`)
- account ID
- destination / conversation ID
- reply-to reference
- text
- attachments
- mentions
- actions placeholder
- metadata map

C. Capability model
- supports reply
- supports mentions
- supports reactions
- supports edit/delete
- supports buttons
- supports media upload
- supports multi-account

D. Metadata policy
Include a raw metadata field such as `map[string]any` or an equivalent extension field to preserve provider-specific features, but do NOT let metadata become the primary model.
Normalize the common 80% into first-class fields.
Core/app logic should only rely on metadata when truly necessary.

Use clear types and comments.

==================================================
CORE PORTS / INTERFACES
==================================================

Define at least these interfaces in `internal/core/ports`:

1. Messenger
- Send
- Reply
- Capabilities

2. EventSink or EventIngestor
- Ingest canonical inbound event

3. SessionStore
- Get/Save/Delete session/workflow state

4. MessageLogRepository
- Store inbound/outbound records
- Update delivery status if needed

5. JobQueue
- Enqueue job

6. AIClient
- Minimal placeholder interface

7. Logger
- Minimal structured logging interface

Keep interfaces clean, minimal, and explicit.
Avoid one vague generic `Repository` interface.

==================================================
APP USE CASES TO SKELETONIZE
==================================================

Create skeleton packages and handlers for these use cases:

1. ingest_event
2. ingest_message_received
3. handle_message
4. parse_command
5. execute_command
6. handle_fallback
7. resolve_conversation_context
8. start_workflow
9. continue_workflow
10. resume_workflow
11. send_message
12. reply_message
13. send_notification
14. sync_delivery_status
15. audit_event

Each use case should have:
- a handler struct
- request/response types where useful
- constructor function
- `Execute(...)` method
- TODO comments for future implementation
- dependency injection via interfaces

Do not over-implement logic.
Keep them standardized, composable, and extensible.

==================================================
WORKFLOW REQUIREMENTS
==================================================

Under `internal/app/workflow`, create at least:
- a shared workflow state abstraction
- an example onboarding workflow
- a simple state machine pattern or explicit states

Keep it lightweight but real enough to show the intended structure.

==================================================
PRIMARY HTTP ADAPTER REQUIREMENTS
==================================================

Under `internal/adapters/primary/http`, generate:

1. webhook/
- HTTP handler(s) for inbound webhook entrypoints
- example route for WhatsApp webhook ingestion
- transform incoming provider payload into canonical internal event input
- enqueue work, do not execute main business logic inline

2. api/
- placeholder internal API endpoint(s), e.g. send message or admin endpoint

3. health/
- liveness/readiness handlers

4. middleware/
- request ID middleware
- basic logging middleware skeleton
- recovery middleware skeleton

Use standard Go HTTP patterns.
Keep it framework-light unless there is a very strong reason otherwise.

==================================================
GOWA ADAPTER REQUIREMENTS
==================================================

Under:
`internal/adapters/secondary/messaging/whatsapp/gowa/`

Generate these concepts:

1. `client.go`
- HTTP client wrapper for talking to GOWA

2. `dto/`
- local DTOs for webhook payload(s) and send request(s)

3. `mapper_inbound.go`
- map GOWA webhook DTO -> canonical internal inbound event

4. `mapper_outbound.go`
- map canonical outbound message -> GOWA request DTO

5. `sender.go`
- implement `core/ports.Messenger`

6. `capabilities.go`
- return capability model for this adapter

7. `errors.go`
- adapter-local error wrapping helpers

8. signature/auth verification placeholder for inbound webhook validation

Important:
- GOWA is a gateway/provider integration.
- Do NOT let its DTOs escape into app/core/transport.
- Add comments explicitly stating this anti-corruption boundary.

Also include support placeholders for:
- multi-account/device routing
- provider account mapping
- provider delivery status reconciliation hooks

==================================================
PERSISTENCE / QUEUE / AI ADAPTERS
==================================================

Generate minimal skeletons for:

1. `internal/adapters/secondary/persistence/postgres/`
- session store skeleton
- message log repository skeleton

2. `internal/adapters/secondary/queue/asynq/`
- queue producer skeleton
- worker-side task handler registration placeholder if useful

3. `internal/adapters/secondary/ai/`
- placeholder AI client implementation or interface adapter

These can be stubs but should have clean constructors and interface compliance.

==================================================
PLATFORM LAYER REQUIREMENTS
==================================================

Under `internal/platform`, generate:

1. `config/`
- config structs
- environment loading skeleton
- validation skeleton

2. `bootstrap/`
- dependency wiring for bot-server
- dependency wiring for worker
- route registration
- adapter construction

3. `db/`
- DB connection skeleton

4. `cache/`
- Redis/cache skeleton

5. `observability/`
- logger construction
- metrics/tracing placeholders

Make bootstrap explicit and readable.

==================================================
PING-PONG REFERENCE SLICE
==================================================

Implement one minimal but real end-to-end reference path:

- inbound WhatsApp webhook from GOWA
- transformed into canonical event
- enqueued to worker
- worker executes a simple use case
- if the inbound text is `ping`, respond with `pong`
- outbound reply goes through `core/ports.Messenger`
- GOWA adapter sends the response

This slice is important because it proves the architecture.

Keep it simple, but make the data flow real.

==================================================
RUNTIME / OPERATIONS REQUIREMENTS
==================================================

Provide:

1. `docker-compose.yml` with at least:
- bot-server
- worker
- gowa gateway
- redis
- postgres

2. `Makefile` with common targets, e.g.:
- run
- up
- down
- test
- migrate placeholder

3. Graceful shutdown for both `bot-server` and `worker`
- handle SIGTERM / SIGINT
- close HTTP server, queue resources, DB, Redis cleanly

==================================================
TEST REQUIREMENTS
==================================================

Create at least:

1. contract test placeholder for Messenger adapters
2. mapping test for GOWA inbound mapper
3. integration test placeholder for webhook ingestion path
4. minimal test around the ping-pong vertical slice if feasible

Use minimal but meaningful tests.

==================================================
README REQUIREMENTS
==================================================

Generate a serious README that explains:

1. What this repository is
2. Why GOWA is treated as a replaceable transport adapter
3. Architecture overview
4. Dependency direction
5. Execution model: thin webhook server + async worker
6. Folder responsibilities
7. Coding conventions
8. Extension guide for adding Discord/Slack/etc.
9. Rules about keeping provider DTOs at the edge
10. Local development instructions
11. Docker compose usage
12. Future roadmap placeholders

The README should help future contributors preserve the architecture.

==================================================
CODING STYLE REQUIREMENTS
==================================================

1. Use idiomatic Go.
2. Prefer explicit constructors.
3. Keep interfaces where they are consumed or in core ports if foundational.
4. Add package comments where useful.
5. Use TODO comments intentionally, not excessively.
6. Avoid unnecessary generics.
7. Avoid overengineering, but enforce strong boundaries.
8. Prefer standard library HTTP for the starter unless absolutely necessary.
9. Keep names clear and specific.
10. Make the repo compile if possible, even with stub implementations.
11. Accept interfaces in use case constructors to keep code testable.

==================================================
OUTPUT FORMAT
==================================================

Return the result as a repository scaffold:
- folder tree
- then file-by-file contents
- then a short explanation of major design decisions

If the output is too large, prioritize:
1. folder tree
2. transport contracts
3. core ports
4. app use cases
5. GOWA adapter
6. bootstrap
7. ping-pong slice
8. README

Do not collapse the architecture into a simplistic bot example.
Preserve the standardization intent.