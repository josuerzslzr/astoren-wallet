import { z } from 'zod';

/**
 * Sample request body for the Story 1.1 OpenAPI spike route (`POST /spike/echo`).
 * Throwaway: Story 1.2 replaces it with the real envelope and contracts.
 */
export const spikeEchoRequestSchema = z
  .object({
    message: z.string().min(1).max(200).describe('Text to echo back'),
    count: z.int().min(1).max(10).default(1).describe('How many times to repeat it'),
  })
  .meta({ id: 'SpikeEchoRequest' });

export type SpikeEchoRequest = z.infer<typeof spikeEchoRequestSchema>;
