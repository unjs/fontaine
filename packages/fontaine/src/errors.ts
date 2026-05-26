export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class ResolutionError extends FontaineError {
  constructor(source: string, reason: string) {
    super(`Failed to resolve source ${source}: ${reason}`, 'ERR_RESOLUTION');
    this.name = 'ResolutionError';
  }
}

export class AnalysisError extends FontaineError {
  constructor(fontName: string, reason: string) {
    super(`Analysis failed for font ${fontName}: ${reason}`, 'ERR_ANALYSIS');
    this.name = 'AnalysisError';
  }
}

export class ValidationError extends FontaineError {
  constructor(reason: string) {
    super(`Invalid configuration: ${reason}`, 'ERR_VALIDATION');
    this.name = 'ValidationError';
  }
}
