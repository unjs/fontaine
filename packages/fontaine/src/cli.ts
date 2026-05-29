#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts, type PipelineOptions } from './index.js';

const program = new Command();

program
  .name('fontaine')
  .description('Analyze font metrics for CSS size-adjust')
  .argument('<source>', 'URL or path to font file')
  .option('-f, --format <type>', 'Output format (css, json)', 'css')
  .action(async (source, options) => {
    try {
      const format = options.format as PipelineOptions['format'];
      const result = await analyzeFonts(source, { format });
      process.stdout.write(result + '\n');
    } catch (err: any) {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exit(1);
    }
  });

program.parse();
