#!/usr/bin/env node
import { analyzeFonts } from './index.js';
import { CssFormatter, JsonFormatter } from './formatter.js';

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: fontaine <source1> <source2> ... [--css]');
    process.exit(1);
  }

  const isCss = args.includes('--css');
  const sources = args.filter(arg => arg !== '--css');
  const formatter = isCss ? new CssFormatter() : new JsonFormatter();

  try {
    const outputs = await analyzeFonts(sources, { formatter });
    outputs.forEach(out => console.log(out));
  } catch (error) {
    console.error(`Fatal pipeline error: ${error instanceof Error ? error.message : 'Unknown'}`);
    process.exit(1);
  }
}

run();
