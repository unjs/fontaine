/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font retrieval fails (Network, File System, 404).
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Error thrown when font validation fails (Incorrect Content-Type or Magic Bytes).
 */
export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown during the font analysis process.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}
