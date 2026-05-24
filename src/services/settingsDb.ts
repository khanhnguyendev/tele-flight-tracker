import clientPromise from './mongodb';
import { Settings, SettingsSchema } from './schemas';
export { SettingsSchema };
export type { Settings };

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
 * Reads settings from settings collection or returns default settings if not found or invalid.
 */
export async function getSettings(): Promise<Settings> {
  try {
    const client = await clientPromise;
    const db = client.db('tele-flight');
    const doc = await db.collection('settings').findOne({ id: 'global_settings' });
    if (!doc) {
      // Seed default settings if none exists
      await writeSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    // Remove MongoDB _id field to validate with strict Zod schema
    const { _id, ...settingsData } = doc;
    const validated = SettingsSchema.parse(settingsData);
    return validated;
  } catch (error) {
    console.error('Error reading settings from MongoDB, returning defaults:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Writes/Updates settings to settings collection after Zod validation.
 */
export async function writeSettings(settings: Partial<Settings>): Promise<Settings> {
  try {
    const client = await clientPromise;
    const db = client.db('tele-flight');
    
    // Fetch current settings to perform partial updates
    const currentDoc = await db.collection('settings').findOne({ id: 'global_settings' });
    let current: Settings = DEFAULT_SETTINGS;
    if (currentDoc) {
      const { _id, ...settingsData } = currentDoc;
      current = SettingsSchema.parse(settingsData);
    }

    const updated = { ...current, ...settings };
    const validated = SettingsSchema.parse(updated);

    await db.collection('settings').updateOne(
      { id: 'global_settings' },
      { $set: { id: 'global_settings', ...validated } },
      { upsert: true }
    );
    return validated;
  } catch (error) {
    console.error('Error writing settings to MongoDB:', error);
    throw error;
  }
}
