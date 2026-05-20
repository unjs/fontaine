#!/usr/bin/env node
import { Command } from 'commander';
import pLimit from 'p-limit';
import { analyzeFontSource } from './url-analyzer.js';
import { atomicTransformCss } from './transform.js';
import { FontaineError } from './errors.js';

const program = new Command();
const limit = pLimit(5);

program
  .name('fontaine')
  .description('Production-grade font metric analysis and CSS transformation')
  .option('-i, --input <path>', 'Input CSS file')
  .option('-u, --urls <urls...>', 'Font URLs to analyze')
  .action(async (options) => {
    try {
      if (!options.input || !options.urls) {
        program.error('Both --input and --urls are required for transformation.');
      }

      const analysisResults = await Promise.all(
        options.urls.map(url => limit(() => analyzeFontSource(url)))
      );

      await atomicTransformCss(options.input, (css) => {
        let updatedCss = css;
        for (const { source, metrics } of analysisResults) {
          // Logic to apply overrides based on analysisResults
          // This bridges the Analysis-to-Transformation gap
          updatedCss = updatedCss.replace(
            new RegExp(`@font-face\\s*\\{[^}]*src:\\s*url\\(['"]?${source}['"]?\\)[^}]*\\}`, 'g'),
            (match) => `${match}\n  size-adjust: ${metrics.ascent}%;`
          );
        }
        return updatedCss;
      });

      console.log('Successfully applied font overrides atomically.');
    } catch (error) {
      if (error instanceof FontaineError) {
        console.error(`[${error.code}] ${error.message}`);
      } else {
        console.error('Unexpected failure:', error);
      }
      process.exit(1);
    }
  });

program.parse();
