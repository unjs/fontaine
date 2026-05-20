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

export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(contentType: string) {
    super(`Invalid Content-Type: ${contentType}`, 415);
    this.name = 'FontaineInvalidContentTypeError';
  }
}

export class FontaineResolutionError extends FontaineError {
  constructor(source: string) {
    super(`Could not resolve source: ${source}`, 'RESOLUTION_ERROR');
    this.name = 'FontaineResolutionError';
  }
}

export class FontaineTransformError extends FontaineError {
  constructor(message: string) {
    super(message, 'TRANSFORM_ERROR');
    this.name = 'FontaineTransformError';
  }
}
