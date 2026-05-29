#!/usr/bin/env node
import { runAnalysisPipeline } from './pipeline.js';
import { formatMetrics } from './formatter.js';
import { FontaineError } from './errors.js';

async function main() {
  const args = process.argv.slice(2);
  const source = args[0];
  const format = (args[1] as 'json' | 'css') || 'json';

  if (!source) {
    console.error('Usage: fontaine <source> [json|css]');
    process.exit(1);
  }

  try {
    const metrics = await runAnalysisPipeline({ source });
    const output = formatMetrics(metrics, format);
    process.stdout.write(output + '\n');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.code}] ${error.message}`);
      process.exit(error instanceof FontaineFetchError && error.status === 404 ? 44 : 1);
    }
    console.error('An unexpected error occurred');
    process.exit(1);
  }
}

main().catch(() => process.exit(1));
