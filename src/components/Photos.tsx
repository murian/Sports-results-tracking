import { useState, useRef } from 'react';
import { Plus, Trash2, Calendar, Camera, ArrowLeftRight } from 'lucide-react';
import type { BodyPhoto } from '../types';
import { format } from 'date-fns';

interface PhotosProps {
  photos: BodyPhoto[];
  onAdd: (photo: BodyPhoto) => void;
  onDelete: (id: string) => void;
}

export default function Photos({ photos, onAdd, onDelete }: PhotosProps) {
  const [showForm, setShowForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
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

  const comparePhotosData = selectedPhotos.map(id => photos.find(p => p.id === id)).filter(Boolean) as BodyPhoto[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">Progress Photos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedPhotos([]);
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

      {compareMode && selectedPhotos.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Comparison View</h3>
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
              </div>
            ))}
          </div>
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
