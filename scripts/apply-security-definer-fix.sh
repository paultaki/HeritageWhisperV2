#!/bin/bash

# Script to apply the SECURITY DEFINER fix migration
# This removes SECURITY DEFINER from the prompt_quality_stats view

echo "=================================================="
echo "Fixing SECURITY DEFINER View Issue"
echo "=================================================="
echo ""
echo "This will fix the security linter warning for the prompt_quality_stats view."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it using:"
    echo "  export DATABASE_URL='postgresql://...'"
    echo ""
    echo "You can find this in Supabase Dashboard > Settings > Database"
    exit 1
fi

echo "🔄 Applying migration to fix SECURITY DEFINER..."
echo ""

# Apply the migration
psql "$DATABASE_URL" -f migrations/0012_fix_security_definer_view.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "The prompt_quality_stats view has been recreated without SECURITY DEFINER."
    echo "This should resolve the security linter warning in Supabase."
    echo ""
    echo "Next steps:"
    echo "1. Check Supabase Dashboard > Database > Linter"
    echo "2. The SECURITY DEFINER warning for prompt_quality_stats should be gone"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above."
    exit 1
fi