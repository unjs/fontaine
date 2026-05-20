#!/usr/bin/env node
import { processFont } from './index.js';
import { formatResult } from './formatter.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    process.stderr.write('Usage: fontaine <source1> [source2] ...\n');
    process.exit(1);
  }

  // Atomic Parallelism: Process all sources concurrently without blocking
  const results = await Promise.allSettled(
    args.map(source => processFont(source))
  );

  // Atomic Output Buffer: Prevent interleaved stdout "slop"
  let output = '';
  let exitCode = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      const analysis = result.value;
      output += formatResult(analysis) + '\n';
      if (!analysis.success) exitCode = 1;
    } else {
      output += `Unexpected system error: ${result.reason}\n`;
      exitCode = 1;
    }
  }

  process.stdout.write(output);
  process.exit(exitCode);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
