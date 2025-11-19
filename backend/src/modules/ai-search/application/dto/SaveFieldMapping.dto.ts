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
  pageType: z.enum(['tech-package', 'tech-strategy', 'tech-article', 'press-release']).optional(),
  label: z.string().optional(),
  agentId: z.string().optional(),
});

export const SaveFieldMappingSchema = z.object({
  workflowId: z.string(),
  inputMappings: z.array(FieldMappingRuleSchema),
  outputMappings: z.array(OutputMappingRuleSchema),
  featureObjects: z.array(FeatureObjectMappingSchema).optional(),
});

export type SaveFieldMappingDTO = z.infer<typeof SaveFieldMappingSchema>;

