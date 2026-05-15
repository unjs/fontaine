#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { transformCssFile } from './index.js';

const { values } = parseArgs({
  options: {
    input: { type: 'string', short: 'i' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.input || !values.output) {
  console.error('Usage: fontaine --input <file> --output <file>');
  process.exit(1);
}

try {
  await transformCssFile(values.input as string, values.output as string);
} catch (error) {
  console.error(`Transformation failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
