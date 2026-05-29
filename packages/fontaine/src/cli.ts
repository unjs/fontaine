#!/usr/bin/env node
import { analyzeFont, transformCss } from './index';
import { resolve } from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'analyze') {
    const source = args[1];
    if (!source) {
      console.error('Missing font source path');
      process.exit(1);
    }
    try {
      const result = await analyzeFont(resolve(source));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  } else if (command === 'transform') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Missing CSS file path');
      process.exit(1);
    }
    // logic for reading file and passing to transformCss
  } else {
    console.log('Usage: fontaine <analyze|transform> [path]');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
