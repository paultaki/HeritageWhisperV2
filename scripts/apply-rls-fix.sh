#!/bin/bash

# Script to apply RLS fix migration to Supabase
# Created: 2025-01-21
# Purpose: Fix missing Row Level Security on critical tables

echo "========================================="
echo "Heritage Whisper RLS Security Fix"
echo "========================================="
echo ""
echo "This script will enable Row Level Security on the following tables:"
echo "  - users"
echo "  - recording_sessions"
echo "  - stories"
echo "  - usage_tracking"
echo ""
echo "⚠️  IMPORTANT: This is a CRITICAL security fix!"
echo ""

# Check if we have the Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
MIGRATION_FILE="$PROJECT_ROOT/migrations/0011_fix_missing_rls.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""
echo "Choose an option:"
echo "1) Apply to LOCAL database (supabase db)"
echo "2) Apply to PRODUCTION database (requires connection string)"
echo "3) View migration SQL"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Applying migration to LOCAL database..."
        cd "$PROJECT_ROOT"
        supabase db push --include-migrations
        if [ $? -eq 0 ]; then
            echo "✅ Migration applied successfully to local database!"
        else
            echo "❌ Migration failed. Please check the error messages above."
            exit 1
        fi
        ;;
    2)
        echo ""
        echo "🔧 Applying migration to PRODUCTION database..."
        echo ""
        echo "You'll need your database connection string."
        echo "Find it at: https://app.supabase.io/project/tjycibrhoammxohemyhq/settings/database"
        echo ""
        read -p "Enter your DATABASE_URL (or press Enter to use from .env.local): " db_url

        if [ -z "$db_url" ]; then
            # Try to read from .env.local
            if [ -f "$PROJECT_ROOT/.env.local" ]; then
                db_url=$(grep "^DATABASE_URL=" "$PROJECT_ROOT/.env.local" | cut -d '=' -f 2-)
                if [ -z "$db_url" ]; then
                    echo "❌ DATABASE_URL not found in .env.local"
                    exit 1
                fi
                echo "Using DATABASE_URL from .env.local"
            else
                echo "❌ .env.local file not found"
                exit 1
            fi
        fi

        echo ""
        echo "⚠️  WARNING: You are about to apply changes to the PRODUCTION database!"
        read -p "Are you sure? Type 'yes' to continue: " confirm

        if [ "$confirm" != "yes" ]; then
            echo "❌ Aborted."
            exit 1
        fi

        echo ""
        echo "🚀 Applying migration..."
        psql "$db_url" -f "$MIGRATION_FILE"

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Migration applied successfully to production!"
            echo ""
            echo "📊 Verification queries have been run. Check the output above for:"
            echo "   - RLS status for each table (should show '✅ RLS Enabled')"
            echo "   - Policy count for each table (should be >0)"
            echo "   - Overall security status (all should show '✅ Protected')"
        else
            echo "❌ Migration failed. Please check the error messages above."
            exit 1
        fi
        ;;
    3)
        echo ""
        echo "📄 Viewing migration SQL:"
        echo "========================================="
        cat "$MIGRATION_FILE"
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "========================================="
echo "Next Steps:"
echo "========================================="
echo ""
echo "1. ✅ Verify the fix in Supabase dashboard:"
echo "   https://app.supabase.io/project/tjycibrhoammxohemyhq/database/tables"
echo "   - Check that RLS badge appears next to each table"
echo ""
echo "2. 🔍 Re-run the security linter:"
echo "   Supabase Dashboard > Database > Linter"
echo "   - Should no longer show RLS warnings for these tables"
echo ""
echo "3. 📝 Update security documentation:"
echo "   - Mark this issue as resolved in SECURITY_IMPLEMENTATION_STATUS.md"
echo ""
echo "4. 🧪 Test application functionality:"
echo "   - Ensure users can still access their own data"
echo "   - Verify users cannot access other users' data"
echo ""
echo "========================================="