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
 * Thrown when a remote resource cannot be fetched.
 */
export class FetchError extends FontaineError {
  constructor(message: string) {
    super(message, 'FETCH_ERROR');
  }
}

/**
 * Thrown when the resource Content-Type does not match expected font binary types.
 */
export class InvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Invalid Content-Type: ${contentType}. Expected a font binary.`, 'INVALID_CONTENT_TYPE');
  }
}

/**
 * Thrown when a local file cannot be resolved or read.
 */
export class ResolutionError extends FontaineError {
  constructor(message: string) {
    super(message, 'RESOLUTION_ERROR');
  }
}
