import { create } from 'zustand';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, orderBy, limit, startAfter, DocumentSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BASE_URL, GET_RECEPIES, POST_RECEPIES } from '@/constants/api';

// Define Recipe interface
export interface Recipe {
  id?: string;
  name: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  difficulty: string;
  categories: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    beverage: boolean;
    desserts: boolean;
    appetizer: boolean;
    snack: boolean;
  };
  cuisine: string;
  tools: string;
  nutrition: {
    calories: string;
    protein: string;
    fat: string;
    carbs: string;
  };
  media: { url: string, type: string, name: string }[];
  ingredients: { name: string, quantity: string, unit: string }[];
  steps: { description: string, step: number }[];
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  userId: string;
}

// Define store state interface
interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  success: string | null;
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  currentPage: number;
  fetchRecipes: (userId: string, page: number, searchTerm: string, difficulty: string, sortBy: string) => Promise<void>;
  loadMoreRecipes: (userId: string) => Promise<void>;
  resetPagination: () => void;
  fetchRecipeById: (recipeId: string) => Promise<void>;
  createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  createUpdateRecipie: (id: string | undefined, recipeData: Recipe) => Promise<string | undefined>;
  updateRecipe: (recipeId: string, recipeData: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (recipeId: string) => Promise<void>;
  clearCurrentRecipe: () => void;
  clearError: () => void;
  clearSuccess: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  setRecipes: (recipes: Recipe[]) => void;
}

// Create the store
export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  currentRecipe: null,
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: true,
  lastDoc: null,
  success: null,
  currentPage: 1,

  // Reset pagination
  resetPagination: () => {
    set({ lastDoc: null, hasMore: true });
  },

  // Fetch all recipes for a user
  fetchRecipes: async (
    userId: string,
    page: number = 1,
    searchTerm: string = '',
    difficulty: string = '',
    sortBy: string = ''
  ) => {
    set({
      loading: true,
      error: null,
      // Only clear recipes if this is the first page, otherwise keep existing for infinite scroll
      recipes: page === 1 ? [] : get().recipes,
      lastDoc: null,
      hasMore: true,
      currentPage: page,
    });
    try {
      set({ loadingMore: true, error: null });
      const ITEMS_PER_PAGE = 6;

      const res = await fetch(
        `${BASE_URL}${GET_RECEPIES}?page=${page}&limit=${ITEMS_PER_PAGE}&type=chef&userId=${userId}&searchTerm=${searchTerm}&difficulty=${difficulty}&sortBy=${sortBy}`
      );
      const data = await res.json();
      const recipesList = data.recipes as Recipe[];

      let recipesData: Recipe[];
      if (page === 1) {
        // On first page, replace recipes
        recipesData = [...recipesList];
      } else {
        // On subsequent pages, append and deduplicate by id
        const existing = get().recipes;
        const all = [...existing, ...recipesList];
        // Deduplicate by id (or _id fallback)
        const seen = new Set();
        recipesData = all.filter((r) => {
          const id = (r as any).id || (r as any)._id;
          if (!id) return false;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      }

      // Set hasMore based on total and loaded
      if (recipesList.length > 0) {
        if (data.total > recipesData.length) {
          set({ hasMore: true });
        } else {
          set({ hasMore: false });
        }
      } else {
        set({ hasMore: false });
      }

      set({ loadingMore: false, error: null });
      set({ recipes: recipesData, loading: false });
    } catch (error) {
      console.error('Error fetching recipes:', error);
      set({ error: 'Failed to fetch recipes', loading: false });
    }
  },

  loadMoreRecipes: async (userId: string) => {
    const { lastDoc, hasMore, recipes } = get();
    if (!lastDoc || !hasMore) return;

    set({ loadingMore: true, error: null });
    try {
      const ITEMS_PER_PAGE = 6;
      const recipesQuery = query(
        collection(db, 'recipes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );

      const querySnapshot = await getDocs(recipesQuery);

      // If no more documents, set hasMore to false
      if (querySnapshot.empty) {
        set({ hasMore: false, loadingMore: false });
        return;
      }

      // Save the last document for next pagination
      const newLastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      const newRecipes: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Recipe, 'id'>;
        newRecipes.push({
          id: doc.id,
          ...data
        });
      });

      // Update recipes state with new recipes
      set({
        recipes: [...recipes, ...newRecipes],
        lastDoc: newLastDoc,
        loadingMore: false
      });

    } catch (error) {
      console.error('Error loading more recipes:', error);
      set({ error: 'Failed to load more recipes', loadingMore: false });
    }
  },

  // Fetch a single recipe by ID
  fetchRecipeById: async (recipeId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${BASE_URL}${GET_RECEPIES}${recipeId}`);
      const data = await res.json();
      // const recipeDoc = await getDoc(doc(db, 'recipes', recipeId));



      if (data) {
        const recipeData = data as Omit<Recipe, 'id'>;
        set({
          currentRecipe: {
            id: data._id,
            ...recipeData
          },
          loading: false
        });
      } else {
        set({ error: 'Recipe not found', loading: false });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recipe';
      console.error('Error fetching recipe:', error);
      set({ error: errorMessage, loading: false });
    }
  },

  // Create a new recipe
  createRecipe: async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ loading: true, error: null });
    try {
      const recipeWithTimestamps = {
        ...recipe,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'recipes'), recipeWithTimestamps);

      // Update the recipes list with the new recipe
      const recipes = get().recipes;
      set({
        recipes: [...recipes, { id: docRef.id, ...recipe }],
        loading: false
      });



      return docRef.id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create recipe';
      console.error('Error creating recipe:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  createUpdateRecipie: async (id: string | undefined, recipeData: Recipe) => {
    set({ loading: true, error: null });
    try {
      const profileUpdateUrl = id !== undefined && id !== 'undefined' ? (BASE_URL + POST_RECEPIES + '/' + id) : (BASE_URL + POST_RECEPIES);

      const body = recipeData;

      const res = await fetch(profileUpdateUrl, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      set({ loading: false, success: id ? 'Recipe updated successfully' : 'Recipe created successfully' });
      
      // Return the recipe ID for new recipes
      return data._id || data.id || id;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save recipe';
      console.error('Error updating recipe:', error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },



  // Update an existing recipe
  updateRecipe: async (recipeId: string, recipeData: Partial<Recipe>) => {
    set({ loading: true, error: null });
    try {
      const recipeRef = doc(db, 'recipes', recipeId);

      await updateDoc(recipeRef, {
        ...recipeData,
        updatedAt: serverTimestamp()
      });

      // Update the recipes list and current recipe if it's being viewed
      const recipes = get().recipes.map(recipe =>
        recipe.id === recipeId ? { ...recipe, ...recipeData } : recipe
      );

      const currentRecipe = get().currentRecipe;
      set({
        recipes,
        currentRecipe: currentRecipe?.id === recipeId
          ? { ...currentRecipe, ...recipeData }
          : currentRecipe,
        loading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update recipe';
      console.error('Error updating recipe:', error);
      set({ error: errorMessage, loading: false });
    }
  },

  // Delete a recipe
  deleteRecipe: async (recipeId: string) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'recipes', recipeId));

      // Remove the recipe from the recipes list
      const recipes = get().recipes.filter(recipe => recipe.id !== recipeId);

      // Clear current recipe if it's the one being deleted
      const currentRecipe = get().currentRecipe;
      set({
        recipes,
        currentRecipe: currentRecipe?.id === recipeId ? null : currentRecipe,
        loading: false
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recipe';
      console.error('Error deleting recipe:', error);
      set({ error: errorMessage, loading: false });
    }
  },

  // Clear the current recipe
  clearCurrentRecipe: () => {
    set({ currentRecipe: null });
  },

  // Clear any error
  clearError: () => {
    set({ error: null });
  },

  // Clear success message
  clearSuccess: () => {
    set({ success: null });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // Set current recipe
  setCurrentRecipe: (recipe: Recipe | null) => {
    set({ currentRecipe: recipe });
  },

  // Set recipes list
  setRecipes: (recipes: Recipe[]) => {
    set({ recipes });
  }
}));
