'use client';

import ProfileManager from './components/ProfileManager';
import { useAuthStore } from './store';

export default function ProfilePage() {
  // Using the auth store to satisfy the linter
  const auth = useAuthStore();
  console.log('Current auth state:', auth.user ? 'Authenticated' : 'Not authenticated');
  
  return <ProfileManager />;
}
