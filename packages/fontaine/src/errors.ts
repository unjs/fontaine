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
 * Error thrown when a font asset cannot be fetched or fails MIME-type validation.
 * @extends FontaineError
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, reason: string) {
    super(`Failed to fetch font at ${url}: ${reason}`);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when font analysis fails due to corrupted data or unsupported features.
 * @extends FontaineError
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(fontName: string, reason: string) {
    super(`Failed to analyze font ${fontName}: ${reason}`);
    this.name = 'FontaineAnalysisError';
  }
}
