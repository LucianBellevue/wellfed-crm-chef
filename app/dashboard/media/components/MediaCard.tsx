import React from 'react';
import { MediaFile } from './types';
import { LazyMediaThumbnail } from './LazyMediaThumbnail';
import { FileTypeIcon } from './FileTypeIcon';

interface MediaCardProps {
  file: MediaFile;
  onDelete: (id: string, url: string) => void;
  formatFileSize: (bytes: number) => string;
  onClick: (file: MediaFile) => void;
}

export const MediaCard = ({ file, onDelete, formatFileSize, onClick }: MediaCardProps) => {
  return (
    <div 
      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-primary transition-all cursor-pointer"
      onClick={() => onClick(file)}
    >
      {file.type.startsWith('image/') && (
        <div className="relative">
          <LazyMediaThumbnail file={file} />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-40 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white opacity-0 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center mb-3">
          <FileTypeIcon type={file.type} />
          <div className="ml-3">
            <h3 className="text-white font-medium truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
          </div>
        </div>
        
        {file.description && (
          <p className="text-gray-300 text-sm mb-3">{file.description}</p>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} // Prevent opening the modal
            className="text-primary hover:text-primary-400 text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View
          </a>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening the modal
              onDelete(file.id, file.url);
            }}
            className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
