import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS: Settings = {
  origin: 'SGN',
  destination: 'CAN',
  outboundDate: '2026-08-28',
  returnDate: '2026-09-02',
  currency: 'VND',
  engine: 'serpapi',
  cron: '0 */6 * * *'
};

/**
 * Ensures that the data directory exists.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads settings from settings.json or returns default settings if file doesn't exist or is invalid.
 */
export function getSettings(): Settings {
  ensureDataDir();
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    const validated = SettingsSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Error reading settings, returning defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Writes settings to settings.json after Zod validation.
 */
export function writeSettings(settings: Partial<Settings>): Settings {
  ensureDataDir();
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    const validated = SettingsSchema.parse(updated);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(validated, null, 2), 'utf8');
    return validated;
  } catch (error) {
    console.error('Error writing settings:', error);
    throw error;
  }
}
