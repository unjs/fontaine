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
 * Error thrown when font retrieval fails from remote or local sources.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly url?: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when input validation fails (e.g., invalid mime-type).
 */
export class FontaineValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'FontaineValidationError';
  }
}

/**
 * Error thrown during font metric analysis.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}
