import { z } from 'zod';
import { resolveSource } from './resolver.js';
import { calculateMetrics } from './metrics.js';

export const AnalysisResultSchema = z.object({
  source: z.string(),
  metrics: z.object({
    ascent: z.number(),
    descent: z.number(),
    lineGap: z.number(),
  }),
  timestamp: z.string().datetime(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export async function analyzeFontSource(source: string): Promise<AnalysisResult> {
  const buffer = await resolveSource(source);
  const metrics = await calculateMetrics(buffer);

  return AnalysisResultSchema.parse({
    source,
    metrics,
    timestamp: new Date().toISOString(),
  });
}
