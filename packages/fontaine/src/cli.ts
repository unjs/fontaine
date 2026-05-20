#!/usr/bin/env node
import { resolveFont } from './resolver';
import { analyzeFont } from './metrics';
import { transformCss } from './transform';
import { FontaineError } from './errors';
import { readFileSync, writeFileSync } from 'node:fs';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: fontaine <url|css-path> [output-path]');
    process.exit(1);
  }

  const input = args[0];
  const output = args[1];

  try {
    if (input.endsWith('.css')) {
      // Bulk Transformation
      const cssContent = readFileSync(input, 'utf8');
      const result = await transformCss(cssContent);
      if (output) {
        writeFileSync(output, result);
      } else {
        console.log(result);
      }
    } else {
      // Atomic Analysis
      const fontBuffer = await resolveFont(input);
      const overrides = await analyzeFont(fontBuffer);
      console.log(JSON.stringify(overrides, null, 2));
    }
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.code}] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main();
