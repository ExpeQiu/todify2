import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// DB Path
const DB_PATH = path.join(__dirname, '../data/todify3.db');

// User provided Configuration
const LLM_CONFIG = {
  provider: 'openai',
  apiKey: 'sk-W9R6t5GGTgvHscUJWdD5oaDu2odrMM3PBxJD99e5m8PWWirs',
  apiBaseUrl: 'https://api.openai-proxy.org/v1',
  model: 'gpt-4o'
};

async function updateRoles() {
  let db;
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    console.log('Connected to database at:', DB_PATH);

    // Get all roles with system_prompt
    const roles = await db.all('SELECT id, name, dify_config, system_prompt FROM ai_roles');
    console.log(`Found ${roles.length} roles to update.`);

    for (const role of roles) {
      console.log(`Updating config for role: ${role.name} (${role.id})...`);
      
      // Construct valid agentConfig
      // We must include prompt and contextStrategy because AgentOrchestrator requires them for direct-agent
      
      const systemPrompt = role.system_prompt || "You are a helpful AI assistant.";
      
      const configJson = JSON.stringify({
        provider: 'direct-agent',
        agentConfig: {
          llm: {
            provider: LLM_CONFIG.provider,
            apiKey: LLM_CONFIG.apiKey,
            apiBaseUrl: LLM_CONFIG.apiBaseUrl,
            model: LLM_CONFIG.model,
            temperature: 0.7,
            maxTokens: 4000
          },
          prompt: {
            systemPrompt: systemPrompt,
            variables: []
          },
          contextStrategy: {
            type: 'window',
            maxMessages: 20,
            maxTokens: 2000,
            includeSystemPrompt: true
          }
        }
      });

      await db.run(
        `UPDATE ai_roles 
         SET dify_config = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [configJson, role.id]
      );
      
      console.log(`✅ Updated ${role.name}`);
    }

    // Verify updates
    console.log('\nVerifying updates...');
    const updatedRoles = await db.all('SELECT name, substr(dify_config, 1, 100) as config_preview FROM ai_roles');
    console.table(updatedRoles);

  } catch (error) {
    console.error('Error updating roles:', error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

updateRoles();
