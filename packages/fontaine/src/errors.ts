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
 * Error thrown when a network request for a font asset fails.
 */
export class NetworkError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'NETWORK_FAILURE');
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when a font asset fails MIME-type validation.
 */
export class ValidationError extends FontaineError {
  constructor(message: string, public readonly invalidMime?: string) {
    super(message, 'INVALID_FONT_FORMAT');
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when the analysis engine encounters an internal processing failure.
 */
export class AnalysisError extends FontaineError {
  constructor(message: string, public readonly details?: unknown) {
    super(message, 'ANALYSIS_FAILURE');
    this.name = 'AnalysisError';
  }
}
