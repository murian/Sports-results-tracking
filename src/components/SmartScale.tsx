import { useState } from 'react';
import { Plus, Trash2, Calendar, Activity, Radio } from 'lucide-react';
import type { SmartScaleData } from '../types';
import { format } from 'date-fns';

interface SmartScaleProps {
  scaleData: SmartScaleData[];
  onAdd: (data: SmartScaleData) => void;
  onDelete: (id: string) => void;
}

// Types for experimental BLE scanning API
interface BluetoothLEScanOptions {
  filters?: BluetoothLEScanFilter[];
  keepRepeatedDevices?: boolean;
  acceptAllAdvertisements?: boolean;
}

interface BluetoothLEScan {
  stop(): void;
}

interface BluetoothAdvertisingEvent extends Event {
  device: BluetoothDevice;
  rssi: number;
  manufacturerData?: Map<number, DataView>;
  serviceData?: Map<string, DataView>;
}

// Extended Bluetooth interface with experimental scanning API
interface BluetoothWithScanning extends Bluetooth {
  requestLEScan?(options?: BluetoothLEScanOptions): Promise<BluetoothLEScan>;
}

export default function SmartScale({ scaleData, onAdd, onDelete }: SmartScaleProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('');
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

  // Parse weight from Chipsea scale advertisement data
  const parseChipseaWeight = (manufacturerData: Map<number, DataView>): number | null => {
    for (const [companyId, dataView] of manufacturerData) {
      console.log(`Manufacturer ID: 0x${companyId.toString(16)}, Data:`, new Uint8Array(dataView.buffer));

      // Try to parse weight from manufacturer data
      if (dataView.byteLength >= 2) {
        // Chipsea format: weight is often in bytes as (value * 100) in grams or kg
        // Try different parsing strategies

        // Strategy 1: Weight in bytes 0-1 (big endian) as kg * 100
        let weight = dataView.getUint16(0, false) / 100;
        if (weight > 20 && weight < 200) {
          return weight;
        }

        // Strategy 2: Weight in bytes 0-1 (little endian) as kg * 100
        weight = dataView.getUint16(0, true) / 100;
        if (weight > 20 && weight < 200) {
          return weight;
        }

        // Strategy 3: Look for weight in later bytes
        if (dataView.byteLength >= 4) {
          weight = dataView.getUint16(2, false) / 100;
          if (weight > 20 && weight < 200) {
            return weight;
          }
          weight = dataView.getUint16(2, true) / 100;
          if (weight > 20 && weight < 200) {
            return weight;
          }
        }

        // Strategy 4: Weight as grams in bytes 0-1
        weight = dataView.getUint16(0, true) / 1000;
        if (weight > 20 && weight < 200) {
          return weight;
        }
      }
    }
    return null;
  };

  const startScanning = async () => {
    setIsScanning(true);
    setScanStatus('Initializing...');

    try {
      // Cast to extended type for experimental scanning API
      const bluetooth = navigator.bluetooth as BluetoothWithScanning;

      // Check if Web Bluetooth Scanning is available
      if (!bluetooth?.requestLEScan) {
        alert(
          'BLE Scanning is not available in your browser.\n\n' +
          'To enable it in Chrome:\n' +
          '1. Go to chrome://flags\n' +
          '2. Search for "Experimental Web Platform features"\n' +
          '3. Enable it and restart Chrome\n\n' +
          'Alternative: Use "Add Manually" to enter your scale data.'
        );
        setIsScanning(false);
        setScanStatus('');
        return;
      }

      setScanStatus('Requesting permission...');

      // Request BLE scan - accept all advertisements
      const scan = await bluetooth.requestLEScan({
        acceptAllAdvertisements: true,
      });

      setScanStatus('Scanning... Step on your scale now!');

      // Listen for advertisement events
      const handleAdvertisement = (event: Event) => {
        const advEvent = event as BluetoothAdvertisingEvent;
        const device = advEvent.device;

        // Log all devices for debugging
        if (device.name || advEvent.manufacturerData?.size) {
          console.log('Device found:', device.name || device.id, advEvent);
        }

        // Check for Chipsea/CHWARES scale
        // These scales often have no name or generic names
        if (advEvent.manufacturerData && advEvent.manufacturerData.size > 0) {
          const weight = parseChipseaWeight(advEvent.manufacturerData);
          if (weight) {
            setLastWeight(weight);
            setScanStatus(`Weight detected: ${weight.toFixed(1)} kg`);
            console.log('Weight from advertisement:', weight);
          }
        }
      };

      (bluetooth as unknown as EventTarget).addEventListener('advertisementreceived', handleAdvertisement);

      // Stop scanning after 30 seconds
      setTimeout(() => {
        scan.stop();
        (bluetooth as unknown as EventTarget).removeEventListener('advertisementreceived', handleAdvertisement);
        setIsScanning(false);
        if (!lastWeight) {
          setScanStatus('Scan complete. No weight detected.');
        }
      }, 30000);

    } catch (error) {
      console.error('Scanning error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Permission denied. Please allow Bluetooth scanning when prompted.');
        } else if (error.name === 'NotFoundError') {
          alert('No Bluetooth adapter found. Make sure Bluetooth is enabled.');
        } else {
          alert(`Scanning failed: ${error.message}`);
        }
      }
      setIsScanning(false);
      setScanStatus('');
    }
  };

  const saveLastWeight = () => {
    if (lastWeight) {
      const data: SmartScaleData = {
        id: Date.now().toString(),
        date: new Date(),
        weight: lastWeight,
      };
      onAdd(data);
      setLastWeight(null);
      setScanStatus('Weight saved!');
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
        <div className="flex gap-2">
          <button
            onClick={startScanning}
            disabled={isScanning}
            className={`btn-secondary flex items-center gap-2 ${isScanning ? 'bg-primary text-dark' : ''}`}
          >
            <Radio size={20} className={isScanning ? 'animate-pulse' : ''} />
            {isScanning ? 'Scanning...' : 'Scan for Scale'}
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
            <Activity className="text-primary" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Bluetooth Smart Scale Integration</h3>
            <p className="text-gray-400 text-sm mb-2">
              Scan for CHWARES/Fitdays/Chipsea scales that broadcast weight via BLE advertisements.
            </p>
            <p className="text-gray-500 text-xs">
              Requires Chrome with "Experimental Web Platform features" enabled (chrome://flags). Step on your scale after clicking Scan.
            </p>
          </div>
        </div>
      </div>

      {/* Scanning Status & Weight Display */}
      {(scanStatus || lastWeight) && (
        <div className="card border-primary/50">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              {isScanning ? 'Scanning for Weight...' : 'Weight Reading'}
            </h3>
            {lastWeight ? (
              <>
                <p className="text-5xl font-bold text-primary mb-4">{lastWeight.toFixed(1)} kg</p>
                <button onClick={saveLastWeight} className="btn-primary">
                  Save This Weight
                </button>
              </>
            ) : (
              <p className="text-gray-400">{scanStatus}</p>
            )}
          </div>
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
