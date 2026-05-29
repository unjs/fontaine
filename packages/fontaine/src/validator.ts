import { z } from 'zod';
import { ValidationError } from './errors.js';

const AnalyzeOptionsSchema = z.object({
  source: z.string().min(1),
  format: z.enum(['json', 'css']).default('json'),
});

const TransformOptionsSchema = z.object({
  input: z.string().min(1),
  output: z.string().optional(),
});

export function validateAnalyzeOptions(options: unknown) {
  const result = AnalyzeOptionsSchema.safeParse(options);
  if (!result.success) {
    throw new ValidationError(`Invalid analyze options: ${result.error.message}`);
  }
  return result.data;
}

export function validateTransformOptions(options: unknown) {
  const result = TransformOptionsSchema.safeParse(options);
  if (!result.success) {
    throw new ValidationError(`Invalid transform options: ${result.error.message}`);
  }
  return result.data;
}
