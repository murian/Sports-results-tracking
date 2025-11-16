import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import type { BodyMeasurement } from '../types';
import { format } from 'date-fns';

interface MeasurementsProps {
  measurements: BodyMeasurement[];
  onAdd: (measurement: BodyMeasurement) => void;
  onDelete: (id: string) => void;
}

export default function Measurements({ measurements, onAdd, onDelete }: MeasurementsProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    chest: '',
    waist: '',
    hips: '',
    thighs: '',
    arms: '',
    calves: '',
    shoulders: '',
    neck: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const measurement: BodyMeasurement = {
      id: Date.now().toString(),
      date: new Date(formData.date),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      muscleMass: formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
      bmi: formData.bmi ? parseFloat(formData.bmi) : undefined,
      chest: formData.chest ? parseFloat(formData.chest) : undefined,
      waist: formData.waist ? parseFloat(formData.waist) : undefined,
      hips: formData.hips ? parseFloat(formData.hips) : undefined,
      thighs: formData.thighs ? parseFloat(formData.thighs) : undefined,
      arms: formData.arms ? parseFloat(formData.arms) : undefined,
      calves: formData.calves ? parseFloat(formData.calves) : undefined,
      shoulders: formData.shoulders ? parseFloat(formData.shoulders) : undefined,
      neck: formData.neck ? parseFloat(formData.neck) : undefined,
      notes: formData.notes || undefined,
    };

    onAdd(measurement);
    setShowForm(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      bodyFat: '',
      muscleMass: '',
      bmi: '',
      chest: '',
      waist: '',
      hips: '',
      thighs: '',
      arms: '',
      calves: '',
      shoulders: '',
      neck: '',
      notes: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Body Measurements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Add Measurement'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">New Measurement</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="75.5"
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
                <label className="block text-sm font-medium mb-2">BMI</label>
                <input
                  type="number"
                  step="0.1"
                  name="bmi"
                  value={formData.bmi}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="22.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Chest (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="chest"
                  value={formData.chest}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="95.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Waist (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="waist"
                  value={formData.waist}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="80.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Hips (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="hips"
                  value={formData.hips}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="95.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thighs (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="thighs"
                  value={formData.thighs}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="55.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Arms (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="arms"
                  value={formData.arms}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="35.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Calves (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="calves"
                  value={formData.calves}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="38.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shoulders (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="shoulders"
                  value={formData.shoulders}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="110.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Neck (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="neck"
                  value={formData.neck}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="38.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field w-full"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Save Measurement
            </button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {measurements.length === 0 ? (
          <div className="card text-center text-gray-400">
            <p>No measurements yet. Add your first measurement to start tracking!</p>
          </div>
        ) : (
          measurements.map((measurement) => (
            <div key={measurement.id} className="card hover:border-primary/50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="text-primary" size={20} />
                  <span className="font-semibold">
                    {format(measurement.date, 'MMMM d, yyyy')}
                  </span>
                </div>
                <button
                  onClick={() => onDelete(measurement.id)}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {measurement.weight && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="font-semibold text-primary">{measurement.weight} kg</p>
                  </div>
                )}
                {measurement.bodyFat && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Body Fat</p>
                    <p className="font-semibold text-primary">{measurement.bodyFat}%</p>
                  </div>
                )}
                {measurement.muscleMass && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Muscle Mass</p>
                    <p className="font-semibold text-primary">{measurement.muscleMass} kg</p>
                  </div>
                )}
                {measurement.bmi && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">BMI</p>
                    <p className="font-semibold text-primary">{measurement.bmi}</p>
                  </div>
                )}
                {measurement.chest && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Chest</p>
                    <p className="font-semibold text-primary">{measurement.chest} cm</p>
                  </div>
                )}
                {measurement.waist && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Waist</p>
                    <p className="font-semibold text-primary">{measurement.waist} cm</p>
                  </div>
                )}
                {measurement.hips && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Hips</p>
                    <p className="font-semibold text-primary">{measurement.hips} cm</p>
                  </div>
                )}
                {measurement.thighs && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Thighs</p>
                    <p className="font-semibold text-primary">{measurement.thighs} cm</p>
                  </div>
                )}
                {measurement.arms && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Arms</p>
                    <p className="font-semibold text-primary">{measurement.arms} cm</p>
                  </div>
                )}
                {measurement.calves && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Calves</p>
                    <p className="font-semibold text-primary">{measurement.calves} cm</p>
                  </div>
                )}
                {measurement.shoulders && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Shoulders</p>
                    <p className="font-semibold text-primary">{measurement.shoulders} cm</p>
                  </div>
                )}
                {measurement.neck && (
                  <div className="bg-dark-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Neck</p>
                    <p className="font-semibold text-primary">{measurement.neck} cm</p>
                  </div>
                )}
              </div>

              {measurement.notes && (
                <div className="mt-3 p-3 bg-dark-100 rounded-lg">
                  <p className="text-sm text-gray-300">{measurement.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
