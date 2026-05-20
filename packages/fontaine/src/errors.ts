export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FetchError extends FontaineError {
  constructor(url: string, status?: number) {
    super(`Failed to fetch font from ${url}${status ? ` with status ${status}` : ''}`, 'FETCH_ERROR');
  }
}

export class AnalysisError extends FontaineError {
  constructor(reason: string) {
    super(`Font analysis failed: ${reason}`, 'ANALYSIS_ERROR');
  }
}

export class ValidationError extends FontaineError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}
