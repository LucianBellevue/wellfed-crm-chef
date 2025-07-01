import React, { useRef, useState } from 'react';
import { BASE_URL } from '@/constants/api';

interface StepMediaUploaderProps {
  recipeId: string;
  stepNumber: number; // 1-based index
  userId: string;
  imageUrl: string | null;
  onMediaChange: (newUrl: string | null) => void;
}

const StepMediaUploader: React.FC<StepMediaUploaderProps> = ({
  recipeId,
  stepNumber,
  userId,
  imageUrl,
  onMediaChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!stepNumber || isNaN(stepNumber) || stepNumber < 1) {
      setError('Invalid step number');
      setLoading(false);
      return;
    }
    const file = e.target.files[0];
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const res = await fetch(`${BASE_URL}recipe/${recipeId}/stage/${stepNumber}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const updatedStep = await res.json();
      onMediaChange(updatedStep.imageUrl || null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setError(null);
    if (!stepNumber || isNaN(stepNumber) || stepNumber < 1) {
      setError('Invalid step number');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}recipe/${recipeId}/stage/${stepNumber}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Remove failed');
      const updatedStep = await res.json();
      onMediaChange(updatedStep.imageUrl || null);
    } catch (err: any) {
      setError(err.message || 'Remove failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {imageUrl ? (
        <div className="relative">
          {imageUrl.match(/\.(mp4|mov)$/i) ? (
            <video src={imageUrl} controls className="w-40 h-32 rounded" />
          ) : (
            <img src={imageUrl} alt="Step media" className="w-40 h-32 object-cover rounded" />
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="absolute top-1 right-1 bg-red-600 text-white px-2 py-1 rounded text-xs"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="bg-primary hover:bg-slate-900 border border-primary text-white py-1 px-2 rounded text-xs cursor-pointer">
          {loading ? 'Uploading...' : 'Select image/video'}
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
};

export default StepMediaUploader; 