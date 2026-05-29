#!/usr/bin/env node
import { Command } from 'commander';
import { runFontainePipeline } from './pipeline.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Analyze fonts to generate size-adjust overrides')
  .version('1.0.0')
  .argument('<source>', 'URL or path to font file')
  .option('-f, --format <type>', 'Output format (json, css)', 'json')
  .action(async (source, options) => {
    try {
      const metrics = await runFontainePipeline(source);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(metrics, null, 2));
      } else {
        console.log(`:root { --font-ascent: ${metrics.ascent}; }`);
      }
    } catch (error) {
      if (error instanceof FontaineError) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
      }
      console.error('Unexpected internal error');
      process.exit(1);
    }
  });

program.parse();
