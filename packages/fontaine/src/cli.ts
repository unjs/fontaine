#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts } from './pipeline.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Production-grade font metric analyzer')
  .version('1.0.0')
  .argument('<source>', 'Path or URL to the font file')
  .option('-f, --format <type>', 'Output format: json or css', 'css')
  .action(async (source, options) => {
    try {
      const result = await analyzeFonts({
        source,
        format: options.format as 'json' | 'css',
      });
      process.stdout.write(result + '\n');
    } catch (err) {
      if (err instanceof FontaineError) {
        process.stderr.write(`[${err.code}] ${err.message}\n`);
        process.exit(1);
      }
      process.stderr.write(`Unexpected Error: ${err}\n`);
      process.exit(1);
    }
  });

program.parse();
