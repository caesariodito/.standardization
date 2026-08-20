# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue:** `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue:** `gh issue view <number> --comments` and fetch its labels.
- **List issues:** `gh issue list --state open --json number,title,body,labels,comments` with suitable label and state filters.
- **Comment:** `gh issue comment <number> --body "..."`.
- **Apply/remove labels:** `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Close:** `gh issue close <number> --comment "..."`.

Infer the repository from `git remote -v`; `gh` does this automatically inside the clone.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill operations

- When a skill says “publish to the issue tracker,” create a GitHub issue.
- When a skill says “fetch the relevant ticket,” run `gh issue view <number> --comments`.
- A bare `#42` may identify an issue or PR. Resolve with `gh pr view 42`, then fall back to `gh issue view 42`.

## Wayfinding

Use one issue labelled `wayfinder:map` as the map and GitHub sub-issues as child tickets. Use native issue dependencies where available. Fall back to task lists and `Blocked by: #<n>` only when native relationships are unavailable.
