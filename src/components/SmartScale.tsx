import { useState, useRef } from 'react';
import { Plus, Trash2, Calendar, Upload, FileText } from 'lucide-react';
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
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Parse Apple Health export XML for weight data
  const parseAppleHealthExport = async (file: File): Promise<SmartScaleData[]> => {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid XML file. Please export your data from Apple Health.');
    }

    const records: SmartScaleData[] = [];
    const existingDates = new Set(scaleData.map(d => format(d.date, 'yyyy-MM-dd')));

    // Find all weight records (HKQuantityTypeIdentifierBodyMass)
    const weightRecords = xmlDoc.querySelectorAll('Record[type="HKQuantityTypeIdentifierBodyMass"]');

    // Also check for body fat percentage
    const bodyFatRecords = xmlDoc.querySelectorAll('Record[type="HKQuantityTypeIdentifierBodyFatPercentage"]');
    const leanBodyMassRecords = xmlDoc.querySelectorAll('Record[type="HKQuantityTypeIdentifierLeanBodyMass"]');

    // Group records by date
    const recordsByDate = new Map<string, {
      weight?: number;
      bodyFat?: number;
      leanMass?: number;
      date: Date;
    }>();

    // Process weight records
    weightRecords.forEach((record) => {
      const value = parseFloat(record.getAttribute('value') || '0');
      const unit = record.getAttribute('unit') || 'kg';
      const startDate = record.getAttribute('startDate') || '';

      if (value > 0 && startDate) {
        // Parse date (format: "2024-01-01 10:00:00 +0000")
        const date = new Date(startDate);
        const dateKey = format(date, 'yyyy-MM-dd');

        // Convert to kg if needed
        let weightKg = value;
        if (unit === 'lb') {
          weightKg = value * 0.453592;
        }

        // Keep the most recent reading for each day
        const existing = recordsByDate.get(dateKey);
        if (!existing || date > existing.date) {
          recordsByDate.set(dateKey, {
            ...existing,
            weight: weightKg,
            date,
          });
        }
      }
    });

    // Process body fat records
    bodyFatRecords.forEach((record) => {
      const value = parseFloat(record.getAttribute('value') || '0');
      const startDate = record.getAttribute('startDate') || '';

      if (value > 0 && startDate) {
        const date = new Date(startDate);
        const dateKey = format(date, 'yyyy-MM-dd');

        // Body fat is stored as decimal (0.15 = 15%)
        const bodyFatPercent = value < 1 ? value * 100 : value;

        const existing = recordsByDate.get(dateKey);
        if (existing) {
          recordsByDate.set(dateKey, {
            ...existing,
            bodyFat: bodyFatPercent,
          });
        }
      }
    });

    // Process lean body mass records
    leanBodyMassRecords.forEach((record) => {
      const value = parseFloat(record.getAttribute('value') || '0');
      const unit = record.getAttribute('unit') || 'kg';
      const startDate = record.getAttribute('startDate') || '';

      if (value > 0 && startDate) {
        const date = new Date(startDate);
        const dateKey = format(date, 'yyyy-MM-dd');

        let leanMassKg = value;
        if (unit === 'lb') {
          leanMassKg = value * 0.453592;
        }

        const existing = recordsByDate.get(dateKey);
        if (existing) {
          recordsByDate.set(dateKey, {
            ...existing,
            leanMass: leanMassKg,
          });
        }
      }
    });

    // Convert to SmartScaleData format
    recordsByDate.forEach((data, dateKey) => {
      if (data.weight && !existingDates.has(dateKey)) {
        records.push({
          id: `apple-health-${dateKey}-${Date.now()}`,
          date: data.date,
          weight: Math.round(data.weight * 10) / 10,
          bodyFat: data.bodyFat ? Math.round(data.bodyFat * 10) / 10 : undefined,
          muscleMass: data.leanMass ? Math.round(data.leanMass * 10) / 10 : undefined,
        });
      }
    });

    // Sort by date (oldest first)
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return records;
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus('Reading file...');

    try {
      const records = await parseAppleHealthExport(file);

      if (records.length === 0) {
        setImportStatus('No new weight records found in file.');
      } else {
        // Add all records
        records.forEach((record) => {
          onAdd(record);
        });
        setImportStatus(`Successfully imported ${records.length} weight record${records.length > 1 ? 's' : ''}.`);
      }
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof Error) {
        setImportStatus(`Import failed: ${error.message}`);
      } else {
        setImportStatus('Import failed. Please check the file format.');
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={`btn-secondary flex items-center gap-2 ${isImporting ? 'opacity-50' : ''}`}
          >
            <Upload size={20} className={isImporting ? 'animate-pulse' : ''} />
            {isImporting ? 'Importing...' : 'Import from Apple Health'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleFileImport}
            className="hidden"
          />
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
            <FileText className="text-primary" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Import from Apple Health</h3>
            <p className="text-gray-400 text-sm mb-2">
              Import your weight data from Apple Health export. Your Fitdays app syncs data to Apple Health automatically.
            </p>
            <p className="text-gray-500 text-xs">
              To export: Open Health app → Profile → Export All Health Data → Save the export.xml file → Import here.
            </p>
          </div>
        </div>
      </div>

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
