import { Command } from 'commander';
import fg from 'fast-glob';
import { loadConfig } from './config';
import { runPipeline } from './pipeline';
import { FontaineError } from './errors';

const program = new Command();

program
  .name('fontaine')
  .description('Production-grade font metric analyzer')
  .option('-i, --input <pattern>', 'Input font file or glob pattern')
  .option('-o, --output <path>', 'Output destination')
  .option('--dry-run', 'Validate sources without writing files')
  .option('--no-cache', 'Disable caching of remote metrics')
  .action(async (options) => {
    const config = loadConfig();
    const mergedOptions = {
      ...config,
      ...options,
    };

    try {
      const files = mergedOptions.input 
        ? await fg(mergedOptions.input) 
        : [];

      if (files.length === 0) {
        console.error('No fonts found matching the pattern.');
        process.exit(1);
      }

      for (const file of files) {
        await runPipeline(file, mergedOptions);
      }
    } catch (error) {
      if (error instanceof FontaineError) {
        console.error(`[${error.code}] ${error.message}`);
      } else {
        console.error('Unexpected system error:', error);
      }
      process.exit(1);
    }
  });

program.parse();
