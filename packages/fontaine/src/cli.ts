#!/usr/bin/env node
import { runFontPipeline } from './pipeline.js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: fontaine <input.css> <mapping.json> [output.css]');
    process.exit(1);
  }

  try {
    const cssInput = await readFile(resolve(args[0]), 'utf-8');
    const mapping = JSON.parse(await readFile(resolve(args[1]), 'utf-8'));
    const output = await runFontPipeline(cssInput, mapping);

    if (args[2]) {
      await writeFile(resolve(args[2]), output);
    } else {
      process.stdout.write(output + '\n');
    }
  } catch (err) {
    console.error(`Fatal Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
