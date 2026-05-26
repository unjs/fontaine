export const SUPPORTED_FONT_MIMES = [
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/font-woff',
  'application/font-woff2',
];

export function isValidFontMime(mime: string): boolean {
  return SUPPORTED_FONT_MIMES.includes(mime);
}
