#!/usr/bin/env node
import { Command } from 'commander';
import { defu } from 'defu';
import { runFontainePipeline } from './pipeline.js';
import { FontaineError } from './errors.js';

const program = new Command();

const DEFAULT_OPTIONS = {
  format: 'css',
  timeout: 10000,
};

async function main() {
  program
    .name('fontaine')
    .description('Analyze font metrics for CSS optimization')
    .argument('<url>', 'Path or URL to the font file')
    .option('-f, --format <type>', 'Output format (css, json, yaml)')
    .option('-t, --timeout <ms>', 'Request timeout in ms', '10000')
    .action(async (url, options) => {
      const config = defu({
        format: options.format,
        timeout: parseInt(options.timeout, 10),
      }, DEFAULT_OPTIONS);

      const abortController = new AbortController();
      
      const cleanup = () => {
        abortController.abort();
        process.exit(130);
      };

      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);

      try {
        const result = await runFontainePipeline(url, config);
        process.stdout.write(result + '\n');
        process.exit(0);
      } catch (error) {
        if (error instanceof FontaineError) {
          process.stderr.write(`Error [${error.code}]: ${error.message}\n`);
          process.exit(1);
        }
        process.stderr.write(`Unexpected Error: ${error}\n`);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv, { forceError: true });
}

main().catch(err => {
  process.stderr.write(err.stack || err)\n';
  process.exit(1);
});
