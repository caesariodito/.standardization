# API Contract

> Source of truth for endpoint **semantics**.
> Bruno (`/api/bruno/`) is the source of truth for **examples**.
> OpenAPI (`/api/openapi.yaml`, optional) is the source of truth for **schemas**.
>
> Tie-break: when contract and code disagree, the code is wrong. Update the
> contract first, then the code.

## Versioning

- Current API version: `v1`
- Breaking changes require an ADR + a new version path (`/v2/...`).
- Additive changes (new optional fields, new endpoints) ship without a version bump.

## Endpoints

### `POST /v1/orders` — create order

- **Auth**: Bearer JWT, scope `orders:write`
- **Idempotency**: `Idempotency-Key` header required
- **Errors**:
  - `409 conflict` — duplicate `Idempotency-Key`
  - `422 unprocessable_entity` — validation
  - `402 payment_required` — payment method declined
- **Request**: `{ customer_id, items[], metadata? }`
- **Response**: `{ id, status, created_at, ... }`
- **Bruno**: `/api/bruno/orders/create.bru`
- **Changed**: 2026-05-20 — added `metadata` field (additive, non-breaking)

### `GET /v1/orders/{id}` — fetch order

- **Auth**: Bearer JWT, scope `orders:read`
- **Errors**: `404 not_found` if id unknown or not visible to caller
- **Response**: `{ id, status, items[], total, ... }`
- **Bruno**: `/api/bruno/orders/get.bru`

## Breaking change log

| Date       | Endpoint           | Change                              | Migration                         |
|------------|--------------------|-------------------------------------|-----------------------------------|
| 2026-04-01 | `POST /v1/orders`  | `customer_id` now required          | clients must send `customer_id`   |
