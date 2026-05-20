/**
 * Base error for all Fontaine operations.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font resource acquisition fails.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font resource at ${url}`);
    this.name = 'FontaineFetchError';
    if (cause) this.cause = cause;
  }
}

/**
 * Error thrown when font analysis fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(fontName: string, cause?: unknown) {
    super(`Failed to analyze font: ${fontName}`);
    this.name = 'FontaineAnalysisError';
    if (cause) this.cause = cause;
  }
}
