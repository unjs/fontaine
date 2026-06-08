/**
 * Base error class for all Fontaine related failures.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when a font source cannot be fetched or read.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when the font analysis process fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}
