#!/usr/bin/env node
import { analyze } from './index';
import { CssFormatter, JsonFormatter } from './formatter';

async function main() {
  const args = process.argv.slice(2);
  const flags = args.filter(a => a.startsWith('--'));
  const urls = args.filter(a => !a.startsWith('--'));

  if (urls.length === 0) {
    console.error('Error: No URLs provided.');
    process.exit(1);
  }

  const useCss = flags.includes('--css');
  
  try {
    const result = await analyze(urls, {
      formatter: useCss ? new CssFormatter() : new JsonFormatter()
    });
    process.stdout.write(result + '\n');
  } catch (err) {
    console.error(`Fatal Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
