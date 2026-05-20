#!/usr/bin/env node
import { Command } from 'commander';
import { analyzeFonts } from './index.js';
import { FontaineError } from './errors.js';

const program = new Command();

program
  .name('fontaine')
  .description('Production-grade font metric analyzer')
  .version('1.0.0')
  .argument('<source>', 'Path or URL to font asset')
  .option('-f, --format <type>', 'Output format (json, css)', 'json')
  .action(async (source, options) => {
    try {
      // Strict validation for positional arguments handled by commander, 
      // but we ensure no unexpected behavior here.
      const result = await analyzeFonts(source, { 
        format: options.format as 'json' | 'css' 
      });
      process.stdout.write(result + '\n');
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`[${error.code}] ${error.message}\n`);
      } else {
        process.stderr.write(`Unexpected Error: ${String(error)}\n`);
      }
      process.exit(1);
    }
  });

if (process.argv.length > 4 && !process.argv.includes('--help') && !process.argv.includes('-h')) {
  process.stderr.write('Error: Too many arguments provided.\n');
  process.exit(1);
}

program.parseAsync(process.argv);
