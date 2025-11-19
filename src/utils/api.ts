// API utilities for data sync

const API_BASE = '/api/data';

export interface SyncData {
  measurements: any[];
  photos: any[];
  scaleData: any[];
  settings: any;
}

// Get the sync token from localStorage
export function getSyncToken(): string {
  return localStorage.getItem('fitnessSyncToken') || 'default';
}

export function setSyncToken(token: string): void {
  localStorage.setItem('fitnessSyncToken', token);
}

// Fetch all data from server
export async function fetchAllData(): Promise<SyncData | null> {
  try {
    const token = getSyncToken();
    const response = await fetch(`${API_BASE}?token=${encodeURIComponent(token)}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return null;
  }
}

// Fetch specific data type
export async function fetchData(type: 'measurements' | 'photos' | 'scaleData' | 'settings'): Promise<any[] | any | null> {
  try {
    const token = getSyncToken();
    const response = await fetch(`${API_BASE}?token=${encodeURIComponent(token)}&type=${type}`);
    const result = await response.json();

    if (result.success) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch ${type}:`, error);
    return null;
  }
}

// Save data to server
export async function saveData(
  type: 'measurements' | 'photos' | 'scaleData' | 'settings' | 'sync',
  data: any
): Promise<boolean> {
  try {
    const token = getSyncToken();
    const response = await fetch(`${API_BASE}?token=${encodeURIComponent(token)}&type=${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Failed to save ${type}:`, error);
    return false;
  }
}

// Delete item from server
export async function deleteData(
  type: 'measurements' | 'photos' | 'scaleData',
  id: string
): Promise<boolean> {
  try {
    const token = getSyncToken();
    const response = await fetch(
      `${API_BASE}?token=${encodeURIComponent(token)}&type=${type}&id=${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(`Failed to delete from ${type}:`, error);
    return false;
  }
}

// Sync local data to server (full sync)
export async function syncToServer(data: SyncData): Promise<boolean> {
  return saveData('sync', data);
}

// Load data with fallback to localStorage
export async function loadDataWithFallback(): Promise<SyncData> {
  // Try to fetch from server first
  const serverData = await fetchAllData();

  if (serverData && (
    serverData.measurements.length > 0 ||
    serverData.photos.length > 0 ||
    serverData.scaleData.length > 0
  )) {
    // Server has data, use it
    return serverData;
  }

  // Fallback to localStorage
  const localData: SyncData = {
    measurements: JSON.parse(localStorage.getItem('measurements') || '[]'),
    photos: JSON.parse(localStorage.getItem('photos') || '[]'),
    scaleData: JSON.parse(localStorage.getItem('scaleData') || '[]'),
    settings: JSON.parse(localStorage.getItem('settings') || '{}'),
  };

  // If we have local data but not on server, sync it up
  if (localData.measurements.length > 0 || localData.photos.length > 0 || localData.scaleData.length > 0) {
    await syncToServer(localData);
  }

  return localData;
}
