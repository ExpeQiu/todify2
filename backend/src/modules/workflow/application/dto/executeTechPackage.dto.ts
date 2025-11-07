import { z } from 'zod';

export const ExecuteTechPackageSchema = z.object({
  inputs: z.record(z.any()),
  conversationId: z.string().optional(),
});

export type ExecuteTechPackageDTO = z.infer<typeof ExecuteTechPackageSchema>;

