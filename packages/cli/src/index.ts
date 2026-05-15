import { Command } from 'commander';
import { SdkClient } from './client/sdk_client';

const program = new Command();
const client = new SdkClient({
  endpoint: process.env.MEMANTO_ENDPOINT || 'http://localhost:8080',
  apiKey: process.env.MEMANTO_API_KEY || 'default_key',
});

program
  .command('ingest')
  .requiredOption('-i, --agent-id <id>', 'Agent ID for namespace')
  .requiredOption('-c, --content <text>', 'Content to store')
  .action(async ({ agentId, content }) => {
    const response = await client.ingest(agentId, { 
      content, 
      metadata: { timestamp: Date.now() } 
    });
    console.log(JSON.stringify(response));
  });

program
  .command('recall')
  .requiredOption('-i, --agent-id <id>', 'Agent ID for namespace')
  .requiredOption('-q, --query <text>', 'Query string')
  .action(async ({ agentId, query }) => {
    const response = await client.recall(agentId, query);
    console.log(JSON.stringify(response));
  });

program.parse();
