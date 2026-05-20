export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineFetchError';
  }
}

export class FontaineHTTPError extends FontaineFetchError {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'FontaineHTTPError';
  }
}

export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(public contentType: string) {
    super(`Invalid Content-Type: ${contentType}. Expected a font asset.`);
    this.name = 'FontaineInvalidContentTypeError';
  }
}
