#!/usr/bin/env node
import { Fontaine } from './index.js';
import pc from 'picocolors';
import ora from 'ora';
import { FontaineError } from './errors.js';

async function run() {
  const [,, source, cssPath] = process.argv;

  if (!source) {
    console.error(pc.red('Usage: fontaine <source> [css-file]'));
    process.exit(1);
  }

  const fontaine = new Fontaine();
  const spinner = ora('Processing font asset...').start();

  try {
    if (cssPath) {
      // Transformation Mode
      const fs = await import('node:fs/promises');
      const css = await fs.readFile(cssPath, 'utf-8');
      const result = await fontaine.transform(source, css);
      await fs.writeFile(cssPath, result);
      spinner.succeed(pc.green(`Transformed CSS saved to ${cssPath}`));
    } else {
      // Analysis Mode
      const metrics = await fontaine.analyze(source);
      spinner.succeed(pc.green('Analysis complete'));
      console.log(JSON.stringify(metrics, null, 2));
    }
  } catch (error) {
    spinner.fail(pc.red('Operation failed'));
    if (error instanceof FontaineError) {
      console.error(`${pc.bold(error.code)}: ${error.message}`);
    } else {
      console.error(pc.red(error instanceof Error ? error.stack : String(error)));
    }
    process.exit(1);
  }
}

run();
