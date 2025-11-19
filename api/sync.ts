import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (will reset on cold starts)
// For production, use Vercel KV or a database
let syncedData: Record<string, any[]> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user token from query or header
  const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '') || 'default';

  if (req.method === 'POST') {
    // Receive data from iOS app
    try {
      const records = req.body;

      if (!Array.isArray(records)) {
        return res.status(400).json({ error: 'Invalid data format. Expected array of records.' });
      }

      // Store or merge with existing data
      const existingRecords = syncedData[token] || [];
      const existingIds = new Set(existingRecords.map((r: any) => r.id));

      // Add new records (avoid duplicates)
      const newRecords = records.filter((r: any) => !existingIds.has(r.id));
      syncedData[token] = [...existingRecords, ...newRecords];

      return res.status(200).json({
        success: true,
        message: `Synced ${newRecords.length} new records`,
        totalRecords: syncedData[token].length
      });
    } catch (error) {
      console.error('Sync error:', error);
      return res.status(500).json({ error: 'Failed to sync data' });
    }
  }

  if (req.method === 'GET') {
    // Return synced data for web app
    try {
      const records = syncedData[token] || [];

      // Optional: filter by date range
      const since = req.query.since as string;
      let filteredRecords = records;

      if (since) {
        const sinceDate = new Date(since);
        filteredRecords = records.filter((r: any) => new Date(r.date) >= sinceDate);
      }

      return res.status(200).json({
        success: true,
        records: filteredRecords,
        count: filteredRecords.length
      });
    } catch (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  }

  if (req.method === 'DELETE') {
    // Clear synced data
    syncedData[token] = [];
    return res.status(200).json({ success: true, message: 'Data cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
