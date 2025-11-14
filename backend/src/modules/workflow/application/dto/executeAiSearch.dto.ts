import { z } from 'zod';

export const ExecuteAiSearchSchema = z.object({
  query: z.string().min(1, 'query 不能为空'),
  inputs: z.record(z.any()).optional(),
  conversationId: z.string().optional().default(''),
});

export type ExecuteAiSearchDTO = z.infer<typeof ExecuteAiSearchSchema>;

