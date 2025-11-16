import type { AppData } from '../types';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProgressProps {
  data: AppData;
}

export default function Progress({ data }: ProgressProps) {
  // Combine and sort all weight data
  const weightData = [
    ...data.measurements
      .filter(m => m.weight)
      .map(m => ({ date: m.date, weight: m.weight!, source: 'manual' })),
    ...data.scaleData.map(s => ({ date: s.date, weight: s.weight, source: 'scale' })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const bodyFatData = [
    ...data.measurements
      .filter(m => m.bodyFat)
      .map(m => ({ date: m.date, bodyFat: m.bodyFat! })),
    ...data.scaleData
      .filter(s => s.bodyFat)
      .map(s => ({ date: s.date, bodyFat: s.bodyFat! })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const muscleMassData = [
    ...data.measurements
      .filter(m => m.muscleMass)
      .map(m => ({ date: m.date, muscleMass: m.muscleMass! })),
    ...data.scaleData
      .filter(s => s.muscleMass)
      .map(s => ({ date: s.date, muscleMass: s.muscleMass! })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const bodyMeasurementsData = data.measurements
    .filter(m => m.waist || m.chest || m.hips)
    .map(m => ({
      date: m.date,
      waist: m.waist,
      chest: m.chest,
      hips: m.hips,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const calculateTrend = (dataArray: { weight?: number; bodyFat?: number; muscleMass?: number }[]) => {
    if (dataArray.length < 2) return null;
    const first = dataArray[0];
    const last = dataArray[dataArray.length - 1];
    const value = (first.weight || first.bodyFat || first.muscleMass)!;
    const lastValue = (last.weight || last.bodyFat || last.muscleMass)!;
    const change = lastValue - value;
    const percentChange = ((change / value) * 100).toFixed(1);
    return { change: change.toFixed(1), percentChange, trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' };
  };

  const weightTrend = calculateTrend(weightData);
  const bodyFatTrend = calculateTrend(bodyFatData);
  const muscleMassTrend = calculateTrend(muscleMassData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-50 border border-primary/30 rounded-lg p-3 shadow-xl">
          <p className="text-sm text-gray-400 mb-2">{format(new Date(label), 'MMM d, yyyy')}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Progress & Analytics</h2>

      {/* Trend Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {weightTrend && weightData.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Weight Trend</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {weightData[weightData.length - 1].weight.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {weightTrend.change} kg ({weightTrend.percentChange}%)
                </p>
              </div>
              {weightTrend.trend === 'up' && <TrendingUp className="text-red-500" size={32} />}
              {weightTrend.trend === 'down' && <TrendingDown className="text-green-500" size={32} />}
              {weightTrend.trend === 'stable' && <Minus className="text-primary" size={32} />}
            </div>
          </div>
        )}

        {bodyFatTrend && bodyFatData.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Body Fat Trend</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {bodyFatData[bodyFatData.length - 1].bodyFat.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {bodyFatTrend.change}% ({bodyFatTrend.percentChange}%)
                </p>
              </div>
              {bodyFatTrend.trend === 'up' && <TrendingUp className="text-red-500" size={32} />}
              {bodyFatTrend.trend === 'down' && <TrendingDown className="text-green-500" size={32} />}
              {bodyFatTrend.trend === 'stable' && <Minus className="text-primary" size={32} />}
            </div>
          </div>
        )}

        {muscleMassTrend && muscleMassData.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Muscle Mass Trend</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {muscleMassData[muscleMassData.length - 1].muscleMass.toFixed(1)} kg
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {muscleMassTrend.change} kg ({muscleMassTrend.percentChange}%)
                </p>
              </div>
              {muscleMassTrend.trend === 'up' && <TrendingUp className="text-green-500" size={32} />}
              {muscleMassTrend.trend === 'down' && <TrendingDown className="text-red-500" size={32} />}
              {muscleMassTrend.trend === 'stable' && <Minus className="text-primary" size={32} />}
            </div>
          </div>
        )}
      </div>

      {/* Weight Chart */}
      {weightData.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Weight Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFCC00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FFCC00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                stroke="#888"
              />
              <YAxis stroke="#888" domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#FFCC00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorWeight)"
                name="Weight"
                unit="kg"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Fat Chart */}
      {bodyFatData.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Body Fat Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyFatData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                stroke="#888"
              />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="bodyFat"
                stroke="#FFCC00"
                strokeWidth={3}
                dot={{ fill: '#FFCC00', r: 5 }}
                activeDot={{ r: 7 }}
                name="Body Fat"
                unit="%"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Muscle Mass Chart */}
      {muscleMassData.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Muscle Mass Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={muscleMassData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                stroke="#888"
              />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="muscleMass"
                stroke="#FFCC00"
                strokeWidth={3}
                dot={{ fill: '#FFCC00', r: 5 }}
                activeDot={{ r: 7 }}
                name="Muscle Mass"
                unit="kg"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body Measurements Chart */}
      {bodyMeasurementsData.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Body Measurements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={bodyMeasurementsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
                stroke="#888"
              />
              <YAxis stroke="#888" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {bodyMeasurementsData.some(d => d.waist) && (
                <Line
                  type="monotone"
                  dataKey="waist"
                  stroke="#FFCC00"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Waist"
                  unit="cm"
                />
              )}
              {bodyMeasurementsData.some(d => d.chest) && (
                <Line
                  type="monotone"
                  dataKey="chest"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Chest"
                  unit="cm"
                />
              )}
              {bodyMeasurementsData.some(d => d.hips) && (
                <Line
                  type="monotone"
                  dataKey="hips"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Hips"
                  unit="cm"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {weightData.length === 0 && bodyFatData.length === 0 && muscleMassData.length === 0 && (
        <div className="card text-center text-gray-400">
          <p>No data available yet. Start tracking your measurements to see progress charts!</p>
        </div>
      )}
    </div>
  );
}
