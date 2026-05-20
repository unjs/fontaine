/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a network request for a font asset fails.
 */
export class FontaineNetworkError extends FontaineError {
  constructor(public readonly url: string, public readonly status: number, message: string) {
    super(`[Network Error ${status}] ${url}: ${message}`);
  }
}

/**
 * Thrown when a font asset fails MIME-type validation or is corrupted.
 */
export class FontaineInvalidAssetError extends FontaineError {
  constructor(public readonly asset: string, message: string) {
    super(`[Invalid Asset] ${asset}: ${message}`);
  }
}

/**
 * Thrown during the metric analysis phase if the font buffer cannot be parsed.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(public readonly asset: string, message: string) {
    super(`[Analysis Error] ${asset}: ${message}`);
  }
}
