#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const configPath = path.join(process.env.HOME, '.claude.json');
const projectPath = '/Users/paul/Documents/DevProjects/HeritageWhisperV2';

console.log('🔍 Verifying MCP Setup...\n');

try {
  // Read the config
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  // Check if the project has MCP servers configured
  if (!config.projects || !config.projects[projectPath]) {
    console.log('❌ Project not found in configuration');
    console.log(`   Path: ${projectPath}`);
  } else {
    console.log('✅ Project found in configuration');

    const projectConfig = config.projects[projectPath];

    if (!projectConfig.mcpServers) {
      console.log('❌ No MCP servers configured for this project');
    } else {
      console.log('✅ MCP servers found:');

      const servers = Object.keys(projectConfig.mcpServers);
      servers.forEach(server => {
        const serverConfig = projectConfig.mcpServers[server];
        console.log(`   - ${server}: ${serverConfig.type} (${serverConfig.url || serverConfig.command || 'configured'})`);

        // Check if Supabase has auth header
        if (server === 'supabase') {
          if (serverConfig.headers && serverConfig.headers.Authorization) {
            console.log('     ✅ Authorization header present');
          } else {
            console.log('     ❌ Missing Authorization header');
          }
        }
      });

      // List expected servers that might be missing
      const expectedServers = ['supabase', 'vercel', 'vercel-heritage-whisper-v2'];
      const missingServers = expectedServers.filter(s => !servers.includes(s));

      if (missingServers.length > 0) {
        console.log('\n⚠️  Potentially missing servers:');
        missingServers.forEach(s => console.log(`   - ${s}`));
      }
    }
  }

  // Check global MCP servers
  console.log('\n📦 Global MCP servers:');
  if (config.mcpServers) {
    Object.keys(config.mcpServers).forEach(server => {
      const serverConfig = config.mcpServers[server];
      console.log(`   - ${server}: ${serverConfig.type}`);
    });
  } else {
    console.log('   None configured');
  }

  // Check if Claude is installed globally
  console.log('\n🔧 Claude CLI Status:');
  try {
    const claudeVersion = execSync('claude --version 2>/dev/null', { encoding: 'utf8' }).trim();
    console.log(`   ✅ Claude CLI installed: ${claudeVersion}`);
  } catch (e) {
    console.log('   ❌ Claude CLI not found or not in PATH');
  }

  // Check shell configuration for 'c' alias
  console.log('\n🐚 Shell Configuration:');
  const shellRc = process.env.SHELL.includes('zsh') ? '.zshrc' : '.bashrc';
  const shellRcPath = path.join(process.env.HOME, shellRc);

  try {
    const shellConfig = fs.readFileSync(shellRcPath, 'utf8');
    if (shellConfig.includes('alias c=')) {
      const aliasLine = shellConfig.split('\n').find(line => line.includes('alias c='));
      console.log(`   ✅ Found 'c' alias: ${aliasLine.trim()}`);
    } else {
      console.log(`   ❌ No 'c' alias found in ${shellRc}`);
      console.log('   To add it, run:');
      console.log(`   echo "alias c='cd ~/Documents/DevProjects && claude'" >> ~/${shellRc}`);
    }
  } catch (e) {
    console.log(`   ⚠️  Could not read ${shellRc}`);
  }

  // Provide instructions for starting Claude with MCPs
  console.log('\n💡 To start Claude with all MCPs:');
  console.log('   1. Close all Claude instances');
  console.log('   2. Open a new terminal');
  console.log('   3. Navigate to your project: cd ~/Documents/DevProjects/HeritageWhisperV2');
  console.log('   4. Start Claude: claude');
  console.log('   5. Use /mcp to authenticate MCPs that require it');

} catch (error) {
  console.error('❌ Error reading configuration:', error.message);
  console.log('\nPlease ensure ~/.claude.json exists and is valid JSON');
}