import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, orderBy, limit, startAfter, DocumentSnapshot } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { BASE_URL, POST_MEDIA } from '../constants/api';

// Define MediaFile interface
interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
  createdAt: Date;
  size: number;
}

// Define upload state interface
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// Define store state interface
interface MediaState {
  files: MediaFile[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  success: string | null;
  uploadState: UploadState;
  description: string;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  
  fetchMediaFiles: (userId: string) => Promise<void>;
  loadMoreMediaFiles: (userId: string) => Promise<void>;
  uploadMediaFile: (userId: string, file: File, description: string) => Promise<void>;
  deleteMediaFile: (fileId: string, fileUrl: string) => Promise<void>;
  setDescription: (description: string) => void;
  clearSuccess: () => void;
  clearError: () => void;
  resetPagination: () => void;
}

// Create the store
export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  loading: false,
  loadingMore: false,
  error: null,
  success: null,
  description: '',
  hasMore: true,
  lastDoc: null,
  uploadState: {
    isUploading: false,
    progress: 0,
    error: null
  },

  // Reset pagination state
  resetPagination: () => {
    set({ lastDoc: null, hasMore: true });
  },

  // Fetch media files with pagination
  fetchMediaFiles: async (userId: string) => {
    set({ loading: true, error: null, files: [], lastDoc: null, hasMore: true });
    try {
      const ITEMS_PER_PAGE = 12; // Limit initial load to improve performance
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(ITEMS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(mediaQuery);
      const mediaFiles: MediaFile[] = [];
      
      // Save the last document for pagination
      if (!querySnapshot.empty) {
        set({ lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] });
      } else {
        set({ hasMore: false });
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
      
      set({ files: mediaFiles, loading: false });
    } catch (err) {
      console.error('Error fetching media files:', err);
      set({ error: 'Failed to load media files', loading: false });
    }
  },
  
  // Load more media files
  loadMoreMediaFiles: async (userId: string) => {
    const { lastDoc, hasMore, files } = get();
    if (!lastDoc || !hasMore) return;
    
    set({ loadingMore: true, error: null });
    try {
      const ITEMS_PER_PAGE = 12;
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );
      
      const querySnapshot = await getDocs(mediaQuery);
      
      // If no more documents, set hasMore to false
      if (querySnapshot.empty) {
        set({ hasMore: false, loadingMore: false });
        return;
      }
      
      // Store the last document for next pagination
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      
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
      set({ 
        files: [...files, ...newMediaFiles],
        lastDoc: newLastDoc,
        loadingMore: false 
      });
      
    } catch (err) {
      console.error('Error loading more media files:', err);
      set({ error: 'Failed to load more media files', loadingMore: false });
    }
  },

  // Upload media file
  uploadMediaFile: async (userId: string, file: File, description: string) => {
    // Use backend API instead of Firebase
    set({ 
      uploadState: {
        isUploading: true,
        progress: 0,
        error: null
      },
      error: null,
      success: null
    });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('userId', userId);
      const res = await fetch(`${BASE_URL}${POST_MEDIA}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload file');
      set({
        success: 'File uploaded successfully',
        uploadState: { isUploading: false, progress: 100, error: null }
      });
    } catch (err) {
      set({
        error: 'Failed to upload file',
        uploadState: { isUploading: false, progress: 0, error: 'Failed to upload file' }
      });
    }
  },

  // Delete media file
  deleteMediaFile: async (fileId: string, fileUrl: string) => {
    set({ loading: true, error: null, success: null });
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'mediaFiles', fileId));
      
      // Delete from Storage
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      
      // Update files list
      const files = get().files.filter(file => file.id !== fileId);
      
      set({ 
        files,
        loading: false,
        success: 'File deleted successfully'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        set({ success: null });
      }, 3000);
    } catch (err) {
      console.error('Error deleting file:', err);
      set({ error: 'Failed to delete file', loading: false });
    }
  },

  // Set description for upload
  setDescription: (description: string) => {
    set({ description });
  },

  // Clear success state
  clearSuccess: () => {
    set({ success: null });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  }
}));
