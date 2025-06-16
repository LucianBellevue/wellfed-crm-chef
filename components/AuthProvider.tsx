'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../store';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, initialized } = useAuthStore();
  
  // Initialize auth state listener when component mounts
  useEffect(() => {
    const unsubscribe = initialize();
    
    // Clean up subscription on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initialize]);
  
  // Show loading state until auth is initialized
  if (!initialized) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return <>{children}</>;
}
