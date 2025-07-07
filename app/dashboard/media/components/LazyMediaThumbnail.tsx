import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MediaFile } from './types';

interface LazyMediaThumbnailProps {
  file: MediaFile;
}

export const LazyMediaThumbnail = ({ file }: LazyMediaThumbnailProps) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    const img = new window.Image();
    img.src = file.url;
    img.onload = () => setLoaded(true);
  }, [file.url]);
  
  return (
    <div className="relative aspect-video bg-slate-700 overflow-hidden">
      {loaded ? (
        <Image
          src={file.url}
          alt={file.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse flex space-x-2">
            <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
            <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};
