#!/usr/bin/env node
/**
 * Script to add passkey session support to API routes
 * 
 * This script automatically updates API routes that only have JWT auth
 * to also support passkey sessions.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';

// Routes that already have passkey support (skip these)
const ROUTES_WITH_PASSKEY = new Set([
  'auth/me/route.ts',
  'accounts/available/route.ts',
  'stories/route.ts',
  'stories/[id]/route.ts',
  'stories/move/route.ts',
  'user/profile/route.ts',
  'chapters/route.ts',
  'chapters/organize/route.ts',
  'chapters/reorder/route.ts',
  'passkey/manage/route.ts',
  'upload/photo/route.ts', // Just fixed
  'upload/audio/route.ts', // Just fixed
  'upload/profile-photo/route.ts', // Just fixed
]);

// Check if a route file needs passkey support
function needsPasskeySupport(content) {
  // Check if it already has getPasskeySession
  if (content.includes('getPasskeySession')) {
    return false;
  }
  
  // Check if it uses supabaseAdmin.auth.getUser (JWT only)
  if (content.includes('supabaseAdmin.auth.getUser')) {
    return true;
  }
  
  return false;
}

// Add passkey import if not present
function addPasskeyImport(content) {
  if (content.includes('getPasskeySession')) {
    return content;
  }
  
  // Find the last import statement
  const importRegex = /^import\s+.+from\s+['"].+['"];?\s*$/gm;
  const imports = content.match(importRegex) || [];
  
  if (imports.length === 0) {
    // No imports found, add at the top
    return `import { getPasskeySession } from "@/lib/iron-session";\n\n${content}`;
  }
  
  // Add after the last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;
  
  return content.slice(0, insertPosition) + '\nimport { getPasskeySession } from "@/lib/iron-session";' + content.slice(insertPosition);
}

// Replace JWT-only auth pattern with dual auth pattern
function addPasskeyAuth(content) {
  // Pattern 1: Simple auth check at function start
  const simplePattern = /(\s+try\s*\{[\s\S]*?)\/\/\s*Get the Authorization header[\s\S]*?const authHeader = request\.headers\.get\("authorization"\);[\s\S]*?const token = authHeader && authHeader\.split\(" "\)\[1\];[\s\S]*?if \(!token\) \{[\s\S]*?return NextResponse\.json\([\s\S]*?\{ error: "Authentication required" \},[\s\S]*?\{ status: 401 \},?[\s\S]*?\);[\s\S]*?\}[\s\S]*?\/\/\s*Verify the JWT token[\s\S]*?const \{[\s\S]*?data: \{ user \},[\s\S]*?error:?\s*\w*,?[\s\S]*?\} = await supabaseAdmin\.auth\.getUser\(token\);[\s\S]*?if \((?:authError|error) \|\| !user\) \{[\s\S]*?return NextResponse\.json\([\s\S]*?\{ error: "Invalid authentication" \},[\s\S]*?\{ status: 401 \},?[\s\S]*?\);[\s\S]*?\}/g;

  let replaced = content.replace(simplePattern, (match, prefix) => {
    return `${prefix}let userId: string | undefined;

    // 1. Try passkey session first
    const passkeySession = await getPasskeySession();
    if (passkeySession) {
      userId = passkeySession.userId;
    } else {
      // 2. Fall back to Supabase auth
      const authHeader = request.headers.get("authorization");
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Verify the JWT token with Supabase
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return NextResponse.json(
          { error: "Invalid authentication" },
          { status: 401 },
        );
      }
      userId = user.id;
    }`;
  });

  // Replace user.id with userId throughout
  replaced = replaced.replace(/\buser\.id\b/g, 'userId');
  
  // Fix the userId = user.id line that was just created (don't replace that one)
  replaced = replaced.replace(/userId = userId;/g, 'userId = user.id;');
  
  return replaced;
}

// Main execution
async function main() {
  console.log('🔍 Finding API routes that need passkey support...\n');
  
  // Find all route.ts files in app/api
  const routeFiles = await glob('app/api/**/route.ts', {
    cwd: process.cwd(),
    absolute: true,
  });
  
  console.log(`Found ${routeFiles.length} total API routes\n`);
  
  const filesToUpdate = [];
  
  for (const file of routeFiles) {
    const relativePath = file.replace(process.cwd() + '/app/api/', '');
    
    // Skip routes that already have passkey support
    if (ROUTES_WITH_PASSKEY.has(relativePath)) {
      console.log(`⏭️  Skipping ${relativePath} (already has passkey support)`);
      continue;
    }
    
    const content = readFileSync(file, 'utf-8');
    
    if (needsPasskeySupport(content)) {
      filesToUpdate.push({ file, relativePath });
      console.log(`✅ ${relativePath} needs updating`);
    } else {
      console.log(`⏭️  Skipping ${relativePath} (doesn't need passkey support)`);
    }
  }
  
  console.log(`\n📝 Found ${filesToUpdate.length} files to update\n`);
  
  if (filesToUpdate.length === 0) {
    console.log('✨ All routes already have passkey support!');
    return;
  }
  
  console.log('🚀 Updating routes...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const { file, relativePath } of filesToUpdate) {
    try {
      let content = readFileSync(file, 'utf-8');
      
      // Add passkey import
      content = addPasskeyImport(content);
      
      // Add passkey auth pattern
      content = addPasskeyAuth(content);
      
      // Write back to file
      writeFileSync(file, content, 'utf-8');
      
      console.log(`✅ Updated ${relativePath}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error updating ${relativePath}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n✨ Complete!`);
  console.log(`   ✅ ${successCount} files updated successfully`);
  if (errorCount > 0) {
    console.log(`   ❌ ${errorCount} files failed`);
  }
  console.log('\n💡 Please run TypeScript check to verify: npx tsc --noEmit');
}

main().catch(console.error);
