import React from 'react';

export const RecipeMediaSkeleton = () => {
  return (
    <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md mt-8 animate-pulse">
      {/* Recipe section title skeleton */}
      <div className="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
      
      {/* Recipe items */}
      <div className="space-y-6">
        {/* Recipe 1 */}
        <div className="border-b border-gray-800 pb-4">
          <div className="h-5 bg-slate-700 rounded w-1/4 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="aspect-square bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Recipe 2 */}
        <div className="border-b border-gray-800 pb-4">
          <div className="h-5 bg-slate-700 rounded w-1/3 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="aspect-square bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Recipe 3 */}
        <div>
          <div className="h-5 bg-slate-700 rounded w-2/5 mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="aspect-square bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
