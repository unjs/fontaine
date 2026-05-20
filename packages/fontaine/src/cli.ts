#!/usr/bin/env node
import { fontaine, FontaineError } from './index.js';
import { parseArgs } from 'node:util';

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      format: { type: 'string', short: 'f', default: 'css' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: false,
  });

  if (values.help) {
    console.log('Usage: fontaine <source> [--format css|json]');
    process.exit(0);
  }

  const source = process.argv[2];
  if (!source) {
    console.error('Error: Missing source path or URL');
    process.exit(1);
  }

  try {
    const result = await fontaine(source, { format: values.format as any });
    process.stdout.write(result + '\n');
  } catch (err) {
    if (err instanceof FontaineError) {
      console.error(`[Fontaine] ${err.message}`);
    } else {
      console.error('An unexpected error occurred', err);
    }
    process.exit(1);
  }
}

main().catch(() => process.exit(1));
