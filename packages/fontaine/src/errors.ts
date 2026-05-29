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
 * Error thrown when a font resource cannot be retrieved from the provided source.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly source: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when the resolved resource does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(source: string, public readonly contentType: string) {
    super(`Invalid content type received: ${contentType}`, source);
    this.name = 'FontaineInvalidContentTypeError';
  }
}

/**
 * Error thrown when the font binary is malformed or cannot be parsed.
 */
export class FontaineParseError extends FontaineError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'FontaineParseError';
  }
}
