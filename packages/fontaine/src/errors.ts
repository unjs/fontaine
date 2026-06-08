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
 * Error thrown when font asset retrieval fails.
 */
export class FetchError extends FontaineError {
  constructor(url: string, status?: number) {
    super(`Failed to fetch font asset from ${url}${status ? ` (Status: ${status})` : ''}`);
    this.name = 'FetchError';
  }
}

/**
 * Error thrown when the retrieved asset fails mime-type validation.
 */
export class ValidationError extends FontaineError {
  constructor(mimeType: string) {
    super(`Invalid asset type: ${mimeType}. Only font/* or application/font-* are permitted.`);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown during binary analysis of the font file.
 */
export class AnalysisError extends FontaineError {
  constructor(detail: string) {
    super(`Font analysis failed: ${detail}`);
    this.name = 'AnalysisError';
  }
}
