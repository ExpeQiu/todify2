import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().min(1, '消息内容不能为空'),
  sources: z.array(z.any()).optional(),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

