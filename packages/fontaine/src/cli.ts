#!/usr/bin/env node
import { Command } from 'commander';
import { FontainePipeline } from './pipeline';
import { FORMATTERS } from './formatter';

const program = new Command();

program
  .name('fontaine')
  .description('Extract and format font metrics for isomorphic environments')
  .version('1.0.0');

program
  .argument('<source>', 'URL or file path to the font')
  .option('-f, --format <type>', 'Output format (json, css)', 'json')
  .action(async (source, options) => {
    try {
      const FormatterClass = FORMATTERS[options.format];
      if (!FormatterClass) {
        console.error(`Unsupported format: ${options.format}`);
        process.exit(1);
      }

      const formatter = new FormatterClass();
      const pipeline = new FontainePipeline();
      const result = await pipeline.process(source, formatter);
      
      process.stdout.write(result + '\n');
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
