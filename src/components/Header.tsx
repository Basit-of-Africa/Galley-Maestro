import React from 'react';
import { BookOpen, FileCheck, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm ring-1 ring-indigo-500/30">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="flex items-baseline space-x-2">
          <h1 className="font-bold text-xl tracking-tight text-slate-800 font-sans">
            Galley<span className="text-indigo-600">Engine</span>
          </h1>
          <span className="hidden sm:inline-block text-xs font-medium text-slate-400">
            Editorial Portal
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
        <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
          v2.4.1 Stable
        </span>
        <div className="hidden sm:block w-px h-4 bg-slate-200" />
        <div className="hidden sm:flex items-center space-x-2 text-slate-600">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>DOCX Typesetting</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>PDF Mark Overlay</span>
          </span>
        </div>
      </div>
    </header>
  );
};

