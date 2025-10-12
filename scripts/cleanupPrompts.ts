/**
 * Cleanup Poor Quality Prompts
 * 
 * Run this script to identify and remove prompts that don't meet quality standards.
 * 
 * Usage:
 *   npx tsx scripts/cleanupPrompts.ts [--dry-run] [--verbose]
 */

import { db } from "../lib/db";
import { activePrompts, promptHistory } from "../shared/schema";
import { assessPromptQuality, getQualityReport } from "../lib/promptQuality";
import { eq } from "drizzle-orm";

interface CleanupOptions {
  dryRun: boolean;
  verbose: boolean;
}

async function cleanupPrompts(options: CleanupOptions) {
  console.log("🔍 Scanning prompts for quality issues...\n");
  
  // Fetch all active prompts
  const prompts = await db.select().from(activePrompts);
  
  console.log(`Found ${prompts.length} active prompts\n`);
  
  let removedCount = 0;
  const issues: Array<{ id: string; text: string; issues: string[] }> = [];
  
  for (const prompt of prompts) {
    const report = getQualityReport(prompt.promptText);
    
    if (!report.isQuality) {
      removedCount++;
      
      const issueTypes = report.issues.map(i => `${i.type}: ${i.reason}`);
      issues.push({
        id: prompt.id,
        text: prompt.promptText,
        issues: issueTypes,
      });
      
      if (options.verbose) {
        console.log(`❌ Low quality (score: ${report.score}/100):`);
        console.log(`   "${prompt.promptText}"`);
        console.log(`   Issues: ${issueTypes.join(', ')}`);
        console.log(`   Word count: ${report.wordCount}\n`);
      }
      
      if (!options.dryRun) {
        // Move to history as 'retired' instead of deleting
        await db.insert(promptHistory).values({
          userId: prompt.userId,
          promptText: prompt.promptText,
          contextNote: prompt.contextNote,
          tier: prompt.tier,
          outcome: 'retired',
          retiredReason: `Quality issues: ${issueTypes.join(', ')}`,
          resolvedAt: new Date(),
        });
        
        // Remove from active prompts
        await db.delete(activePrompts).where(eq(activePrompts.id, prompt.id));
      }
    } else if (options.verbose) {
      console.log(`✅ Good quality (score: ${report.score}/100):`);
      console.log(`   "${prompt.promptText}"\n`);
    }
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Cleanup Summary");
  console.log("=".repeat(60));
  console.log(`Total prompts scanned: ${prompts.length}`);
  console.log(`High quality prompts: ${prompts.length - removedCount}`);
  console.log(`Low quality prompts: ${removedCount}`);
  
  if (options.dryRun) {
    console.log("\n⚠️  DRY RUN MODE - No changes made");
    console.log("Run without --dry-run to actually remove low quality prompts");
  } else {
    console.log(`\n✅ Removed ${removedCount} low quality prompts`);
  }
  
  // Show common issues
  if (issues.length > 0) {
    const issueTypeCounts: Record<string, number> = {};
    issues.forEach(issue => {
      issue.issues.forEach(i => {
        const type = i.split(':')[0];
        issueTypeCounts[type] = (issueTypeCounts[type] || 0) + 1;
      });
    });
    
    console.log("\n📋 Most common issues:");
    Object.entries(issueTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} prompts`);
      });
  }
  
  console.log("\n");
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CleanupOptions = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose') || args.includes('-v'),
};

// Run cleanup
cleanupPrompts(options)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  });
