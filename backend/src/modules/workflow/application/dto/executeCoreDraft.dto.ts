import { z } from 'zod';

export const ExecuteCoreDraftSchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteCoreDraftDTO = z.infer<typeof ExecuteCoreDraftSchema>;

