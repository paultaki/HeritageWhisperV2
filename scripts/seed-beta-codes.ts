#!/usr/bin/env tsx
/**
 * Beta Code Seeding Script
 * 
 * Generates generic beta codes for admin distribution.
 * 
 * Usage:
 *   npx tsx scripts/seed-beta-codes.ts --count=10
 *   npx tsx scripts/seed-beta-codes.ts --count=50 --expires=2025-12-31
 */

import { createGenericBetaCodes } from '../lib/betaCodes';

interface Args {
  count: number;
  expires?: string;
}

function parseArgs(): Args {
  const args: Args = { count: 10 };
  
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--count=')) {
      args.count = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--expires=')) {
      args.expires = arg.split('=')[1];
    }
  });
  
  return args;
}

async function main() {
  console.log('\n🎫 Beta Code Generator\n');
  
  const args = parseArgs();
  
  // Validate count
  if (isNaN(args.count) || args.count < 1 || args.count > 1000) {
    console.error('❌ Error: Count must be between 1 and 1000');
    process.exit(1);
  }
  
  // Validate expiry date if provided
  if (args.expires) {
    const expiryDate = new Date(args.expires);
    if (isNaN(expiryDate.getTime())) {
      console.error('❌ Error: Invalid expiry date format. Use YYYY-MM-DD');
      process.exit(1);
    }
    if (expiryDate < new Date()) {
      console.error('❌ Error: Expiry date must be in the future');
      process.exit(1);
    }
  }
  
  console.log(`Generating ${args.count} beta codes...`);
  if (args.expires) {
    console.log(`Expiry date: ${args.expires}`);
  }
  console.log('');
  
  try {
    const codes = await createGenericBetaCodes(
      args.count,
      args.expires ? new Date(args.expires).toISOString() : undefined
    );
    
    console.log('✅ Successfully generated codes:\n');
    console.log('━'.repeat(50));
    codes.forEach((code, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${code}`);
    });
    console.log('━'.repeat(50));
    console.log(`\n✨ Generated ${codes.length} beta codes`);
    console.log('\nYou can now distribute these codes to your beta testers.');
    console.log('Each code can be used once during signup.\n');
  } catch (error) {
    console.error('\n❌ Error generating codes:');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
