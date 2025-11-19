import { z } from 'zod';

export const CreateConversationSchema = z.object({
  title: z.string().optional(),
  sources: z.array(z.any()).optional(),
  pageType: z.string().optional(),
});

export type CreateConversationDTO = z.infer<typeof CreateConversationSchema>;

