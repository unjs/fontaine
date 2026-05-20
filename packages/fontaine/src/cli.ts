#!/usr/bin/env node
import { runPipeline } from './index.js';
import { CssFormatter, JsonFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

async function main() {
  const [,, source, format = 'json'] = process.argv;

  if (!source) {
    console.error('Usage: fontaine <source> [json|css]');
    process.exit(1);
  }

  const formatter = format === 'css' ? new CssFormatter() : new JsonFormatter();

  try {
    const output = await runPipeline(source, { formatter });
    process.stdout.write(output + '\n');
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[${error.code}] ${error.message}`);
    } else {
      console.error('Unexpected system failure:', error);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
