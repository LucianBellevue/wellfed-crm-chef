import React from 'react';

export const MediaCardSkeleton = () => {
  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-slate-700"></div>
      
      <div className="p-4">
        {/* Icon and title skeleton */}
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 bg-slate-700 rounded-md"></div>
          <div className="ml-3 space-y-2 flex-1">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        </div>
        
        {/* Description skeleton */}
        <div className="h-3 bg-slate-700 rounded w-full mb-3"></div>
        <div className="h-3 bg-slate-700 rounded w-4/5 mb-3"></div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};
