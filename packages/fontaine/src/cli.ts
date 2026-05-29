#!/usr/bin/env node
import { cac } from 'cac';
import { analyze, transform } from './index.js';
import { FontaineError } from './errors.js';

const cli = cac('fontaine');

cli.command('analyze <source>', 'Analyze a font source')
  .option('--format <format>', 'Output format (json|css)', { default: 'json' })
  .action(async (source, options) => {
    try {
      const result = await analyze({ source, format: options.format as 'json' | 'css' });
      process.stdout.write(result + '\n');
    } catch (err) {
      handleError(err);
    }
  });

cli.command('transform <input>', 'Transform CSS font declarations')
  .option('--output <output>', 'Output file path')
  .action(async (input, options) => {
    try {
      const result = await transform({ input, output: options.output });
      if (!options.output) process.stdout.write(result + '\n');
    } catch (err) {
      handleError(err);
    }
  });

function handleError(err: unknown) {
  if (err instanceof FontaineError) {
    process.stderr.write(`Error: [${err.name}] ${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`Unexpected Error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}

cli.help();
cli.parse();
