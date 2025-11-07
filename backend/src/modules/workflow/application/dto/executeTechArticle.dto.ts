import { z } from 'zod';

export const ExecuteTechArticleSchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteTechArticleDTO = z.infer<typeof ExecuteTechArticleSchema>;

