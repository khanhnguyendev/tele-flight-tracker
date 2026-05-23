/**
 * Translates standard cron expressions into highly readable human-friendly text.
 * Falls back gracefully to the raw cron string if the expression is advanced/custom.
 */
export function getFriendlyCronText(cronStr: string): string {
  if (!cronStr) return 'Not Scheduled';
  
  const clean = cronStr.trim().replace(/\s+/g, ' ');
  
  // Standard static cron mappings
  if (clean === '0 */6 * * *') return 'Every 6 hours';
  if (clean === '0 */12 * * *') return 'Every 12 hours';
  if (clean === '0 0 * * *' || clean === '0 0 * * *') return 'Every day at midnight';
  if (clean === '0 */24 * * *') return 'Every 24 hours';
  if (clean === '0 * * * *') return 'Every hour';
  if (clean === '*/5 * * * *') return 'Every 5 minutes';
  if (clean === '*/30 * * * *') return 'Every 30 minutes';
  if (clean === '0 0 * * 0') return 'Every Sunday (Weekly)';

  // Advanced parsing for generic hourly intervals: e.g. "0 */X * * *"
  const hourlyMatch = clean.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
  if (hourlyMatch) {
    const hours = hourlyMatch[1];
    return `Every ${hours} hours`;
  }

  // Advanced parsing for generic minutely intervals: e.g. "*/X * * * *"
  const minutelyMatch = clean.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
  if (minutelyMatch) {
    const minutes = minutelyMatch[1];
    return `Every ${minutes} minutes`;
  }

  // Fallback to stylized cron expression
  return `Cron: ${cronStr}`;
}
