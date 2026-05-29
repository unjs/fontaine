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
 * Error thrown when font retrieval fails via network or filesystem.
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Error thrown when font analysis fails due to corrupt data or unsupported formats.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}

/**
 * Error thrown when the provided asset is not a valid font file.
 */
export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
