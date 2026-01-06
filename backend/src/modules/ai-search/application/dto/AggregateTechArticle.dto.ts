import { z } from 'zod';

export const AggregateTechArticleSchema = z.object({
  conversationIds: z.array(z.string()).min(1, '至少选择一个对话'),
  outputIds: z.array(z.string()).optional().default([]),
  articleTypes: z
    .array(z.enum(['media_release', 'internal_memo', 'social_media']))
    .min(1, '至少选择一种文章类型'),
  tone: z.string().optional(),
  targetAudience: z.string().optional(),
  workflowId: z.string().optional(),
});

export type AggregateTechArticleDTO = z.infer<typeof AggregateTechArticleSchema>;

