import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import JSZip from 'jszip';
import { Header } from './components/Header.js';
import { MetadataForm } from './components/MetadataForm.js';
import { PdfViewerPane } from './components/PdfViewerPane.js';
import { BatchResultPane } from './components/BatchResultPane.js';
import { MetricsDashboard, TypesettingMetrics } from './components/MetricsDashboard.js';
import { ErrorAlert } from './components/ErrorAlert.js';
import { GalleyResponse, GalleyMetadata, BulkBatchItem, BulkBatchResult } from './types.js';
import { ShieldCheck, Sparkles, Files, Layers } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<GalleyResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BulkBatchResult | null>(null);
  const [lastBatchMetadata, setLastBatchMetadata] = useState<GalleyMetadata | null>(null);

  // Lightweight state tracker for typesetting performance metrics
  const [metrics, setMetrics] = useState<TypesettingMetrics>({
    totalProcessed: 0,
    successfulCount: 0,
    failedCount: 0,
    totalTimeMs: 0,
  });

  const recordMetric = (success: boolean, durationMs: number) => {
    setMetrics((prev) => ({
      totalProcessed: prev.totalProcessed + 1,
      successfulCount: prev.successfulCount + (success ? 1 : 0),
      failedCount: prev.failedCount + (success ? 0 : 1),
      totalTimeMs: prev.totalTimeMs + durationMs,
    }));
  };

  // Single manuscript submit handler
  const handleSingleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    setBatchResult(null); // hide batch pane when running single

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate-galley', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate galley proof PDF.');
      }

      setSingleResult(data as GalleyResponse);
      recordMetric(true, Date.now() - startTime);

      // Auto-trigger direct browser file download for single proof
      try {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (dlErr) {
        console.warn('Auto-download popup blocked or deferred:', dlErr);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      recordMetric(false, Date.now() - startTime);
      setErrorMessage(err.message || 'An unexpected error occurred during typesetting.');
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk batch submission handler
  const handleBulkSubmit = async (batchQueue: BulkBatchItem[], baseMetadata: GalleyMetadata) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSingleResult(null); // hide single viewer when running batch
    setLastBatchMetadata(baseMetadata);

    const initialItems: BulkBatchItem[] = batchQueue.map((item) => ({
      ...item,
      status: 'pending',
    }));

    const currentBatch: BulkBatchResult = {
      zipFilename: `galley-proofs-batch-${new Date().toISOString().slice(0, 10)}.zip`,
      totalProcessed: initialItems.length,
      successCount: 0,
      failedCount: 0,
      items: [...initialItems],
    };

    setBatchResult({ ...currentBatch });

    // Process manuscripts sequentially
    for (let i = 0; i < currentBatch.items.length; i++) {
      currentBatch.items[i].status = 'processing';
      setBatchResult({ ...currentBatch });

      const item = currentBatch.items[i];
      const formData = new FormData();

      if (item.file) {
        formData.append('file', item.file);
      } else if (item.sampleType) {
        formData.append('useSampleType', item.sampleType);
      }

      formData.append('journalName', baseMetadata.journalName || '');
      formData.append('volume', baseMetadata.volume || '');
      formData.append('issue', baseMetadata.issue || '');
      formData.append('year', baseMetadata.year || new Date().getFullYear().toString());
      formData.append('doi', baseMetadata.doi ? `${baseMetadata.doi}-${i + 1}` : '');
      formData.append('title', baseMetadata.title || ''); // If empty, server auto-detects per manuscript!
      formData.append('authors', baseMetadata.authors || '');
      formData.append('affiliation', baseMetadata.affiliation || '');
      formData.append('abstract', baseMetadata.abstract || '');
      formData.append('keywords', baseMetadata.keywords || '');
      formData.append('addWatermark', baseMetadata.addWatermark ? 'true' : 'false');
      formData.append('twoColumn', baseMetadata.twoColumn ? 'true' : 'false');

      const startTime = Date.now();

      try {
        const response = await fetch('/api/generate-galley', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to process manuscript');
        }

        currentBatch.items[i].status = 'completed';
        currentBatch.items[i].result = data as GalleyResponse;
        currentBatch.successCount += 1;
        recordMetric(true, Date.now() - startTime);
      } catch (err: any) {
        console.error(`Error processing batch item ${item.name}:`, err);
        currentBatch.items[i].status = 'error';
        currentBatch.items[i].errorMessage = err.message || 'Processing failed';
        currentBatch.failedCount += 1;
        recordMetric(false, Date.now() - startTime);
      }

      setBatchResult({ ...currentBatch });
    }

    // Generate ZIP archive if any succeeded
    if (currentBatch.successCount > 0) {
      try {
        const zip = new JSZip();

        currentBatch.items.forEach((item) => {
          if (item.status === 'completed' && item.result?.pdfBase64) {
            const binaryStr = atob(item.result.pdfBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let k = 0; k < binaryStr.length; k++) {
              bytes[k] = binaryStr.charCodeAt(k);
            }
            const cleanName = item.name.replace(/\.[^/.]+$/, "").replace(/\s*\(Sample\)$/, "");
            const outputFilename = `${cleanName}-proof.pdf`;
            zip.file(outputFilename, bytes);
          }
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        currentBatch.zipBlob = zipBlob;
        setBatchResult({ ...currentBatch });

        // Auto-trigger browser ZIP download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = currentBatch.zipFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (zipErr) {
        console.error('Failed to create ZIP archive:', zipErr);
      }
    }

    setIsLoading(false);
  };

  // Single failed item retry handler
  const handleRetryBatchItem = async (itemId: string) => {
    if (!batchResult) return;

    const itemIndex = batchResult.items.findIndex((it) => it.id === itemId);
    if (itemIndex === -1) return;

    const targetItem = batchResult.items[itemIndex];
    if (targetItem.status === 'processing') return;

    const wasError = targetItem.status === 'error';

    // Update target item status to processing in state
    const updatedItems = [...batchResult.items];
    updatedItems[itemIndex] = {
      ...targetItem,
      status: 'processing',
      errorMessage: undefined,
    };

    const updatedBatch: BulkBatchResult = {
      ...batchResult,
      items: updatedItems,
    };

    setBatchResult({ ...updatedBatch });

    const formData = new FormData();
    if (targetItem.file) {
      formData.append('file', targetItem.file);
    } else if (targetItem.sampleType) {
      formData.append('useSampleType', targetItem.sampleType);
    }

    const meta = lastBatchMetadata || {};
    formData.append('journalName', meta.journalName || '');
    formData.append('volume', meta.volume || '');
    formData.append('issue', meta.issue || '');
    formData.append('year', meta.year || new Date().getFullYear().toString());
    formData.append('doi', meta.doi ? `${meta.doi}-${itemIndex + 1}` : '');
    formData.append('title', meta.title || '');
    formData.append('authors', meta.authors || '');
    formData.append('affiliation', meta.affiliation || '');
    formData.append('abstract', meta.abstract || '');
    formData.append('keywords', meta.keywords || '');
    formData.append('addWatermark', meta.addWatermark ? 'true' : 'false');
    formData.append('twoColumn', meta.twoColumn ? 'true' : 'false');

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate-galley', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process manuscript');
      }

      // Successful retry
      updatedItems[itemIndex] = {
        ...targetItem,
        status: 'completed',
        result: data as GalleyResponse,
        errorMessage: undefined,
      };

      updatedBatch.items = updatedItems;
      if (wasError) {
        updatedBatch.failedCount = Math.max(0, updatedBatch.failedCount - 1);
        updatedBatch.successCount += 1;
      }

      recordMetric(true, Date.now() - startTime);

      // Re-generate ZIP bundle
      if (updatedBatch.successCount > 0) {
        try {
          const zip = new JSZip();
          updatedBatch.items.forEach((item) => {
            if (item.status === 'completed' && item.result?.pdfBase64) {
              const binaryStr = atob(item.result.pdfBase64);
              const bytes = new Uint8Array(binaryStr.length);
              for (let k = 0; k < binaryStr.length; k++) {
                bytes[k] = binaryStr.charCodeAt(k);
              }
              const cleanName = item.name.replace(/\.[^/.]+$/, "").replace(/\s*\(Sample\)$/, "");
              const outputFilename = `${cleanName}-proof.pdf`;
              zip.file(outputFilename, bytes);
            }
          });

          const zipBlob = await zip.generateAsync({ type: 'blob' });
          updatedBatch.zipBlob = zipBlob;
        } catch (zipErr) {
          console.error('Failed to update ZIP archive:', zipErr);
        }
      }

      setBatchResult({ ...updatedBatch });
    } catch (err: any) {
      console.error(`Error retrying batch item ${targetItem.name}:`, err);

      updatedItems[itemIndex] = {
        ...targetItem,
        status: 'error',
        errorMessage: err.message || 'Processing failed',
      };

      updatedBatch.items = updatedItems;
      if (!wasError) {
        updatedBatch.failedCount += 1;
      }

      recordMetric(false, Date.now() - startTime);

      setBatchResult({ ...updatedBatch });
    }
  };

  const handleLoadSample = (_sampleType: 'docx' | 'pdf') => {
    setErrorMessage(null);
  };

  const handleReset = () => {
    setSingleResult(null);
    setBatchResult(null);
    setErrorMessage(null);
  };

  const handleSelectBatchItemPreview = (itemResult: GalleyResponse) => {
    setSingleResult(itemResult);
  };

  const showRightColumn = Boolean(singleResult || batchResult);

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans flex flex-col antialiased">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro banner */}
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-sm relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Automated Production-Grade Typesetting & Bulk Queue</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Publishing-House Galley Proof Engine
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Upload single or bulk manuscript batches (<span className="font-semibold text-indigo-300">.docx</span> for house-style typesetting or <span className="font-semibold text-indigo-300">.pdf</span> for mark overlays). Bulk mode queues files sequentially and generates a zipped archive of print-ready proofs.
            </p>
          </div>

          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Typesetting Performance Metrics Dashboard */}
        <MetricsDashboard
          metrics={metrics}
          onResetMetrics={() =>
            setMetrics({ totalProcessed: 0, successfulCount: 0, failedCount: 0, totalTimeMs: 0 })
          }
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        )}

        {/* Main Content Area: Form & Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <motion.div
            layout
            className={showRightColumn ? 'lg:col-span-5' : 'lg:col-span-12 max-w-3xl mx-auto w-full'}
          >
            <MetadataForm
              onSubmitSingle={handleSingleSubmit}
              onSubmitBulk={handleBulkSubmit}
              isLoading={isLoading}
              onLoadSample={handleLoadSample}
              errorMessage={errorMessage || undefined}
              onErrorDismiss={() => setErrorMessage(null)}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            {batchResult && (
              <motion.div
                key="batch-result-pane"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={singleResult ? 'lg:col-span-7 space-y-4' : 'lg:col-span-7 sticky top-20'}
              >
                <BatchResultPane
                  batchResult={batchResult}
                  onClearBatch={handleReset}
                  onSelectPreview={handleSelectBatchItemPreview}
                  onRetryItem={handleRetryBatchItem}
                />

                {singleResult && (
                  <div className="mt-4 pt-4 border-t border-slate-300">
                    <PdfViewerPane
                      result={singleResult}
                      onReset={() => setSingleResult(null)}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {!batchResult && singleResult && (
              <motion.div
                key="single-preview-pane"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-7 sticky top-20"
              >
                <PdfViewerPane result={singleResult} onReset={handleReset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Galley Engine © {new Date().getFullYear()} Editorial Production Toolkit</span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Single & Bulk processing • Manuscripts are processed in memory and never retained</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

