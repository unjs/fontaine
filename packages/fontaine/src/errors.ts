export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(url: string, status?: number) {
    super(`Failed to fetch font from ${url}${status ? ` (Status: ${status})` : ''}`, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

export class FontaineValidationError extends FontaineError {
  constructor(reason: string) {
    super(`Invalid font binary: ${reason}`, 'VALIDATION_ERROR');
    this.name = 'FontaineValidationError';
  }
}

export class FontaineAnalysisError extends FontaineError {
  constructor(details: string) {
    super(`Font analysis failed: ${details}`, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}
