import { z } from 'zod';

export const ExecuteTechStrategySchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteTechStrategyDTO = z.infer<typeof ExecuteTechStrategySchema>;

