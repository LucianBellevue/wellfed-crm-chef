'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRecipeStore } from '../store';
import { useAuthStore } from '../store';

export default function RecipeList() {
  const { user } = useAuthStore();
  const { 
    recipes, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    fetchRecipes, 
    loadMoreRecipes, 
    deleteRecipe, 
    resetPagination 
  } = useRecipeStore();
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  
  // Initialize recipes with pagination
  useEffect(() => {
    if (user && recipes.length === 0) {
      // Reset pagination and fetch initial batch
      resetPagination();
      fetchRecipes(user.uid, 1, '', 'all', 'newest');
    }
  }, [user, recipes.length, fetchRecipes, resetPagination]);
  
  // Handle image loading
  const handleImageLoad = (recipeId: string) => {
    setLoadedImages(prev => ({
      ...prev,
      [recipeId]: true
    }));
  };
  
  // Load more recipes using server-side pagination
  const loadMore = () => {
    if (user && hasMore && !loadingMore) {
      loadMoreRecipes(user.uid);
    }
  };
  
  const handleDelete = async (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(recipeId);
    }
  };
  
  // Only show full loading spinner on initial load
  if (loading && recipes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900 text-white p-4 rounded">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!recipes.length) {
    return (
      <div className="bg-gray-900 text-white p-8 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-4">No Recipes Yet</h3>
        <p className="mb-6">You haven&apos;t created any recipes yet. Get started by creating your first recipe!</p>
        <Link 
          href="/recipes/new" 
          className="bg-primary hover:bg-slate-900 text-white py-2 px-6 rounded-md inline-block"
        >
          Create Recipe
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Your Recipes</h2>
        <Link 
          href="/recipes/new" 
          className="bg-primary hover:bg-slate-900 text-white py-2 px-4 rounded-md inline-block"
        >
          Create Recipe
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="bg-gray-900 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-[1.02]"
          >
            <div className="relative h-48 w-full">
              {recipe.media && recipe.media.length > 0 ? (
                <>
                  {!loadedImages[recipe.id || ''] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  <Image
                    src={recipe.media[0].url}
                    alt={recipe.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded-t-lg"
                    onLoad={() => handleImageLoad(recipe.id || '')}
                    loading="lazy"
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-white mb-2 flex-grow">{recipe.name}</h3>
                <div className="flex space-x-2">
                  <Link 
                    href={`/recipes/${recipe.id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button 
                    onClick={() => handleDelete(recipe.id || '')}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {recipe.description || 'No description provided'}
              </p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {recipe.totalTime ? `${recipe.totalTime} mins` : 'Time not specified'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>
                    {recipe.servings ? `${recipe.servings} servings` : 'Not specified'}
                  </span>
                </div>
              </div>
              
              <Link 
                href={`/recipes/${recipe.id}`}
                className="mt-4 inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
              >
                View Recipe
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
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
    </div>
  );
}
