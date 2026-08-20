# Domain docs

This repository uses a single-context domain-document layout.

## Before exploring

Read these when they exist:

- `CONTEXT.md` at repository root
- relevant ADRs under `docs/adr/`

Proceed silently when they do not exist. Create them lazily through domain-modeling only after vocabulary or a durable architectural decision is resolved.

## Layout

```text
/
├── CONTEXT.md
├── docs/adr/
└── ...
```

Use terms defined in `CONTEXT.md` consistently. If proposed work conflicts with an ADR, identify the conflict instead of silently overriding it.
