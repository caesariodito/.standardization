# Repo Local Agent Notes

This repository enables both RTK and caveman guidance.

## RTK

- Use `rtk` prefix for shell commands when possible.
- Verify with `rtk --version`, `rtk gain`, and `which rtk`.

## Caveman

- Caveman mode guidance is loaded on Codex session start/resume via `.codex/hooks.json`.
- Deactivate by explicitly asking for `normal mode` or `stop caveman`.
