/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when a font resource cannot be fetched or is invalid.
 */
export class FontaineFetchError extends FontaineError {
  constructor(public url: string, public status?: number, message: string) {
    super(`[FetchError] ${url}: ${message}`);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when font analysis fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(public fontName: string, message: string) {
    super(`[AnalysisError] ${fontName}: ${message}`);
    this.name = 'FontaineAnalysisError';
  }
}
