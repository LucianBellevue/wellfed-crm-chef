import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { MediaFile } from './types';

interface MediaPreviewModalProps {
  file: MediaFile | null;
  onClose: () => void;
  onDelete: (fileId: string, fileUrl: string) => Promise<void>;
  onReplace: (fileId: string, newFile: File) => Promise<void>;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ 
  file, 
  onClose, 
  onDelete,
  onReplace
}) => {
  const [isReplacing, setIsReplacing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!file) return null;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      await onDelete(file.id, file.url);
      onClose();
    }
  };

  const handleReplaceClick = () => {
    setIsReplacing(true);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleReplaceSubmit = async () => {
    if (!selectedFile || !file) return;
    
    setIsUploading(true);
    try {
      await onReplace(file.id, selectedFile);
      onClose();
    } catch (error) {
      console.error('Error replacing file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative max-h-[70vh] max-w-full">
          <Image 
            src={file.url} 
            alt={file.name} 
            width={800}
            height={600}
            className="object-contain rounded-lg"
            style={{ maxHeight: '70vh' }}
          />
        </div>
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <video 
          src={file.url} 
          controls 
          className="max-h-[70vh] max-w-full rounded-lg"
        />
      );
    } else if (file.type.startsWith('audio/')) {
      return (
        <div className="p-8 bg-slate-800 rounded-lg">
          <audio src={file.url} controls className="w-full" />
          <div className="mt-4 text-center">
            <p className="text-lg font-medium text-white">{file.name}</p>
          </div>
        </div>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="flex flex-col items-center">
          <iframe 
            src={file.url} 
            className="w-full h-[70vh] rounded-lg"
            title={file.name}
          />
        </div>
      );
    } else {
      return (
        <div className="p-8 bg-slate-800 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-white">{file.name}</p>
          <a 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 inline-block bg-primary hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Download File
          </a>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white truncate">{file.name}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {renderPreview()}
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">
                {new Date(file.createdAt).toLocaleDateString()} • {file.type} • {file.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown size'}
              </p>
              {file.description && (
                <p className="text-white mt-1">{file.description}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              {isReplacing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => setIsReplacing(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReplaceSubmit}
                    disabled={!selectedFile || isUploading}
                    className="bg-primary hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Replacement'}
                  </button>
                  {selectedFile && (
                    <span className="text-sm text-gray-300 truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleReplaceClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
