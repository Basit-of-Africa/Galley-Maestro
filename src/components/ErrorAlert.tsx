import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm shadow-sm flex items-start justify-between space-x-3">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-950 mb-0.5">Processing Notice</h4>
          <p className="text-amber-800 leading-relaxed">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-amber-500 hover:text-amber-800 p-1 rounded-lg transition-colors"
          title="Dismiss error message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
