#!/usr/bin/env node
import { runFontPipeline } from './pipeline.js';
import { FontaineError } from './errors.js';

async function main() {
  const args = process.argv.slice(2);
  const source = args[0];

  if (!source) {
    console.error('Usage: fontaine <font-source> [--json]');
    process.exit(1);
  }

  const isJson = args.includes('--json');

  try {
    const output = await runFontPipeline(source, {
      format: isJson ? 'json' : 'text',
    });
    process.stdout.write(output + '\n');
    process.exit(0);
  } catch (error) {
    if (error instanceof FontaineError) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(1);
    }
    process.stderr.write(`Unexpected Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

main();
