import React, { useState } from 'react';
import {
  FolderArchive,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BulkBatchResult, BulkBatchItem, GalleyResponse } from '../types.js';

interface BatchResultPaneProps {
  batchResult: BulkBatchResult;
  isProcessing?: boolean;
  onReset?: () => void;
  onClearBatch?: () => void;
  onDownloadZip?: () => void;
  onPreviewSinglePdf?: (item: BulkBatchItem) => void;
  onSelectPreview?: (itemResult: GalleyResponse) => void;
  onRetryItem?: (itemId: string) => void;
}

export const BatchResultPane: React.FC<BatchResultPaneProps> = ({
  batchResult,
  isProcessing: isProcessingProp,
  onReset,
  onClearBatch,
  onDownloadZip,
  onPreviewSinglePdf,
  onSelectPreview,
  onRetryItem,
}) => {
  const [downloadedZip, setDownloadedZip] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const isProcessingActive =
    isProcessingProp ?? batchResult.items.some((item) => item.status === 'processing');

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleZipClick = () => {
    if (onDownloadZip) {
      onDownloadZip();
    } else if (batchResult.zipBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(batchResult.zipBlob);
      link.download = batchResult.zipFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setDownloadedZip(true);
    setTimeout(() => setDownloadedZip(false), 3000);
  };

  const handleResetClick = () => {
    if (onReset) onReset();
    else if (onClearBatch) onClearBatch();
  };

  const handlePreviewClick = (item: BulkBatchItem) => {
    if (onPreviewSinglePdf) onPreviewSinglePdf(item);
    else if (onSelectPreview && item.result) onSelectPreview(item.result);
  };

  const progressPercent = Math.round(
    ((batchResult.successCount + batchResult.failedCount) / (batchResult.totalProcessed || 1)) * 100
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100 flex flex-col h-full min-h-[580px]">
      {/* Top Header Controls Bar */}
      <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">
                Bulk Batch Production Queue
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {isProcessingActive ? 'Processing Queue' : 'Batch Complete'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {batchResult.successCount} of {batchResult.totalProcessed} proofs generated
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!isProcessingActive && batchResult.zipBlob && (
            <button
              onClick={handleZipClick}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-semibold transition-all shadow-sm ${
                downloadedZip
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {downloadedZip ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ZIP Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .ZIP Bundle</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleResetClick}
            disabled={isProcessingActive}
            className="inline-flex items-center space-x-1 px-2.5 py-2 rounded text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors border border-slate-700/80 disabled:opacity-50"
            title="Start new batch"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Batch</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Header */}
      <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
          <span className="text-slate-300">
            {isProcessingActive ? 'Typesetting Queue Progress...' : 'Batch Output Ready'}
          </span>
          <span className="text-indigo-400 font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isProcessingActive
                ? 'bg-gradient-to-r from-indigo-500 to-sky-400 animate-pulse'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Batch Summary & Items List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Status Metrics Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-base font-bold text-white">{batchResult.totalProcessed}</span>
          </div>
          <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-800/40 text-center">
            <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Success</span>
            <span className="text-base font-bold text-emerald-300">{batchResult.successCount}</span>
          </div>
          <div className="p-3 bg-rose-950/30 rounded-lg border border-rose-800/40 text-center">
            <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider">Failed</span>
            <span className="text-base font-bold text-rose-300">{batchResult.failedCount}</span>
          </div>
        </div>

        {/* Item Queue List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Manuscripts Status Log
          </h4>

          {batchResult.items.map((item, index) => {
            const isDone = item.status === 'completed';
            const isError = item.status === 'error';
            const isCurrent = item.status === 'processing';

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-3 transition-all ${
                  isCurrent
                    ? 'border-indigo-500/80 bg-indigo-950/30 ring-1 ring-indigo-500/20'
                    : isDone
                    ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                    : isError
                    ? 'border-rose-900/60 bg-rose-950/20'
                    : 'border-slate-800/60 bg-slate-950/20 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="shrink-0">
                      {isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isError ? (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 text-[9px] font-bold text-slate-500 flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {item.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300 shrink-0">
                          {item.fileType}
                        </span>
                      </div>
                      {item.result?.detectedTitle && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Detected Title: "{item.result.detectedTitle}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isDone && item.result && (
                      <button
                        type="button"
                        onClick={() => handlePreviewClick(item)}
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-colors"
                        title="Preview single proof"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Preview PDF</span>
                      </button>
                    )}

                    {isError && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRetryItem) onRetryItem(item.id);
                          }}
                          disabled={isCurrent}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-500/60 transition-colors disabled:opacity-50 shadow-2xs"
                          title="Re-submit this failed manuscript"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded"
                          title={expandedItems[item.id] ? "Hide error details" : "Show error details"}
                        >
                          {expandedItems[item.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isError && (expandedItems[item.id] || true) && (
                  <div className="mt-2.5 pt-2 border-t border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="text-rose-300 font-mono bg-rose-950/60 p-2 rounded border border-rose-900/50 flex-1 truncate">
                      {item.errorMessage || 'Processing failed'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onRetryItem) onRetryItem(item.id);
                      }}
                      disabled={isCurrent}
                      className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded text-[11px] font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Manuscript</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info bar */}
      <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-400">
          ZIP file contains all successfully typeset galley proof PDFs.
        </span>
        <span className="text-[11px] text-indigo-400 font-semibold">
          {batchResult.zipFilename}
        </span>
      </div>
    </div>
  );
};

