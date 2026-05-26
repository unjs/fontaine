#!/usr/bin/env node
import { runAnalysis } from './pipeline.js';
import { formatterRegistry } from './formatter.js';
import { AnalysisOptions } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: fontaine <source> [--format=json|text]');
    process.exit(1);
  }

  const source = args[0];
  const formatArg = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'text';

  const options: AnalysisOptions = {
    source,
    strict: true
  };

  try {
    const result = await runAnalysis(options);
    const formatter = formatterRegistry.get(formatArg);
    process.stdout.write(formatter.format(result) + '\n');
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(() => process.exit(1));
}
