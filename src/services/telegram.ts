import axios from 'axios';
import { HistoryPoint } from './historyDb';
import { Settings } from './settingsDb';
import { StandardizedOffer } from './tracker';

/**
 * Computes timezone-safe departure countdown in ICT (GMT+7)
 */
export function getCountdown(outboundDateStr: string): string {
  try {
    // Departure at 00:00:00 ICT (GMT+7) on the outboundDate
    const targetDate = new Date(`${outboundDateStr}T00:00:00+07:00`);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return '🛫 **Departed!**';
    }

    const diffSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(diffSecs / (24 * 3600));
    const hours = Math.floor((diffSecs % (24 * 3600)) / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);

    return `<b>${days}d ${hours}h ${mins}m</b>`;
  } catch (error) {
    console.error('Error calculating countdown:', error);
    return 'N/A';
  }
}

/**
 * Generates Unicode horizontal block chart inside a <code> block
 */
export function generateAsciiChart(history: HistoryPoint[]): string {
  if (history.length === 0) {
    return '<i>No history data available yet</i>';
  }

  const prices = history.map(p => p.cheapestPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;

  let chart = '<code>\n';
  history.forEach(point => {
    // Format price in k (thousands) for clean ASCII display
    const priceK = Math.round(point.cheapestPrice / 1000);
    const formattedPrice = `${priceK.toLocaleString()}k`;
    
    // Scale bar length between 1 and 15 blocks
    let barLength = 8;
    if (range > 0) {
      barLength = Math.round(2 + ((point.cheapestPrice - minPrice) / range) * 12);
    }
    const bar = '█'.repeat(barLength);
    
    chart += `${point.timestamp} ➔ ${formattedPrice.padEnd(8)} | ${bar}\n`;
  });
  chart += '</code>';

  return chart;
}

/**
 * Dynamically compiles a QuickChart JSON query URL mapped to an Emerald Green line chart config
 */
export function generateQuickChartUrl(history: HistoryPoint[]): string {
  if (history.length === 0) return '';

  const labels = history.map(p => p.timestamp);
  const data = history.map(p => p.cheapestPrice);

  const chartConfig = {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Flight Price Trend (VND)',
          data: data,
          fill: true,
          borderColor: '#10b981', // Emerald Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          borderWidth: 3,
          pointRadius: 5
        }
      ]
    },
    options: {
      title: {
        display: true,
        text: 'Price Scan History',
        fontColor: '#f3f4f6',
        fontSize: 16
      },
      legend: {
        display: false
      },
      scales: {
        yAxes: [
          {
            gridLines: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              fontColor: '#9ca3af',
              callback: (value: number) => {
                return (value / 1000).toLocaleString() + 'k';
              }
            }
          }
        ],
        xAxes: [
          {
            gridLines: {
              display: false
            },
            ticks: {
              fontColor: '#9ca3af'
            }
          }
        ]
      }
    }
  };

  const encodedConfig = encodeURIComponent(JSON.stringify(chartConfig));
  return `https://quickchart.io/chart?c=${encodedConfig}&bkg=rgba(15,23,42,0.95)`; // Sleek dark slate background
}

/**
 * Dispatches HTML message reports to the Telegram bot channel
 */
export async function sendTelegramMessage(htmlText: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing. Message not sent.');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: htmlText,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    return response.data && response.data.ok;
  } catch (error: any) {
    console.error('Failed to send Telegram message:', error.message);
    return false;
  }
}

/**
 * Compiles a beautiful HTML scan alert report
 */
export function compileScanReport(
  settings: Settings,
  cheapestOffer: StandardizedOffer | null,
  history: HistoryPoint[]
): string {
  const route = `${settings.origin} ⇄ ${settings.destination}`;
  const dates = `${settings.outboundDate} to ${settings.returnDate}`;
  const countdownHtml = getCountdown(settings.outboundDate);
  const activeEngine = settings.engine.toUpperCase();

  let message = `🔔 <b>FLIGHT PRICE TRACKER SCAN ALERT</b> 🔔\n\n`;
  message += `✈️ <b>Route:</b> ${route}\n`;
  message += `📅 <b>Dates:</b> ${dates}\n`;
  message += `⏳ <b>Countdown:</b> ${countdownHtml}\n`;
  message += `🤖 <b>Engine:</b> ${activeEngine}\n\n`;

  if (cheapestOffer) {
    const formattedPrice = cheapestOffer.price.toLocaleString() + ' ' + settings.currency;
    message += `💰 <b>Cheapest Offer:</b> <code>${formattedPrice}</code> by <b>${cheapestOffer.carrierName}</b>\n`;
    message += `🛫 <b>Outbound:</b> ${cheapestOffer.outbound.departureTime} (Stops: ${cheapestOffer.outbound.stops})\n`;
    message += `🛬 <b>Inbound:</b> ${cheapestOffer.inbound.departureTime} (Stops: ${cheapestOffer.inbound.stops})\n`;
    message += `🔗 <a href="${cheapestOffer.deeplink}"><b>Book on Google Flights</b></a>\n\n`;
  } else {
    message += `❌ <b>No offers found in this scan!</b>\n\n`;
  }

  if (history.length > 0) {
    message += `📊 <b>Price Trend Visual (Last 10 Scans):</b>\n`;
    message += generateAsciiChart(history) + '\n\n';

    const chartUrl = generateQuickChartUrl(history);
    if (chartUrl) {
      message += `📈 <a href="${chartUrl}"><b>View Full Interactive Trend Chart</b></a>\n`;
    }
  }

  return message;
}
