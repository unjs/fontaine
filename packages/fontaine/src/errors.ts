/**
 * Base error class for all Fontaine operations.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font retrieval from local or remote sources fails.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font from ${url}`);
    this.name = 'FontaineFetchError';
    if (cause) this.cause = cause;
  }
}

/**
 * Error thrown when the retrieved asset does not match expected font characteristics.
 */
export class FontaineValidationError extends FontaineError {
  constructor(reason: string) {
    super(`Font validation failed: ${reason}`);
    this.name = 'FontaineValidationError';
  }
}
