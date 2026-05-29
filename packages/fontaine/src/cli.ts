#!/usr/bin/env node
import { analyzeFonts } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: fontaine <url1> <url2> ...');
    process.exit(1);
  }

  try {
    const output = await analyzeFonts(args);
    console.log(output.join('\n'));
  } catch (error: any) {
    console.error(`[${error.code || 'ERROR'}] ${error.message}`);
    process.exit(1);
  }
}

main();
