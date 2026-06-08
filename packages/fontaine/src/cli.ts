#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts, Errors } from './index.js';

const program = new Command();

program
  .name('fontaine')
  .description('Extract font metrics and generate override CSS')
  .version('1.0.0')
  .argument('<source>', 'Path or URL to the font file')
  .option('-f, --format <type>', 'Output format (css, json)', 'css')
  .action(async (source, options) => {
    try {
      const result = await analyzeFonts(source, { format: options.format as any });
      process.stdout.write(result + '\n');
      process.exit(0);
    } catch (err) {
      if (err instanceof Errors.FontaineError) {
        process.stderr.write(`Error [${err.code}]: ${err.message}\n`);
      } else {
        process.stderr.write(`Unexpected Error: ${err instanceof Error ? err.message : String(err)}\n`);
      }
      process.exit(1);
    }
  });

program.parse();
