# Reusable Prompt — Standardized HTML Docs (User + Technical)

Paste the block below to an agent, working inside any repository. It reproduces
the same two-doc, shared-template documentation format.

---

## PROMPT

Generate project documentation as static HTML for GitHub Pages, under `docs/`.
Follow this EXACT standard so every project looks and behaves the same.

### 1. File structure (do not deviate)

Create four files:

- `docs/docs-styles.css` — shared theme + layout. Copy verbatim across projects; only edit the `:root` CSS variables for branding.
- `docs/docs-engine.js` — shared, section-driven template engine. Copy verbatim; never fork per project.
- `docs/index.html` — **User Guide** (non-technical audience).
- `docs/technical.html` — **Technical Docs** (engineers/operators).

Each HTML file contains ONLY: a minimal shell (`<head>` linking the CSS, a body
with a single inline `window.DOCS_DATA = {...}` object), then the mermaid CDN
`<script>` and `<script src="docs-engine.js">`. All rendering is done by the
engine from `DOCS_DATA`. No page-specific JS or CSS.

### 2. The engine contract

`docs-engine.js` reads global `DOCS_DATA` and builds the whole page: sidebar,
header, sections, footer, scrollspy, Mermaid init, version fetch, and the chat
demo. `DOCS_DATA` shape:

```js
window.DOCS_DATA = {
  project, tagline, repo, fallbackVersion,
  audience,             // "User Guide" or "Technical Docs"
  crossLink: { href, label },   // link to the sibling doc
  sections: [
    { id, nav, title, type:"html",      html },
    { id, nav, title, type:"changelog", items:[{v,notes}] },
    { id, nav, title, type:"diagrams",  items:[{title,code}] },   // code = Mermaid text
    { id, nav, title, type:"demo", intro, cases:[{title,note,steps}] },
    { id, nav, title, type:"commands",  columns:[...], rows:[{...}] },
  ],
};
```

Section `type` dispatch — implement all five:
- `html`: inject `html` string as-is.
- `changelog`: `<details><summary>{v}</summary><p>{notes}</p></details>` list.
- `diagrams`: for each item, `<h3>{title}</h3>` + `<div class="mermaid">{code}</div>`.
- `commands`: table from `columns` + `rows`.
- `demo`: interactive WhatsApp-style chat player (see §5).

### 3. Fixed heading / section format

- Sidebar: project name (logo), audience label (accent color), `version <tag>`, a cross-link button to the sibling doc, then nav links (one per section, using `nav || title`).
- Header (top of `main`): version badge + a `GitHub ↗` pill, `<h1>` project name, muted tagline.
- Each section: `<h2>` title with a bottom border, `scroll-margin-top`, generous bottom spacing.
- Footer: `project · audience · source link · generated <date> · version <tag>`.
- Sticky left sidebar (260px) + centered `main` (max 960px). Scrollspy highlights the active nav link. Collapses to single column under 820px.

### 4. Look & feel (theme tokens in `:root`)

Dark theme, WhatsApp-inspired. Provide CSS variables: `--brand`, `--brand-2`,
`--bg`, `--panel`, `--panel-2`, `--line`, `--text`, `--muted`, `--accent`,
`--user-bubble`, `--bot-bubble`, `--radius`, `--mono`, `--sans`. Reusable
classes: `.card`, `.grid2`, `.pill`, `.badge`, `.muted`, `.steps` (numbered),
tables, `pre`, `kbd`, `details/summary`, `.mermaid`.

### 5. Interactive chat demo engine

For the `demo` section, render a phone frame with a WhatsApp-style header and a
`.chat` area, plus controls: a use-case `<select>`, a `▶ Replay` button, and a
`Speed: 1×` toggle cycling 1× → 2× → 0.5×. Each use case has `steps[]`:

```js
{ from:"user"|"bot", text }                       // a chat bubble
{ from:"user", quote:"...", text:"..." }           // quote-reply bubble
{ from:"bot", kind:"file", fileName, text }        // document/attachment bubble
{ typing: 900 }                                    // typing indicator for N ms
```

Bubbles: user right (green), bot left (dark), animated in with a timestamp;
typing shows an animated three-dot indicator that is removed before the next
message. Replay/select/speed all restart the animation and clear pending timers.

### 6. Mermaid rules (avoid syntax errors)

- Load Mermaid 11 via CDN; init with `theme:"dark"`, `securityLevel:"loose"`, dark themeVariables.
- In diagram labels, DO NOT use angle brackets `< >` or `==`; they break sequence/flowchart parsing. Write "doc-number" not "<doc-number>". Prefer plain words over symbols in node/message text.

### 7. Versioning

Version source of truth = latest Git tag via the GitHub API
(`GET /repos/{owner}/{repo}/tags?per_page=1`, parse owner/repo from `repo` URL).
On success fill every `[data-ver]` element; on failure (offline / `file://`)
fall back to `fallbackVersion`. Also keep a changelog section in the technical doc.

### 8. Content split

- **User Guide (`index.html`)**: plain language, no env vars / architecture. Include: Getting Started (what it is, prerequisites, a numbered routine), a plain-language "How It Works" flow diagram, an interactive demo covering EVERY user-facing use case (happy paths AND common errors), an input-format / usage reference, a quick-reference command table in everyday wording, and an FAQ.
- **Technical Docs (`technical.html`)**: Overview, Architecture (layers/modules + dependency rules), Flow Diagrams (end-to-end + per-workflow sequence/flowcharts), any domain policies (IDs, numbering, state lifecycle), command/trigger/authorization table, Safety-Critical behavior, Setup & Configuration (run commands + env table), and Versioning/Changelog.

### 9. Grounding

Derive all content from the ACTUAL current repository: read the README, config,
command/handler code, domain rules, and example inputs. Use real command
strings, real bot reply messages, and real config keys — no invented behavior.
Cover every use case and the complete end-to-end flow of the current state.

### 10. Deliverable

Verify the two HTML files parse (their `DOCS_DATA` is valid JS) and the engine
JS parses. Report the section list per file. Keep the engine and CSS identical
between the two pages — the only per-page difference is `DOCS_DATA`.

---
```
End of prompt. Adjust `:root` tokens, project name, and audience content per
project; keep everything else identical.
```
