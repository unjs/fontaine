#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts } from './index.js';
import { FormatterFactory } from './formatter.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Analyze fonts and generate size-adjust overrides')
  .version('1.0.0')
  .requiredOption('-u, --url <url>', 'URL or path to font file')
  .requiredOption('-n, --name <name>', 'Font family name')
  .option('-f, --format <format>', 'Output format (css, json)', 'css')
  .action(async (options) => {
    try {
      const result = await analyzeFonts({
        url: options.url,
        fontName: options.name,
      });

      const formatter = FormatterFactory.getFormatter(options.format as 'css' | 'json');
      process.stdout.write(formatter.format(result) + '\n');
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`Error: ${error.message}\n`);
        process.exit(1);
      }
      process.stderr.write(`Unexpected Error: ${(error as Error).message}\n`);
      process.exit(1);
    }
  });

program.parse();
