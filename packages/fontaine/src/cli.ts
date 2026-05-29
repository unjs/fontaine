#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFont, FontaineError } from './index.js';

const program = new Command();

program
  .name('fontaine')
  .description('Analyze font metrics and characteristics')
  .version('0.0.1')
  .argument('<source>', 'Path or URL to the font file')
  .option('-j, --json', 'Output results as JSON', false)
  .action(async (source, options) => {
    try {
      const result = await analyzeFont(source, options);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
      process.exit(0);
    } catch (err) {
      if (err instanceof FontaineError) {
        console.error(`[${err.code}] ${err.message}`);
      } else {
        console.error((err as Error).message);
      }
      process.exit(1);
    }
  });

program.parse();
