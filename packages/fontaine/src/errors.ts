export class FontaineError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class NetworkError extends FontaineError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_FAILURE', statusCode);
    this.name = 'NetworkError';
  }
}

export class FontFormatError extends FontaineError {
  constructor(message: string) {
    super(message, 'INVALID_FONT_FORMAT');
    this.name = 'FontFormatError';
  }
}

export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_FAILED');
    this.name = 'AnalysisError';
  }
}
