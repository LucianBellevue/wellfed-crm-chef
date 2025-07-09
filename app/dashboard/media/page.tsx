'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { BASE_URL, POST_MEDIA, GET_MEDIA } from '@/constants/api';

// Import components
import { MediaFile, Recipe } from './components/types';
import { AlertMessage } from './components/AlertMessage';
import { EmptyMediaState } from './components/EmptyMediaState';
import { LoadMoreButton } from './components/LoadMoreButton';
import { MediaCard } from './components/MediaCard';
import { FileUploadForm } from './components/FileUploadForm';
import { RecipeMediaSection } from './components/RecipeMediaSection';
import { MediaCardSkeleton } from './components/MediaCardSkeleton';
import { RecipeMediaSkeleton } from './components/RecipeMediaSkeleton';
import { MediaPreviewModal } from './components/MediaPreviewModal';

export default function MediaPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [recipeMediaLoading, setRecipeMediaLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [itemsPerPage] = useState<number>(9); // Show 9 items per page (3x3 grid)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Store last document for pagination
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeMedia, setRecipeMedia] = useState<{ [key: string]: string[] }>({});
  
  // UI rendering states
  const [uiReady, setUiReady] = useState<boolean>(false);
  
  // Modal state
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  // Fetch media files from backend API
  const fetchMediaFiles = useCallback(async () => {
    if (!user) return;
    setMediaLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}${GET_MEDIA}?userId=${user.uid}`);
      if (!res.ok) throw new Error('Failed to fetch media files');
      const data = await res.json();
      // Always treat as array and map backend fields to frontend fields
      const filesArray = Array.isArray(data)
        ? data
        : data && typeof data === 'object'
          ? [data]
          : [];
      const mappedFiles = filesArray.map(file => ({
        id: file._id,
        name: file.filename,
        type: file.type || 'image/jpeg', // fallback if type is missing
        url: file.url,
        description: file.description,
        createdAt: file.createdAt,
        size: file.size || 0, // fallback if size is missing
      }));
      setFiles(mappedFiles);
    } catch {
      setError('Failed to load media files');
    } finally {
      setMediaLoading(false);
    }
  }, [user]);

  // Function to load more media files
  const loadMoreFiles = useCallback(async () => {
    if (!user || !lastDocRef.current) return;
    
    try {
      setMediaLoading(true);
      
      // Create query with pagination starting after the last document
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(itemsPerPage)
      );
      
      const querySnapshot = await getDocs(mediaQuery);
      
      // If no more documents, set hasMore to false
      if (querySnapshot.empty) {
        setHasMore(false);
        setMediaLoading(false);
        return;
      }
      
      // Store the last document for pagination
      lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      const newMediaFiles: MediaFile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newMediaFiles.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          url: data.url,
          description: data.description,
          createdAt: data.createdAt.toDate(),
          size: data.size
        });
      });
      
      // Update files state with new files
      setFiles(prevFiles => [...prevFiles, ...newMediaFiles]);
    } catch (err) {
      console.error('Error loading more media files:', err);
      setError('Failed to load more media files');
    } finally {
      setMediaLoading(false);
    }
  }, [user, itemsPerPage]);
  
  useEffect(() => {
    if (user) {
      fetchMediaFiles();
    }
  }, [user, fetchMediaFiles]);
  
  // Reset pagination when user changes
  useEffect(() => {
    setHasMore(true);
    lastDocRef.current = null;
  }, [user]);

  // Upload file to backend API (which handles Azure Blob Storage)
  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('description', description);
      formData.append('userId', user.uid);
      const res = await fetch(`${BASE_URL}${POST_MEDIA}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload file');
      setSuccess('File uploaded successfully');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchMediaFiles();
    } catch (err) {
      setError('Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Removed getFileTypeIcon as it's now in the FileTypeIcon component

  // Fetch all recipes for the chef
  useEffect(() => {
    async function fetchRecipes() {
      if (!user?.uid) return;
      setRecipesLoading(true);
      try {
        const res = await fetch(`${BASE_URL}${GET_MEDIA}?page=1&limit=100&type=chef&userId=${user.uid}`);
        if (!res.ok) throw new Error('Failed to fetch recipes');
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setRecipesLoading(false);
      }
    }
    fetchRecipes();
  }, [user]);

  // For each recipe, fetch its media
  useEffect(() => {
    async function fetchAllRecipeMedia() {
      if (recipes.length === 0) return;
      
      setRecipeMediaLoading(true);
      try {
        const mediaMap: { [key: string]: string[] } = {};
        await Promise.all((recipes || []).map(async (recipe) => {
          const recipeId = recipe._id || recipe.id;
          if (recipeId) {
            const res = await fetch(`${BASE_URL}recipe/${recipeId}/media`);
            if (!res.ok) throw new Error(`Failed to fetch media for recipe ${recipeId}`);
            const urls = await res.json();
            mediaMap[recipeId] = Array.isArray(urls) ? urls : [];
          }
        }));
        setRecipeMedia(mediaMap);
      } catch (err) {
        console.error('Error fetching recipe media:', err);
      } finally {
        setRecipeMediaLoading(false);
      }
    }
    if (recipes.length) fetchAllRecipeMedia();
  }, [recipes]);

  // Set UI ready after a short delay to ensure basic layout renders quickly
  useEffect(() => {
    const timer = setTimeout(() => {
      setUiReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Show minimal loading state before UI is ready
  if (!uiReady) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-800 rounded w-2/3 mb-8"></div>
        <div className="h-40 bg-slate-800 rounded mb-8"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
        <p className="text-gray-300">Upload and manage your media files for recipes and promotional content</p>
      </div>

      {error && <AlertMessage type="error" message={error} />}
      {success && <AlertMessage type="success" message={success} />}
      
      {/* Media Preview Modal */}
      {selectedMedia && (
        <MediaPreviewModal 
          file={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onDelete={async () => {
            // TODO: Implement delete via API if needed
          }} 
          onReplace={async () => {
            // TODO: Implement replace via API if needed
          }}
        />
      )}

      <FileUploadForm
        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        description={description}
        setDescription={setDescription}
        uploading={uploading}
        uploadProgress={uploadProgress}
      />

      {/* Upload Button between sections */}
      <div className="flex justify-center mb-8">
        <button
          className="bg-primary hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
        >
          Upload
        </button>
      </div>

      <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md">
        <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-gray-800">Your Media Files</h2>
        {mediaLoading && files.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <MediaCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <EmptyMediaState />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files
                .filter(file => file && (file.id || file.url) && file.type)
                .map((file) => (
                  <MediaCard
                    key={file.id || file.url}
                    file={file}
                    onDelete={() => {
                      // TODO: Implement delete via API if needed
                    }}
                    formatFileSize={formatFileSize}
                    onClick={(file) => setSelectedMedia(file)}
                  />
              ))}
            </div>
            {/* Load More Button inside the box */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <LoadMoreButton 
                  onClick={loadMoreFiles} 
                  loading={mediaLoading} 
                  label="Load More Media" 
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Recipe Media Section */}
      {recipesLoading || recipeMediaLoading ? (
        <RecipeMediaSkeleton />
      ) : (
        <RecipeMediaSection recipes={recipes} recipeMedia={recipeMedia} />
      )}
    </div>
  );
}
