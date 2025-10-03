#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const configPath = path.join(process.env.HOME, '.claude.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Setting up Supabase MCP with your access token...\n');

rl.question('Please enter your Supabase access token: ', (accessToken) => {
  try {
    // Read the current config
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (readError) {
      console.error('Error reading config file:', readError.message);
      console.log('\nMake sure ~/.claude.json exists and is valid JSON.');
      rl.close();
      return;
    }

    // Find the current project's mcpServers
    const projectPath = '/Users/paul/Documents/DevProjects/HeritageWhisperV2';

    // Initialize projects structure if it doesn't exist
    if (!config.projects) {
      config.projects = {};
    }

    // Initialize the project if it doesn't exist
    if (!config.projects[projectPath]) {
      config.projects[projectPath] = {};
    }

    // Initialize mcpServers if it doesn't exist
    if (!config.projects[projectPath].mcpServers) {
      config.projects[projectPath].mcpServers = {};
    }

    // Update the supabase configuration
    config.projects[projectPath].mcpServers.supabase = {
      type: "http",
      url: "https://mcp.supabase.com",
      headers: {
        "Authorization": `Bearer ${accessToken.trim()}`
      }
    };

    // Write the updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('\n✅ Supabase MCP configured successfully!');
    console.log('You can now use Supabase MCP in Claude.');
    console.log('\nTo test it, start a new Claude session and use /mcp to authenticate.');
  } catch (error) {
    console.error('Error updating configuration:', error.message);
    console.error('Full error:', error);
  }

  rl.close();
});