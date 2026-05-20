#!/usr/bin/env node
import { analyzeFont } from './index';

async function main() {
  const [url, format] = process.argv.slice(2);

  if (!url) {
    console.error('Usage: fontaine <url> [css|json]');
    process.exit(1);
  }

  try {
    const result = await analyzeFont(url, { format: format as any });
    process.stdout.write(result + '\n');
    process.exit(0);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
