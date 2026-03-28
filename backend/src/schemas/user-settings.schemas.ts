import { z } from 'zod';

export const UpdateUserSettingsSchema = z.object({
  knowledge_enabled: z.boolean().optional(),
});

export type UpdateUserSettingsBody = z.infer<typeof UpdateUserSettingsSchema>;
