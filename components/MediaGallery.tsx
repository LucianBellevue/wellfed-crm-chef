'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useMediaStore, useAuthStore } from '../store';
import { toast } from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';

// Lazy loaded image component
const LazyImage = ({ src, alt }: { src: string; alt: string; mediaId?: string }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });
  
  return (
    <div ref={ref} className="w-full h-full relative">
      {inView ? (
        <Image 
          src={src} 
          alt={alt} 
          fill
          style={{ objectFit: 'cover' }}
          className="rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQviwAAAABJRU5ErkJggg=="
        />
      ) : (
        <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg"></div>
      )}
    </div>
  );
};

export default function MediaGallery() {
  const { user } = useAuthStore();
  const { 
    files: mediaFiles, 
    loading,
    loadingMore,
    error, 
    hasMore,
    uploadState: { progress: uploadProgress, isUploading: uploadingInProgress },
    success,
    fetchMediaFiles,
    loadMoreMediaFiles,
    uploadMediaFile: uploadMedia,
    deleteMediaFile: deleteMedia,
    clearError,
    clearSuccess,
    resetPagination
  } = useMediaStore();
  
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<string | null>(null);
  const [mediaUrlToDelete, setMediaUrlToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch media files when component mounts - with debounce
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (user && isMounted) {
        try {
          // Reset pagination when component mounts
          resetPagination();
          await fetchMediaFiles(user.uid);
        } catch (err) {
          console.error('Error fetching media files:', err);
          if (isMounted) {
            toast.error('Failed to load media files');
          }
        }
      }
    };
    
    // Small delay to allow the UI to render first
    const timeoutId = setTimeout(loadData, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, fetchMediaFiles, resetPagination]);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        clearSuccess();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success, clearSuccess]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFiles || !user) return;
    
    setIsUploading(true);
    
    try {
      // Convert FileList to array and upload each file
      const filesArray = Array.from(selectedFiles);
      
      // Upload each file individually
      for (const file of filesArray) {
        await uploadMedia(user.uid, file, ''); // Empty description for now
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFiles(null);
      toast.success('Files uploaded successfully');
    } catch (err) {
      console.error('Error uploading media:', err);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle media deletion
  const confirmDelete = (mediaId: string, mediaUrl: string) => {
    setMediaToDelete(mediaId);
    setMediaUrlToDelete(mediaUrl);
    setShowDeleteDialog(true);
  };
  
  const handleDelete = async () => {
    if (!mediaToDelete || !mediaUrlToDelete) return;
    
    try {
      await deleteMedia(mediaToDelete, mediaUrlToDelete);
      setShowDeleteDialog(false);
      setMediaToDelete(null);
      setMediaUrlToDelete(null);
      toast.success('File deleted successfully');
    } catch (err) {
      console.error('Error deleting media:', err);
      toast.error('Failed to delete file');
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
  
  // Memoize filtered media files to prevent unnecessary re-renders
  const displayedMediaFiles = useMemo(() => {
    return mediaFiles.slice(0, 20); // Limit initial display to improve performance
  }, [mediaFiles]);
  
  if (loading && !isUploading && mediaFiles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-900 text-white p-4 mb-4 rounded flex justify-between items-center">
          <p>{error}</p>
          <button 
            onClick={clearError}
            className="text-white hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 text-white p-4 mb-4 rounded">
          <p>{success}</p>
        </div>
      )}
      
      {/* Upload Section */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Upload Media</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <label className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded cursor-pointer flex-grow md:flex-grow-0">
            Select Files
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
              className="hidden" 
              multiple
              ref={fileInputRef}
            />
          </label>
          
          {selectedFiles && (
            <div className="flex-grow">
              <span className="text-sm text-gray-300">
                {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
              </span>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`ml-4 ${
                  isUploading 
                    ? 'bg-primary cursor-not-allowed' 
                    : 'bg-primary hover:bg-slate-900 border border-primary'
                } text-white py-2 px-4 rounded`}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          )}
        </div>
        
        {/* Upload Progress */}
        {(isUploading || uploadingInProgress) && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <p className="text-sm text-gray-400">Uploading: {uploadProgress}%</p>
          </div>
        )}
      </div>
      
      {/* Media Gallery */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Your Media</h3>
        
        {mediaFiles.length === 0 ? (
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <p className="text-gray-400">You haven&apos;t uploaded any media files yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedMediaFiles.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  {media.type === 'image' || getFileType(media.url) === 'image' ? (
                    <LazyImage 
                      src={media.url} 
                      alt={media.name || 'Media'} 
                      mediaId={media.id}
                    />
                  ) : (
                    <video 
                      src={media.url} 
                      controls 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </div>
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <button
                    onClick={() => confirmDelete(media.id, media.url)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                    aria-label={`Delete ${media.name || 'media file'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {/* File Name */}
                <p className="text-sm text-gray-400 mt-1 truncate">
                  {media.name || 'Untitled'}
                </p>
              </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && mediaFiles.length > 0 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => user && loadMoreMediaFiles(user.uid)}
                  disabled={loadingMore}
                  className={`px-4 py-2 ${loadingMore ? 'bg-slate-700' : 'bg-primary hover:bg-slate-900'} border border-primary text-white rounded-md`}
                >
                  {loadingMore ? (
                    <>
                      <span className="inline-block animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Delete Media?</h3>
            <p className="mb-6">Are you sure you want to delete this media file? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
                aria-label="Confirm deletion"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
