import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load .env.local file
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USER_ID = '38ad3036-e423-4e41-a3f3-020664a1ee0e';
const OUTPUT_DIR = './public/demo-files';

console.log('📥 Downloading all demo files...\n');

// Create output directory
mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'photos'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'audio'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'profile'), { recursive: true });

// Get all files from Supabase Storage
const { data: files, error } = await supabase.storage
  .from('heritage-whisper-files')
  .list('', {
    limit: 10000,
    search: DEMO_USER_ID,
  });

if (error) {
  console.error('❌ Error listing files:', error);
  process.exit(1);
}

console.log(`Found ${files?.length || 0} files\n`);

// Download each file
let downloadedCount = 0;
const fileMap = {}; // Map old paths to new paths

for (const file of files || []) {
  try {
    // Get file path
    const remotePath = file.name;

    // Determine local path based on file type
    let localPath;
    if (remotePath.includes('/photo/')) {
      localPath = join(OUTPUT_DIR, 'photos', `photo-${downloadedCount}.webp`);
    } else if (remotePath.includes('/audio/')) {
      const ext = remotePath.endsWith('.mp3') ? 'mp3' : 'webm';
      localPath = join(OUTPUT_DIR, 'audio', `audio-${downloadedCount}.${ext}`);
    } else if (remotePath.includes('/profile-photos/')) {
      localPath = join(OUTPUT_DIR, 'profile', 'profile.jpg');
    } else {
      continue; // Skip other files
    }

    // Download file
    const { data, error: downloadError } = await supabase.storage
      .from('heritage-whisper-files')
      .download(remotePath);

    if (downloadError) {
      console.log(`⚠️  Skip ${remotePath}: ${downloadError.message}`);
      continue;
    }

    // Save to disk
    const buffer = Buffer.from(await data.arrayBuffer());
    writeFileSync(localPath, buffer);

    // Map old path to new path
    fileMap[remotePath] = localPath.replace('./public/', '/');

    downloadedCount++;
    console.log(`✅ ${downloadedCount}. Downloaded ${remotePath} → ${localPath}`);

  } catch (err) {
    console.error(`❌ Error downloading ${file.name}:`, err.message);
  }
}

// Save file map for updating JSON
writeFileSync(
  join(OUTPUT_DIR, 'file-mapping.json'),
  JSON.stringify(fileMap, null, 2)
);

console.log(`\n✅ Downloaded ${downloadedCount} files to ${OUTPUT_DIR}`);
console.log(`📄 File mapping saved to ${OUTPUT_DIR}/file-mapping.json`);
console.log(`\n📝 Next step: Update demo-data.json with new local paths`);

process.exit(0);
