import fs from 'fs';
import path from 'path';

export interface HistoryPoint {
  timestamp: string;     // ISO String or 'DD/MM HH:mm'
  cheapestPrice: number; // in currency units (e.g., VND)
  currency: string;
  engine: string;
  route: string;
  carrierName: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

/**
 * Ensures that the data directory exists.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads price scan history from history.json.
 */
export function getHistory(): HistoryPoint[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error('Error reading history, returning empty list:', error);
    return [];
  }
}

/**
 * Adds a new scan point to history, capping the size to the last 10 scans.
 */
export function addHistoryPoint(point: Omit<HistoryPoint, 'timestamp'>): HistoryPoint[] {
  ensureDataDir();
  try {
    const history = getHistory();
    
    // Format timestamp as DD/MM HH:mm in ICT time (GMT+7) or local server time
    const now = new Date();
    // Adjust to ICT timezone (GMT+7)
    const ictTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    
    const day = String(ictTime.getDate()).padStart(2, '0');
    const month = String(ictTime.getMonth() + 1).padStart(2, '0');
    const hours = String(ictTime.getHours()).padStart(2, '0');
    const minutes = String(ictTime.getMinutes()).padStart(2, '0');
    const timestampStr = `${day}/${month} ${hours}:${minutes}`;

    const newPoint: HistoryPoint = {
      ...point,
      timestamp: timestampStr
    };

    history.push(newPoint);

    // Cap the list to the last 10 points
    const cappedHistory = history.slice(-10);

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(cappedHistory, null, 2), 'utf8');
    return cappedHistory;
  } catch (error) {
    console.error('Error adding history point:', error);
    throw error;
  }
}

/**
 * Clears all scan history.
 */
export function clearHistory(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), 'utf8');
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}
