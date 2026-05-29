export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class FontaineFetchError extends FontaineError {
  constructor(public url: string, public status?: number, message: string = 'Failed to fetch font resource') {
    super(`${message}: [${status || 'Unknown'}] ${url}`);
  }
}

export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(public contentType: string, public expected: string[]) {
    super(`Invalid Content-Type: ${contentType}. Expected one of: ${expected.join(', ')}`);
  }
}

export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(`Font analysis failed: ${message}`);
  }
}
