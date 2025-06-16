import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';

// Define ChefProfile interface
interface ChefProfile {
  displayName: string;
  aboutMe: string;
  specialty: string;
  yearsOfExperience: string;
  location: string;
  contactEmail: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  socialLinks: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

// Define upload state interface
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

// Define store state interface
interface ProfileState {
  profile: ChefProfile;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  profileImageUpload: UploadState;
  bannerImageUpload: UploadState;
  
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, profileData: Partial<ChefProfile>) => Promise<void>;
  uploadProfileImage: (userId: string, file: File) => Promise<void>;
  removeProfileImage: (userId: string) => Promise<void>;
  uploadBannerImage: (userId: string, file: File) => Promise<void>;
  removeBannerImage: (userId: string) => Promise<void>;
  clearSuccess: () => void;
  clearError: () => void;
}

// Create the store
export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: {
    displayName: '',
    aboutMe: '',
    specialty: '',
    yearsOfExperience: '',
    location: '',
    contactEmail: '',
    profileImageUrl: '',
    bannerImageUrl: '',
    socialLinks: {}
  },
  loading: false,
  saving: false,
  error: null,
  success: false,
  profileImageUpload: {
    isUploading: false,
    progress: 0,
    error: null
  },
  bannerImageUpload: {
    isUploading: false,
    progress: 0,
    error: null
  },

  // Fetch chef profile
  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const profileRef = doc(db, 'chefProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        set({ 
          profile: profileSnap.data() as ChefProfile,
          loading: false 
        });
      } else {
        // Initialize with default values if no profile exists
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ error: 'Failed to load profile data', loading: false });
    }
  },

  // Update chef profile
  updateProfile: async (userId: string, profileData: Partial<ChefProfile>) => {
    set({ saving: true, error: null, success: false });
    try {
      const profileRef = doc(db, 'chefProfiles', userId);
      
      // Merge with existing profile data
      const updatedProfile = {
        ...get().profile,
        ...profileData
      };
      
      await setDoc(profileRef, updatedProfile, { merge: true });
      
      set({ 
        profile: updatedProfile,
        saving: false,
        success: true 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        set({ success: false });
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: 'Failed to update profile', saving: false });
    }
  },

  // Upload profile image
  uploadProfileImage: async (userId: string, file: File) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      set({ 
        profileImageUpload: {
          ...get().profileImageUpload,
          error: 'Please select an image file (JPEG, PNG, etc)'
        }
      });
      return;
    }

    set({ 
      profileImageUpload: {
        isUploading: true,
        progress: 0,
        error: null
      },
      error: null
    });

    try {
      // Delete previous image if exists
      const { profile } = get();
      if (profile.profileImageUrl) {
        try {
          const previousImageRef = ref(storage, profile.profileImageUrl);
          await deleteObject(previousImageRef);
        } catch (err) {
          console.error('Error deleting previous image:', err);
          // Continue with upload even if delete fails
        }
      }

      // Create a storage reference
      const storageRef = ref(storage, `profileImages/${userId}/${file.name}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          set({ 
            profileImageUpload: {
              ...get().profileImageUpload,
              progress
            }
          });
        },
        (error) => {
          console.error('Upload error:', error);
          set({ 
            profileImageUpload: {
              isUploading: false,
              progress: 0,
              error: 'Failed to upload image'
            }
          });
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update profile with new image URL
          const updatedProfile = {
            ...get().profile,
            profileImageUrl: downloadURL
          };
          
          // Update in Firestore
          await setDoc(doc(db, 'chefProfiles', userId), updatedProfile, { merge: true });
          
          set({ 
            profile: updatedProfile,
            profileImageUpload: {
              isUploading: false,
              progress: 0,
              error: null
            },
            success: true
          });
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ success: false });
          }, 3000);
        }
      );
    } catch (err) {
      console.error('Error during upload:', err);
      set({ 
        profileImageUpload: {
          isUploading: false,
          progress: 0,
          error: 'Failed to upload image'
        }
      });
    }
  },

  // Remove profile image
  removeProfileImage: async (userId: string) => {
    const { profile } = get();
    if (!profile.profileImageUrl) return;
    
    set({ 
      profileImageUpload: {
        isUploading: true,
        progress: 0,
        error: null
      },
      error: null
    });
    
    try {
      // Delete image from storage
      const imageRef = ref(storage, profile.profileImageUrl);
      await deleteObject(imageRef);
      
      // Update profile
      const updatedProfile = {
        ...profile,
        profileImageUrl: ''
      };
      
      // Update in Firestore
      await setDoc(doc(db, 'chefProfiles', userId), updatedProfile, { merge: true });
      
      set({ 
        profile: updatedProfile,
        profileImageUpload: {
          isUploading: false,
          progress: 0,
          error: null
        },
        success: true
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        set({ success: false });
      }, 3000);
    } catch (err) {
      console.error('Error removing image:', err);
      set({ 
        profileImageUpload: {
          isUploading: false,
          progress: 0,
          error: 'Failed to remove profile image'
        }
      });
    }
  },

  // Upload banner image
  uploadBannerImage: async (userId: string, file: File) => {
    // Validate file type
    if (!file.type.match('image.*')) {
      set({ 
        bannerImageUpload: {
          ...get().bannerImageUpload,
          error: 'Please select an image file (JPEG, PNG, etc)'
        }
      });
      return;
    }

    set({ 
      bannerImageUpload: {
        isUploading: true,
        progress: 0,
        error: null
      },
      error: null
    });

    try {
      // Delete previous banner image if exists
      const { profile } = get();
      if (profile.bannerImageUrl) {
        try {
          const previousImageRef = ref(storage, profile.bannerImageUrl);
          await deleteObject(previousImageRef);
        } catch (err) {
          console.error('Error deleting previous banner image:', err);
          // Continue with upload even if delete fails
        }
      }

      // Create a storage reference
      const storageRef = ref(storage, `bannerImages/${userId}/${file.name}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          set({ 
            bannerImageUpload: {
              ...get().bannerImageUpload,
              progress
            }
          });
        },
        (error) => {
          console.error('Upload error:', error);
          set({ 
            bannerImageUpload: {
              isUploading: false,
              progress: 0,
              error: 'Failed to upload banner image'
            }
          });
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update profile with new banner image URL
          const updatedProfile = {
            ...get().profile,
            bannerImageUrl: downloadURL
          };
          
          // Update in Firestore
          await setDoc(doc(db, 'chefProfiles', userId), updatedProfile, { merge: true });
          
          set({ 
            profile: updatedProfile,
            bannerImageUpload: {
              isUploading: false,
              progress: 0,
              error: null
            },
            success: true
          });
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ success: false });
          }, 3000);
        }
      );
    } catch (err) {
      console.error('Error during banner upload:', err);
      set({ 
        bannerImageUpload: {
          isUploading: false,
          progress: 0,
          error: 'Failed to upload banner image'
        }
      });
    }
  },

  // Remove banner image
  removeBannerImage: async (userId: string) => {
    const { profile } = get();
    if (!profile.bannerImageUrl) return;
    
    set({ 
      bannerImageUpload: {
        isUploading: true,
        progress: 0,
        error: null
      },
      error: null
    });
    
    try {
      // Delete image from storage
      const imageRef = ref(storage, profile.bannerImageUrl);
      await deleteObject(imageRef);
      
      // Update profile
      const updatedProfile = {
        ...profile,
        bannerImageUrl: ''
      };
      
      // Update in Firestore
      await setDoc(doc(db, 'chefProfiles', userId), updatedProfile, { merge: true });
      
      set({ 
        profile: updatedProfile,
        bannerImageUpload: {
          isUploading: false,
          progress: 0,
          error: null
        },
        success: true
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        set({ success: false });
      }, 3000);
    } catch (err) {
      console.error('Error removing banner image:', err);
      set({ 
        bannerImageUpload: {
          isUploading: false,
          progress: 0,
          error: 'Failed to remove banner image'
        }
      });
    }
  },

  // Clear success state
  clearSuccess: () => {
    set({ success: false });
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  }
}));
