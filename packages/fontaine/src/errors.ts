export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(url: string, status: number) {
    super(`Failed to fetch font from ${url}: ${status}`);
    this.name = 'FontaineFetchError';
  }
}

export class FontaineValidationError extends FontaineError {
  constructor(reason: string) {
    super(`Invalid font file: ${reason}`);
    this.name = 'FontaineValidationError';
  }
}

export class FontaineResolverError extends FontaineError {
  constructor(path: string, reason: string) {
    super(`Could not resolve source at ${path}: ${reason}`);
    this.name = 'FontaineResolverError';
  }
}
