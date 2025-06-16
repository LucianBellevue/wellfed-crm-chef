'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useMediaStore, useAuthStore } from '../store';
import { useRouter } from 'next/navigation';

interface MediaFile {
  id: string;
  url: string;
  type: string;
  name?: string;
}

interface MediaSelectorProps {
  selectedMedia: MediaFile[];
  onChange: (media: MediaFile[]) => void;
  maxFiles?: number;
}

export default function MediaSelector({ selectedMedia = [], onChange, maxFiles = 10 }: MediaSelectorProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { 
    files: mediaFiles, 
    loading, 
    error, 
    fetchMediaFiles 
  } = useMediaStore();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch media files when selector is opened
  useEffect(() => {
    if (isOpen && user) {
      fetchMediaFiles(user.uid).catch(err => {
        console.error('Error fetching media files:', err);
      });
    }
  }, [isOpen, user, fetchMediaFiles]);
  
  // Determine if a media file is already selected
  const isSelected = (mediaId: string) => {
    return selectedMedia.some(media => media.id === mediaId);
  };
  
  // Toggle media selection
  const toggleMediaSelection = (media: { id: string; url: string; type: string; name?: string }) => {
    if (isSelected(media.id)) {
      // Remove from selection
      onChange(selectedMedia.filter(item => item.id !== media.id));
    } else {
      // Add to selection if under max limit
      if (selectedMedia.length < maxFiles) {
        onChange([...selectedMedia, media]);
      }
    }
  };
  
  // Determine file type (image or video)
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) {
      return 'video';
    }
    return 'unknown';
  };
  
  // Remove a selected media item
  const removeSelectedMedia = (mediaId: string) => {
    onChange(selectedMedia.filter(item => item.id !== mediaId));
  };
  
  return (
    <div className="space-y-4">
      {/* Selected Media Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Selected Media ({selectedMedia.length}/{maxFiles})
        </label>
        
        {selectedMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedMedia.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  {media.type === 'image' || getFileType(media.url) === 'image' ? (
                    <Image 
                      src={media.url} 
                      alt={media.name || 'Media'} 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-lg"
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeSelectedMedia(media.id)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">No media selected</p>
          </div>
        )}
      </div>
      
      {/* Media Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={selectedMedia.length >= maxFiles}
        className={`${
          selectedMedia.length >= maxFiles 
            ? 'bg-gray-700 cursor-not-allowed' 
            : 'bg-primary hover:bg-slate-900 border border-primary'
        } text-white py-2 px-4 rounded-md`}
      >
        {selectedMedia.length >= maxFiles ? 'Maximum Files Selected' : 'Select Media'}
      </button>
      
      {/* Media Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Select Media ({selectedMedia.length}/{maxFiles})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="bg-red-900 text-white p-4 mb-4 rounded">
                <p>{error}</p>
              </div>
            )}
            
            {/* Media Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : mediaFiles.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <p className="text-gray-400 mb-4">You haven&apos;t uploaded any media files yet.</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push('/media');
                  }}
                  className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded-md"
                  aria-label="Navigate to Media Manager"
                >
                  Go to Media Manager
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaFiles.map((media) => (
                  <div 
                    key={media.id} 
                    onClick={() => toggleMediaSelection(media)}
                    className={`
                      relative cursor-pointer rounded-lg overflow-hidden
                      ${isSelected(media.id) ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    <div className="aspect-square bg-gray-800">
                      {media.type === 'image' || getFileType(media.url) === 'image' ? (
                        <Image 
                          src={media.url} 
                          alt={media.name || 'Media'} 
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          priority={false}
                        />
                      ) : (
                        <video 
                          src={media.url} 
                          className="w-full h-full object-cover"
                          controls
                          muted
                          preload="metadata"
                        />
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    {isSelected(media.id) && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    
                    {/* File Type Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 py-1 px-2">
                      <p className="text-xs text-white truncate">
                        {media.name || 'Untitled'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                aria-label="Cancel selection"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded-md"
                aria-label="Confirm media selection"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
