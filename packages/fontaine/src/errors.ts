export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Thrown when a remote font resource cannot be retrieved via HTTP.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, error: unknown) {
    super(`Failed to fetch font from ${url}: ${String(error)}`);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Thrown when the retrieved resource does not match expected font content types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Invalid content type: ${contentType}. Expected font binary.`);
    this.name = 'FontaineInvalidContentTypeError';
  }
}
