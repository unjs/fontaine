#!/usr/bin/env node
import { FontainePipeline } from './pipeline.js';
import { JsonFormatter, CssFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

async function main() {
  const args = process.argv.slice(2);
  const input = args[0];
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';

  if (!input) {
    console.error('Usage: fontaine <path|url> [--format=json|css]');
    process.exit(1);
  }

  const formatter = format === 'css' ? new CssFormatter() : new JsonFormatter();
  const pipeline = new FontainePipeline({ formatter });

  try {
    const result = await pipeline.run(input);
    process.stdout.write(result + '\n');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.code}] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main();
