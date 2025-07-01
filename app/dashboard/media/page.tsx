'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import Image from 'next/image';
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
  startAfter
} from 'firebase/firestore';
import { db, storage } from '../../../firebase/config';
import { BASE_URL, GET_RECEPIES } from '@/constants/api';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  createdAt: Date;
  size: number;
}

// Lazy-loaded image component for media thumbnails
const LazyMediaThumbnail = ({ file }: { file: MediaFile }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Only render image thumbnails for image files
  if (!file.type.startsWith('image/')) {
    return null;
  }
  
  return (
    <div className="relative h-24 w-full bg-slate-800 rounded overflow-hidden mb-2">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      <Image 
        src={file.url} 
        alt={file.name}
        fill
        style={{ objectFit: 'cover' }}
        className="rounded"
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

export default function MediaPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
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

  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeMedia, setRecipeMedia] = useState<{ [key: string]: string[] }>({});

  // Function to fetch initial media files with pagination
  const fetchMediaFiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      // Create query with pagination
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(itemsPerPage)
      );
      
      const querySnapshot = await getDocs(mediaQuery);
      const mediaFiles: MediaFile[] = [];
      
      // Store the last document for pagination
      if (!querySnapshot.empty) {
        lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];
      } else {
        setHasMore(false);
      }
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        mediaFiles.push({
          id: doc.id,
          name: data.name,
          type: data.type,
          url: data.url,
          description: data.description,
          createdAt: data.createdAt.toDate(),
          size: data.size
        });
      });
      
      setFiles(mediaFiles);
    } catch (err) {
      console.error('Error fetching media files:', err);
      setError('Failed to load media files');
    } finally {
      setLoading(false);
    }
  }, [user, itemsPerPage]);
  
  // Function to load more media files
  const loadMoreFiles = useCallback(async () => {
    if (!user || !lastDocRef.current) return;
    
    try {
      setLoading(true);
      
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
        setLoading(false);
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
      setLoading(false);
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
    if (!user || !window.confirm('Are you sure you want to delete this file?')) return;
    
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Define the getFileTypeIcon function before the LazyMediaThumbnail component
const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (type.startsWith('video/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (type.startsWith('audio/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    } else if (type.startsWith('application/pdf')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  // Fetch all recipes for the chef
  useEffect(() => {
    async function fetchRecipes() {
      if (!user?.uid) return;
      const res = await fetch(`${BASE_URL}${GET_RECEPIES}?page=1&limit=100&type=chef&userId=${user.uid}`);
      const data = await res.json();
      setRecipes(data.recipes || []);
    }
    fetchRecipes();
  }, [user]);

  // For each recipe, fetch its media
  useEffect(() => {
    async function fetchAllRecipeMedia() {
      const mediaMap: { [key: string]: string[] } = {};
      await Promise.all((recipes || []).map(async (recipe) => {
        const res = await fetch(`${BASE_URL}recipe/${recipe._id || recipe.id}/media`);
        const urls = await res.json();
        mediaMap[recipe._id || recipe.id] = Array.isArray(urls) ? urls : [];
      }));
      setRecipeMedia(mediaMap);
    }
    if (recipes.length) fetchAllRecipeMedia();
  }, [recipes]);

  // Only show loading spinner on initial load
  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
        <p className="text-gray-300">Upload and manage your media files for recipes and promotional content</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-300">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-gray-800">Upload New Media</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-white mb-1">
              Select File
            </label>
            <input
              type="file"
              id="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files.length > 0) {
                  setSelectedFile(e.target.files[0]);
                } else {
                  setSelectedFile(null);
                }
              }}
              disabled={uploading}
              className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
              className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describe this media file..."
            />
          </div>
          
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-slate-900 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">Uploading: {uploadProgress}%</p>
            </div>
          )}
        </div>
      </div>

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
        
        {files.length === 0 ? (
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">No media files yet. Upload your first file above.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file) => (
                <div key={file.id} className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-primary transition-all">
                  {file.type.startsWith('image/') && (
                    <LazyMediaThumbnail file={file} />
                  )}
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      {getFileTypeIcon(file.type)}
                      <div className="ml-3">
                        <h3 className="text-white font-medium truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    
                    {file.description && (
                      <p className="text-gray-300 text-sm mb-3">{file.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-4">
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-400 text-sm font-medium flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </a>
                      
                      <button
                        onClick={() => handleDeleteFile(file.id, file.url)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMoreFiles}
                  disabled={loading}
                  className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Loading...
                    </span>
                  ) : (
                    'Load More Media'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recipe Media Section */}
      <div className="mt-12 mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Your Recipe Images</h2>
        {(recipes || []).map(recipe => (
          <div key={recipe._id || recipe.id} className="mb-8">
            <h3 className="text-lg font-bold mb-2 text-primary">{recipe.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(recipeMedia[recipe._id || recipe.id] || []).map(url => (
                <div key={url} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  {url.match(/\.(mp4|mov)$/i) ? (
                    <video src={url} controls className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <img src={url} alt="Recipe media" className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
