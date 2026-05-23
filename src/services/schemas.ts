import { z } from 'zod';

// Define Settings Zod Schema matching boundaries in master_prompt.md
export const SettingsSchema = z.object({
  origin: z.string().length(3, 'Origin must be a 3-letter IATA code').toUpperCase(),
  destination: z.string().length(3, 'Destination must be a 3-letter IATA code').toUpperCase(),
  outboundDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Outbound date must be in YYYY-MM-DD format'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be in YYYY-MM-DD format'),
  currency: z.string().default('VND').transform(val => val.toUpperCase()),
  engine: z.enum(['serpapi', 'travelpayouts', 'mock', 'amadeus']).default('serpapi'),
  cron: z.string().default('0 */6 * * *')
});

export type Settings = z.infer<typeof SettingsSchema>;
