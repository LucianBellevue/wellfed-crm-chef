'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

export default function RecipesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [error, setError] = useState('');

  const fetchRecipes = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      
      const recipesQuery = query(
        collection(db, 'recipes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(recipesQuery);
      const recipesList: Recipe[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        recipesList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          servings: data.servings,
          difficulty: data.difficulty,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          imageUrl: data.imageUrl
        });
      });
      
      setRecipes(recipesList);
      setFilteredRecipes(recipesList);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyFiltersAndSort = useCallback(() => {
    let result = [...recipes];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(recipe => 
        recipe.title.toLowerCase().includes(term) || 
        recipe.description.toLowerCase().includes(term)
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      result = result.filter(recipe => recipe.difficulty === filter);
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'prep-time') {
      result.sort((a, b) => a.prepTime - b.prepTime);
    }
    
    setFilteredRecipes(result);
  }, [recipes, searchTerm, filter, sortBy]);

  useEffect(() => {
    if (user) {
      fetchRecipes();
    }
  }, [user, fetchRecipes]);

  useEffect(() => {
    if (recipes.length > 0) {
      applyFiltersAndSort();
    }
  }, [recipes, applyFiltersAndSort, searchTerm, filter, sortBy]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  }, []);

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-900/30 text-green-300';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300';
      case 'hard':
        return 'bg-red-900/30 text-red-300';
      default:
        return 'bg-slate-700 text-gray-300';
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Your Recipes</h1>
        <p className="text-gray-300">Browse, search, and manage your recipe collection</p>
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

      <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search recipes by title or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-primary rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-auto">
              <select
                value={filter}
                onChange={handleFilterChange}
                className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="prep-time">Prep Time</option>
              </select>
            </div>
            
            <Link
              href="/recipes/new"
              className="w-full md:w-auto px-6 py-2 bg-primary border border-primary hover:bg-slate-900 hover:border-primary text-white font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Recipe
            </Link>
          </div>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center">
          {searchTerm || filter !== 'all' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No matching recipes found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setSortBy('newest');
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No recipes yet</h3>
              <p className="text-gray-400 mb-6">Create your first recipe to get started</p>
              <Link
                href="/recipes/new"
                className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Create Recipe
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-slate-900 border border-slate-700 hover:border-primary rounded-xl overflow-hidden shadow-md transition-all duration-300 flex flex-col"
            >
              {recipe.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="h-48 bg-slate-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-white">{recipe.title}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-400 mb-4 line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <div className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Prep: {formatTime(recipe.prepTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{recipe.servings} servings</span>
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-2 border-t border-slate-700 mt-auto">
                <div className="flex justify-between">
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="text-primary hover:text-primary-400 font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                    className="text-gray-300 hover:text-white font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
