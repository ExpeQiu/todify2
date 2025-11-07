import { z } from 'zod';

export const ExecuteTechPublishSchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteTechPublishDTO = z.infer<typeof ExecuteTechPublishSchema>;

