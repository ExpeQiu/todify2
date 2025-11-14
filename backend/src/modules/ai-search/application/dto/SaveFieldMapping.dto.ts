import { z } from 'zod';

const FieldMappingRuleSchema = z.object({
  workflowInputName: z.string(),
  sourceType: z.enum(['field', 'expression']),
  sourceField: z.string().optional(),
  expression: z.string().optional(),
  defaultValue: z.any().optional(),
});

const OutputMappingRuleSchema = z.object({
  workflowOutputName: z.string(),
  targetField: z.string(),
  extractExpression: z.string(),
});

const FeatureObjectMappingSchema = z.object({
  featureType: z.string(),
  workflowId: z.string().optional(),
  inputMappings: z.array(FieldMappingRuleSchema).optional(),
  outputMappings: z.array(OutputMappingRuleSchema).optional(),
});

export const SaveFieldMappingSchema = z.object({
  workflowId: z.string(),
  inputMappings: z.array(FieldMappingRuleSchema),
  outputMappings: z.array(OutputMappingRuleSchema),
  featureObjects: z.array(FeatureObjectMappingSchema).optional(),
});

export type SaveFieldMappingDTO = z.infer<typeof SaveFieldMappingSchema>;

