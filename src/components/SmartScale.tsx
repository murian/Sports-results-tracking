import { useState } from 'react';
import { Bluetooth, Plus, Trash2, Calendar, Activity } from 'lucide-react';
import type { SmartScaleData } from '../types';
import { format } from 'date-fns';

interface SmartScaleProps {
  scaleData: SmartScaleData[];
  onAdd: (data: SmartScaleData) => void;
  onDelete: (id: string) => void;
}

export default function SmartScale({ scaleData, onAdd, onDelete }: SmartScaleProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
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

  const connectToScale = async () => {
    setIsConnecting(true);
    try {
      // Check if Web Bluetooth is available
      if (!('bluetooth' in navigator)) {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

        let message = 'Web Bluetooth is not available.\n\n';

        if (!isSecure) {
          message += 'Reason: This page must be served over HTTPS.\n\n';
        } else {
          message += 'Possible reasons:\n';
          message += '• Safari and iOS browsers do not support Web Bluetooth\n';
          message += '• You may need to enable Bluetooth in browser settings\n\n';
          message += 'For Chrome/Edge/Opera on macOS:\n';
          message += '1. Go to chrome://flags (or edge://flags)\n';
          message += '2. Search for "Web Bluetooth"\n';
          message += '3. Enable the feature and restart browser\n\n';
        }

        message += 'Alternative: Use "Add Manually" to enter your scale data.';

        alert(message);
        setIsConnecting(false);
        return;
      }

      // Request Bluetooth device - accept all devices to show all available scales
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'weight_scale',
          'body_composition',
          'battery_service',
          '0000fff0-0000-1000-8000-00805f9b34fb', // Common scale service
          '0000181b-0000-1000-8000-00805f9b34fb', // Body Composition
          '0000181d-0000-1000-8000-00805f9b34fb', // Weight Scale
        ]
      });

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      setIsConnected(true);
      alert('Connected to smart scale! The app will automatically receive data when you step on the scale.');

      // Listen for weight measurements
      // Note: This is a simplified example. Actual implementation would depend on your specific scale's protocol
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        alert('Disconnected from smart scale');
      });

    } catch (error) {
      console.error('Bluetooth connection error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          alert('No Bluetooth device selected. Please try again.');
        } else if (error.name === 'SecurityError') {
          alert('Bluetooth access denied. Please ensure:\n\n1. Site is served over HTTPS\n2. Browser has Bluetooth permission\n3. System Bluetooth is enabled');
        } else {
          alert(`Failed to connect to scale: ${error.message}`);
        }
      }
    } finally {
      setIsConnecting(false);
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
            onClick={connectToScale}
            disabled={isConnecting || isConnected}
            className={`btn-secondary flex items-center gap-2 ${isConnected ? 'bg-primary text-dark' : ''}`}
          >
            <Bluetooth size={20} />
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect Scale'}
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
              Connect your Bluetooth-enabled smart scale to automatically sync your weight and body composition data.
            </p>
            <p className="text-gray-500 text-xs">
              Supported on Chrome, Edge, and Opera browsers (desktop and Android). Make sure Bluetooth is enabled on your device.
            </p>
          </div>
        </div>
      </div>

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
