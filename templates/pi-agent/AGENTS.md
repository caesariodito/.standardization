# Global agent instructions

## Matt Pocock skills routing

When `mattpocock/skills` is installed, proactively use these skills for day-to-day engineering workflow.

### Repo setup

- If repo lacks `docs/agents/`, `CONTEXT.md`, or an `## Agent skills` block in `AGENTS.md`/`CLAUDE.md`, suggest or run `/skill:setup-matt-pocock-skills` before complex work.
- For new feature development or side-project development, run setup first unless user explicitly skips it.
- Prefer local markdown issues for small side projects unless user says GitHub/GitLab/Jira/Linear is used.

### Skill routing

- Use `/skill:grill-with-docs` when user asks for feature planning, requirements discovery, vague product idea, domain modeling, or big change.
- Use `/skill:tdd` when user asks to implement behavior or fix bug and tests are possible.
- Use `/skill:diagnose` when bug cause is unclear, test failure is mysterious, behavior differs across environments, or previous fix failed.
- Use `/skill:zoom-out` when code area is unfamiliar, architecture unclear, or user asks where/how something fits.
- Use `/skill:improve-codebase-architecture` when code feels tangled, duplicated, hard to change, or user asks for refactor/architecture review.
- Use `/skill:to-issues` when user asks to turn plan/spec/PRD into tickets or vertical slices.
- Use `/skill:to-prd` when user asks to turn conversation/context into product requirements.
- Use `/skill:triage` when user asks to process issue backlog or classify issues.
- Use `/skill:prototype` when user wants throwaway exploration, UI alternatives, or business-logic/state-machine experiments.

### Operating rules

- Prefer explicit skill use at workflow boundaries instead of always-on process.
- Do not run heavyweight skills for trivial edits.
- If unsure whether to use a skill, briefly say which skill fits and ask for confirmation.
- When adopting skills in new side projects, start with setup, then grill-with-docs, then tdd.

## Karpathy coding guardrails

When writing, reviewing, or refactoring code, apply these guardrails by default. Use `/skill:karpathy-guidelines` explicitly when stronger review is useful.

- Think before coding: state assumptions; ask if ambiguous; surface tradeoffs; push back when simpler approach exists.
- Simplicity first: write minimal code that solves requested problem; avoid speculative abstractions, optional configurability, and unrequested features.
- Surgical changes: touch only files/lines needed for request; avoid drive-by refactors or formatting churn; match existing style.
- Clean only own mess: remove imports, variables, or code made unused by your change; mention unrelated dead code instead of deleting it.
- Goal-driven execution: define success criteria for nontrivial work; verify with tests, typecheck, lint, or targeted commands when available.
- For trivial edits, keep process lightweight: apply surgical/minimal-change rules without verbose planning.
