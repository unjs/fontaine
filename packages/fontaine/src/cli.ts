#!/usr/bin/env node
import { analyzeFonts } from './index.js';
import { JsonFormatter, CssFormatter } from './formatter.js';
import { parseArgs } from 'node:util';

const options = {
  format: {
    type: 'string',
    short: 'f',
    default: 'json',
  },
};

const { values, positionals } = parseArgs({ options, allowPositionals: true });

async function main() {
  const source = positionals[0];

  if (!source) {
    console.error('Usage: fontaine <source> [-f json|css]');
    process.exit(1);
  }

  const formatter = values.format === 'css' ? new CssFormatter() : new JsonFormatter();
  const response = await analyzeFonts(source);

  if (!response.success) {
    console.error(`Error: ${response.error.message}`);
    process.exit(1);
  }

  console.log(formatter.format(response.data));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
