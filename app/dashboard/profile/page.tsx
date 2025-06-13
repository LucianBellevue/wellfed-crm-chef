'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface ChefProfile {
  displayName: string;
  aboutMe: string;
  specialty: string;
  yearsOfExperience: string;
  location: string;
  contactEmail: string;
  profileImageUrl?: string;
  socialLinks: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [profile, setProfile] = useState<ChefProfile>({
    displayName: '',
    aboutMe: '',
    specialty: '',
    yearsOfExperience: '',
    location: '',
    contactEmail: '',
    profileImageUrl: '',
    socialLinks: {}
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const profileRef = doc(db, 'chefProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as ChefProfile);
        } else {
          // Initialize with user email if available
          setProfile(prev => ({
            ...prev,
            displayName: user.displayName || '',
            contactEmail: user.email || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social-')) {
      const socialPlatform = name.replace('social-', '');
      setProfile(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialPlatform]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, etc)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Delete previous image if exists
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
      const storageRef = ref(storage, `profileImages/${user.uid}/${file.name}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setError('Failed to upload image');
          setIsUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Update profile with new image URL
          setProfile(prev => ({
            ...prev,
            profileImageUrl: downloadURL
          }));
          
          setIsUploading(false);
        }
      );
    } catch (err) {
      console.error('Error handling image upload:', err);
      setError('Failed to process image upload');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !profile.profileImageUrl) return;
    
    try {
      // Delete image from storage
      const imageRef = ref(storage, profile.profileImageUrl);
      await deleteObject(imageRef);
      
      // Update profile
      setProfile(prev => ({
        ...prev,
        profileImageUrl: ''
      }));
    } catch (err) {
      console.error('Error removing image:', err);
      setError('Failed to remove profile image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);
    setError('');
    
    try {
      const profileRef = doc(db, 'chefProfiles', user.uid);
      await setDoc(profileRef, profile, { merge: true });
      setSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Chef Profile</h1>
        <p className="text-gray-300">Update your profile information and about me section</p>
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
            <p className="text-green-300">Profile updated successfully!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-slate-700">Profile Image</h2>
          
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 mb-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-600">
              {profile.profileImageUrl ? (
                <Image 
                  src={profile.profileImageUrl} 
                  alt="Chef profile" 
                  fill 
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-sm font-medium">{uploadProgress}%</div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                    Uploading...
                  </>
                ) : 'Upload Image'}
              </button>
              
              {profile.profileImageUrl && (
                <button 
                  type="button" 
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Remove Image
                </button>
              )}
              
              <p className="text-xs text-gray-400 mt-1">
                Recommended: Square image, at least 500x500 pixels
              </p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-slate-700">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={profile.displayName}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your professional name"
              />
            </div>
            
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-300 mb-1">
                Culinary Specialty
              </label>
              <input
                type="text"
                id="specialty"
                name="specialty"
                value={profile.specialty}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. French Cuisine, Pastry, etc."
              />
            </div>
            
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-300 mb-1">
                Years of Experience
              </label>
              <input
                type="text"
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={profile.yearsOfExperience}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. 5 years"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={profile.location}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. New York, NY"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={profile.contactEmail}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Your professional email address"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-slate-700">About Me</h2>
          
          <div>
            <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-300 mb-1">
              Professional Bio
            </label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              value={profile.aboutMe}
              onChange={handleInputChange}
              rows={6}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Tell clients about your culinary background, experience, and cooking philosophy..."
            />
          </div>
        </div>
        
        <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md">
          <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-slate-700">Social Links</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="social-website" className="block text-sm font-medium text-gray-300 mb-1">
                Website
              </label>
              <input
                type="url"
                id="social-website"
                name="social-website"
                value={profile.socialLinks.website || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div>
              <label htmlFor="social-instagram" className="block text-sm font-medium text-gray-300 mb-1">
                Instagram
              </label>
              <input
                type="url"
                id="social-instagram"
                name="social-instagram"
                value={profile.socialLinks.instagram || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://instagram.com/username"
              />
            </div>
            
            <div>
              <label htmlFor="social-twitter" className="block text-sm font-medium text-gray-300 mb-1">
                Twitter
              </label>
              <input
                type="url"
                id="social-twitter"
                name="social-twitter"
                value={profile.socialLinks.twitter || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://twitter.com/username"
              />
            </div>
            
            <div>
              <label htmlFor="social-facebook" className="block text-sm font-medium text-gray-300 mb-1">
                Facebook
              </label>
              <input
                type="url"
                id="social-facebook"
                name="social-facebook"
                value={profile.socialLinks.facebook || ''}
                onChange={handleInputChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://facebook.com/username"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                Saving...
              </>
            ) : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
