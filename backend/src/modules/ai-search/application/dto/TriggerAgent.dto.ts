import { z } from 'zod';

export const TriggerAgentSchema = z.object({
  featureType: z.string().min(1, 'featureType 参数不能为空'),
  messageId: z.string().optional(),
  content: z.string().optional(),
  sources: z.array(z.any()).optional(),
});

export type TriggerAgentDTO = z.infer<typeof TriggerAgentSchema>;

