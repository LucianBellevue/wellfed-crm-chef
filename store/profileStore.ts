import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { BASE_URL, GET_PROFILE, POST_PROFILE, PUT_PROFILE, UPLOAD_API } from '@/constants/api';


// Helper function to detect iOS platform
const isIOS = () => {
  if (typeof window === 'undefined') return false;
  
  // Modern way to detect iOS using user agent
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
               (userAgent.includes('mac') && 'ontouchend' in document);

  return isIOS; 
}

// Define ChefProfile interface
interface ChefProfile {
  id?: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  profileBannerURL?: string;
  profilePictureURL?: string;
  phoneNumber?: string;
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
  email: string;
  authId?: string;
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
  createProfile: (profileData: Partial<ChefProfile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, profileData: Partial<ChefProfile>) => Promise<void>;

  uploadProfileImage: (userId: string, file: File, type: string) => Promise<void>;
  removeProfileImage: (userId: string, type: string) => Promise<void>;
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
    socialLinks: {},
    email: ''
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
  createProfile: async (profileData: Partial<ChefProfile>) => {
    set({ saving: true, error: null, success: false });
    try {
      profileData.authId = profileData.authId || '';
      await fetch(`${BASE_URL}${POST_PROFILE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData }),  
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      set({ error: 'Failed to create profile', saving: false });
    }
  },
  // Fetch chef profile
  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      // const profileRef = doc(db, 'chefProfiles', userId);
      // const profileSnap = await getDoc(profileRef);
      
      // if (profileSnap.exists()) {
      //   set({ 
      //     profile: profileSnap.data() as ChefProfile,
      //     loading: false 
      //   });
      // } else {
      //   // Initialize with default values if no profile exists
      //   set({ loading: false });
      // }

      const res = await fetch(`${BASE_URL}${GET_PROFILE}${userId}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      set({ 
            profile: await res.json() as ChefProfile,
            loading: false 
          });
      set({ loading: false });
      return 
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({ error: 'Failed to load profile data', loading: false });
    }
  },

  // Update chef profile
  updateProfile: async (userId: string, profileData: Partial<ChefProfile>) => {
    set({ saving: true, error: null, success: false });
    try {
      if (!userId) return;
      profileData.authId = userId;
      await fetch(`${BASE_URL}${PUT_PROFILE}${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileData }),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      set({ error: 'Failed to update profile', saving: false });
    }
  },

  // Upload profile image
  uploadProfileImage: async (userId: string, file: File, type: string) => {
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

      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        platform: isIOS() ? "iOS" : "Other"
      });
      // Validate file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        alert("File size should be less than 5MB");
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (JPEG, PNG, or WebP)");
        return;
      }

      // Create FormData - special handling for iOS
      const formData = new FormData();
      
      // Use a different approach for iOS
      if (isIOS()) {
        // iOS requires special handling for FormData
        // Add a timestamp to ensure uniqueness
        const fileName = `${Date.now()}_${file.name}`;
        console.log("iOS upload with filename:", fileName);
        
        // Append with explicit filename for iOS
        formData.append("file", file, fileName);
      } else {
        formData.append("file", file);
      }
      
      formData.append("type", type);
      formData.append("userId", userId || "");

      console.log("Uploading to:", BASE_URL + UPLOAD_API);
      console.log("FormData prepared with type:", "profile");

      // Upload the file with timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(BASE_URL + UPLOAD_API, {
          method: "POST",
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Upload response error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          let errorMessage = "Upload failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use the raw error text
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        await get().fetchProfile(userId);

        console.log("Upload success response:", data);

        set({ 
          profileImageUpload: {
            isUploading: false,
            progress: 0,
            error: null
          },
          error: null
        });

        // Update profile after successful upload
        
        // Close the bottom sheet only after successful update
        
        // Show success message
      } catch (error: unknown) {
        const fetchError = error as Error;
        if (fetchError.name === 'AbortError') {
          console.error("Upload request timed out");
          alert("Upload timed out. Please try again with a smaller image or better connection.");
        } else {
          console.error("Upload fetch error:", fetchError);
          alert(fetchError instanceof Error ? fetchError.message : "Failed to upload image. Please try again.");
        }
      }
      
      
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
  removeProfileImage: async (userId: string, type: string) => {
    const { profile } = get();
    try {
      const uploadApi = BASE_URL + UPLOAD_API + 'deleteFile';

        const body = {
          type: type,
          userId: userId,
          fileName: (type === 'banner' ? profile.profileBannerURL : profile.profilePictureURL)
        };

        body.fileName = body.fileName ? body.fileName.split('/')[body.fileName.split('/')?.length - 1] : '';

        await fetch(uploadApi, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        set({ success: false });
        get().fetchProfile(userId);
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
