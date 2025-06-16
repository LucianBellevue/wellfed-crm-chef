import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

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
  error: string | null;
  success: string | null;
  uploadState: UploadState;
  description: string;
  
  fetchMediaFiles: (userId: string) => Promise<void>;
  uploadMediaFile: (userId: string, file: File, description: string) => Promise<void>;
  deleteMediaFile: (fileId: string, fileUrl: string) => Promise<void>;
  setDescription: (description: string) => void;
  clearSuccess: () => void;
  clearError: () => void;
}

// Create the store
export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  loading: false,
  error: null,
  success: null,
  description: '',
  uploadState: {
    isUploading: false,
    progress: 0,
    error: null
  },

  // Fetch media files
  fetchMediaFiles: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const mediaQuery = query(
        collection(db, 'mediaFiles'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(mediaQuery);
      const mediaFiles: MediaFile[] = [];
      
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

  // Upload media file
  uploadMediaFile: async (userId: string, file: File, description: string) => {
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
      // Create a storage reference
      const storageRef = ref(storage, `media/${userId}/${Date.now()}-${file.name}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          set({ 
            uploadState: {
              ...get().uploadState,
              progress: Math.round(progress)
            }
          });
        },
        (error) => {
          console.error('Upload error:', error);
          set({ 
            uploadState: {
              isUploading: false,
              progress: 0,
              error: 'Failed to upload file'
            },
            error: 'Failed to upload file'
          });
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save file metadata to Firestore
          await addDoc(collection(db, 'mediaFiles'), {
            userId: userId,
            name: file.name,
            type: file.type,
            url: downloadURL,
            description: description,
            createdAt: new Date(),
            size: file.size
          });
          
          set({ 
            uploadState: {
              isUploading: false,
              progress: 0,
              error: null
            },
            success: 'File uploaded successfully',
            description: ''
          });
          
          // Refresh file list
          get().fetchMediaFiles(userId);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ success: null });
          }, 3000);
        }
      );
    } catch (err) {
      console.error('Error during upload:', err);
      set({ 
        uploadState: {
          isUploading: false,
          progress: 0,
          error: 'Failed to upload file'
        },
        error: 'Failed to upload file'
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
