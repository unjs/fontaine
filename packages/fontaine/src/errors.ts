/**
 * Base error class for all Fontaine operations.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font retrieval from a source fails.
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly url?: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Error thrown when font validation fails (e.g., invalid magic bytes).
 */
export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown during the font analysis phase.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}
