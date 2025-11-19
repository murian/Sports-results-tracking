import type { AppData, BodyMeasurement, BodyPhoto, SmartScaleData } from '../types';

const STORAGE_KEY = 'fitness-tracker-data';

const defaultData: AppData = {
  measurements: [],
  photos: [],
  scaleData: [],
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Convert date strings back to Date objects
      data.measurements = data.measurements.map((m: any) => ({
        ...m,
        date: new Date(m.date),
      }));
      data.photos = data.photos.map((p: any) => ({
        ...p,
        date: new Date(p.date),
      }));
      data.scaleData = data.scaleData.map((s: any) => ({
        ...s,
        date: new Date(s.date),
      }));
      return data;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

// Alias for saveData
export const saveAllData = saveData;

export const addMeasurement = (measurement: BodyMeasurement): void => {
  const data = loadData();
  data.measurements.push(measurement);
  data.measurements.sort((a, b) => b.date.getTime() - a.date.getTime());
  saveData(data);
};

export const addPhoto = (photo: BodyPhoto): void => {
  const data = loadData();
  data.photos.push(photo);
  data.photos.sort((a, b) => b.date.getTime() - a.date.getTime());
  saveData(data);
};

export const addScaleData = (scaleData: SmartScaleData): void => {
  const data = loadData();
  data.scaleData.push(scaleData);
  data.scaleData.sort((a, b) => b.date.getTime() - a.date.getTime());
  saveData(data);
};

export const deleteMeasurement = (id: string): void => {
  const data = loadData();
  data.measurements = data.measurements.filter(m => m.id !== id);
  saveData(data);
};

export const deletePhoto = (id: string): void => {
  const data = loadData();
  data.photos = data.photos.filter(p => p.id !== id);
  saveData(data);
};

export const deleteScaleData = (id: string): void => {
  const data = loadData();
  data.scaleData = data.scaleData.filter(s => s.id !== id);
  saveData(data);
};

export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    saveData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
};
