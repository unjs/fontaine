export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly status?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

export class FontaineAnalysisError extends FontaineError {
  constructor(message: string, public readonly detail?: any) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}

export class FontaineValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'FontaineValidationError';
  }
}
