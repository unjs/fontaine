/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when a network request for a font fails.
 */
export class FontaineNetworkError extends FontaineError {
  constructor(message: string, public readonly status?: number) {
    super(message, 'NETWORK_ERROR');
    this.name = 'FontaineNetworkError';
  }
}

/**
 * Error thrown when a local file system operation fails.
 */
export class FontaineFileSystemError extends FontaineError {
  constructor(message: string) {
    super(message, 'FS_ERROR');
    this.name = 'FontaineFileSystemError';
  }
}

/**
 * Error thrown when font analysis fails due to corrupt or unsupported data.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}
