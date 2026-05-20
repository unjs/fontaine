export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class ResolverError extends FontaineError {
  constructor(message: string) {
    super(message, 'RESOLVER_ERROR');
  }
}

export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
  }
}

export class FormatterError extends FontaineError {
  constructor(message: string) {
    super(message, 'FORMATTER_ERROR');
  }
}
