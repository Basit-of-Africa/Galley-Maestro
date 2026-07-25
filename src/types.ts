export interface GalleyMetadata {
  journalName?: string;
  subTitle?: string;
  publisherName?: string;
  runningHeader?: string;
  pageRange?: string;
  volume?: string;
  issue?: string;
  year?: string;
  doi?: string;
  title?: string;
  authors?: string;
  affiliation?: string;
  abstract?: string;
  keywords?: string;
  orcid?: string;
  correspondingAuthor?: string;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  receivedDate?: string;
  revisedDate?: string;
  acceptedDate?: string;
  licenseType?: string;
  licenseText?: string;
  showArticleInfo?: boolean;
  layoutTemplate?: 'fountain' | 'standard' | 'modern' | 'ieee';
  fontFamily?: string;
  addWatermark?: boolean;
  twoColumn?: boolean;
}

export interface SavedTemplate {
  id: string;
  name: string;
  updatedAt: string;
  isDefault?: boolean;
  metadata: GalleyMetadata;
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

