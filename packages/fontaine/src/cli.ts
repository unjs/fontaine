#!/usr/bin/env node
import { runFontaine, CssFormatter, JsonFormatter } from './index.js';
import { writeFileSync, renameSync, writeFileSync as fsWrite } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: fontaine <source> [--json] [--out <path>]');
    process.exit(1);
  }

  const source = args[0];
  const isJson = args.includes('--json');
  const outIdx = args.indexOf('--out');
  const outputPath = outIdx !== -1 ? args[outIdx + 1] : null;

  const formatter = isJson ? new JsonFormatter() : new CssFormatter();

  try {
    const result = await runFontaine({ source, formatter });

    if (outputPath) {
      // Atomic Write: Write to temp, then rename
      const tempPath = join(tmpdir(), `fontaine-${Date.now()}.tmp`);
      writeFileSync(tempPath, result);
      renameSync(tempPath, outputPath);
      console.log(`Successfully wrote analysis to ${outputPath}`);
    } else {
      console.log(result);
    }
  } catch (error: any) {
    console.error(`[${error.code || 'ERROR'}] ${error.message}`);
    process.exit(1);
  }
}

main();
