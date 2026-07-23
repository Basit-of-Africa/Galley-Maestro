import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Info,
  Sliders,
  ShieldCheck,
  Files,
  FileStack,
  Trash2,
  Plus,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { GalleyMetadata, BulkBatchItem } from '../types.js';

interface MetadataFormProps {
  onSubmitSingle: (formData: FormData) => void;
  onSubmitBulk: (batchItems: BulkBatchItem[], baseMetadata: GalleyMetadata) => void;
  isLoading: boolean;
  onLoadSample: (sampleType: 'docx' | 'pdf') => void;
  errorMessage?: string;
  onErrorDismiss?: () => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({
  onSubmitSingle,
  onSubmitBulk,
  isLoading,
  onLoadSample,
  errorMessage,
  onErrorDismiss,
}) => {
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);

  // Single mode file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeSampleType, setActiveSampleType] = useState<'docx' | 'pdf' | null>(null);

  // Bulk mode file queue state
  const [batchItems, setBatchItems] = useState<BulkBatchItem[]>([]);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form Fields State
  const [journalName, setJournalName] = useState('Journal of Advanced Scholarly Research');
  const [volume, setVolume] = useState('14');
  const [issue, setIssue] = useState('2');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [doi, setDoi] = useState('10.1080/01234567.2026.890123');
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [addWatermark, setAddWatermark] = useState(true);
  const [twoColumn, setTwoColumn] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetSingleFile = (file: File) => {
    setValidationError(null);
    if (onErrorDismiss) onErrorDismiss();

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'pdf') {
      setValidationError('Unsupported file format. Please select a .docx or .pdf manuscript file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setValidationError('File exceeds 25 MB size limit. Please choose a smaller manuscript.');
      return;
    }

    setSelectedFile(file);
    setActiveSampleType(null);
  };

  const addFilesToBatch = (files: FileList | File[]) => {
    setValidationError(null);
    if (onErrorDismiss) onErrorDismiss();

    const newItems: BulkBatchItem[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'docx' && ext !== 'pdf') {
        invalidFiles.push(file.name);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (>25MB)`);
        return;
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        fileType: ext === 'docx' ? 'docx' : 'pdf',
        status: 'pending',
      });
    });

    if (invalidFiles.length > 0) {
      setValidationError(`Skipped invalid or oversized files: ${invalidFiles.join(', ')}`);
    }

    if (newItems.length > 0) {
      setBatchItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isBulkMode) {
        addFilesToBatch(e.dataTransfer.files);
      } else {
        validateAndSetSingleFile(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isBulkMode) {
        addFilesToBatch(e.target.files);
      } else {
        validateAndSetSingleFile(e.target.files[0]);
      }
    }
  };

  const handleSelectSample = (sampleType: 'docx' | 'pdf') => {
    setSelectedFile(null);
    setActiveSampleType(sampleType);
    setValidationError(null);
    if (onErrorDismiss) onErrorDismiss();

    // Auto-fill metadata
    if (sampleType === 'docx') {
      setJournalName('Journal of Quantum Bio-Physics');
      setVolume('28');
      setIssue('4');
      setYear('2026');
      setDoi('10.1016/j.jqb.2026.04.102');
      setTitle('');
      setAuthors('Dr. Elena Rostova & Dr. Mikhail Vance');
      setAffiliation('Department of Applied Physics, Bio-Quantum Laboratory, Zurich');
      setAbstract('Light-harvesting complexes demonstrate remarkable energy transfer efficiency exceeding 95%.');
      setKeywords('Quantum Coherence, Exciton Transfer');
    } else {
      setJournalName('IEEE Transactions on Neural Computing');
      setVolume('42');
      setIssue('1');
      setYear('2026');
      setDoi('10.1109/TNC.2026.3104928');
      setTitle('Neural Signal Decoding via Deep Transformer Architectures');
      setAuthors('Prof. Marcus Vance & Dr. Sarah Jenkins');
      setAffiliation('Center for Neuro-Engineering, MIT');
    }

    onLoadSample(sampleType);
  };

  const handleLoadSampleBatch = () => {
    setValidationError(null);
    if (onErrorDismiss) onErrorDismiss();

    const sampleQueue: BulkBatchItem[] = [
      {
        id: Math.random().toString(36).substring(2, 9),
        sampleType: 'docx',
        name: 'quantum-exciton-transfer-study.docx (Sample)',
        size: 1420000,
        fileType: 'docx',
        status: 'pending',
      },
      {
        id: Math.random().toString(36).substring(2, 9),
        sampleType: 'pdf',
        name: 'neural-signal-decoding-paper.pdf (Sample)',
        size: 2150000,
        fileType: 'pdf',
        status: 'pending',
      },
      {
        id: Math.random().toString(36).substring(2, 9),
        sampleType: 'docx',
        name: 'crispr-gene-editing-analysis.docx (Sample)',
        size: 1890000,
        fileType: 'docx',
        status: 'pending',
      },
    ];

    setBatchItems(sampleQueue);
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearBatch = () => {
    setBatchItems([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearSingleFile = () => {
    setSelectedFile(null);
    setActiveSampleType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseMetadata: GalleyMetadata = {
      journalName,
      volume,
      issue,
      year: year || new Date().getFullYear().toString(),
      doi,
      title,
      authors,
      affiliation,
      abstract,
      keywords,
      addWatermark,
      twoColumn,
    };

    if (isBulkMode) {
      if (batchItems.length === 0) {
        setValidationError('Please add at least one manuscript file to the batch queue.');
        return;
      }
      onSubmitBulk(batchItems, baseMetadata);
    } else {
      if (!selectedFile && !activeSampleType) {
        setValidationError('Please upload a manuscript file (.docx or .pdf) or select a sample manuscript.');
        return;
      }

      const formData = new FormData();

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (activeSampleType) {
        formData.append('useSampleType', activeSampleType);
      }

      formData.append('journalName', journalName);
      formData.append('volume', volume);
      formData.append('issue', issue);
      formData.append('year', baseMetadata.year || '');
      formData.append('doi', doi);
      formData.append('title', title);
      formData.append('authors', authors);
      formData.append('affiliation', affiliation);
      formData.append('abstract', abstract);
      formData.append('keywords', keywords);
      formData.append('addWatermark', addWatermark ? 'true' : 'false');
      formData.append('twoColumn', twoColumn ? 'true' : 'false');

      onSubmitSingle(formData);
    }
  };

  const isDocx = selectedFile
    ? selectedFile.name.endsWith('.docx')
    : activeSampleType === 'docx';

  const isPdf = selectedFile
    ? selectedFile.name.endsWith('.pdf')
    : activeSampleType === 'pdf';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode Switcher Toggle Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setIsBulkMode(false);
              setValidationError(null);
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              !isBulkMode
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Single Manuscript</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBulkMode(true);
              setValidationError(null);
            }}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              isBulkMode
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileStack className="w-3.5 h-3.5" />
            <span>Bulk Batch Mode</span>
            <span className={`ml-1 px-1.5 py-0.2 text-[9px] rounded-full uppercase font-bold ${
              isBulkMode ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'
            }`}>
              ZIP Output
            </span>
          </button>
        </div>

        <span className="hidden md:inline-block text-[11px] font-medium text-slate-400 pr-2">
          {isBulkMode ? 'Batch process & zip multiple proofs' : 'Single manuscript proofing'}
        </span>
      </div>

      {/* File Upload / Dropzone Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            1. {isBulkMode ? 'Bulk Manuscripts Queue' : 'Manuscript Upload'}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Max 25 MB per file (.docx, .pdf)
          </span>
        </div>

        {/* SINGLE MODE DROPZONE */}
        {!isBulkMode && (
          <>
            {!selectedFile && !activeSampleType ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/80'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".docx,.pdf"
                  className="hidden"
                />
                <div className="text-indigo-600 mb-2">
                  <UploadCloud className="w-7 h-7 mx-auto" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Drop .docx or .pdf manuscript file here, or click to browse
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports <span className="font-semibold text-slate-600">Microsoft Word (.docx)</span> for typesetting or <span className="font-semibold text-slate-600">PDF (.pdf)</span> for mark overlays.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[11px] text-slate-400 font-medium mr-1">
                    Try a pre-loaded sample:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('docx')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Sample .DOCX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('pdf')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>Sample .PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-indigo-200 bg-indigo-50/40 rounded-lg p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-white rounded border border-indigo-200 text-indigo-600 shadow-2xs shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {selectedFile ? selectedFile.name : activeSampleType === 'docx' ? 'sample-manuscript.docx (Sample)' : 'sample-manuscript.pdf (Sample)'}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                        isDocx ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {isDocx ? 'DOCX Typeset' : 'PDF Overlay'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {selectedFile
                        ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready`
                        : 'Pre-loaded sample manuscript'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSingleFile}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all shrink-0 ml-2"
                  title="Change selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* BULK MODE DROPZONE & QUEUE */}
        {isBulkMode && (
          <div className="space-y-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                  : 'border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-50/80'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".docx,.pdf"
                multiple
                className="hidden"
              />
              <div className="text-indigo-600 mb-1.5">
                <Files className="w-7 h-7 mx-auto" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                Select or drag multiple .docx & .pdf manuscripts simultaneously
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Batch queue sequentially typesets each manuscript and zips the resulting proofs.
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Load Sample Batch (3 Manuscripts)</span>
                </button>
              </div>
            </div>

            {/* Queued Items List */}
            {batchItems.length > 0 && (
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                  <span className="flex items-center space-x-1.5">
                    <FolderArchive className="w-4 h-4 text-indigo-600" />
                    <span>Queued Manuscripts ({batchItems.length})</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add More</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearBatch}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                    >
                      Clear Queue
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded p-2 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <span className="w-4 text-center font-bold text-[10px] text-slate-400 shrink-0">
                          {idx + 1}.
                        </span>
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate text-xs">
                          {item.name}
                        </span>
                        <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {item.fileType}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-400">
                          {(item.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBatchItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(validationError || errorMessage) && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-between">
            <span>{validationError || errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                if (onErrorDismiss) onErrorDismiss();
              }}
              className="text-rose-500 hover:text-rose-800 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Journal Metadata Fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          2. {isBulkMode ? 'Batch Default Metadata Settings' : 'Metadata Settings'}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-medium text-slate-500 mb-1 block">
              Journal Name
            </label>
            <input
              type="text"
              value={journalName}
              onChange={(e) => setJournalName(e.target.value)}
              placeholder="e.g. Journal of Academic Research"
              className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-500 mb-1 block">
              Volume
            </label>
            <input
              type="text"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="e.g. 14"
              className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-500 mb-1 block">
              Issue & Year
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="No."
                className="w-full text-sm border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
              />
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={new Date().getFullYear().toString()}
                className="w-full text-sm border border-slate-200 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-slate-500 mb-1 block">
              Article DOI
            </label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g. 10.1016/j.cell.2026.04.012"
              className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-medium text-slate-500 block">
                {isBulkMode ? 'Article Title (Default)' : 'Article Title'}
              </label>
              {!title && (
                <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5">
                  <Info className="w-3 h-3" /> Auto-detect
                </span>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isBulkMode ? "Blank = Auto-detect from each manuscript" : "Article Title"}
              className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
            />
          </div>
        </div>

        {/* DOCX specific fields */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-slate-500 mb-1 block">
                Author(s) <span className="text-slate-400 font-normal">(DOCX)</span>
              </label>
              <input
                type="text"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                placeholder="e.g. Jane Doe, PhD"
                className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 mb-1 block">
                Affiliation(s) <span className="text-slate-400 font-normal">(DOCX)</span>
              </label>
              <input
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="e.g. Oxford Institute of Ethics"
                className="w-full text-sm border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pt-0.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvanced ? 'Hide Abstract & Keywords' : 'Add Abstract & Keywords'}</span>
          </button>

          {showAdvanced && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-1 block">
                  Abstract Text
                </label>
                <textarea
                  rows={2}
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Enter manuscript abstract..."
                  className="w-full text-xs border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white resize-y"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-500 mb-1 block">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. Ethics, Digital Workflows, Typesetting"
                  className="w-full text-xs border border-slate-200 rounded px-3 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formatting & Galley Marks Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          3. Galley Marks & Layout Options
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              id="wm"
              checked={addWatermark}
              onChange={(e) => setAddWatermark(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Add 'Galley Proof' Watermark
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                Top banner for DOCX, 45° diagonal watermark for PDF.
              </span>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={twoColumn}
              onChange={(e) => setTwoColumn(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-800 block">
                  Two-Column Layout
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                  DOCX
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                Typesets body text in dual columns.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 active:transform active:scale-[0.98] text-white font-bold py-3.5 px-5 rounded-lg shadow-sm transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>
              {isBulkMode ? 'Processing Manuscript Batch...' : 'Generating Galley Proof...'}
            </span>
          </>
        ) : isBulkMode ? (
          <>
            <FolderArchive className="w-4 h-4" />
            <span>
              Typeset & Zip {batchItems.length > 0 ? `${batchItems.length} Manuscripts` : 'Batch Queue'}
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Generate Galley Proof PDF</span>
          </>
        )}
      </button>
    </form>
  );
};

