'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (isResetMode) {
      // Handle password reset
      try {
        await resetPassword(email);
        setSuccessMessage('Password reset email sent. Check your inbox.');
        setIsResetMode(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle sign in
      try {
        await signIn(email, password);
        router.push('/dashboard');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };
  
  const toggleMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-primary">WellFed Chef Portal</h1>
            <p className="text-white">Sign in to manage your recipes</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl shadow-soft p-8 border border-primary">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-300 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700 border border-primary text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-gray-400"
                required
              />
            </div>

            {!isResetMode && (
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder-gray-400"
                  required={!isResetMode}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 transition-colors shadow-button font-medium"
            >
              {isLoading 
                ? (isResetMode ? 'Sending...' : 'Signing in...') 
                : (isResetMode ? 'Send Reset Link' : 'Sign In')}
            </button>
            
            <div className="mt-4 text-center">
              <button 
                type="button" 
                onClick={toggleMode} 
                className="text-primary-300 hover:text-primary-200 text-sm font-medium transition-colors"
              >
                {isResetMode ? 'Back to Sign In' : 'Forgot Password?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
