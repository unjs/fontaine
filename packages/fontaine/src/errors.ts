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
 * Thrown when a remote resource cannot be fetched.
 */
export class FontaineFetchError extends FontaineError {
  constructor(public url: string, public status?: number) {
    super(`Failed to fetch font from ${url}${status ? ` (Status: ${status})` : ''}`);
  }
}

/**
 * Thrown when the resolved content is not a valid font MIME type.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(public contentType: string) {
    super(`Invalid content type: ${contentType}. Only font binary data is supported.`);
  }
}

/**
 * Thrown when a local file path cannot be resolved or read.
 */
export class FontaineResolutionError extends FontaineError {
  constructor(public path: string, cause?: Error) {
    super(`Could not resolve font at path: ${path}`);
    this.cause = cause;
  }
}
