#!/bin/bash
#
# HeritageWhisper Full Restore Script
# Restores: Database + Storage files from a backup
#
# Usage: ./scripts/restore-full.sh /path/to/backup/folder
#

set -e

# Configuration
PROJECT_REF="tjycibrhoammxohemyhq"
BUCKET_NAME="heritage-whisper-files"

# Check arguments
if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore-full.sh /path/to/backup/folder"
    echo ""
    echo "Available backups:"
    ls -la ~/Backups/HeritageWhisper/ 2>/dev/null || echo "  No backups found in ~/Backups/HeritageWhisper/"
    exit 1
fi

BACKUP_DIR="$1"

# Verify backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup folder not found: $BACKUP_DIR"
    exit 1
fi

if [ ! -f "$BACKUP_DIR/database.dump" ]; then
    echo "❌ Database backup not found: $BACKUP_DIR/database.dump"
    exit 1
fi

echo "================================================"
echo "  HeritageWhisper Full Restore"
echo "  $(date)"
echo "================================================"
echo ""
echo "⚠️  WARNING: This will OVERWRITE your current data!"
echo ""
echo "Restoring from: $BACKUP_DIR"
echo ""

# Show manifest if available
if [ -f "$BACKUP_DIR/MANIFEST.txt" ]; then
    echo "Backup details:"
    cat "$BACKUP_DIR/MANIFEST.txt" | sed 's/^/  /'
    echo ""
fi

read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo ""

# ============================================
# 1. DATABASE RESTORE
# ============================================
echo "📦 Step 1/2: Restoring database..."

# Get database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo ""
    echo "To get your password:"
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
    echo "2. Use your database password"
    echo ""
    read -sp "Enter your database password: " SUPABASE_DB_PASSWORD
    echo ""
fi

DB_HOST="db.$PROJECT_REF.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"

echo "   Restoring database (this may take a few minutes)..."
/opt/homebrew/opt/postgresql@17/bin/pg_restore \
    -h "$DB_HOST" \
    -p 5432 \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$BACKUP_DIR/database.dump" 2>&1 | grep -v "already exists" | head -20 || true

unset PGPASSWORD

echo "   ✅ Database restored"
echo ""

# ============================================
# 2. STORAGE RESTORE
# ============================================
echo "📷 Step 2/2: Restoring storage files..."

STORAGE_DIR="$BACKUP_DIR/storage"

if [ ! -d "$STORAGE_DIR" ] || [ -z "$(ls -A "$STORAGE_DIR" 2>/dev/null)" ]; then
    echo "   ⚠️  No storage files found in backup, skipping..."
else
    # Check if logged into Supabase
    if ! supabase projects list &>/dev/null; then
        echo "   Please log into Supabase CLI..."
        supabase login
    fi

    echo "   Uploading files to '$BUCKET_NAME'..."
    supabase storage cp -r "$STORAGE_DIR/" "ss:///$BUCKET_NAME" --project-ref "$PROJECT_REF" 2>&1 || {
        echo "   ⚠️  Some files may have failed to upload. Check manually."
    }

    echo "   ✅ Storage restored"
fi

echo ""

# ============================================
# 3. SUMMARY
# ============================================
echo "================================================"
echo "  ✅ RESTORE COMPLETE"
echo "================================================"
echo ""
echo "Your HeritageWhisper data has been restored."
echo ""
echo "Next steps:"
echo "1. Verify in Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF"
echo "2. Test the application to ensure everything works"
echo "3. Check a few customer accounts to verify data integrity"
echo ""
