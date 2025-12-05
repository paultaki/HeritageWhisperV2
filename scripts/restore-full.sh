#!/bin/bash
#
# HeritageWhisper Full Restore Script
# Restores: Database + Storage files from a backup
#
# Usage: ./scripts/restore-full.sh /path/to/backup/folder
#

set -e

# Configuration
PROJECT_REF="pwuzksomxnbdndeeivzf"
BUCKET_NAME="heritage-whisper-files"
PROJECT_DIR="/Users/paul/Development/HeritageWhisper"

# Database connection
DB_HOST="aws-0-us-west-2.pooler.supabase.com"
DB_USER="postgres.$PROJECT_REF"
DB_NAME="postgres"
DB_PORT="5432"

# Check arguments
BACKUP_ROOT="/Volumes/OWC Express 1M2/HW Supabase Backup"

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore-full.sh /path/to/backup/folder"
    echo ""
    echo "Available backups:"
    ls -la "$BACKUP_ROOT" 2>/dev/null || echo "  No backups found (is external drive connected?)"
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

# Auto-extract password from DATABASE_URL in .env.local
DATABASE_URL=$(grep "^DATABASE_URL=" "$PROJECT_DIR/.env.local" | cut -d= -f2-)
SUPABASE_DB_PASSWORD=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))")
echo "   Using database password from .env.local"

export PGPASSWORD="$SUPABASE_DB_PASSWORD"

echo "   Restoring database (this may take a few minutes)..."
/opt/homebrew/opt/postgresql@17/bin/pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
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
    # Create upload script
    UPLOAD_SCRIPT="$PROJECT_DIR/scripts/upload-storage-temp.mjs"
    cat > "$UPLOAD_SCRIPT" << 'NODESCRIPT'
import { createClient } from '@supabase/supabase-js';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.BUCKET_NAME;
const inputDir = process.env.INPUT_DIR;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = fullPath.replace(baseDir + '/', '');
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

async function uploadFile(bucket, filePath, relativePath) {
  try {
    const fileBuffer = await readFile(filePath);
    const { error } = await supabase.storage.from(bucket).upload(relativePath, fileBuffer, {
      upsert: true
    });

    if (error) {
      console.error(`  ❌ ${relativePath}: ${error.message}`);
      return false;
    }
    console.log(`  ✓ ${relativePath}`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${relativePath}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`   Finding files in backup...`);
  const files = await getAllFiles(inputDir);
  console.log(`   Found ${files.length} files to upload.`);

  let uploaded = 0;
  for (const { fullPath, relativePath } of files) {
    if (await uploadFile(bucketName, fullPath, relativePath)) {
      uploaded++;
    }
  }

  console.log(`   Uploaded ${uploaded}/${files.length} files.`);
}

main().catch(console.error);
NODESCRIPT

    echo "   Uploading files to storage..."
    cd "$PROJECT_DIR"
    SUPABASE_URL="https://$PROJECT_REF.supabase.co" \
    SUPABASE_SERVICE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY "$PROJECT_DIR/.env.local" | cut -d= -f2)" \
    BUCKET_NAME="$BUCKET_NAME" \
    INPUT_DIR="$STORAGE_DIR" \
    node "$UPLOAD_SCRIPT" 2>&1 || {
        echo "   ⚠️  Some files may have failed to upload."
    }

    rm -f "$UPLOAD_SCRIPT"
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
