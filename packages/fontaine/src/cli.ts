#!/usr/bin/env node
import { analyzeFonts } from './pipeline.js';
import { formatResult } from './formatter.js'; // Assuming this exists
import { parseArgs } from 'node:util';

async function main() {
  const { positionals, values } = parseArgs({
    options: {
      output: { type: 'string', short: 'o' },
    },
    allowPositionals: true,
  });

  const target = positionals[0];

  if (!target) {
    console.error('Usage: fontaine <path|url> [-o output]');
    process.exit(1);
  }

  const result = await analyzeFonts(target);

  if (!result.success) {
    console.error(`Error: ${result.error.message}`);
    process.exit(1);
  }

  const output = formatResult(result.data);
  if (values.output) {
    // Logic to write to file
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
