import { useState, useEffect } from 'react';
import { Home, Activity, Camera, Scale, TrendingUp, Menu, X, Cloud, CloudOff } from 'lucide-react';
import type { ViewType, AppData } from './types';
import { loadData, addMeasurement, addPhoto, addScaleData, deleteMeasurement, deletePhoto, deleteScaleData, saveAllData } from './utils/storage';
import { loadDataWithFallback, saveData, getSyncToken } from './utils/api';
import Dashboard from './components/Dashboard';
import Measurements from './components/Measurements';
import Photos from './components/Photos';
import SmartScale from './components/SmartScale';
import Progress from './components/Progress';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [data, setData] = useState<AppData>(loadData());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Load data from API on startup
  useEffect(() => {
    const initializeData = async () => {
      try {
        const syncToken = getSyncToken();
        if (syncToken && syncToken !== 'default') {
          const serverData = await loadDataWithFallback();
          if (serverData) {
            // Convert date strings back to Date objects
            const processedData: AppData = {
              measurements: serverData.measurements.map((m: any) => ({
                ...m,
                date: new Date(m.date)
              })),
              photos: serverData.photos.map((p: any) => ({
                ...p,
                date: new Date(p.date)
              })),
              scaleData: serverData.scaleData.map((s: any) => ({
                ...s,
                date: new Date(s.date)
              }))
            };
            setData(processedData);
            // Also save to localStorage for offline access
            saveAllData(processedData);
            setIsSynced(true);
          }
        }
      } catch (error) {
        console.error('Failed to load data from server:', error);
      }
    };

    initializeData();
  }, []);

  // Sync data to server after changes
  const syncToServer = async (newData: AppData) => {
    const syncToken = getSyncToken();
    if (syncToken && syncToken !== 'default') {
      try {
        await saveData('sync', {
          measurements: newData.measurements,
          photos: newData.photos,
          scaleData: newData.scaleData,
          settings: {}
        });
        setIsSynced(true);
      } catch (error) {
        console.error('Failed to sync to server:', error);
        setIsSynced(false);
      }
    }
  };

  // Refresh data from localStorage and sync
  const refreshData = () => {
    const newData = loadData();
    setData(newData);
    syncToServer(newData);
  };

  useEffect(() => {
    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      refreshData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navigationItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: Home },
    { id: 'measurements' as ViewType, label: 'Measurements', icon: Activity },
    { id: 'photos' as ViewType, label: 'Photos', icon: Camera },
    { id: 'scale' as ViewType, label: 'Smart Scale', icon: Scale },
    { id: 'progress' as ViewType, label: 'Progress', icon: TrendingUp },
  ];

  const handleNavigation = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-100 border-b border-primary/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <Activity className="text-dark" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">FitTrack Pro</h1>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  {getSyncToken() && getSyncToken() !== 'default' ? (
                    <>
                      {isSynced ? (
                        <Cloud size={12} className="text-green-500" />
                      ) : (
                        <CloudOff size={12} className="text-orange-500" />
                      )}
                      <span>Synced</span>
                    </>
                  ) : (
                    'Your Fitness Journey'
                  )}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-primary text-dark font-semibold'
                      : 'text-gray-300 hover:bg-dark-50 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-dark-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-2 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-primary text-dark font-semibold'
                      : 'text-gray-300 hover:bg-dark-50 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {currentView === 'dashboard' && <Dashboard data={data} />}

        {currentView === 'measurements' && (
          <Measurements
            measurements={data.measurements}
            onAdd={(measurement) => {
              addMeasurement(measurement);
              refreshData();
            }}
            onDelete={(id) => {
              deleteMeasurement(id);
              refreshData();
            }}
          />
        )}

        {currentView === 'photos' && (
          <Photos
            photos={data.photos}
            onAdd={(photo) => {
              addPhoto(photo);
              refreshData();
            }}
            onDelete={(id) => {
              deletePhoto(id);
              refreshData();
            }}
          />
        )}

        {currentView === 'scale' && (
          <SmartScale
            scaleData={data.scaleData}
            onAdd={(scaleData) => {
              addScaleData(scaleData);
              refreshData();
            }}
            onDelete={(id) => {
              deleteScaleData(id);
              refreshData();
            }}
          />
        )}

        {currentView === 'progress' && <Progress data={data} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>FitTrack Pro - Track your fitness journey with style</p>
          <p className="mt-2 text-xs">
            {getSyncToken() && getSyncToken() !== 'default'
              ? 'Data syncs between web and iOS app using your sync token.'
              : 'Set a sync token in Smart Scale settings to sync with the iOS app.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
