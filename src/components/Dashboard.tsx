import { Activity, Camera, Scale, TrendingUp, Calendar } from 'lucide-react';
import type { AppData } from '../types';
import { format } from 'date-fns';

interface DashboardProps {
  data: AppData;
}

export default function Dashboard({ data }: DashboardProps) {
  const latestMeasurement = data.measurements[0];
  const latestScale = data.scaleData[0];

  const stats = [
    {
      title: 'Total Measurements',
      value: data.measurements.length,
      icon: Activity,
      color: 'text-primary',
    },
    {
      title: 'Progress Photos',
      value: data.photos.length,
      icon: Camera,
      color: 'text-primary',
    },
    {
      title: 'Scale Readings',
      value: data.scaleData.length,
      icon: Scale,
      color: 'text-primary',
    },
    {
      title: 'Days Tracking',
      value: data.measurements.length > 0
        ? Math.ceil((Date.now() - data.measurements[data.measurements.length - 1].date.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      icon: Calendar,
      color: 'text-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-8 text-dark">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome to Your Fitness Journey</h1>
          <p className="text-lg opacity-90">Track your progress and achieve your goals</p>
        </div>
        <div className="absolute top-0 right-0 opacity-10">
          <TrendingUp size={200} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:scale-105 transform transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={stat.color} size={40} />
            </div>
          </div>
        ))}
      </div>

      {/* Latest Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Measurement */}
        {latestMeasurement && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="text-primary" />
              Latest Measurement
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                {format(latestMeasurement.date, 'MMMM d, yyyy')}
              </p>
              {latestMeasurement.weight && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Weight:</span>
                  <span className="font-semibold text-primary">{latestMeasurement.weight} kg</span>
                </div>
              )}
              {latestMeasurement.bodyFat && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Body Fat:</span>
                  <span className="font-semibold text-primary">{latestMeasurement.bodyFat}%</span>
                </div>
              )}
              {latestMeasurement.waist && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Waist:</span>
                  <span className="font-semibold text-primary">{latestMeasurement.waist} cm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest Scale Reading */}
        {latestScale && (
          <div className="card">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Scale className="text-primary" />
              Latest Scale Reading
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                {format(latestScale.date, 'MMMM d, yyyy')}
              </p>
              <div className="flex justify-between">
                <span className="text-gray-300">Weight:</span>
                <span className="font-semibold text-primary">{latestScale.weight} kg</span>
              </div>
              {latestScale.bodyFat && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Body Fat:</span>
                  <span className="font-semibold text-primary">{latestScale.bodyFat}%</span>
                </div>
              )}
              {latestScale.muscleMass && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Muscle Mass:</span>
                  <span className="font-semibold text-primary">{latestScale.muscleMass} kg</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {data.measurements.length === 0 && data.photos.length === 0 && data.scaleData.length === 0 && (
        <div className="card text-center">
          <h3 className="text-2xl font-bold mb-4">Get Started</h3>
          <p className="text-gray-400 mb-6">
            Start your fitness journey by adding your first measurement, photo, or scale reading!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary">Add Measurement</button>
            <button className="btn-secondary">Take Photo</button>
            <button className="btn-secondary">Connect Scale</button>
          </div>
        </div>
      )}
    </div>
  );
}
