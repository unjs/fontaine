#!/usr/bin/env node
import cac from 'cac';
import { runAnalysis, CssFormatter, JsonFormatter } from './index.js';
import { FontaineError } from './errors.js';

const cli = cac('fontaine');

cli
  .command('<source>', 'Analyze a font file')
  .option('--format <type>', 'Output format (css|json)', { default: 'json' })
  .action(async (source, options) => {
    try {
      const formatter = options.format === 'css' 
        ? new CssFormatter() 
        : new JsonFormatter();

      const output = await runAnalysis(source, { formatter });
      process.stdout.write(output + '\n');
      process.exit(0);
    } catch (error) {
      if (error instanceof FontaineError) {
        process.stderr.write(`Error [${error.name}]: ${error.message}\n`);
        process.exit(error.code);
      }
      process.stderr.write(`Unexpected Error: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

cli.help();
cli.parse();
