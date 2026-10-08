export const logger = {
  warn: (message: string, ...details: unknown[]): void => console.warn(`[fontless] ${message}`, ...details),
}
