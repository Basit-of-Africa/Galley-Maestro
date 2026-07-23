import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  RotateCcw,
  FileCheck,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';
import { GalleyResponse } from '../types.js';

interface PdfViewerPaneProps {
  result: GalleyResponse;
  onReset: () => void;
}

export const PdfViewerPane: React.FC<PdfViewerPaneProps> = ({ result, onReset }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Convert base64 PDF to blob URL for iframe viewing
  const pdfDataUrl = `data:application/pdf;base64,${result.pdfBase64}`;

  const handleDownload = () => {
    try {
      const byteCharacters = atob(result.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleOpenNewTab = () => {
    const byteCharacters = atob(result.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const fileUrl = URL.createObjectURL(blob);
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="bg-slate-800 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl text-slate-100 flex flex-col h-full min-h-[640px]">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3 truncate">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            {result.fileType === 'docx' ? (
              <FileCheck className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div className="truncate">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-xs text-white truncate">
                {result.filename}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                {result.fileType === 'docx' ? 'Typeset Proof' : 'PDF Mark Overlay'}
              </span>
            </div>
            {result.detectedTitle && (
              <p className="text-[11px] text-slate-400 truncate max-w-md">
                Title: "{result.detectedTitle}"
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownload}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-semibold transition-all shadow-sm ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenNewTab}
            className="p-2 rounded text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center space-x-1 px-2.5 py-2 rounded text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors border border-slate-700/80"
            title="Process another manuscript"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Form</span>
          </button>
        </div>
      </div>

      {/* PDF Iframe Container */}
      <div className="relative flex-1 bg-slate-900/90 min-h-[520px]">
        <iframe
          src={`${pdfDataUrl}#toolbar=1&navpanes=0&view=FitH`}
          className="w-full h-full min-h-[520px] border-0"
          title="Galley Proof PDF Live Preview"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-900 px-5 py-2.5 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Print-Ready Galley Proof Generated Successfully</span>
        </span>
        <span>
          {result.pageCount ? `${result.pageCount} Pages` : 'Letter Size • 2.4cm Margins'}
        </span>
      </div>
    </div>
  );
};
