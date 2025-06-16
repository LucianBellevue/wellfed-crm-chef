'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProfileStore, useAuthStore } from '../store';

// Separate loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded image component with proper typing
const LazyImage = ({ src, alt, className, fill, style }: { 
  src: string; 
  alt: string; 
  className?: string; 
  fill?: boolean;
  style?: React.CSSProperties;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!isLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-800"><LoadingSpinner /></div>}
      <Image 
        src={src} 
        alt={alt} 
        className={className}
        fill={fill}
        style={style}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
};

export default function ProfileManager() {
  const { user } = useAuthStore();
  const { 
    profile, 
    loading, 
    error, 
    success, 
    fetchProfile, 
    updateProfile, 
    uploadProfileImage, 
    uploadBannerImage,
    removeProfileImage,
    removeBannerImage
  } = useProfileStore();
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    specialty: '',
    location: '',
    website: '',
    phone: ''
  });
  
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRemoveProfileDialog, setShowRemoveProfileDialog] = useState(false);
  const [showRemoveBannerDialog, setShowRemoveBannerDialog] = useState(false);
  
  // Fetch profile data when component mounts, but only if not already loaded
  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.uid);
    }
  }, [user, profile, fetchProfile]);
  
  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.aboutMe || '', // Map aboutMe to bio in our form
        specialty: profile.specialty || '',
        location: profile.location || '',
        website: profile.socialLinks?.website || '',
        phone: profile.contactEmail || '' // Use contactEmail as phone for now
      });
    }
  }, [profile]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImageFile(e.target.files[0]);
    }
  };
  
  const handleBannerImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBannerImageFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Map form data to ChefProfile structure
      const profileData = {
        displayName: formData.displayName,
        aboutMe: formData.bio, // Map bio to aboutMe
        specialty: formData.specialty,
        location: formData.location,
        contactEmail: formData.phone, // Map phone to contactEmail
        socialLinks: {
          website: formData.website,
          // Preserve other social links if they exist
          ...(profile?.socialLinks || {})
        }
      };
      
      // Create an array of promises to execute in parallel
      const updatePromises = [];
      
      // Add profile update promise
      updatePromises.push(updateProfile(user.uid, profileData));
      
      // Add image upload promises if needed
      if (profileImageFile) {
        updatePromises.push(uploadProfileImage(user.uid, profileImageFile));
      }
      
      if (bannerImageFile) {
        updatePromises.push(uploadBannerImage(user.uid, bannerImageFile));
      }
      
      // Execute all promises in parallel
      await Promise.all(updatePromises);
      
      // Reset file inputs
      setProfileImageFile(null);
      setBannerImageFile(null);
      
      // Show success message briefly
      setTimeout(() => {
        // Clear success message after 3 seconds
        useProfileStore.getState().clearSuccess();
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveProfileImage = async () => {
    if (!user) return;
    
    try {
      await removeProfileImage(user.uid);
      setShowRemoveProfileDialog(false);
    } catch (err) {
      console.error('Error removing profile image:', err);
    }
  };
  
  const handleRemoveBannerImage = async () => {
    if (!user) return;
    
    try {
      await removeBannerImage(user.uid);
      setShowRemoveBannerDialog(false);
    } catch (err) {
      console.error('Error removing banner image:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-900 border border-primary text-white p-6 rounded-lg shadow-lg">
      {error && (
        <div className="bg-red-900 text-white p-4 mb-4 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900 text-white p-4 mb-4 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Banner Image Section */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Banner Image</h3>
          <div className="relative w-full h-48 bg-gray-500 rounded-lg overflow-hidden mb-2">
            {profile?.bannerImageUrl ? (
              <>
                <LazyImage 
                  src={profile.bannerImageUrl} 
                  alt="Banner" 
                  fill 
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowRemoveBannerDialog(true)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No banner image uploaded</p>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <label className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded cursor-pointer">
              {profile?.bannerImageUrl ? 'Change Banner' : 'Upload Banner'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerImageChange} 
                className="hidden" 
              />
            </label>
            {bannerImageFile && (
              <span className="ml-2 text-sm text-gray-300">
                {bannerImageFile.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Profile Image */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Profile Image</h3>
          <div className="flex items-center space-x-4">
            <div className="relative w-24 h-24 bg-gray-500 rounded-full overflow-hidden">
              {profile?.profileImageUrl ? (
                <>
                  <LazyImage 
                    src={profile.profileImageUrl} 
                    alt="Profile" 
                    fill 
                    style={{ objectFit: 'cover' }}
                    className="rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRemoveProfileDialog(true)}
                    className="absolute bottom-0 inset-x-0 bg-red-600/80 hover:bg-red-700 text-white text-xs py-1"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-800 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <label className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded cursor-pointer">
                {profile?.profileImageUrl ? 'Change Photo' : 'Upload Photo'}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfileImageChange} 
                  className="hidden" 
                />
              </label>
              {profileImageFile && (
                <span className="ml-2 text-sm text-gray-300">
                  {profileImageFile.name}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Profile Information */}
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
              placeholder="Tell us about yourself"
            />
          </div>
          
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium mb-1">Specialty</label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
              placeholder="Your culinary specialty"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
                placeholder="City, Country"
              />
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-900/70 border border-primary rounded-md py-2 px-3 text-white"
                placeholder="Your phone number"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-md ${
                isSubmitting 
                  ? 'bg-primary cursor-not-allowed' 
                  : 'bg-primary hover:bg-slate-900 border border-primary'
              } text-white font-medium`}
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </form>
      
      {/* Remove Profile Image Dialog */}
      {showRemoveProfileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/70 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Remove Profile Image?</h3>
            <p className="mb-6">Are you sure you want to remove your profile image? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveProfileDialog(false)}
                className="px-4 py-2 bg-primary hover:bg-slate-900 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveProfileImage}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Banner Image Dialog */}
      {showRemoveBannerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/70 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Remove Banner Image?</h3>
            <p className="mb-6">Are you sure you want to remove your banner image? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveBannerDialog(false)}
                className="px-4 py-2 bg-primary hover:bg-slate-900 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveBannerImage}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
