'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  orderBy,
  limit,
  startAfter,
  updateDoc
} from 'firebase/firestore';
import { db, storage } from '../../../firebase/config';
import { BASE_URL, GET_RECEPIES } from '@/constants/api';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [description, setDescription] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [itemsPerPage] = useState(9); // Show 9 items per page (3x3 grid)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Store last document for pagination
  const lastDocRef = useRef<DocumentSnapshot | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeMedia, setRecipeMedia] = useState<{ [key: string]: string[] }>({});
  
  // UI rendering states
  const [uiReady, setUiReady] = useState(false);
  
  // Modal state
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  // Function to fetch initial media files with pagination
  const fetchMediaFiles = useCallback(async () => {
    if (!user) return;

    try {
      setMediaLoading(true);
      setError('');
      
      // Create query with pagination
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(itemsPerPage)
      );
      
      const mediaSnapshot = await getDocs(mediaQuery);
      
      if (mediaSnapshot.empty) {
        setFiles([]);
        setHasMore(false);
        setMediaLoading(false);
        return;
      }
      
      // Store the last document for pagination
      lastDocRef.current = mediaSnapshot.docs[mediaSnapshot.docs.length - 1];
      
      const mediaFiles = mediaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as MediaFile[];
      
      setFiles(mediaFiles);
      setHasMore(mediaSnapshot.docs.length === itemsPerPage);
      setMediaLoading(false);
    } catch (err) {
      console.error('Error fetching media files:', err);
      setError('Failed to load media files');
      setMediaLoading(false);
    }
  }, [user, itemsPerPage]);
  
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

  const handleDeleteFile = async (fileId: string, fileUrl: string) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'mediaFiles', fileId));
      
      // Delete from Storage
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef);
      
      // Update UI
      setFiles(files.filter(file => file.id !== fileId));
      setSuccess('File deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    }
  };
  
  const handleReplaceFile = async (fileId: string, newFile: File) => {
    if (!user) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Get the file to replace
      const fileToReplace = files.find(file => file.id === fileId);
      if (!fileToReplace) throw new Error('File not found');
      
      // Upload new file
      const storageRef = ref(storage, `media/${user.uid}/${Date.now()}-${newFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, newFile);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload replacement file');
          setUploading(false);
        },
        async () => {
          // Get new download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Delete old file from storage
          const oldStorageRef = ref(storage, fileToReplace.url);
          await deleteObject(oldStorageRef).catch(err => {
            console.error('Error deleting old file:', err);
          });
          
          // Update document in Firestore
          await updateDoc(doc(db, 'mediaFiles', fileId), {
            name: newFile.name,
            type: newFile.type,
            url: downloadURL,
            size: newFile.size,
            updatedAt: new Date()
          });
          
          // Update UI
          setFiles(prevFiles => prevFiles.map(file => {
            if (file.id === fileId) {
              return {
                ...file,
                name: newFile.name,
                type: newFile.type,
                url: downloadURL,
                size: newFile.size,
                updatedAt: new Date()
              };
            }
            return file;
          }));
          
          setSuccess('File replaced successfully');
          setUploading(false);
          setUploadProgress(0);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess('');
          }, 3000);
        }
      );
    } catch (err) {
      console.error('Error replacing file:', err);
      setError('Failed to replace file');
      setUploading(false);
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
        const res = await fetch(`${BASE_URL}${GET_RECEPIES}?page=1&limit=100&type=chef&userId=${user.uid}`);
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
          onDelete={handleDeleteFile}
          onReplace={handleReplaceFile}
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
          onClick={async () => {
            if (!selectedFile) return;
            setUploading(true);
            setUploadProgress(0);
            setError('');
            setSuccess('');
            try {
              if (!user) throw new Error('No user');
              const storageRef = ref(storage, `media/${user.uid}/${Date.now()}-${selectedFile.name}`);
              const uploadTask = uploadBytesResumable(storageRef, selectedFile);
              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                  setUploadProgress(Math.round(progress));
                },
                (error) => {
                  console.error('Upload error:', error);
                  setError('Failed to upload file');
                  setUploading(false);
                },
                async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  await addDoc(collection(db, 'mediaFiles'), {
                    userId: user.uid,
                    name: selectedFile.name,
                    type: selectedFile.type,
                    url: downloadURL,
                    description: description,
                    createdAt: new Date(),
                    size: selectedFile.size
                  });
                  setSuccess('File uploaded successfully');
                  setDescription('');
                  setUploading(false);
                  setUploadProgress(0);
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  fetchMediaFiles();
                }
              );
            } catch (err) {
              console.error('Error during upload:', err);
              setError('Failed to upload file');
              setUploading(false);
            }
          }}
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
              {files.map((file) => (
                <MediaCard 
                  key={file.id} 
                  file={file} 
                  onDelete={handleDeleteFile} 
                  formatFileSize={formatFileSize}
                  onClick={(file) => setSelectedMedia(file)}
                />
              ))}
              
              {/* Show skeletons when loading more */}
              {mediaLoading && [...Array(3)].map((_, index) => (
                <MediaCardSkeleton key={`load-more-skeleton-${index}`} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <LoadMoreButton 
                onClick={loadMoreFiles} 
                loading={mediaLoading} 
                label="Load More Media" 
              />
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
