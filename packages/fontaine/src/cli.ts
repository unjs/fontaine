#!/usr/bin/env node
import { runAnalysis } from './pipeline.js';
import { JsonFormatter, CssFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  const format = args[1] === '--css' ? new CssFormatter() : new JsonFormatter();

  if (!url) {
    console.error('Usage: fontaine <url> [--css]');
    process.exit(1);
  }

  try {
    const output = await runAnalysis(url, { formatter: format });
    process.stdout.write(output + '\n');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.name}] ${error.message}`);
    } else {
      console.error('Unexpected system error occurred');
    }
    process.exit(1);
  }
}

main();
