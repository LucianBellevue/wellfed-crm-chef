import React from 'react';

type AlertType = 'error' | 'success';

interface AlertMessageProps {
  type: AlertType;
  message: string;
}

export const AlertMessage = ({ type, message }: AlertMessageProps) => {
  if (!message) return null;
  
  const isError = type === 'error';
  
  return (
    <div className={`mb-6 p-4 ${isError ? 'bg-red-900/30 border-red-500/50' : 'bg-green-900/30 border-green-500/50'} border rounded-lg`}>
      <div className="flex items-center">
        {isError ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <p className={`${isError ? 'text-red-300' : 'text-green-300'}`}>{message}</p>
      </div>
    </div>
  );
};
