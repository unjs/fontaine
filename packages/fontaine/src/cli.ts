#!/usr/bin/env node
import { analyzeFont, getFormatter } from './index.js';
import { FontaineError } from './errors.js';

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  const format = args[1] || 'json';

  if (!url) {
    console.error('Usage: fontaine <url> [json|css]');
    process.exit(1);
  }

  try {
    const result = await analyzeFont({ url });
    const formatter = getFormatter(format);
    process.stdout.write(formatter.format(result) + '\n');
  } catch (err) {
    if (err instanceof FontaineError) {
      console.error(`[Fontaine Error] ${err.message}`);
    } else {
      console.error(`[Unexpected Error] ${(err as Error).message}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
