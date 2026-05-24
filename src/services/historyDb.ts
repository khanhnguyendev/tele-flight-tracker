import clientPromise from './mongodb';

export interface HistoryPoint {
  timestamp: string;     // 'DD/MM HH:mm'
  cheapestPrice: number; // in currency units (e.g., VND)
  currency: string;
  engine: string;
  route: string;
  carrierName: string;
  createdAt?: Date;      // Useful for sorting
}

/**
 * Reads price scan history from the history collection.
 */
export async function getHistory(): Promise<HistoryPoint[]> {
  try {
    const client = await clientPromise;
    const db = client.db('tele-flight');
    const docs = await db.collection('history').find({}).sort({ createdAt: 1 }).toArray();
    return docs.map(({ _id, ...rest }) => rest as HistoryPoint);
  } catch (error) {
    console.error('Error reading history from MongoDB, returning empty list:', error);
    return [];
  }
}

/**
 * Adds a new scan point to history, capping the collection size to the last 10 scans.
 */
export async function addHistoryPoint(point: Omit<HistoryPoint, 'timestamp'>): Promise<HistoryPoint[]> {
  try {
    const client = await clientPromise;
    const db = client.db('tele-flight');
    
    // Format timestamp as DD/MM HH:mm in ICT time (GMT+7)
    const now = new Date();
    const ictTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    
    const day = String(ictTime.getDate()).padStart(2, '0');
    const month = String(ictTime.getMonth() + 1).padStart(2, '0');
    const hours = String(ictTime.getHours()).padStart(2, '0');
    const minutes = String(ictTime.getMinutes()).padStart(2, '0');
    const timestampStr = `${day}/${month} ${hours}:${minutes}`;

    const newPoint: HistoryPoint = {
      ...point,
      timestamp: timestampStr,
      createdAt: now
    };

    // Insert the new point
    await db.collection('history').insertOne(newPoint);

    // Fetch history and sort by oldest first
    let history = await getHistory();

    // If history has more than 10 items, remove the oldest documents
    if (history.length > 10) {
      // Find how many documents to delete
      const deleteCount = history.length - 10;
      // Get the oldest documents to delete
      const docsToDelete = await db.collection('history')
        .find({})
        .sort({ createdAt: 1 })
        .limit(deleteCount)
        .toArray();
      
      const idsToDelete = docsToDelete.map(doc => doc._id);
      await db.collection('history').deleteMany({ _id: { $in: idsToDelete } });
      
      // Re-fetch clean history
      history = await getHistory();
    }

    return history;
  } catch (error) {
    console.error('Error adding history point to MongoDB:', error);
    throw error;
  }
}

/**
 * Clears all scan history.
 */
export async function clearHistory(): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db('tele-flight');
    await db.collection('history').deleteMany({});
  } catch (error) {
    console.error('Error clearing history in MongoDB:', error);
    throw error;
  }
}
