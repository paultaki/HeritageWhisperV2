#!/bin/bash
# Check if Next.js security patch is available
# Run with: ./scripts/check-nextjs-patch.sh

CURRENT="15.5.4"
PATCHED="15.5.7"

echo "Checking for Next.js security patch..."
echo ""

LATEST=$(npm view next@latest version 2>/dev/null)

echo "Current installed: $CURRENT"
echo "Latest on npm:     $LATEST"
echo "Patch needed:      $PATCHED"
echo ""

if [[ "$LATEST" == "$PATCHED" ]] || [[ "$LATEST" > "$PATCHED" ]]; then
    echo "✅ PATCH AVAILABLE! Run:"
    echo ""
    echo "   npm install next@$LATEST"
    echo "   git add package.json package-lock.json"
    echo "   git commit -m \"fix: Upgrade Next.js to $LATEST (CVE-2025-66478)\""
    echo "   git push"
    echo ""
else
    echo "❌ Patch not yet available. Check again later."
    echo ""
    echo "   Vercel WAF is protecting your site in the meantime."
fi
