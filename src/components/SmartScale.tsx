import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Smartphone, RefreshCw, Settings } from 'lucide-react';
import type { SmartScaleData } from '../types';
import { format } from 'date-fns';

interface SmartScaleProps {
  scaleData: SmartScaleData[];
  onAdd: (data: SmartScaleData) => void;
  onDelete: (id: string) => void;
}

export default function SmartScale({ scaleData, onAdd, onDelete }: SmartScaleProps) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToken, setSyncToken] = useState<string>('');
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    muscleMass: '',
    boneMass: '',
    waterPercentage: '',
    visceralFat: '',
    bmr: '',
    metabolicAge: '',
    proteinPercentage: '',
  });

  // Load sync token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('fitnessSyncToken');
    if (savedToken) {
      setSyncToken(savedToken);
    }
  }, []);

  // Save sync token to localStorage
  const saveSyncToken = (token: string) => {
    setSyncToken(token);
    localStorage.setItem('fitnessSyncToken', token);
  };

  // Sync from iOS app via API
  const syncFromiOS = async () => {
    if (!syncToken) {
      setImportStatus('Please set your sync token first');
      setShowSyncSettings(true);
      return;
    }

    setIsSyncing(true);
    setImportStatus('Syncing from iOS...');

    try {
      const response = await fetch(`/api/sync?token=${encodeURIComponent(syncToken)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      if (data.records && data.records.length > 0) {
        const existingDates = new Set(scaleData.map(d => format(d.date, 'yyyy-MM-dd')));
        let addedCount = 0;

        data.records.forEach((record: any) => {
          const recordDate = new Date(record.date);
          const dateKey = format(recordDate, 'yyyy-MM-dd');

          if (!existingDates.has(dateKey)) {
            onAdd({
              id: record.id || `ios-${dateKey}-${Date.now()}`,
              date: recordDate,
              weight: record.weight,
              bodyFat: record.bodyFat,
              muscleMass: record.leanMass || record.muscleMass,
            });
            existingDates.add(dateKey);
            addedCount++;
          }
        });

        if (addedCount > 0) {
          setImportStatus(`Successfully synced ${addedCount} new record${addedCount > 1 ? 's' : ''} from iOS`);
        } else {
          setImportStatus('No new records to sync');
        }
      } else {
        setImportStatus('No records found. Open the iOS app and sync first.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (error instanceof Error) {
        setImportStatus(`Sync failed: ${error.message}`);
      } else {
        setImportStatus('Sync failed. Please try again.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data: SmartScaleData = {
      id: Date.now().toString(),
      date: new Date(formData.date),
      weight: parseFloat(formData.weight),
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
      boneMass: formData.boneMass ? parseFloat(formData.boneMass) : undefined,
      waterPercentage: formData.waterPercentage ? parseFloat(formData.waterPercentage) : undefined,
      visceralFat: formData.visceralFat ? parseFloat(formData.visceralFat) : undefined,
      bmr: formData.bmr ? parseFloat(formData.bmr) : undefined,
      metabolicAge: formData.metabolicAge ? parseFloat(formData.metabolicAge) : undefined,
      proteinPercentage: formData.proteinPercentage ? parseFloat(formData.proteinPercentage) : undefined,
    };

    onAdd(data);
    setShowManualForm(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      bodyFat: '',
      muscleMass: '',
      boneMass: '',
      waterPercentage: '',
      visceralFat: '',
      bmr: '',
      metabolicAge: '',
      proteinPercentage: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">Smart Scale</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={syncFromiOS}
            disabled={isSyncing}
            className={`btn-secondary flex items-center gap-2 ${isSyncing ? 'opacity-50' : ''}`}
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync from iOS'}
          </button>
          <button
            onClick={() => setShowSyncSettings(!showSyncSettings)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {showManualForm ? 'Cancel' : 'Add Manually'}
          </button>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-dark-50 to-dark-100">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Smartphone className="text-primary" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">iOS App Sync</h3>
            <p className="text-gray-400 text-sm mb-2">
              Automatically sync weight data from Apple Health using the companion iOS app.
            </p>
            <p className="text-gray-500 text-xs">
              1. Install the FitnessSync iOS app → 2. Grant Health access → 3. Set same sync token in both apps → 4. Tap Sync
            </p>
          </div>
        </div>
      </div>

      {/* Sync Settings Modal */}
      {showSyncSettings && (
        <div className="card border-primary/50">
          <h3 className="text-lg font-bold mb-4">Sync Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sync Token</label>
              <input
                type="text"
                value={syncToken}
                onChange={(e) => saveSyncToken(e.target.value)}
                placeholder="Enter a unique token (e.g., my-fitness-2024)"
                className="input-field w-full"
              />
              <p className="text-gray-500 text-xs mt-1">
                Use the same token in your iOS app settings to link them.
              </p>
            </div>
            <button
              onClick={() => setShowSyncSettings(false)}
              className="btn-primary w-full"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Import Status Display */}
      {importStatus && (
        <div className={`card border ${importStatus.includes('Successfully') ? 'border-green-500/50 bg-green-500/10' : importStatus.includes('failed') ? 'border-red-500/50 bg-red-500/10' : 'border-primary/50'}`}>
          <p className="text-center">{importStatus}</p>
        </div>
      )}

      {showManualForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Manual Entry</h3>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="75.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Body Fat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="bodyFat"
                  value={formData.bodyFat}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="15.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Muscle Mass (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="muscleMass"
                  value={formData.muscleMass}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="45.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bone Mass (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="boneMass"
                  value={formData.boneMass}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="3.2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Water (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="waterPercentage"
                  value={formData.waterPercentage}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="60.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visceral Fat</label>
                <input
                  type="number"
                  step="0.1"
                  name="visceralFat"
                  value={formData.visceralFat}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">BMR (kcal)</label>
                <input
                  type="number"
                  step="1"
                  name="bmr"
                  value={formData.bmr}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="1800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Metabolic Age</label>
                <input
                  type="number"
                  step="1"
                  name="metabolicAge"
                  value={formData.metabolicAge}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Protein (%)</label>
                <input
                  type="number"
                  step="0.1"
                  name="proteinPercentage"
                  value={formData.proteinPercentage}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="18.0"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full">
              Save Scale Data
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {scaleData.length === 0 ? (
          <div className="card text-center text-gray-400">
            <p>No scale data yet. Connect your smart scale or add data manually!</p>
          </div>
        ) : (
          scaleData.map((data) => (
            <div key={data.id} className="card hover:border-primary/50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-primary" size={20} />
                  <span className="font-semibold">
                    {format(data.date, 'MMMM d, yyyy')}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(data.id)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="bg-dark-100 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Weight</p>
                  <p className="font-semibold text-primary text-lg">{data.weight} kg</p>
                </div>
                {data.bodyFat && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Body Fat</p>
                    <p className="font-semibold text-primary">{data.bodyFat}%</p>
                  </div>
                )}
                {data.muscleMass && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Muscle Mass</p>
                    <p className="font-semibold text-primary">{data.muscleMass} kg</p>
                  </div>
                )}
                {data.boneMass && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Bone Mass</p>
                    <p className="font-semibold text-primary">{data.boneMass} kg</p>
                  </div>
                )}
                {data.waterPercentage && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Water</p>
                    <p className="font-semibold text-primary">{data.waterPercentage}%</p>
                  </div>
                )}
                {data.visceralFat && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Visceral Fat</p>
                    <p className="font-semibold text-primary">{data.visceralFat}</p>
                  </div>
                )}
                {data.bmr && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">BMR</p>
                    <p className="font-semibold text-primary">{data.bmr} kcal</p>
                  </div>
                )}
                {data.metabolicAge && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Metabolic Age</p>
                    <p className="font-semibold text-primary">{data.metabolicAge} years</p>
                  </div>
                )}
                {data.proteinPercentage && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Protein</p>
                    <p className="font-semibold text-primary">{data.proteinPercentage}%</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
