#!/bin/bash
#
# HeritageWhisper Full Backup Script
# Backs up: Database (all tables, RLS, functions) + Storage (all files)
#
# Usage: ./scripts/backup-full.sh
#

set -e

# Configuration - from .env.local
PROJECT_REF="pwuzksomxnbdndeeivzf"
BUCKET_NAME="heritage-whisper-files"
BACKUP_ROOT="/Volumes/OWC Express 1M2/HW Supabase Backup"

# Database connection from DATABASE_URL
DB_HOST="aws-0-us-west-2.pooler.supabase.com"
DB_USER="postgres.$PROJECT_REF"
DB_NAME="postgres"
DB_PORT="5432"

# Check if external drive is connected
if [ ! -d "$BACKUP_ROOT" ]; then
    echo "❌ External drive not found: $BACKUP_ROOT"
    echo "   Please connect your OWC Express drive and try again."
    exit 1
fi

# Create dated backup folder
BACKUP_DATE=$(date +%Y-%m-%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$BACKUP_DATE"
mkdir -p "$BACKUP_DIR"

echo "================================================"
echo "  HeritageWhisper Full Backup"
echo "  $(date)"
echo "================================================"
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""

# ============================================
# 1. DATABASE BACKUP
# ============================================
echo "📦 Step 1/2: Backing up database..."

# Get database password
PASSWORD_FILE="$HOME/.heritagewhisper/db-password"
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    if [ -f "$PASSWORD_FILE" ]; then
        SUPABASE_DB_PASSWORD=$(cat "$PASSWORD_FILE")
        echo "   Using stored database password"
    else
        echo ""
        echo "   Get your password from: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
        echo ""
        read -sp "   Enter database password: " SUPABASE_DB_PASSWORD
        echo ""
    fi
fi

# Export password for pg_dump
export PGPASSWORD="$SUPABASE_DB_PASSWORD"

# Run pg_dump
echo "   Connecting to $DB_HOST..."
echo "   Dumping database (this may take a minute)..."

if /opt/homebrew/opt/postgresql@17/bin/pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -b \
    -f "$BACKUP_DIR/database.dump" 2>&1; then
    echo "   Binary dump complete."
else
    echo "   ⚠️  Binary dump had issues."
fi

# Also create a plain SQL backup (easier to read/restore)
echo "   Creating SQL backup..."
/opt/homebrew/opt/postgresql@17/bin/pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --clean \
    --if-exists \
    -f "$BACKUP_DIR/database.sql" 2>&1 || echo "   SQL backup had issues."

unset PGPASSWORD

DB_SIZE=$(du -h "$BACKUP_DIR/database.dump" 2>/dev/null | cut -f1 || echo "0B")
echo "   ✅ Database backed up ($DB_SIZE)"
echo ""

# ============================================
# 2. STORAGE BACKUP (using Node.js script)
# ============================================
echo "📷 Step 2/2: Backing up storage files..."

STORAGE_DIR="$BACKUP_DIR/storage"
mkdir -p "$STORAGE_DIR"

# Create a Node.js script to download storage files (in project dir for module resolution)
DOWNLOAD_SCRIPT="/Users/paul/Development/HeritageWhisper/scripts/download-storage-temp.mjs"
cat > "$DOWNLOAD_SCRIPT" << 'NODESCRIPT'
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucketName = process.env.BUCKET_NAME;
const outputDir = process.env.OUTPUT_DIR;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllFiles(bucket, path = '') {
  const files = [];
  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit: 1000,
    offset: 0,
  });

  if (error) {
    console.error(`Error listing ${path}:`, error.message);
    return files;
  }

  for (const item of data || []) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder, recurse
      const subFiles = await listAllFiles(bucket, fullPath);
      files.push(...subFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function downloadFile(bucket, filePath, outputDir) {
  const { data, error } = await supabase.storage.from(bucket).download(filePath);

  if (error) {
    console.error(`  ❌ ${filePath}: ${error.message}`);
    return false;
  }

  const outputPath = join(outputDir, filePath);
  await mkdir(dirname(outputPath), { recursive: true });

  const buffer = Buffer.from(await data.arrayBuffer());
  await writeFile(outputPath, buffer);
  console.log(`  ✓ ${filePath}`);
  return true;
}

async function main() {
  console.log(`   Listing files in '${bucketName}'...`);
  const files = await listAllFiles(bucketName);
  console.log(`   Found ${files.length} files to download.`);

  let downloaded = 0;
  for (const file of files) {
    if (await downloadFile(bucketName, file, outputDir)) {
      downloaded++;
    }
  }

  console.log(`   Downloaded ${downloaded}/${files.length} files.`);
}

main().catch(console.error);
NODESCRIPT

# Run the Node.js script from the project directory (where node_modules is)
echo "   Downloading files..."
cd /Users/paul/Development/HeritageWhisper
SUPABASE_URL="https://$PROJECT_REF.supabase.co" \
SUPABASE_SERVICE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY /Users/paul/Development/HeritageWhisper/.env.local | cut -d= -f2)" \
BUCKET_NAME="$BUCKET_NAME" \
OUTPUT_DIR="$STORAGE_DIR" \
node "$DOWNLOAD_SCRIPT" 2>&1 || {
    echo "   ⚠️  Storage download had issues."
}
cd - > /dev/null

# Clean up temp script
rm -f "$DOWNLOAD_SCRIPT"

STORAGE_SIZE=$(du -sh "$STORAGE_DIR" 2>/dev/null | cut -f1 || echo "0")
STORAGE_COUNT=$(find "$STORAGE_DIR" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "   ✅ Storage backed up ($STORAGE_COUNT files, $STORAGE_SIZE)"
echo ""

# ============================================
# 3. SUMMARY
# ============================================
echo "================================================"
echo "  ✅ BACKUP COMPLETE"
echo "================================================"
echo ""
echo "Location: $BACKUP_DIR"
echo ""
echo "Contents:"
echo "  📦 database.dump  - Full database (binary, for pg_restore)"
echo "  📄 database.sql   - Full database (SQL, human-readable)"
echo "  📁 storage/       - All photos, audio, and files ($STORAGE_COUNT files)"
echo ""
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
echo "Total backup size: $TOTAL_SIZE"
echo ""
echo "To restore from this backup, run:"
echo "  ./scripts/restore-full.sh $BACKUP_DIR"
echo ""

# Create a manifest
echo "HeritageWhisper Backup Manifest" > "$BACKUP_DIR/MANIFEST.txt"
echo "===============================" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Date: $(date)" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Project: $PROJECT_REF" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Database size: $DB_SIZE" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Storage files: $STORAGE_COUNT" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Storage size: $STORAGE_SIZE" >> "$BACKUP_DIR/MANIFEST.txt"
echo "Total size: $TOTAL_SIZE" >> "$BACKUP_DIR/MANIFEST.txt"
