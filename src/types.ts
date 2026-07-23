export interface GalleyMetadata {
  journalName?: string;
  volume?: string;
  issue?: string;
  year?: string;
  doi?: string;
  title?: string;
  authors?: string;
  affiliation?: string;
  abstract?: string;
  keywords?: string;
  addWatermark?: boolean;
  twoColumn?: boolean;
}

export interface GalleyResponse {
  pdfBase64: string;
  filename: string;
  fileType: 'docx' | 'pdf';
  detectedTitle?: string;
  pageCount?: number;
}

export interface SampleFileInfo {
  name: string;
  type: 'docx' | 'pdf';
  description: string;
  metadata: Partial<GalleyMetadata>;
}

export interface BulkBatchItem {
  id: string;
  file?: File;
  sampleType?: 'docx' | 'pdf';
  name: string;
  size: number;
  fileType: 'docx' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  result?: GalleyResponse;
}

export interface BulkBatchResult {
  zipFilename: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  items: BulkBatchItem[];
  zipBlob?: Blob;
}

