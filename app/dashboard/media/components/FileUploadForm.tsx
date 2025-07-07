import React from 'react';

interface FileUploadFormProps {
  uploading: boolean;
  uploadProgress: number;
  description: string;
  setDescription: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
}

export const FileUploadForm = ({ 
  uploading, 
  uploadProgress, 
  description, 
  setDescription, 
  fileInputRef, 
  setSelectedFile
}: FileUploadFormProps) => {
  return (
    <div className="bg-slate-900 border border-primary rounded-xl p-6 shadow-md mb-8">
      <h2 className="text-xl font-semibold text-white mb-4 pb-3 border-b border-gray-800">Upload New Media</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-white mb-1">
            Select File
          </label>
          <input
            type="file"
            id="file"
            ref={fileInputRef}
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                setSelectedFile(e.target.files[0]);
              } else {
                setSelectedFile(null);
              }
            }}
            disabled={uploading}
            className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-600"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            className="w-full bg-slate-900 border border-primary rounded-lg px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Describe this media file..."
          />
        </div>
        
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-slate-900 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
        
        {/* Upload button moved to parent component */}
      </div>
    </div>
  );
};
