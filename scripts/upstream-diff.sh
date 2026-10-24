#!/usr/bin/env bash
# Compares the files carried in src/lib/upstream/ with an IronCalc checkout.
# Usage: scripts/upstream-diff.sh <path to an IronCalc checkout>
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "usage: $0 <path to an IronCalc checkout>" >&2
  exit 2
fi

upstream="$1/webapp/IronCalc/src"
here="$(cd "$(dirname "$0")/.." && pwd)/src/lib/upstream"
status=0

while IFS= read -r file; do
  if [ "$file" = "components/Editor/util.ts" ]; then
    # excerpt of Editor/util.tsx without the JSX: getFormulaHTML and its
    # private helpers are ported in src/lib/components/Editor/formulaHTML.ts.
    # The line ranges are those of the pinned commit (see UPSTREAM.md); a bump
    # re-checks them.
    tsx="$upstream/components/Editor/util.tsx"
    if ! diff -u <(sed -n 1,9p "$tsx"; echo; sed -n 23,29p "$tsx"; echo
      sed -n 61,150p "$tsx"; echo; sed -n 339,446p "$tsx") \
      "$here/$file"; then
      status=1
    fi
    continue
  fi
  if ! diff -u "$upstream/$file" "$here/$file"; then
    status=1
  fi
done < <(cd "$here" && find . -type f ! -name UPSTREAM.md | sed 's|^\./||' | sort)

exit $status
