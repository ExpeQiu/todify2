import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().min(1, '消息内容不能为空'),
  sources: z.array(z.any()).optional(),
  contextWindowSize: z
    .union([z.number(), z.string()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
      if (Number.isNaN(numericValue)) {
        return undefined;
      }
      return Math.max(-1, numericValue);
    }),
  workflowId: z.string().min(1).optional(),
});

export type SendMessageDTO = z.infer<typeof SendMessageSchema>;

