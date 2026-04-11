#!/bin/bash
# Convert remaining tsx files that have corresponding patterns

# Simple files - just remove type annotations
files=(
  "src/components/ui/avatar.tsx"
  "src/components/ui/collapsible.tsx"
  "src/components/ui/skeleton.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    jsx_file="${file%.tsx}.jsx"
    echo "Would convert $file to $jsx_file"
  fi
done
