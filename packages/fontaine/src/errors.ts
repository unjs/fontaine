/**
 * Base error class for all fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Thrown when resource resolution fails (network or filesystem).
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Thrown when the font buffer is malformed or unsupported.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}

/**
 * Thrown when the provided input parameters fail validation.
 */
export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
