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
 * Thrown when a font source cannot be retrieved via network or filesystem.
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Thrown when font analysis fails due to malformed binary data.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}

/**
 * Thrown when the provided source URL or path is invalid or unsupported.
 */
export class InvalidSourceError extends FontaineError {
  constructor(message: string) {
    super(message, 'INVALID_SOURCE_ERROR');
    this.name = 'InvalidSourceError';
  }
}
