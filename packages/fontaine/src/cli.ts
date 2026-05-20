#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts } from './pipeline.js';
import { JsonFormatter, CssFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Industrial-strength font metric analyzer')
  .version('1.0.0')
  .argument('<source>', 'Path to local font file or HTTPS URL')
  .option('-f, --format <type>', 'Output format: json, css', 'json')
  .action(async (source, options) => {
    try {
      const formatter = options.format === 'css' ? new CssFormatter() : new JsonFormatter();
      const result = await analyzeFonts(source, { formatter });
      process.stdout.write(result + '\n');
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`Error: ${error.message}\n`);
      } else {
        process.stderr.write(`Unexpected Error: ${(error as Error).message}\n`);
      }
      process.exit(1);
    }
  });

program.parse();
