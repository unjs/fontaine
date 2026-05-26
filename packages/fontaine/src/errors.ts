export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FontaineFetchError extends FontaineError {}

export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(contentType: string) {
    super(`Unsupported MIME type: ${contentType}. Only font binaries are permitted.`);
  }
}

export class FontaineResolutionError extends FontaineError {}
