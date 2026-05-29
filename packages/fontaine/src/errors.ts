export class FontaineError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(url: string, message: string) {
    super(`Failed to fetch font at ${url}: ${message}`, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

export class FontaineAnalysisError extends FontaineError {
  constructor(fontName: string, message: string) {
    super(`Analysis failed for ${fontName}: ${message}`, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}

export class FontaineValidationError extends FontaineError {
  constructor(url: string, mimeType: string) {
    super(`Invalid content type for ${url}: ${mimeType}. Expected font/woff2 or application/font-woff2`, 'VALIDATION_ERROR');
    this.name = 'FontaineValidationError';
  }
}
