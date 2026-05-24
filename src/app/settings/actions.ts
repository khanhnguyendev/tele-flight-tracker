'use server';

import { redirect } from 'next/navigation';
import { writeSettings, SettingsSchema } from '@/services/settingsDb';
import { initCron } from '@/services/cron';

export async function saveSettingsAction(formData: FormData) {
  const rawData = {
    origin: (formData.get('origin') as string || '').trim().toUpperCase(),
    destination: (formData.get('destination') as string || '').trim().toUpperCase(),
    outboundDate: formData.get('outboundDate') as string || '',
    returnDate: formData.get('returnDate') as string || '',
    currency: (formData.get('currency') as string || 'VND').trim().toUpperCase(),
    engine: 'serpapi',
    cron: formData.get('cron') as string || '0 */6 * * *'
  };

  try {
    // 1. Zod schema validation
    const validated = SettingsSchema.parse(rawData);

    // Cross-date validation: Outbound must be before Return
    const outbound = new Date(validated.outboundDate);
    const inbound = new Date(validated.returnDate);
    if (inbound < outbound) {
      throw new Error('Return date must be on or after the departure outbound date.');
    }

    // 2. Persist to settings
    await writeSettings(validated);

    // 3. Dynamically reschedule the in-process cron daemon
    await initCron(true);

  } catch (error: any) {
    console.error('Validation failed saving settings:', error);
    return {
      success: false,
      error: error.message || 'Validation failed. Please verify format boundaries.'
    };
  }

  // 4. Redirect back to dashboard home page on success
  redirect('/');
}
