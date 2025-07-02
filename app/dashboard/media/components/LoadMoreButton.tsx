import React from 'react';

export interface LoadMoreButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
}

export const LoadMoreButton = ({ loading, onClick, label = 'Load More Media' }: LoadMoreButtonProps) => {
  return (
    <div className="mt-8 text-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="bg-primary hover:bg-slate-900 border border-primary text-white py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Loading...
          </span>
        ) : (
          label
        )}
      </button>
    </div>
  );
};
