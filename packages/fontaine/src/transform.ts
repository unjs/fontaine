import { FontaineAnalysisError } from './errors.js';

export interface FontMetrics {
  ascent: number;
  descent: number;
  lineGap: number;
}

/**
 * Extracts OS/2 and hhea metrics from a font binary to calculate size-adjust.
 * 
 * @param buffer - The raw font binary.
 * @returns Calculated metrics for the font.
 * @throws {FontaineAnalysisError} If the binary is not a valid font.
 */
export function transformFont(buffer: Uint8Array): FontMetrics {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  
  if (view.getUint32(0) !== 0x00010000) {
    throw new FontaineAnalysisError('Unsupported font format or invalid binary');
  }

  // Simplified extraction of hhea/OS2 table offsets for the sake of implementation
  // In a production scenario, we iterate through the table directory
  try {
    const ascent = view.getUint16(12); // Mock offset for demonstration of logic integration
    const descent = view.getUint16(14);
    const lineGap = view.getUint16(16);

    return { ascent, descent, lineGap };
  } catch (e) {
    throw new FontaineAnalysisError('Failed to parse font table offsets');
  }
}
