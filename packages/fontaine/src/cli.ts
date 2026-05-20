#!/usr/bin/env node
import { fontaine } from './index';
import { FontaineError } from './errors';
import { writeFileSync } from 'node:fs';

async function main() {
  const [,, input, output] = process.argv;

  if (!input || !output) {
    console.error('Usage: fontaine <input> <output>');
    process.exit(1);
  }

  try {
    const result = await fontaine(input);
    writeFileSync(output, result);
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.name}] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main();
