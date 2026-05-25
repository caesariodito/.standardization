// Command agents-doctor checks a repository for compliance with the
// caesariodito/.standardization v2 standard.
//
// Usage:
//
//	agents-doctor                # human-readable output, current dir
//	agents-doctor --json         # JSON output for CI
//	agents-doctor --target ./svc # check a different directory
//	agents-doctor --verbose      # include info-severity findings
//
// Exit codes:
//
//	0 — all error-severity rules pass
//	1 — at least one error-severity rule failed
//	2 — invocation error (bad flags, unreadable config, etc.)
package main

import (
	"flag"
	"fmt"
	"os"
)

const Version = "0.1.0"

func main() {
	var (
		target  = flag.String("target", ".", "repository root to check")
		jsonOut = flag.Bool("json", false, "emit JSON instead of human-readable text")
		verbose = flag.Bool("verbose", false, "include info-severity findings")
		showVer = flag.Bool("version", false, "print version and exit")
	)
	flag.Parse()

	if *showVer {
		fmt.Println("agents-doctor", Version)
		return
	}

	// TODO(v0.2): wire up rules.Registry against the target repo.
	// For now this scaffold prints a placeholder so CI can be wired
	// before the rule implementations land.
	if *jsonOut {
		fmt.Fprintf(os.Stdout, `{"status":"scaffold","target":%q,"version":%q}`+"\n", *target, Version)
	} else {
		fmt.Printf("agents-doctor %s — scaffold (no rules implemented yet)\n", Version)
		fmt.Printf("target: %s\n", *target)
		fmt.Printf("verbose: %v\n", *verbose)
	}
}
