/**
 * Base error for all Fontaine-related failures.
 * Used to differentiate tool-specific errors from native runtime errors.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Triggered when source resolution fails (e.g., 404, Invalid MIME type).
 */
export class FetchError extends FontaineError {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Triggered when the binary font data cannot be parsed or analyzed.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Triggered when input options fail schema validation.
 */
export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
