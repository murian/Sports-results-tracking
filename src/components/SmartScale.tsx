import { useState } from 'react';
import { Plus, Trash2, Calendar, Activity, Bluetooth } from 'lucide-react';
import type { SmartScaleData } from '../types';
import { format } from 'date-fns';

interface SmartScaleProps {
  scaleData: SmartScaleData[];
  onAdd: (data: SmartScaleData) => void;
  onDelete: (id: string) => void;
}

// Standard Bluetooth service UUIDs for scales
const WEIGHT_SCALE_SERVICE = 0x181D;
const BODY_COMPOSITION_SERVICE = 0x181B;
const WEIGHT_MEASUREMENT_CHAR = 0x2A9D;
const BODY_COMPOSITION_MEASUREMENT_CHAR = 0x2A9C;

// Chipsea-specific UUIDs
const CHIPSEA_SERVICE = 0xFFF0;
const CHIPSEA_NOTIFY_CHAR = 0xFFF4;
const CHIPSEA_WRITE_CHAR = 0xFFF1;

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

  // Parse weight from characteristic data
  const parseWeightData = (dataView: DataView): number | null => {
    const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
    console.log('Received data:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '));

    // Standard Weight Measurement (0x2A9D) format
    // Byte 0: Flags
    // Bytes 1-2: Weight (little-endian)
    if (bytes.length >= 3) {
      const flags = bytes[0];
      const weightRaw = bytes[1] | (bytes[2] << 8);

      // Check unit flag (bit 0): 0 = kg, 1 = lb
      const isImperial = (flags & 0x01) !== 0;
      let weight = weightRaw * 0.005; // Resolution is 0.005 kg or 0.01 lb

      if (isImperial) {
        weight = weight * 0.453592; // Convert lb to kg
      }

      console.log(`Standard format: Raw=${weightRaw}, Weight=${weight.toFixed(2)} kg`);
      if (weight > 0 && weight < 300) {
        return weight;
      }
    }

    // Chipsea format variations
    if (bytes.length >= 2) {
      // Try different parsing strategies

      // Format 1: Weight as uint16 / 10
      let weight = (bytes[0] | (bytes[1] << 8)) / 10;
      if (weight > 20 && weight < 200) {
        console.log(`Chipsea format 1: ${weight} kg`);
        return weight;
      }

      // Format 2: Weight as uint16 / 100
      weight = (bytes[0] | (bytes[1] << 8)) / 100;
      if (weight > 20 && weight < 200) {
        console.log(`Chipsea format 2: ${weight} kg`);
        return weight;
      }

      // Format 3: Check bytes 4-5 for Chipsea with header
      if (bytes.length >= 6) {
        // Lenovo HS11 format: (((byte5 & 15) << 8) + byte6) * 0.1
        weight = (((bytes[4] & 0x0F) << 8) + bytes[5]) * 0.1;
        if (weight > 20 && weight < 200) {
          console.log(`Chipsea HS11 format: ${weight} kg`);
          return weight;
        }
      }

      // Fallback: scan all byte pairs
      for (let i = 0; i < bytes.length - 1; i++) {
        weight = (bytes[i] | (bytes[i + 1] << 8)) / 10;
        if (weight >= 30 && weight <= 150) {
          console.log(`Fallback at position ${i}: ${weight} kg`);
          return weight;
        }
      }
    }

    return null;
  };

  const startScanning = async () => {
    setIsScanning(true);
    setScanStatus('Searching for scale...');

    try {
      // Check if Web Bluetooth is available
      if (!navigator.bluetooth) {
        alert('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
        setIsScanning(false);
        setScanStatus('');
        return;
      }

      console.log('Requesting Bluetooth device...');

      // Request device with multiple service options
      const device = await navigator.bluetooth.requestDevice({
        // Accept all devices to show everything
        acceptAllDevices: true,
        // Request access to all possible scale services
        optionalServices: [
          WEIGHT_SCALE_SERVICE,
          BODY_COMPOSITION_SERVICE,
          CHIPSEA_SERVICE,
          'generic_access',
          'generic_attribute',
        ],
      });

      console.log('Device selected:', device.name || device.id);
      setScanStatus(`Connecting to ${device.name || 'scale'}...`);

      // Connect to GATT server
      const server = await device.gatt!.connect();
      console.log('Connected to GATT server');

      let weightFound = false;

      // Try to find and subscribe to weight services
      const tryService = async (serviceUuid: number, charUuid: number, serviceName: string) => {
        try {
          console.log(`Trying ${serviceName} service (0x${serviceUuid.toString(16)})...`);
          const service = await server.getPrimaryService(serviceUuid);
          const characteristic = await service.getCharacteristic(charUuid);

          console.log(`Found ${serviceName} characteristic, subscribing to notifications...`);

          characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
            const target = event.target as unknown as { value?: DataView };
            if (target.value) {
              const weight = parseWeightData(target.value);
              if (weight) {
                setLastWeight(weight);
                setScanStatus(`Weight: ${weight.toFixed(1)} kg`);
                weightFound = true;
              }
            }
          });

          await characteristic.startNotifications();
          console.log(`Subscribed to ${serviceName} notifications`);
          setScanStatus('Connected! Step on your scale...');
          return true;
        } catch (e) {
          console.log(`${serviceName} not available:`, e);
          return false;
        }
      };

      // Try standard Weight Scale service first
      let connected = await tryService(WEIGHT_SCALE_SERVICE, WEIGHT_MEASUREMENT_CHAR, 'Weight Scale');

      // Try Body Composition service
      if (!connected) {
        connected = await tryService(BODY_COMPOSITION_SERVICE, BODY_COMPOSITION_MEASUREMENT_CHAR, 'Body Composition');
      }

      // Try Chipsea service
      if (!connected) {
        connected = await tryService(CHIPSEA_SERVICE, CHIPSEA_NOTIFY_CHAR, 'Chipsea');
      }

      // If Chipsea service found, we may need to send init command
      if (connected) {
        try {
          const service = await server.getPrimaryService(CHIPSEA_SERVICE);
          const writeChar = await service.getCharacteristic(CHIPSEA_WRITE_CHAR);
          // Send initialization command (common Chipsea init sequence)
          const initCmd = new Uint8Array([0xFD, 0x37, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
          await writeChar.writeValue(initCmd);
          console.log('Sent Chipsea init command');
        } catch (e) {
          console.log('Chipsea write characteristic not available:', e);
        }
      }

      if (!connected) {
        console.log('No known scale services found.');
        console.log('This scale may use a proprietary protocol not yet supported.');
        console.log('Please use "Add Manually" to enter your scale data.');

        setScanStatus('Connected but no weight service found. Use manual entry.');
      }

      // Auto-disconnect after 60 seconds
      setTimeout(() => {
        if (device.gatt?.connected) {
          device.gatt.disconnect();
          console.log('Disconnected from scale');
        }
        setIsScanning(false);
        if (!weightFound) {
          setScanStatus('Session ended. No weight detected.');
        }
      }, 60000);

    } catch (error) {
      console.error('Bluetooth error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          setScanStatus('No device selected');
        } else if (error.name === 'SecurityError') {
          alert('Bluetooth access denied. Make sure you are using HTTPS.');
        } else {
          alert(`Connection failed: ${error.message}`);
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
            <Bluetooth size={20} className={isScanning ? 'animate-pulse' : ''} />
            {isScanning ? 'Connected...' : 'Connect Scale'}
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
              Connect to your Bluetooth smart scale to automatically sync weight data.
            </p>
            <p className="text-gray-500 text-xs">
              Works with Chrome, Edge, or Opera. Click "Connect Scale", select your device from the list, then step on the scale.
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
