/**
 * Base error class for all Fontaine operations.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: number = 1) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font source retrieval fails.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string) {
    super(message, 1);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown during font metric analysis.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'FontaineAnalysisError';
  }
}

/**
 * Error thrown during output formatting.
 */
export class FontaineFormatterError extends FontaineError {
  constructor(message: string) {
    super(message, 3);
    this.name = 'FontaineFormatterError';
  }
}
