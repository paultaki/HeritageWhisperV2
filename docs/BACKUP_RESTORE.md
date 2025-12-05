# HeritageWhisper Backup & Restore Guide

## Quick Reference

| Action | Command |
|--------|---------|
| **Create backup** | `./scripts/backup-full.sh` |
| **Restore backup** | `./scripts/restore-full.sh "/Volumes/OWC Express 1M2/HW Supabase Backup/YYYY-MM-DD_HHMMSS"` |
| **View backups** | `ls "/Volumes/OWC Express 1M2/HW Supabase Backup/"` |
| **Open in Finder** | `open "/Volumes/OWC Express 1M2/HW Supabase Backup/"` |

---

## What Gets Backed Up

| Component | Included | Notes |
|-----------|----------|-------|
| All database tables | ✅ | stories, users, photos, prompts, etc. |
| RLS policies & functions | ✅ | Security rules preserved |
| Customer photos | ✅ | All uploaded images |
| Customer audio recordings | ✅ | All voice recordings |
| File-to-story relationships | ✅ | Everything stays connected |

---

## Creating a Backup

```bash
cd ~/Development/HeritageWhisper
./scripts/backup-full.sh
```

The script will:
1. Dump the entire database (tables, data, RLS policies, functions)
2. Download all storage files (photos, audio)
3. Save everything to your external drive

### Backup Contents

```
/Volumes/OWC Express 1M2/HW Supabase Backup/2025-12-04_211013/
├── database.dump    # Binary backup (for fast restore)
├── database.sql     # Human-readable SQL (can inspect)
├── storage/         # All customer files
│   ├── audio/       # Voice recordings
│   └── photos/      # Uploaded images
└── MANIFEST.txt     # Backup summary
```

---

## Restoring from Backup

### To a New Supabase Project

1. Create a new Supabase project
2. Update `.env.local` with new project credentials
3. Run restore:

```bash
./scripts/restore-full.sh "/Volumes/OWC Express 1M2/HW Supabase Backup/2025-12-04_211013"
```

### To Existing Project (Disaster Recovery)

⚠️ **Warning**: This overwrites existing data!

```bash
./scripts/restore-full.sh "/Volumes/OWC Express 1M2/HW Supabase Backup/2025-12-04_211013"
```

---

## Recommended Backup Schedule

| Frequency | Reason |
|-----------|--------|
| **Weekly** | Minimum for production with active users |
| **Before major changes** | Before schema migrations or big updates |
| **Before deployments** | Safety net for rollbacks |

### Automating Backups (Optional)

Add to crontab for automatic weekly backups:

```bash
crontab -e
```

Add this line (runs every Sunday at 2 AM):
```
0 2 * * 0 /Users/paul/Development/HeritageWhisper/scripts/backup-full.sh >> "/Volumes/OWC Express 1M2/HW Supabase Backup/backup.log" 2>&1
```

⚠️ **Note**: Automated backups require the external drive to be connected.

---

## Offsite Backup Recommendations

For true disaster recovery, copy backups to a separate location:

- **External drive**: `cp -r ~/Backups/HeritageWhisper /Volumes/ExternalDrive/`
- **Cloud storage**: Upload to Google Drive, Dropbox, or S3
- **Different region**: Store in a different geographic location

---

## Troubleshooting

### "Database password required"
The script uses the password from your `.env.local` file automatically. If prompted, just press Enter.

### "Cannot find package '@supabase/supabase-js'"
Run from the project directory:
```bash
cd ~/Development/HeritageWhisper
./scripts/backup-full.sh
```

### Storage download fails
Check your internet connection and Supabase service status at https://status.supabase.com/

### Restore fails with "already exists" errors
This is normal - the restore script uses `--clean --if-exists` to handle this.

---

## File Locations

| Item | Path |
|------|------|
| Backup script | `~/Development/HeritageWhisper/scripts/backup-full.sh` |
| Restore script | `~/Development/HeritageWhisper/scripts/restore-full.sh` |
| Backups folder | `/Volumes/OWC Express 1M2/HW Supabase Backup/` |
| Environment config | `~/Development/HeritageWhisper/.env.local` |

---

*Last updated: December 2025*
