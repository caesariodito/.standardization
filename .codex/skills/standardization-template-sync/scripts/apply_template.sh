#!/usr/bin/env bash
set -euo pipefail

DEFAULT_TEMPLATE="/mnt/f/Documents/_PROJECTS/.standardization"
DEFAULT_REMOTE_TEMPLATE="https://github.com/caesariodito/.standardization/.codex/skills"
template_path="$DEFAULT_TEMPLATE"
target_path="."
target_set=0
dry_run=0
force_rtk=0
remote_temp_dir=""

usage() {
  cat <<'EOF'
Usage:
  apply_template.sh [target_repo] [--template PATH] [--dry-run] [--force-rtk]

Options:
  --template PATH  Source template repo path
  --dry-run        Print planned actions without changing files
  --force-rtk      Overwrite target RTK.md when it exists and differs
  -h, --help       Show this help text
EOF
}

cleanup() {
  if [[ -n "$remote_temp_dir" && -d "$remote_temp_dir" ]]; then
    rm -rf "$remote_temp_dir"
  fi
}

trap cleanup EXIT

run_cmd() {
  if [[ "$dry_run" -eq 1 ]]; then
    printf '[dry-run] %s\n' "$*"
  else
    eval "$@"
  fi
}

has_required_paths() {
  local base="$1"
  [[ -e "$base/.codex" && -e "$base/AGENTS.md" && -e "$base/RTK.md" ]]
}

resolve_remote_template() {
  local remote_url="$1"
  local url_no_scheme github_path owner rest repo subpath clone_url repo_dir candidate

  url_no_scheme="${remote_url#https://}"
  url_no_scheme="${url_no_scheme#http://}"

  if [[ "$url_no_scheme" != github.com/* ]]; then
    echo "error: unsupported remote template URL: $remote_url" >&2
    return 1
  fi

  github_path="${url_no_scheme#github.com/}"
  owner="${github_path%%/*}"
  rest="${github_path#*/}"
  repo="${rest%%/*}"

  if [[ -z "$owner" || -z "$repo" || "$owner" == "$github_path" ]]; then
    echo "error: could not parse GitHub owner/repo from: $remote_url" >&2
    return 1
  fi

  subpath=""
  if [[ "$rest" != "$repo" ]]; then
    subpath="${rest#*/}"
  fi

  clone_url="https://github.com/$owner/$repo.git"
  remote_temp_dir="$(mktemp -d)"
  repo_dir="$remote_temp_dir/repo"

  if ! git clone --depth 1 "$clone_url" "$repo_dir" >/dev/null 2>&1; then
    echo "error: failed to clone remote template repo: $clone_url" >&2
    return 1
  fi

  candidate="$repo_dir"
  if [[ -n "$subpath" && -d "$repo_dir/$subpath" ]]; then
    candidate="$repo_dir/$subpath"
  fi

  if has_required_paths "$candidate"; then
    template_path="$candidate"
    return 0
  fi

  if has_required_paths "$repo_dir"; then
    template_path="$repo_dir"
    return 0
  fi

  echo "error: remote template is missing required paths (.codex, AGENTS.md, RTK.md)" >&2
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --template)
      if [[ $# -lt 2 ]]; then
        echo "error: --template requires a path" >&2
        exit 1
      fi
      template_path="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --force-rtk)
      force_rtk=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ "$target_set" -eq 0 ]]; then
        target_path="$1"
        target_set=1
        shift
      else
        echo "error: unexpected argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if [[ ! -d "$template_path" ]]; then
  if [[ "$template_path" == "$DEFAULT_TEMPLATE" ]]; then
    echo "warn: default template path not found: $template_path" >&2
    echo "info: attempting remote template: $DEFAULT_REMOTE_TEMPLATE" >&2
    if ! resolve_remote_template "$DEFAULT_REMOTE_TEMPLATE"; then
      exit 1
    fi
  else
    echo "error: template path does not exist: $template_path" >&2
    exit 1
  fi
fi

if [[ ! -d "$target_path" ]]; then
  echo "error: target path does not exist: $target_path" >&2
  exit 1
fi

required_paths=(".codex" "AGENTS.md" "RTK.md")
for rel in "${required_paths[@]}"; do
  if [[ ! -e "$template_path/$rel" ]]; then
    echo "error: template missing required path: $template_path/$rel" >&2
    exit 1
  fi
done

template_abs="$(cd "$template_path" && pwd)"
target_abs="$(cd "$target_path" && pwd)"

echo "template: $template_abs"
echo "target:   $target_abs"

# 1) Merge .codex content.
if [[ -d "$target_abs/.codex" ]]; then
  run_cmd "cp -a \"$template_abs/.codex/.\" \"$target_abs/.codex/\""
  echo "ok: merged .codex into existing target .codex"
else
  run_cmd "cp -a \"$template_abs/.codex\" \"$target_abs/.codex\""
  echo "ok: copied .codex"
fi

# 2) Ensure AGENTS.md exists and references RTK.md.
if [[ -f "$target_abs/AGENTS.md" ]]; then
  if grep -Fxq '@RTK.md' "$target_abs/AGENTS.md"; then
    echo "ok: AGENTS.md already references @RTK.md"
  else
    if [[ "$dry_run" -eq 1 ]]; then
      echo "[dry-run] append @RTK.md to $target_abs/AGENTS.md"
    else
      if [[ -s "$target_abs/AGENTS.md" ]]; then
        printf '\n@RTK.md\n' >> "$target_abs/AGENTS.md"
      else
        printf '@RTK.md\n' > "$target_abs/AGENTS.md"
      fi
    fi
    echo "ok: updated AGENTS.md with @RTK.md"
  fi
else
  run_cmd "cp -a \"$template_abs/AGENTS.md\" \"$target_abs/AGENTS.md\""
  echo "ok: copied AGENTS.md"
fi

# 3) Handle RTK.md safely.
if [[ -f "$target_abs/RTK.md" ]]; then
  if cmp -s "$template_abs/RTK.md" "$target_abs/RTK.md"; then
    echo "ok: RTK.md already matches template"
  elif [[ "$force_rtk" -eq 1 ]]; then
    run_cmd "cp -a \"$template_abs/RTK.md\" \"$target_abs/RTK.md\""
    echo "ok: replaced RTK.md with template (--force-rtk)"
  else
    echo "warn: target RTK.md differs; preserved existing file (use --force-rtk to overwrite)"
  fi
else
  run_cmd "cp -a \"$template_abs/RTK.md\" \"$target_abs/RTK.md\""
  echo "ok: copied RTK.md"
fi

echo "done"
