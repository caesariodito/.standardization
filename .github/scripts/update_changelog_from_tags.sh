#!/usr/bin/env bash
set -euo pipefail

CURRENT_TAG="${1:?current tag is required}"
PREVIOUS_TAG="${2:-}"
CHANGELOG_FILE="${3:-CHANGELOG.md}"
RELEASE_BODY_FILE="${4:-.release-notes.md}"

trim() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf "%s" "$value"
}

append_commit() {
  local target_file="$1"
  local short_hash="$2"
  local subject="$3"
  local body="$4"

  printf -- "- %s (%s)\n" "$subject" "$short_hash" >> "$target_file"

  while IFS= read -r line; do
    local clean_line
    clean_line="$(trim "$line")"

    if [[ -z "$clean_line" ]]; then
      continue
    fi

    if [[ "$clean_line" =~ ^(Co-authored-by|Signed-off-by|Reviewed-by|Acked-by|Refs|See-also):[[:space:]] ]]; then
      continue
    fi

    if [[ "$clean_line" == -* ]]; then
      clean_line="${clean_line#- }"
    elif [[ "$clean_line" == \** ]]; then
      clean_line="${clean_line#* }"
    fi

    printf "  - %s\n" "$clean_line" >> "$target_file"
  done <<< "$body"
}

RANGE_SPEC="$CURRENT_TAG"
if [[ -n "$PREVIOUS_TAG" ]]; then
  RANGE_SPEC="$PREVIOUS_TAG..$CURRENT_TAG"
fi

FEATURES_FILE="$(mktemp)"
FIXES_FILE="$(mktemp)"
OTHERS_FILE="$(mktemp)"
FEATURE_REGEX='^feat(\([^)]+\))?(!)?:[[:space:]]+'
FIX_REGEX='^fix(\([^)]+\))?(!)?:[[:space:]]+'

while IFS= read -r -d '' commit_hash && IFS= read -r -d '' subject && IFS= read -r -d '' body; do
  short_hash="${commit_hash:0:7}"
  subject_lower="$(printf "%s" "$subject" | tr '[:upper:]' '[:lower:]')"

  if [[ "$subject_lower" =~ $FEATURE_REGEX ]]; then
    append_commit "$FEATURES_FILE" "$short_hash" "$subject" "$body"
  elif [[ "$subject_lower" =~ $FIX_REGEX ]]; then
    append_commit "$FIXES_FILE" "$short_hash" "$subject" "$body"
  else
    append_commit "$OTHERS_FILE" "$short_hash" "$subject" "$body"
  fi
done < <(git log --reverse --no-merges --format='%H%x00%s%x00%b%x00' "$RANGE_SPEC")

TODAY_UTC="$(date -u +%Y-%m-%d)"

{
  printf "## [%s] - %s\n\n" "$CURRENT_TAG" "$TODAY_UTC"
  if [[ -n "$PREVIOUS_TAG" ]]; then
    printf "_Compared to `%s`._\n\n" "$PREVIOUS_TAG"
  else
    printf "_Initial tagged release._\n\n"
  fi

  has_any_section=0

  if [[ -s "$FEATURES_FILE" ]]; then
    has_any_section=1
    echo "### Features"
    cat "$FEATURES_FILE"
    echo
  fi

  if [[ -s "$FIXES_FILE" ]]; then
    has_any_section=1
    echo "### Fixes"
    cat "$FIXES_FILE"
    echo
  fi

  if [[ -s "$OTHERS_FILE" ]]; then
    has_any_section=1
    echo "### Others"
    cat "$OTHERS_FILE"
    echo
  fi

  if [[ "$has_any_section" -eq 0 ]]; then
    echo "- No notable changes."
    echo
  fi
} > "$RELEASE_BODY_FILE"

if [[ ! -f "$CHANGELOG_FILE" ]]; then
  printf "# Changelog\n\n" > "$CHANGELOG_FILE"
fi

if grep -Fq "## [$CURRENT_TAG]" "$CHANGELOG_FILE"; then
  echo "Entry for $CURRENT_TAG already exists in $CHANGELOG_FILE. Skipping prepend."
  rm -f "$FEATURES_FILE" "$FIXES_FILE" "$OTHERS_FILE"
  exit 0
fi

TMP_CHANGELOG="$(mktemp)"
FIRST_LINE="$(head -n 1 "$CHANGELOG_FILE" || true)"

if [[ "$FIRST_LINE" =~ ^#[[:space:]] ]]; then
  {
    echo "$FIRST_LINE"
    echo
    cat "$RELEASE_BODY_FILE"
    echo
    tail -n +2 "$CHANGELOG_FILE"
  } > "$TMP_CHANGELOG"
else
  {
    cat "$RELEASE_BODY_FILE"
    echo
    cat "$CHANGELOG_FILE"
  } > "$TMP_CHANGELOG"
fi

mv "$TMP_CHANGELOG" "$CHANGELOG_FILE"
rm -f "$FEATURES_FILE" "$FIXES_FILE" "$OTHERS_FILE"
