import { useState, useRef } from 'react';
import { Plus, Trash2, Calendar, Camera, ArrowLeftRight, Sparkles, Settings, X, Loader2 } from 'lucide-react';
import type { BodyPhoto } from '../types';
import { format } from 'date-fns';
import { comparePhotosWithAI, hasGeminiApiKey, setGeminiApiKey, getGeminiApiKey, removeGeminiApiKey, type PhotoComparisonResult } from '../utils/gemini';

interface PhotosProps {
  photos: BodyPhoto[];
  onAdd: (photo: BodyPhoto) => void;
  onDelete: (id: string) => void;
}

export default function Photos({ photos, onAdd, onDelete }: PhotosProps) {
  const [showForm, setShowForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiInsights, setAiInsights] = useState<PhotoComparisonResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    front: '',
    side: '',
    back: '',
    notes: '',
  });

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [type]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const photo: BodyPhoto = {
      id: Date.now().toString(),
      date: new Date(formData.date),
      front: formData.front || undefined,
      side: formData.side || undefined,
      back: formData.back || undefined,
      notes: formData.notes || undefined,
    };

    onAdd(photo);
    setShowForm(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      front: '',
      side: '',
      back: '',
      notes: '',
    });
  };

  const handlePhotoSelect = (id: string) => {
    if (selectedPhotos.includes(id)) {
      setSelectedPhotos(selectedPhotos.filter(p => p !== id));
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos([...selectedPhotos, id]);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setGeminiApiKey(apiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyInput('');
    }
  };

  const handleRemoveApiKey = () => {
    removeGeminiApiKey();
    setShowApiKeyModal(false);
  };

  const handleAiComparison = async () => {
    if (selectedPhotos.length !== 2) {
      setError('Please select exactly 2 photos to compare');
      return;
    }

    if (!hasGeminiApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    const photo1 = comparePhotosData[0];
    const photo2 = comparePhotosData[1];

    // Use front photo for comparison, fallback to side or back
    const image1 = photo1.front || photo1.side || photo1.back;
    const image2 = photo2.front || photo2.side || photo2.back;

    if (!image1 || !image2) {
      setError('Both selected photos must have at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await comparePhotosWithAI(
        image1,
        image2,
        format(photo1.date, 'MMMM d, yyyy'),
        format(photo2.date, 'MMMM d, yyyy'),
        photo1.notes,
        photo2.notes
      );
      setAiInsights(result);
    } catch (err) {
      console.error('AI comparison error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze photos. Please check your API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const comparePhotosData = selectedPhotos.map(id => photos.find(p => p.id === id)).filter(Boolean) as BodyPhoto[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">Progress Photos</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="btn-secondary flex items-center gap-2"
            title="Configure Gemini API"
          >
            <Settings size={20} />
            AI Config
          </button>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedPhotos([]);
              setAiInsights(null);
              setError(null);
            }}
            className={`btn-secondary flex items-center gap-2 ${compareMode ? 'bg-primary text-dark' : ''}`}
          >
            <ArrowLeftRight size={20} />
            Compare
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {showForm ? 'Cancel' : 'Add Photos'}
          </button>
        </div>
      </div>

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Configure Gemini AI</h3>
              <button onClick={() => setShowApiKeyModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                To use AI-powered photo comparison, you need a Google Gemini API key.
              </p>
              <div className="bg-dark-100 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-primary">How to get your API key:</p>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Click "Get API Key" or "Create API Key"</li>
                  <li>Copy the key and paste it below</li>
                </ol>
              </div>
              {hasGeminiApiKey() && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm text-green-400">✓ API Key is configured</p>
                  <p className="text-xs text-gray-400 mt-1">Key: {getGeminiApiKey()?.substring(0, 10)}...</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Gemini API Key</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="input-field w-full"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveApiKey} className="btn-primary flex-1">
                  Save API Key
                </button>
                {hasGeminiApiKey() && (
                  <button onClick={handleRemoveApiKey} className="btn-secondary">
                    Remove Key
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Mode with AI */}
      {compareMode && selectedPhotos.length > 0 && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Comparison View</h3>
              {selectedPhotos.length === 2 && (
                <button
                  onClick={handleAiComparison}
                  disabled={isAnalyzing}
                  className="btn-primary flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Get AI Insights
                    </>
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparePhotosData.map((photo) => (
                <div key={photo.id} className="space-y-3">
                  <p className="font-semibold text-primary text-center">
                    {format(photo.date, 'MMMM d, yyyy')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {photo.front && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1 text-center">Front</p>
                        <img
                          src={photo.front}
                          alt="Front"
                          className="w-full h-64 object-cover rounded-lg border border-primary/20"
                        />
                      </div>
                    )}
                    {photo.side && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1 text-center">Side</p>
                        <img
                          src={photo.side}
                          alt="Side"
                          className="w-full h-64 object-cover rounded-lg border border-primary/20"
                        />
                      </div>
                    )}
                    {photo.back && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1 text-center">Back</p>
                        <img
                          src={photo.back}
                          alt="Back"
                          className="w-full h-64 object-cover rounded-lg border border-primary/20"
                        />
                      </div>
                    )}
                  </div>
                  {photo.notes && (
                    <div className="bg-dark-100 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Notes:</p>
                      <p className="text-sm text-gray-300">{photo.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Display */}
          {aiInsights && (
            <div className="card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h3 className="text-xl font-bold">AI Analysis & Insights</h3>
              </div>

              <div className="space-y-4">
                {aiInsights.insights && (
                  <div className="bg-dark-50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-2">Overall Assessment</h4>
                    <p className="text-gray-300 whitespace-pre-line">{aiInsights.insights}</p>
                  </div>
                )}

                {aiInsights.changes && aiInsights.changes.length > 0 && (
                  <div className="bg-dark-50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">Observed Changes</h4>
                    <ul className="space-y-2">
                      {aiInsights.changes.map((change, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span className="text-gray-300">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div className="bg-dark-50 rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {aiInsights.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span className="text-gray-300">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Powered by Google Gemini 2.0 Flash • AI-generated insights
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">New Progress Photos</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field w-full"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Front Photo</label>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'front')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center hover:border-primary/60 transition-colors"
                >
                  {formData.front ? (
                    <img src={formData.front} alt="Front" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera className="text-primary mb-2" size={32} />
                      <span className="text-sm text-gray-400">Upload Front</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Side Photo</label>
                <input
                  ref={sideInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'side')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => sideInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center hover:border-primary/60 transition-colors"
                >
                  {formData.side ? (
                    <img src={formData.side} alt="Side" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera className="text-primary mb-2" size={32} />
                      <span className="text-sm text-gray-400">Upload Side</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Back Photo</label>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'back')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center hover:border-primary/60 transition-colors"
                >
                  {formData.back ? (
                    <img src={formData.back} alt="Back" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <Camera className="text-primary mb-2" size={32} />
                      <span className="text-sm text-gray-400">Upload Back</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field w-full"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              Save Photos
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.length === 0 ? (
          <div className="col-span-full card text-center text-gray-400">
            <p>No photos yet. Add your first progress photos to start tracking!</p>
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              className={`card cursor-pointer ${compareMode && selectedPhotos.includes(photo.id) ? 'border-primary' : ''}`}
              onClick={() => compareMode && handlePhotoSelect(photo.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="text-primary" size={18} />
                  <span className="font-semibold text-sm">
                    {format(photo.date, 'MMM d, yyyy')}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(photo.id);
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {photo.front && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Front</p>
                    <img
                      src={photo.front}
                      alt="Front"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                {photo.side && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Side</p>
                    <img
                      src={photo.side}
                      alt="Side"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                {photo.back && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Back</p>
                    <img
                      src={photo.back}
                      alt="Back"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              {photo.notes && (
                <p className="text-sm text-gray-300 line-clamp-2">{photo.notes}</p>
              )}

              {compareMode && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-primary">
                    {selectedPhotos.includes(photo.id) ? 'Selected' : 'Click to compare'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
