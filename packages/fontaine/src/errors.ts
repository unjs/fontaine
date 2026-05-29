export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(message: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}

export class FontaineFormatterError extends FontaineError {
  constructor(message: string) {
    super(message, 'FORMATTER_ERROR');
    this.name = 'FontaineFormatterError';
  }
}
