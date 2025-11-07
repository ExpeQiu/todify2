import { z } from 'zod';

export const ExecuteSpeechSchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteSpeechDTO = z.infer<typeof ExecuteSpeechSchema>;

