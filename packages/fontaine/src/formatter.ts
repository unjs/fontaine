import { FormatterError } from './errors';
import { FontMetrics } from './metrics';

export type FormatType = 'css' | 'json';

export class OutputFormatter {
  format(metrics: FontMetrics, type: FormatType = 'css'): string {
    try {
      if (type === 'json') {
        return JSON.stringify(metrics, null, 2);
      }
      
      return `.fontaine-metrics {
  --font-ascent: ${metrics.ascent};
  --font-descent: ${metrics.descent};
  --font-units-per-em: ${metrics.unitsPerEm};
}`;
    } catch (error) {
      throw new FormatterError(`Formatting failed for type ${type}`);
    }
  }
}
