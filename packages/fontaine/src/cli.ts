#!/usr/bin/env node
import { analyzeFonts, FontaineError } from './index.js';

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Usage: fontaine <source>');
    process.exit(1);
  }

  try {
    const results = await analyzeFonts(source);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.code}] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
