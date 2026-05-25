// Package rules defines the agents-doctor rule registry.
//
// Rule slug convention: <group>.<rule-name>, lowercase kebab.
// Severity:
//   SeverityError — fails CI.
//   SeverityWarn  — reports but passes.
//   SeverityInfo  — hidden by default; surfaced with --verbose.
//
// Kinds: service | library | app | infra | docs.
// Apply == nil means "all kinds". api == true means "only when api.is_api".
//
// New rules ship at SeverityWarn first. Promote to SeverityError after one
// bump cycle of clean runs across consumers.
package rules

type Severity int

const (
	SeverityInfo Severity = iota
	SeverityWarn
	SeverityError
)

type Kind string

const (
	KindService Kind = "service"
	KindLibrary Kind = "library"
	KindApp     Kind = "app"
	KindInfra   Kind = "infra"
	KindDocs    Kind = "docs"
)

// Rule is the registry entry. The Check func is implemented per rule
// in its group's file (healthz.go, secrets.go, ...).
type Rule struct {
	Slug     string
	Severity Severity
	Apply    []Kind // nil == all
	APIOnly  bool   // requires api.is_api == true
	Doc      string
	Check    func(ctx *Context) Finding
}

// Registry is the v2 inventory. 45 rules.
var Registry = []Rule{
	// --- config & entrypoint -------------------------------------------------
	{Slug: "config.exists", Severity: SeverityError},
	{Slug: "config.schema-valid", Severity: SeverityError},
	{Slug: "config.standard-version-pinned", Severity: SeverityError},
	{Slug: "agents.exists", Severity: SeverityError},
	{Slug: "agents.no-claude-md", Severity: SeverityWarn},

	// --- README & changelog --------------------------------------------------
	{Slug: "readme.exists", Severity: SeverityError},
	{Slug: "readme.required-links", Severity: SeverityWarn},
	{Slug: "readme.length", Severity: SeverityWarn},
	{Slug: "changelog.exists", Severity: SeverityError},

	// --- healthz (services only) --------------------------------------------
	{Slug: "healthz.liveness", Severity: SeverityError, Apply: []Kind{KindService}},
	{Slug: "healthz.readiness", Severity: SeverityError, Apply: []Kind{KindService}},
	{Slug: "healthz.version-endpoint", Severity: SeverityWarn, Apply: []Kind{KindService}},
	{Slug: "healthz.payload-shape", Severity: SeverityWarn, Apply: []Kind{KindService}},
	{Slug: "healthz.no-deps-in-liveness", Severity: SeverityWarn, Apply: []Kind{KindService}},

	// --- logging / observability --------------------------------------------
	{Slug: "logging.standard-fields", Severity: SeverityWarn, Apply: []Kind{KindService}},
	{Slug: "logging.starter-present", Severity: SeverityWarn, Apply: []Kind{KindService}},

	// --- secrets -------------------------------------------------------------
	{Slug: "secrets.no-env-files", Severity: SeverityError},
	{Slug: "secrets.gitignore-coverage", Severity: SeverityError},
	{Slug: "secrets.no-hardcoded-keys", Severity: SeverityWarn},
	{Slug: "secrets.infisical-config-exists", Severity: SeverityWarn, Apply: []Kind{KindService, KindApp}},
	{Slug: "secrets.infisical-url-https", Severity: SeverityWarn},

	// --- api-contract (api repos) -------------------------------------------
	{Slug: "api-contract.exists", Severity: SeverityError, APIOnly: true},
	{Slug: "api-contract.required-sections", Severity: SeverityError, APIOnly: true},
	{Slug: "api-contract.endpoint-block-shape", Severity: SeverityWarn, APIOnly: true},
	{Slug: "api-contract.bruno-coverage", Severity: SeverityError, APIOnly: true},

	// --- bruno (api repos) ---------------------------------------------------
	{Slug: "bruno.collection-exists", Severity: SeverityError, APIOnly: true},
	{Slug: "bruno.no-secrets-in-files", Severity: SeverityError, APIOnly: true},
	{Slug: "bruno.contract-back-reference", Severity: SeverityWarn, APIOnly: true},

	// --- ci ------------------------------------------------------------------
	{Slug: "ci.workflow-ci", Severity: SeverityError},
	{Slug: "ci.workflow-release", Severity: SeverityWarn, Apply: []Kind{KindService, KindLibrary, KindApp}},
	{Slug: "ci.workflow-deploy", Severity: SeverityWarn, Apply: []Kind{KindService, KindApp}},
	{Slug: "ci.workflow-doctor", Severity: SeverityError},

	// --- docs (PRD/ADR/SOP) --------------------------------------------------
	{Slug: "docs.prd-dir", Severity: SeverityError},
	{Slug: "docs.adr-dir", Severity: SeverityWarn},
	{Slug: "docs.sop-dir", Severity: SeverityWarn},
	{Slug: "docs.frontmatter-shape", Severity: SeverityError},
	{Slug: "docs.frontmatter-status-enum", Severity: SeverityError},
	{Slug: "docs.frontmatter-id-unique", Severity: SeverityError},
	{Slug: "docs.frontmatter-supersedes-exists", Severity: SeverityWarn},
	{Slug: "docs.frontmatter-sop-review", Severity: SeverityWarn},

	// --- optouts hygiene -----------------------------------------------------
	{Slug: "optouts.has-reason", Severity: SeverityError},
	{Slug: "optouts.has-expires", Severity: SeverityWarn},
	{Slug: "optouts.not-expired", Severity: SeverityWarn},
	{Slug: "optouts.targets-known-rule", Severity: SeverityError},

	// --- pi harness courtesy (local only) -----------------------------------
	// Skipped when running in CI (CI runners don't have a Pi setup).
	{Slug: "pi.global-agents-md", Severity: SeverityInfo,
		Doc: "warns when ~/.pi/agent/AGENTS.md is missing; never blocking; CI skips."},
}

// Context, Finding, and per-rule Check implementations live in sibling files.
type Context struct {
	RepoRoot       string
	Config         interface{} // parsed agents.config.yml
	StandardSemver string      // for version-drift checks
}

type Finding struct {
	Slug     string
	Severity Severity
	Message  string
	File     string
	Line     int
}
