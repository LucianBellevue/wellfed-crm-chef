'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, DELETE_RECEPIES, GET_RECEPIES } from '@/constants/api';

interface Recipe {
  id: string;
  _id?: string;
  name: string;
  description: string;
  createdAt: {
    toDate: () => Date;
  } | null;
  updatedAt: {
    toDate: () => Date;
  } | null;
}

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Auth context available for future use

  useEffect(() => {
  
    if (user && user.uid) {
      fetchRecipes();
    }
  }, [user]);

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`${BASE_URL}${GET_RECEPIES}?page=1&limit=10&type=chef&userId=${user?.uid}`);
      const data = await res.json();
      const recipesList = data.recipes as Recipe[];
      // const recipesList = recipesSnapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // })) as Recipe[];
      
      // Sort by creation date (newest first)
      recipesList.sort((a, b) => {
        const getDate = (recipe: Recipe) => {
          const timestamp = recipe.createdAt || recipe.updatedAt;
          if (!timestamp) return null;
          return typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
        };
        
        const dateA = getDate(a);
        const dateB = getDate(b);
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecipes(recipesList);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        const res = await fetch(`${BASE_URL}${DELETE_RECEPIES}${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchRecipes();
        }
        // await deleteDoc(doc(db, 'recipes', id));
        // setRecipes(recipes.filter(recipe => recipe.id !== id));
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 shadow border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Recipes</h1>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-primary hover:text-primary-400 transition-colors">
              Dashboard
            </Link>
            <Link 
              href="/recipes/new" 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors shadow-button"
            >
              Add New Recipe
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-primary">
          <h2 className="text-xl font-semibold mb-6 text-white">All Recipes</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-300">Loading recipes...</p>
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No recipes found. Create your first recipe!</p>
              <Link 
                href="/recipes/new" 
                className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors shadow-button"
              >
                Add New Recipe
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-900">
                <thead className="bg-slate-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-900">
                  {recipes.map((recipe) => (
                    <tr key={recipe._id || recipe.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{recipe.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 line-clamp-2">{recipe.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/recipes/${recipe.id}`} className="text-primary-300 hover:text-primary-200 transition-colors mr-4">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
