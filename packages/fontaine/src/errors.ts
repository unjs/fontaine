/**
 * Base error class for all Fontaine related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when font retrieval fails via network or filesystem.
 */
export class FontaineFetchError extends FontaineError {
  constructor(source: string, cause?: unknown) {
    super(`Failed to fetch font from ${source}: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when the retrieved asset is not a valid font file.
 */
export class FontaineValidationError extends FontaineError {
  constructor(source: string, contentType?: string) {
    super(`Invalid font asset at ${source}${contentType ? ` (Type: ${contentType})` : ''}. Expected a font binary.`);
    this.name = 'FontaineValidationError';
  }
}

/**
 * Error thrown when font analysis fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineAnalysisError';
  }
}
