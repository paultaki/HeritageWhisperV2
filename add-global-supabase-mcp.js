#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.HOME, '.claude.json');

console.log('Adding Supabase MCP to global configuration...\n');

try {
  // Read the current config
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Get the Supabase config from the project
  const projectPath = '/Users/paul/Documents/DevProjects/HeritageWhisperV2';
  let supabaseConfig = null;

  if (config.projects &&
      config.projects[projectPath] &&
      config.projects[projectPath].mcpServers &&
      config.projects[projectPath].mcpServers.supabase) {
    supabaseConfig = config.projects[projectPath].mcpServers.supabase;
    console.log('✅ Found Supabase config in project settings');
  }

  if (!supabaseConfig) {
    console.log('❌ No Supabase config found in project settings');
    process.exit(1);
  }

  // Initialize global mcpServers if it doesn't exist
  if (!config.mcpServers) {
    config.mcpServers = {};
    console.log('📦 Created global mcpServers section');
  }

  // Add Supabase to global MCP servers
  config.mcpServers.supabase = supabaseConfig;
  console.log('✅ Added Supabase to global MCP servers');

  // Also ensure DevProjects directory has the same config
  const devProjectsPath = '/Users/paul/Documents/DevProjects';
  if (!config.projects) {
    config.projects = {};
  }
  if (!config.projects[devProjectsPath]) {
    config.projects[devProjectsPath] = {};
  }
  if (!config.projects[devProjectsPath].mcpServers) {
    config.projects[devProjectsPath].mcpServers = {};
  }

  // Copy all MCP servers from HeritageWhisperV2 to DevProjects
  if (config.projects[projectPath] && config.projects[projectPath].mcpServers) {
    config.projects[devProjectsPath].mcpServers = {
      ...config.projects[devProjectsPath].mcpServers,
      ...config.projects[projectPath].mcpServers
    };
    console.log('✅ Copied all MCP servers to DevProjects directory configuration');
  }

  // Write the updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('\n✅ Configuration updated successfully!');
  console.log('\n🚀 Next steps:');
  console.log('1. Close all Claude instances');
  console.log('2. Open a new terminal');
  console.log('3. Type "c" and press Enter');
  console.log('4. Your MCPs should now load automatically');
  console.log('5. Use /mcp to authenticate if needed');

} catch (error) {
  console.error('❌ Error updating configuration:', error.message);
}