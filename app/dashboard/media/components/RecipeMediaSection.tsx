import React from 'react';
import { Recipe } from './types';

interface RecipeMediaSectionProps {
  recipes: Recipe[];
  recipeMedia: { [key: string]: string[] };
}

export const RecipeMediaSection = ({ recipes, recipeMedia }: RecipeMediaSectionProps) => {
  return (
    <div className="mt-12 mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Your Recipe Images</h2>
      {(recipes || []).map(recipe => {
        const recipeId = recipe._id || recipe.id;
        if (!recipeId) return null;
        
        return (
          <div key={recipeId} className="mb-8">
            <h3 className="text-lg font-bold mb-2 text-primary">{recipe.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(recipeMedia[recipeId] || []).map(url => (
                <div key={url} className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  {url.match(/\.(mp4|mov)$/i) ? (
                    <video src={url} controls className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <img src={url} alt="Recipe media" className="w-full h-full object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
