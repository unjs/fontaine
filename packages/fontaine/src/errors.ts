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
 * Thrown when a font source cannot be fetched or loaded.
 */
export class FetchError extends FontaineError {
  constructor(message: string, public readonly status?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

/**
 * Thrown when the fetched resource does not match expected font content types.
 */
export class InvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Unexpected content type: ${contentType}`, 'INVALID_CONTENT_TYPE');
    this.name = 'InvalidContentTypeError';
  }
}

/**
 * Thrown when the font file is corrupted or cannot be parsed for metrics.
 */
export class ParseError extends FontaineError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
  }
}
