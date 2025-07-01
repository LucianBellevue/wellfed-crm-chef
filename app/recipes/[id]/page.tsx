'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRecipeStore, useAuthStore } from '../../../store';
import MediaSelector from '../../../components/MediaSelector';
import { useAuth } from '@/app/context/AuthContext';

// These interfaces are used in the form state
// They're defined inline for better type checking

export default function CreateUpdateRecipe() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { id } = useParams();

  // Get recipe store actions and state
  const { createUpdateRecipie, fetchRecipeById, error: recipeError, currentRecipe } = useRecipeStore();

  useEffect(() => {
    if (id && id !== 'new') {
      fetchRecipeById(id as string);
    }
  }, [id]);

  useEffect(() => { 
    if (currentRecipe) {
      setFormData(currentRecipe);
    }
  }, [currentRecipe]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prepTime: '',
    cookTime: '',
    totalTime: '',
    servings: '',
    difficulty: 'medium',
    categories: {
      breakfast: false,
      lunch: false,
      dinner: false,
      beverage: false,
      desserts: false,
      appetizer: false,
      snack: false
    },
    cuisine: '',
    tools: '',
    nutrition: {
      calories: '',
      protein: '',
      fat: '',
      carbs: ''
    },
    media: [] as { url: string, type: string, name: string }[],
    ingredients: [{ name: '', quantity: '', unit: '' }],
    steps: [{ description: '', step: 0 }],
    notes: ''
  });

  
  // State for media-related errors
  const [mediaError, setMediaError] = useState('');
  
  // Set local error state when recipe store error changes
  useEffect(() => {
    if (recipeError) {
      setError(recipeError);
    }
  }, [recipeError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update the form data
    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [name]: value
      };
      
      // If prep time or cook time changed, calculate total time
      if (name === 'prepTime' || name === 'cookTime') {
        const prepTimeNum = parseInt(name === 'prepTime' ? value : prevData.prepTime) || 0;
        const cookTimeNum = parseInt(name === 'cookTime' ? value : prevData.cookTime) || 0;
        updatedData.totalTime = (prepTimeNum + cookTimeNum).toString();
      }
      
      return updatedData;
    });
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      categories: {
        ...formData.categories,
        [category]: !formData.categories[category as keyof typeof formData.categories]
      }
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
      description: value,
      step: index + 1
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
      steps: [...formData.steps, { description: '', step: formData.steps.length + 1 }]
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

  const handleMediaChange = (selectedMedia: Array<{ id: string; url: string; type: string; name?: string }>) => {
    setFormData(prevData => ({
      ...prevData,
      media: selectedMedia.map(media => ({
        url: media.url,
        type: media.type,
        name: media.name || ''
      }))
    }));
    setMediaError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!user) {
      setError('You must be logged in to create a recipe');
      setIsSubmitting(false);
      return;
    }

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

      // Use the Zustand store to create the recipe
      const recipeId = await createUpdateRecipie(id !== 'new' && id ? id as string : undefined, {
        ...formData,
        ingredients: filteredIngredients,
        steps: filteredSteps,
        userId: user.uid
      });

      // Redirect to the recipe page
      router.push(`/dashboard/recipes`);
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError('Failed to create recipe. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 shadow border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">{id !== 'new' ? 'Edit Recipe' : 'Create New Recipe'}</h1>
          <div className="flex items-center space-x-4">
            <Link href="/recipes" className="text-primary hover:text-primary-400 transition-colors">
              Back to Recipes
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-primary">
          {/* Display media upload errors */}
          {mediaError && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 rounded-lg">
              {mediaError}
            </div>
          )}
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
              <h2 className="text-lg font-medium mb-4 pb-2 border-b border-gray-700 text-white">Basic Information</h2>
              
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
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                  className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="totalTime" className="block text-sm font-medium text-gray-300 mb-1">
                    Total Time (minutes)
                  </label>
                  <input
                    type="number"
                    id="totalTime"
                    name="totalTime"
                    value={formData.totalTime}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-800 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
                
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="breakfast"
                      checked={formData.categories?.breakfast}
                      onChange={() => handleCategoryChange('breakfast')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="breakfast" className="ml-2 text-sm text-gray-300">
                      Breakfast
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="lunch"
                      checked={formData.categories?.lunch}
                      onChange={() => handleCategoryChange('lunch')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="lunch" className="ml-2 text-sm text-gray-300">
                      Lunch
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="dinner"
                      checked={formData.categories?.dinner}
                      onChange={() => handleCategoryChange('dinner')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="dinner" className="ml-2 text-sm text-gray-300">
                      Dinner
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="beverage"
                      checked={formData.categories?.beverage}
                      onChange={() => handleCategoryChange('beverage')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="beverage" className="ml-2 text-sm text-gray-300">
                      Beverage
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="desserts"
                      checked={formData.categories?.desserts}
                      onChange={() => handleCategoryChange('desserts')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="desserts" className="ml-2 text-sm text-gray-300">
                      Desserts
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="appetizer"
                      checked={formData.categories?.appetizer}
                      onChange={() => handleCategoryChange('appetizer')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="appetizer" className="ml-2 text-sm text-gray-300">
                      Appetizer
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="snack"
                      checked={formData.categories?.snack}
                      onChange={() => handleCategoryChange('snack')}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-600 bg-slate-900 rounded"
                    />
                    <label htmlFor="snack" className="ml-2 text-sm text-gray-300">
                      Snack
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tools Required */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary">
                <h2 className="text-lg font-medium text-white">Tools Required</h2>
              </div>
              <textarea
                id="tools"
                name="tools"
                value={formData.tools}
                onChange={handleChange}
                placeholder="List any special tools or equipment needed (e.g., blender, food processor, dutch oven)"
                className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400 min-h-[80px]"
              />
            </div>

            {/* Media Files */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary">
                <h2 className="text-lg font-medium text-white">Media Files</h2>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-2">Add photos or videos of your recipe (max 10 files)</p>
                <MediaSelector 
                  selectedMedia={formData.media.map(media => ({
                    id: media.name, // Use name as id since our existing media objects don't have id
                    url: media.url,
                    type: media.type,
                    name: media.name
                  }))} 
                  onChange={handleMediaChange}
                  maxFiles={10}
                />
              </div>
            </div>
            
            {/* Nutrition Per Serving */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary">
                <h2 className="text-lg font-medium text-white">Nutrition Per Serving</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-300 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    id="calories"
                    name="nutrition.calories"
                    value={formData.nutrition.calories}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        nutrition: {
                          ...formData.nutrition,
                          calories: e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="protein" className="block text-sm font-medium text-gray-300 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    id="protein"
                    name="nutrition.protein"
                    value={formData.nutrition.protein}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        nutrition: {
                          ...formData.nutrition,
                          protein: e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="fat" className="block text-sm font-medium text-gray-300 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    id="fat"
                    name="nutrition.fat"
                    value={formData.nutrition.fat}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        nutrition: {
                          ...formData.nutrition,
                          fat: e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium text-gray-300 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    id="carbs"
                    name="nutrition.carbs"
                    value={formData.nutrition.carbs}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        nutrition: {
                          ...formData.nutrition,
                          carbs: e.target.value
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary">
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
                        className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="quantity"
                        placeholder="Quantity"
                        value={ingredient.quantity}
                        onChange={(e) => handleIngredientChange(index, e)}
                        className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="unit"
                        placeholder="Unit (g, ml, tsp, etc.)"
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, e)}
                        className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-primary">
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
                      className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
              <h2 className="text-lg font-medium mb-4 pb-2 border-b border-primary text-white">Additional Notes</h2>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-white placeholder-gray-400"
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
                {isSubmitting ? 'Saving...' : 'Save Recipe'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

