import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/services/settingsDb';
import { getHistory, addHistoryPoint } from '@/services/historyDb';
import { searchFlights } from '@/services/tracker';
import { sendTelegramMessage, compileScanReport } from '@/services/telegram';
import { initCron } from '@/services/cron';

/**
 * Route handler to trigger a flight scan manually or via cron scheduler.
 * Supports GET/POST request actions.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reload = searchParams.get('reload') === 'true';

    // Lazy load and guarantee the background cron daemon is initialized
    await initCron(reload);

    if (reload) {
      return NextResponse.json({
        success: true,
        message: 'Cron daemon rescheduled and reloaded successfully.'
      });
    }

    console.log('GET /api/scan: Starting manual flight price scan...');
    const settings = await getSettings();
    const offers = await searchFlights(settings);
    const cheapest = offers[0] || null;

    let history = await getHistory();
    if (cheapest) {
      history = await addHistoryPoint({
        cheapestPrice: cheapest.price,
        currency: settings.currency,
        engine: settings.engine,
        route: `${settings.origin}-${settings.destination}`,
        carrierName: cheapest.carrierName
      });
    }

    const report = compileScanReport(settings, cheapest, history);
    const notified = await sendTelegramMessage(report);

    return NextResponse.json({
      success: true,
      message: 'Flight price scan completed successfully.',
      telegramNotified: notified,
      scanResult: {
        cheapestOffer: cheapest,
        totalOffersCount: offers.length
      }
    });
  } catch (error: any) {
    console.error('Manual flight scan router failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
