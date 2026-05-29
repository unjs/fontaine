#!/usr/bin/env node

import { analyzeFonts } from './pipeline.js';
import { FontaineError, FontaineFetchError, FontaineValidationError } from './errors.js';

async function main() {
  const [,, source, format = 'json'] = process.argv;

  if (!source) {
    console.error('Usage: fontaine <source> [json|css]');
    process.exit(1);
  }

  try {
    const result = await analyzeFonts(source, { format: format as any });
    process.stdout.write(result + '\n');
    process.exit(0);
  } catch (error) {
    if (error instanceof FontaineFetchError) {
      console.error(`Network/FS Error: ${error.message}`);
      process.exit(2);
    }
    if (error instanceof FontaineValidationError) {
      console.error(`Validation Error: ${error.message}`);
      process.exit(1);
    }
    if (error instanceof FontaineError) {
      console.error(`Analysis Error: ${error.message}`);
      process.exit(1);
    }
    
    console.error('Unexpected Error:', error);
    process.exit(3);
  }
}

main();
