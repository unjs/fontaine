#!/usr/bin/env node
import { Command } from 'commander';
import { runPipeline } from './pipeline.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Industrial-grade font metric analyzer')
  .version('1.0.0')
  .argument('<source>', 'Path or URL to the font file')
  .option('-f, --format <format>', 'Output format (json, css)', 'json')
  .action(async (source, options) => {
    try {
      const result = await runPipeline({
        source,
        format: options.format,
      });
      process.stdout.write(result + '\n');
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`[${error.code}] ${error.message}\n`);
      } else {
        process.stderr.write(`Unexpected error: ${(error as Error).message}\n`);
      }
      process.exit(1);
    }
  });

program.parse();
