export interface FormatOptions {
  format: 'css' | 'json';
}

/**
 * Formats the analysis results into the requested output string.
 */
export function formatOutput(content: string | object, { format }: FormatOptions): string {
  if (format === 'json') {
    return JSON.stringify(content, null, 2);
  }
  return content as string;
}
