/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a font resource cannot be retrieved from the source.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font resource at ${url}`);
    this.cause = cause;
  }
}

/**
 * Thrown when the retrieved resource does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(url: string, contentType: string) {
    super(`Invalid Content-Type "${contentType}" for font resource at ${url}`);
  }
}
