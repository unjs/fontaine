#!/usr/bin/env node
import { Command } from 'commander';
import { FontainePipeline } from './pipeline.js';
import { createFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Enterprise font metric analyzer')
  .version('1.0.0')
  .argument('<source>', 'Path or URL to font asset')
  .option('-f, --format <type>', 'Output format (css, json)', 'css')
  .action(async (source, options) => {
    try {
      const pipeline = new FontainePipeline();
      const formatter = createFormatter(options.format as any);
      const output = await pipeline.run(source, formatter);
      process.stdout.write(output + '\n');
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`[${error.code}] ${error.message}\n`);
      } else {
        process.stderr.write(`Unexpected error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`CLI Error: ${err.message}\n`);
  process.exit(1);
});
