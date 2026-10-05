import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 select-none">
      <div className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-800 flex items-center gap-2.5 text-xs font-semibold">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
};
