#!/usr/bin/env node
import { resolveFontSource } from './resolver.js';
import { formatAnalysis } from './formatter.js';
import { FontaineError } from './errors.js';
import { analyzeFont } from './metrics.js';

async function main() {
  const args = process.argv.slice(2);
  const source = args[0];
  const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] as 'css' | 'json' || 'css';

  if (!source) {
    console.error('Usage: fontaine <source> [--format=css|json]');
    process.exit(1);
  }

  try {
    const buffer = await resolveFontSource(source);
    const metrics = await analyzeFont(buffer);
    const output = formatAnalysis(metrics, format);
    process.stdout.write(output + '\n');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.name}] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', (error as Error).message);
    }
    process.exit(1);
  }
}

main().catch(() => process.exit(1));
