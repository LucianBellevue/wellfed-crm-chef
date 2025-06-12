'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{greeting}, Chef!</h2>
        <p className="text-gray-300">Welcome to your WellFed Chef Portal. Manage your recipes and profile from here.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 shadow-soft rounded-xl p-6 border border-primary hover:shadow-lg transition-all duration-300 hover:border-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-primary/20 p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              </div>
              <span className="text-xs font-medium text-primary-300 bg-primary/10 py-1 px-2 rounded-full">New</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Create Recipe</h3>
            <p className="text-gray-300 mb-6">Add a new recipe with ingredients, instructions, and nutritional information</p>
            <Link href="/dashboard/recipes/new" className="inline-flex items-center text-primary hover:text-primary-400 font-medium transition-colors">
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-slate-900 shadow-soft rounded-xl p-6 border border-primary hover:shadow-lg transition-all duration-300 hover:border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <span className="text-xs font-medium text-primary-300 bg-primary/10 py-1 px-2 rounded-full">Browse</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">View Recipes</h3>
            <p className="text-gray-300 mb-6">Browse, search, and manage your existing recipe collection</p>
            <Link href="/recipes" className="inline-flex items-center text-primary-300 font-medium hover:text-primary-200 transition-colors">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="bg-slate-900 shadow-soft rounded-xl p-6 border border-primary hover:shadow-lg transition-all duration-300 hover:border-primary">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/20 p-3 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-primary-300 bg-primary/10 py-1 px-2 rounded-full">Stats</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
            <p className="text-gray-300 mb-6">View insights and statistics about your recipe collection</p>
            <Link href="/analytics" className="inline-flex items-center text-primary-300 font-medium hover:text-primary-200 transition-colors">
              View Stats
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </>
  );
}
