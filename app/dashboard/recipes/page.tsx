'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

import { useRecipeStore, type Recipe } from '../../../store/recipeStore';

export default function RecipesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    recipes,
    loading,
    loadingMore,
    error,
    hasMore,
    currentPage,
    fetchRecipes,
    loadMoreRecipes,
    resetPagination
  } = useRecipeStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  // Initialize recipes with pagination when component mounts or user changes
  useEffect(() => {
    if (user) {
      resetPagination();
      fetchRecipes(user.uid, 1, '', 'all', 'newest');
    }
  }, [user, fetchRecipes, resetPagination]);

  // Apply filters and sorting to recipes
  const applyFiltersAndSort = useCallback(() => {
    if (!recipes.length) {
      setFilteredRecipes([]);
      return;
    }

    let result = [...recipes];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(recipe =>
        recipe.name?.toLowerCase().includes(term) ||
        recipe.description?.toLowerCase().includes(term)
      );
    }

    // Apply difficulty filter
    if (filter !== 'all') {
      result = result.filter(recipe => recipe.difficulty?.toLowerCase() === filter.toLowerCase());
    }

    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date();
        const dateB = b.createdAt?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date();
        const dateB = b.createdAt?.toDate?.() || new Date();
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'prep-time') {
      result.sort((a, b) => {
        const timeA = parseInt(a.prepTime || '0', 10);
        const timeB = parseInt(b.prepTime || '0', 10);
        return timeA - timeB;
      });
    }

    setFilteredRecipes(result);
    // fetchRecipes(user?.uid || '', 1, searchTerm, filter, sortBy);
  }, [recipes, searchTerm, filter, sortBy]);

  // Apply filters when filter criteria or recipes change
  useEffect(() => {
    applyFiltersAndSort();
  }, [recipes, searchTerm, filter, sortBy]);

  useEffect(() => {
    if (user) {
      fetchRecipes(user.uid, 1, searchTerm, filter, sortBy);
    }
  }, [filter, sortBy]);

  // Check if we need to load more recipes when filters change
  useEffect(() => {
    if (filteredRecipes.length < 6 && hasMore && recipes.length > 0 && !loading && !loadingMore) {
      // If we have fewer than 6 filtered recipes, try to load more
      if (user) {
        //  loadMoreRecipes(user.uid);
      }
    }
  }, [filteredRecipes.length, hasMore, recipes.length, loading, loadingMore, loadMoreRecipes, user]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  }, []);

  const formatTime = (minutes: string): string => {
    if (!minutes) return 'Not specified';

    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) return minutes;

    if (mins < 60) {
      return `${mins} min`;
    }

    const hours = Math.floor(mins / 60);
    const remainingMinutes = mins % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty?.toLowerCase()) {
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

  // Only show full loading spinner on initial load
  if (loading && recipes.length === 0) {
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
            <button
              className="absolute right-0 top-0 h-full  bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-6 rounded-md transition-colors disabled:opacity-50"

              onClick={() => {
                fetchRecipes(user?.uid || '', 1, searchTerm, filter, sortBy);
              }}
            > <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg></button>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No recipes yet</h3>
              <p className="text-gray-400 mb-6">Create your first recipe to get started</p>
              <Link
                href="/recipes/new"
                className="px-6 py-2 bg-primary hover:bg-slate-900 border border-primary text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Create Recipe
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
              >
                <div className="relative h-48 w-full">
                  {recipe.media && recipe.media.length > 0 ? (
                    <Image
                      src={recipe.media[0].url}
                      alt={recipe.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-t-lg"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                      {recipe.difficulty || 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{recipe.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {recipe.description || 'No description provided'}
                  </p>

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(recipe.totalTime)}</span>
                    </div>

                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{recipe.servings || 'Not specified'}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/recipes/${recipe.id}`)}
                      className="flex-1 bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-4 rounded-md text-center"
                    >
                      View
                    </button>
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="bg-slate-700 hover:bg-slate-900 border border-slate-700 text-white py-2 px-4 rounded-md"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={() => user && fetchRecipes(user.uid, currentPage + 1, searchTerm, filter, sortBy)}
                disabled={loadingMore}
                className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-6 rounded-md transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Loading...
                  </span>
                ) : (
                  'Load More Recipes'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
