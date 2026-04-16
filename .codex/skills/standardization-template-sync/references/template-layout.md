# Template Layout

Default template source:

- `/mnt/f/Documents/_PROJECTS/.standardization`

Expected files in template root:

- `.codex/`
- `AGENTS.md`
- `RTK.md`

Current intended behavior:

- Merge `.codex/` into target repo.
- Ensure target `AGENTS.md` references `@RTK.md`.
- Keep existing target `RTK.md` unless `--force-rtk` is explicitly requested.
