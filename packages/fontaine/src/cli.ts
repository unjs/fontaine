#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { transformFont } from './transform';
import { FontaineError } from './errors';

const options = {
  source: { type: 'string', short: 's' },
  output: { type: 'string', short: 'o' },
};

async function main() {
  try {
    const { values } = parseArgs({ options, tokens: true });
    
    if (!values.source || !values.output) {
      console.error('Usage: fontaine -s <source> -o <output>');
      process.exit(1);
    }

    await transformFont({
      source: values.source as string,
      output: values.output as string,
    });
    
    console.log('Font transformation complete.');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[Fontaine Error] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

main();
