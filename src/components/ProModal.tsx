import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, onToast }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-purple-200 to-rose-200 rounded-full blur-3xl opacity-50 -z-10" />

        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold mb-3 border border-rose-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PaletteLab Pro</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Supercharge Your Color Workflow
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Unlimited palette generations, PDF brand spec exports, and teamwork collections.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            'Unlimited palette generations',
            'Full PDF, SVG, CSS, and Tailwind token exports',
            'Advanced color-blindness simulation and contrast auditing',
            'Custom image color extraction with zero compression limits',
            'Team collaboration workspaces & project folders',
            'Commercial usage rights for client deliverables',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 font-bold" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500">Pro Membership</div>
            <div className="text-xl font-black text-gray-900">
              $8 <span className="text-xs font-normal text-gray-500">/ month</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            7-Day Free Trial
          </span>
        </div>

        <button
          onClick={() => {
            onToast('Thank you for trying PaletteLab Pro! Free trial activated.');
            onClose();
          }}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
        >
          Start 7-Day Free Trial
        </button>

        <p className="text-center text-[10px] text-gray-400 mt-3">
          Cancel anytime with 1 click. No questions asked.
        </p>
      </div>
    </div>
  );
};
