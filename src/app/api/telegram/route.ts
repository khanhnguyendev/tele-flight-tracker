import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getSettings, writeSettings } from '@/services/settingsDb';
import { getHistory, addHistoryPoint } from '@/services/historyDb';
import { searchFlights } from '@/services/tracker';
import { sendTelegramMessage, compileScanReport, getCountdown } from '@/services/telegram';

// Help Message text
const HELP_MESSAGE = `
🤖 <b>Flight Tracker Bot Commands</b> 🤖

You can use the following commands to configure and trigger flight scans:

• /status - View current configurations, tracking intervals, active engine, and departure countdown.
• /scan or /scannow - Run an immediate real-time scan, log the findings, update the dashboard, and send the HTML report.
• /setorigin &lt;IATA&gt; - Update the departure airport code (e.g., <code>/setorigin SGN</code>).
• /setdest &lt;IATA&gt; - Update the arrival airport code (e.g., <code>/setdest CAN</code>).
• /setdates &lt;Outbound&gt; &lt;Return&gt; - Update travel dates (e.g., <code>/setdates 2026-08-28 2026-09-02</code>).
• /setinterval &lt;Cron&gt; - Update background scanning cron schedule (e.g., <code>/setinterval 0 */12 * * *</code>).
• /help - Display this English documentation.
`;

/**
 * GET handler: Returns a status of the bot settings and history.
 * Highly useful for local verification, monitoring, and browser checks.
 */
export async function GET() {
  try {
    const settings = await getSettings();
    const history = await getHistory();
    const countdown = getCountdown(settings.outboundDate);

    return NextResponse.json({
      success: true,
      botActive: !!process.env.TELEGRAM_BOT_TOKEN,
      settings,
      countdown,
      historyPointsCount: history.length,
      history
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST handler: Receives incoming conversational webhook updates from Telegram.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Telegram Webhook Update:', JSON.stringify(body, null, 2));

    const message = body.message;
    if (!message || !message.text) {
      // Ignore non-text updates (e.g. photos, stickers, edited messages)
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const text = message.text.trim();
    const allowedChatId = process.env.TELEGRAM_CHAT_ID;

    // SECURITY GATE: Strictly check chat ID
    if (!allowedChatId || chatId?.toString() !== allowedChatId.toString()) {
      console.warn(`SECURITY WARNING: Unauthorized command execution attempt from chat ID: ${chatId}`);
      // Silently discard or reply with alert
      await sendRawTelegramMessage(
        chatId,
        `❌ <b>Unauthorized Access!</b> Your chat ID (<code>${chatId}</code>) is not configured in this tracker's credentials.`
      );
      return NextResponse.json({ error: 'Unauthorized Chat ID' }, { status: 403 });
    }

    // Command Parsing
    const tokens = text.split(/\s+/);
    const command = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    const settings = await getSettings();

    if (command === '/help') {
      await sendTelegramMessage(HELP_MESSAGE);
      return NextResponse.json({ ok: true });
    }

    if (command === '/status') {
      const countdown = getCountdown(settings.outboundDate);
      const statusText = `
✈️ <b>Flight Tracker Config Status</b> ✈️

• <b>Route:</b> ${settings.origin} ⇄ ${settings.destination}
• <b>Outbound:</b> <code>${settings.outboundDate}</code>
• <b>Return:</b> <code>${settings.returnDate}</code>
• <b>Countdown:</b> ${countdown}
• <b>API Engine:</b> <code>${settings.engine.toUpperCase()}</code>
• <b>Currency:</b> ${settings.currency}
• <b>Scan Interval:</b> <code>${settings.cron}</code>
`;
      await sendTelegramMessage(statusText);
      return NextResponse.json({ ok: true });
    }

    if (command === '/scan' || command === '/scannow') {
      await sendTelegramMessage('⏳ <i>Executing manual real-time flight scan orchestrator... Please wait...</i>');
      
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
      await sendTelegramMessage(report);
      return NextResponse.json({ ok: true });
    }

    if (command === '/setorigin') {
      const originArg = args[0]?.toUpperCase();
      if (!originArg || originArg.length !== 3) {
        await sendTelegramMessage('⚠️ <b>Usage Error:</b> Please provide a valid 3-letter IATA airport code.\nExample: <code>/setorigin HAN</code>');
        return NextResponse.json({ ok: true });
      }

      const updated = await writeSettings({ origin: originArg });
      await sendTelegramMessage(`✅ <b>Origin Updated:</b> Flight route set to: <b>${updated.origin}</b> ⇄ <b>${updated.destination}</b>`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/setdest') {
      const destArg = args[0]?.toUpperCase();
      if (!destArg || destArg.length !== 3) {
        await sendTelegramMessage('⚠️ <b>Usage Error:</b> Please provide a valid 3-letter IATA airport code.\nExample: <code>/setdest CAN</code>');
        return NextResponse.json({ ok: true });
      }

      const updated = await writeSettings({ destination: destArg });
      await sendTelegramMessage(`✅ <b>Destination Updated:</b> Flight route set to: <b>${updated.origin}</b> ⇄ <b>${updated.destination}</b>`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/setdates') {
      const outbound = args[0];
      const returnDt = args[1];

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!outbound || !returnDt || !dateRegex.test(outbound) || !dateRegex.test(returnDt)) {
        await sendTelegramMessage('⚠️ <b>Usage Error:</b> Format must be YYYY-MM-DD.\nExample: <code>/setdates 2026-08-28 2026-09-02</code>');
        return NextResponse.json({ ok: true });
      }

      try {
        const updated = await writeSettings({ outboundDate: outbound, returnDate: returnDt });
        await sendTelegramMessage(`✅ <b>Travel Dates Updated:</b>\n• Outbound: <code>${updated.outboundDate}</code>\n• Return: <code>${updated.returnDate}</code>`);
      } catch (err: any) {
        await sendTelegramMessage(`❌ <b>Validation Failed:</b> ${err.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (command === '/setinterval') {
      const cronExpression = args.join(' ');
      if (!cronExpression) {
        await sendTelegramMessage('⚠️ <b>Usage Error:</b> Please provide a valid cron expression.\nExample: <code>/setinterval 0 */12 * * *</code>');
        return NextResponse.json({ ok: true });
      }

      try {
        const updated = await writeSettings({ cron: cronExpression });
        
        // Notify of update (dynamic reloading will read settings.json)
        await sendTelegramMessage(`✅ <b>Tracking Interval Updated:</b> Cron schedule set to <code>${updated.cron}</code>.\n<i>Background cron daemon rescheduled!</i>`);
        
        // Trigger rescheduled load by making a local request to scan handler if necessary
        try {
          const scanUrl = `${req.nextUrl.origin}/api/scan?reload=true`;
          await fetch(scanUrl).catch(() => {});
        } catch {}
      } catch (err: any) {
        await sendTelegramMessage(`❌ <b>Validation Failed:</b> ${err.message}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Default unrecognized command handler
    await sendTelegramMessage(`❓ <b>Unknown Command:</b> Unrecognized chat token. Use /help to list active bot controls.`);
    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error('Error handling webhook update:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * Direct message poster to arbitrary chat IDs (bypassing settings configuration).
 * Ideal for unauthorized warnings.
 */
async function sendRawTelegramMessage(chatId: number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    });
    return true;
  } catch {
    return false;
  }
}
