import cron from 'node-cron';
import { getSettings } from './settingsDb';
import { searchFlights } from './tracker';
import { getHistory, addHistoryPoint } from './historyDb';
import { sendTelegramMessage, compileScanReport } from './telegram';

// Cache the cron job on the NodeJS global object to prevent multiple schedules running
// during Next.js hot reloads in development mode.
const globalCron = global as any;

/**
 * Initializes or reschedules the background cron tracking daemon in-process.
 */
export async function initCron(forceReload = false): Promise<void> {
  const settings = await getSettings();
  const targetCron = settings.cron;

  if (globalCron.activeCronJob && globalCron.activeCronStr === targetCron && !forceReload) {
    console.log(`[Cron Daemon] Schedule is already active and up-to-date: "${targetCron}"`);
    return;
  }

  // Stop old cron job if it exists
  if (globalCron.activeCronJob) {
    console.log(`[Cron Daemon] Stopping active cron job: "${globalCron.activeCronStr}"`);
    globalCron.activeCronJob.stop();
    globalCron.activeCronJob = null;
    globalCron.activeCronStr = null;
  }

  console.log(`[Cron Daemon] Initializing new cron job: "${targetCron}"`);
  
  globalCron.activeCronStr = targetCron;
  
  // Schedule node-cron job
  globalCron.activeCronJob = cron.schedule(targetCron, async () => {
    console.log('🕒 [Cron Daemon] Background scheduled flight scan triggered...');
    try {
      const currentSettings = await getSettings();
      const offers = await searchFlights(currentSettings);
      const cheapest = offers[0] || null;

      let history = await getHistory();
      if (cheapest) {
        history = await addHistoryPoint({
          cheapestPrice: cheapest.price,
          currency: currentSettings.currency,
          engine: currentSettings.engine,
          route: `${currentSettings.origin}-${currentSettings.destination}`,
          carrierName: cheapest.carrierName
        });
      }

      const report = compileScanReport(currentSettings, cheapest, history);
      const notified = await sendTelegramMessage(report);
      console.log(`✓ [Cron Daemon] Background scan completed. Telegram notified: ${notified}`);
    } catch (error) {
      console.error('❌ [Cron Daemon] Background scheduled scan failed:', error);
    }
  });
}

/**
 * Programmatically stops the cron daemon.
 */
export function stopCron(): void {
  if (globalCron.activeCronJob) {
    console.log(`[Cron Daemon] Stopping cron job on request: "${globalCron.activeCronStr}"`);
    globalCron.activeCronJob.stop();
    globalCron.activeCronJob = null;
    globalCron.activeCronStr = null;
  }
}
