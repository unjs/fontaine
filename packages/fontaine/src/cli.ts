#!/usr/bin/env node
import { analyzeUrl } from './url-analyzer';
import { FormatterRegistry } from './formatter';
import { FontaineError } from './errors';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: fontaine <url> [--format=json|text]');
    process.exit(64); // EX_USAGE
  }

  const url = args[0];
  const formatArg = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'json';

  try {
    const metrics = await analyzeUrl(url);
    const formatter = FormatterRegistry.get(formatArg);
    process.stdout.write(formatter(metrics) + '\n');
    process.exit(0);
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`Error [${error.code}]: ${error.message}`);
      process.exit(error.statusCode || 1);
    }
    console.error('Internal System Error:', error);
    process.exit(70); // EX_SOFTWARE
  }
}

main();
