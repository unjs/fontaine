export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FetchError extends FontaineError {
  constructor(message: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

export class FileSystemError extends FontaineError {
  constructor(message: string) {
    super(message, 'FS_ERROR');
    this.name = 'FileSystemError';
  }
}

export class AnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'AnalysisError';
  }
}
