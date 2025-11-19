import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage (for demo - use Vercel KV or database for production)
// Structure: { [userId]: { measurements: [], photos: [], scaleData: [], settings: {} } }
const storage: Record<string, {
  measurements: any[];
  photos: any[];
  scaleData: any[];
  settings: any;
}> = {};

function getUserData(userId: string) {
  if (!storage[userId]) {
    storage[userId] = {
      measurements: [],
      photos: [],
      scaleData: [],
      settings: {}
    };
  }
  return storage[userId];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get user token
  const token = (req.query.token as string) || 'default';
  const dataType = req.query.type as string; // measurements, photos, scaleData, settings
  const userData = getUserData(token);

  if (!dataType) {
    // Return all data
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        data: userData
      });
    }
  }

  // Handle specific data types
  if (req.method === 'GET') {
    switch (dataType) {
      case 'measurements':
        return res.status(200).json({ success: true, data: userData.measurements });
      case 'photos':
        return res.status(200).json({ success: true, data: userData.photos });
      case 'scaleData':
        return res.status(200).json({ success: true, data: userData.scaleData });
      case 'settings':
        return res.status(200).json({ success: true, data: userData.settings });
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body;

    switch (dataType) {
      case 'measurements':
        if (Array.isArray(body)) {
          // Bulk add/replace
          userData.measurements = body;
        } else {
          // Add single item
          userData.measurements.push(body);
        }
        return res.status(200).json({ success: true, count: userData.measurements.length });

      case 'photos':
        if (Array.isArray(body)) {
          userData.photos = body;
        } else {
          userData.photos.push(body);
        }
        return res.status(200).json({ success: true, count: userData.photos.length });

      case 'scaleData':
        if (Array.isArray(body)) {
          // Merge with existing, avoiding duplicates by ID
          const existingIds = new Set(userData.scaleData.map((d: any) => d.id));
          const newItems = body.filter((item: any) => !existingIds.has(item.id));
          userData.scaleData = [...userData.scaleData, ...newItems];
        } else {
          const exists = userData.scaleData.find((d: any) => d.id === body.id);
          if (!exists) {
            userData.scaleData.push(body);
          }
        }
        return res.status(200).json({ success: true, count: userData.scaleData.length });

      case 'settings':
        userData.settings = { ...userData.settings, ...body };
        return res.status(200).json({ success: true });

      case 'sync':
        // Full sync - replace all data
        if (body.measurements) userData.measurements = body.measurements;
        if (body.photos) userData.photos = body.photos;
        if (body.scaleData) userData.scaleData = body.scaleData;
        if (body.settings) userData.settings = body.settings;
        return res.status(200).json({ success: true, message: 'Data synced' });

      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;

    if (!id) {
      // Clear all data of type
      switch (dataType) {
        case 'measurements':
          userData.measurements = [];
          break;
        case 'photos':
          userData.photos = [];
          break;
        case 'scaleData':
          userData.scaleData = [];
          break;
      }
      return res.status(200).json({ success: true, message: 'Data cleared' });
    }

    // Delete specific item by ID
    switch (dataType) {
      case 'measurements':
        userData.measurements = userData.measurements.filter((d: any) => d.id !== id);
        break;
      case 'photos':
        userData.photos = userData.photos.filter((d: any) => d.id !== id);
        break;
      case 'scaleData':
        userData.scaleData = userData.scaleData.filter((d: any) => d.id !== id);
        break;
    }
    return res.status(200).json({ success: true, message: 'Item deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
