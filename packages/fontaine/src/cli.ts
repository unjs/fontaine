#!/usr/bin/env node
import { analyzeFonts } from './index.js';
import { JSONFormatter, CSSFormatter } from './formatter.js';
import { FontaineError } from './errors.js';

async function run() {
  const args = process.argv.slice(2);
  const mode = args[0]; // 'analyze' | 'transform'
  const sources = args.slice(1);

  if (!mode || sources.length === 0) {
    console.error('Usage: fontaine <analyze|transform> <files...>');
    process.exit(1);
  }

  try {
    const results = await analyzeFonts(sources);
    
    const formatter = mode === 'transform' 
      ? new CSSFormatter() 
      : new JSONFormatter();
      
    console.log(formatter.format(results));
  } catch (error) {
    if (error instanceof FontaineError) {
      console.error(`[Fontaine Error] ${error.message}`);
    } else {
      console.error('An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

run();
