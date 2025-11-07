import { z } from 'zod';

export const GenerateOutputSchema = z.object({
  type: z.enum(['ppt', 'script', 'mindmap', 'other']),
  conversationId: z.string().min(1),
  messageId: z.string().min(1),
  content: z.any(),
  title: z.string().optional(),
});

export type GenerateOutputDTO = z.infer<typeof GenerateOutputSchema>;

