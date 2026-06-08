#!/usr/bin/env node
import { Command } from 'commander';
import { runPipeline } from './pipeline.js';
import { JsonFormatter, CssFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Font metric analysis CLI')
  .argument('<source>', 'Path or URL to font file')
  .option('-f, --format <type>', 'Output format: json, css', 'json')
  .option('--overrides-only', 'Only output metrics that differ from defaults')
  .action(async (source, options) => {
    try {
      const formatter = options.format === 'css' ? new CssFormatter() : new JsonFormatter();
      const result = await runPipeline(source, {
        formatter,
        overridesOnly: options.overridesOnly,
      });
      process.stdout.write(result + '\n');
    } catch (err) {
      if (err instanceof FontaineError) {
        process.stderr.write(`[${err.code}] ${err.message}\n`);
        process.exit(1);
      }
      process.stderr.write('An unexpected error occurred\n');
      process.exit(1);
    }
  });

program.parse();
