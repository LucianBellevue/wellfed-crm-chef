'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../context/AuthContext';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Step {
  description: string;
}

interface RecipeData {
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: string;
  cuisine: string;
  ingredients: Ingredient[];
  steps: Step[];
  notes: string;
  chefId: string;
  chefEmail: string;
  createdAt: {
    toDate: () => Date;
  } | null;
}

export default function EditRecipe({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { } = useAuth(); // Auth context available for future use
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<RecipeData>({
    name: '',
    description: '',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium',
    cuisine: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    steps: [{ description: '' }],
    notes: '',
    chefId: '',
    chefEmail: '',
    createdAt: null
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeRef = doc(db, 'recipes', params.id);
        const recipeSnap = await getDoc(recipeRef);
        
        if (recipeSnap.exists()) {
          setFormData(recipeSnap.data() as RecipeData);
        } else {
          setError('Recipe not found');
        }
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleIngredientChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      ingredients: updatedIngredients
    });
  };

  const handleStepChange = (index: number, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = {
      description: value
    };
    
    setFormData({
      ...formData,
      steps: updatedSteps
    });
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: '', unit: '' }]
    });
  };

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      const updatedIngredients = [...formData.ingredients];
      updatedIngredients.splice(index, 1);
      setFormData({
        ...formData,
        ingredients: updatedIngredients
      });
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { description: '' }]
    });
  };

  const removeStep = (index: number) => {
    if (formData.steps.length > 1) {
      const updatedSteps = [...formData.steps];
      updatedSteps.splice(index, 1);
      setFormData({
        ...formData,
        steps: updatedSteps
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Recipe name is required');
      }

      // Filter out empty ingredients and steps
      const filteredIngredients = formData.ingredients.filter(
        ing => ing.name.trim() !== '' || ing.quantity.trim() !== ''
      );
      
      const filteredSteps = formData.steps.filter(
        step => step.description.trim() !== ''
      );

      if (filteredIngredients.length === 0) {
        throw new Error('At least one ingredient is required');
      }

      if (filteredSteps.length === 0) {
        throw new Error('At least one step is required');
      }

      // Update recipe document
      const recipeData = {
        ...formData,
        ingredients: filteredIngredients,
        steps: filteredSteps,
        updatedAt: serverTimestamp()
      };

      // Update in Firestore
      const recipeRef = doc(db, 'recipes', params.id);
      await updateDoc(recipeRef, recipeData);
      
      // Redirect to the recipes list
      router.push('/recipes');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update recipe';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-gray-300">Loading recipe...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 shadow border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Edit Recipe</h1>
          <div className="flex items-center space-x-4">
            <Link href="/recipes" className="text-primary-300 hover:text-primary-200 transition-colors">
              Back to Recipes
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 shadow rounded-lg p-6 border border-slate-700">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4 pb-2 border-b border-slate-700 text-white">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Recipe Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-gray-300 mb-1">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div>
                  <label htmlFor="prepTime" className="block text-sm font-medium text-gray-300 mb-1">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="prepTime"
                    name="prepTime"
                    value={formData.prepTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="cookTime" className="block text-sm font-medium text-gray-300 mb-1">
                    Cook Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="cookTime"
                    name="cookTime"
                    value={formData.cookTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label htmlFor="servings" className="block text-sm font-medium text-gray-300 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    id="servings"
                    name="servings"
                    value={formData.servings}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                >
                  <option value="easy" className="bg-slate-700">Easy</option>
                  <option value="medium" className="bg-slate-700">Medium</option>
                  <option value="hard" className="bg-slate-700">Hard</option>
                </select>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                <h2 className="text-lg font-medium text-white">Ingredients</h2>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-800 transition-colors shadow-button"
                >
                  + Add Ingredient
                </button>
              </div>

              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-4 mb-3">
                  <div className="flex-grow grid grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, e)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="quantity"
                        placeholder="Quantity"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, e)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="unit"
                        placeholder="Unit (g, ml, tsp, etc.)"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, e)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                    disabled={formData.ingredients.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700">
                <h2 className="text-lg font-medium text-white">Preparation Steps</h2>
                <button
                  type="button"
                  onClick={addStep}
                  className="px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-primary-800 transition-colors shadow-button"
                >
                  + Add Step
                </button>
              </div>

              {formData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 mb-3">
                  <div className="flex-grow">
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-white">Step {index + 1}</span>
                    </div>
                    <textarea
                      name="description"
                      rows={2}
                      value={step.description}
                      onChange={(e) => handleStepChange(index, e)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 transition-colors"
                    disabled={formData.steps.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4 pb-2 border-b border-slate-700 text-white">Additional Notes</h2>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                placeholder="Any additional notes, tips, or variations..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-800 transition-colors shadow-button focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Update Recipe'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
