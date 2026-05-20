#!/usr/bin/env node
import { cac } from 'cac';
import { analyze } from './index.js';
import { FontaineError } from './errors.js';

const cli = cac('fontaine');

cli
  .command('<source>', 'Analyze a font file')
  .option('--format <type>', 'Output format (css|json)', { default: 'css' })
  .action(async (source, options) => {
    try {
      const result = await analyze(source, { format: options.format as 'css' | 'json' });
      process.stdout.write(result + '\n');
      process.exit(0);
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`Error [${error.code}]: ${error.message}\n`);
      } else {
        process.stderr.write(`Unexpected Error: ${(error as Error).message}\n`);
      }
      process.exit(1);
    }
  });

cli.help();
cli.parse();
