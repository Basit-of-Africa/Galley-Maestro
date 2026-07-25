import React, { useState, useEffect } from 'react';
import {
  GalleyMetadata,
  SavedTemplate,
} from '../types.js';
import {
  Image as ImageIcon,
  Check,
  Type,
  Layout,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ChevronRight,
  Upload,
  Globe,
  FileText,
  UserCheck,
  Award,
  FileCheck,
  Save,
  Download,
  FolderOpen,
  BookmarkCheck,
  CheckCircle2,
  Copy,
} from 'lucide-react';

export const DEFAULT_FOUNTAIN_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <clipPath id="logoClip">
      <circle cx="100" cy="100" r="95" />
    </clipPath>
    <path id="textArc" d="M 28 122 A 74 74 0 1 1 172 122" fill="none" />
  </defs>
  <circle cx="100" cy="100" r="97" fill="%23ffffff" stroke="%23111111" stroke-width="2.5" />
  <g clip-path="url(%23logoClip)">
    <rect x="0" y="38" width="200" height="15" fill="%23EBDCD0" opacity="0.85" />
    <rect x="0" y="68" width="200" height="15" fill="%23EBDCD0" opacity="0.85" />
    <rect x="0" y="98" width="200" height="15" fill="%23EBDCD0" opacity="0.85" />
    <rect x="0" y="128" width="200" height="15" fill="%23EBDCD0" opacity="0.85" />
    <rect x="0" y="158" width="200" height="15" fill="%23EBDCD0" opacity="0.85" />
    <g transform="translate(100, 102)">
      <path d="M 0 -36 L 6 -11 L 11 -6 L 36 0 L 11 6 L 6 11 L 0 36 L -6 11 L -11 6 L -36 0 L -11 -6 L -6 -11 Z" fill="%23568B2B" />
      <path d="M 0 -36 L 6 -11 L 11 -6 L 36 0 L 11 6 L 6 11 L 0 36 L -6 11 L -11 6 L -36 0 L -11 -6 L -6 -11 Z" fill="%23568B2B" transform="rotate(45)" />
      <circle cx="0" cy="0" r="7" fill="%23568B2B" />
    </g>
    <text font-family="'Century Gothic', sans-serif" font-weight="bold" font-size="11.5" fill="%23000000">
      <textPath href="%23textArc" startOffset="50%" text-anchor="middle">Fountain Journal of Natural and Applied Sciences</textPath>
    </text>
  </g>
</svg>`;

export const DEFAULT_FOUNTAIN_CREST_URL = '/assets/fountain_university_crest.jpg';

interface VisualFrontPageEditorProps {
  metadata: GalleyMetadata;
  onChangeMetadata: (updated: GalleyMetadata) => void;
  onApplyAndGenerate?: () => void;
  isLoading?: boolean;
}

const DEFAULT_PRESETS: SavedTemplate[] = [
  {
    id: 'fountain-default',
    name: 'Fountain Journal House Style',
    updatedAt: '2026-07-24',
    isDefault: true,
    metadata: {
      journalName: 'FOUNTAIN JOURNAL OF NATURAL & APPLIED SCIENCES',
      subTitle: 'A Publication of the College of Natural & Applied Sciences',
      publisherName: 'Fountain University, Osogbo, Nigeria',
      leftLogoUrl: DEFAULT_FOUNTAIN_LOGO_SVG,
      rightLogoUrl: DEFAULT_FOUNTAIN_CREST_URL,
      runningHeader: 'Fountain Journal of Natural and Applied Sciences 2026; 15(01): 44-53',
      pageRange: '44-53',
      year: '2026',
      volume: '15',
      issue: '01',
      doi: 'https://doi.org/10.53704/fujnas.v15i1.1060',
      title:
        'Experimental study of improving Nigerian heavy crude oil (Agbabu bitumen) viscosity reduction by dilution with n-heptane, phenol, toluene, xylene, and naphtha',
      authors: 'Falade, A. 1,2; Akinsete, O. O. 2; Aliu, H. O. 2; Mobolaji, O. 2; Oni, T. 1',
      affiliation:
        '1Department of Mineral & Petroleum Resources Engineering, School of Engineering, Federal Polytechnic, Ado Ekiti.\n2Department of Petroleum Engineering, University of Ibadan, Ibadan',
      correspondingAuthor: 'ademola201052@yahoo.com',
      orcid: '0000-0002-1825-0097, 0000-0001-8291-3012',
      abstract:
        'This experimental study examines the viscosity reduction of Nigerian heavy crude oil, specifically Agbabu bitumen, through dilution with selected solvents, including naphtha, n-heptane, phenol, toluene, and xylene. The influence of pressure variation on the solubility-driven reduction of viscosity was investigated.',
      keywords: 'Viscosity, Heavy oil, Solvent, Dynamic, Kinematic',
      receivedDate: 'September 2025',
      revisedDate: 'January 2026',
      acceptedDate: 'February 2026',
      licenseType: 'CC BY 4.0',
      licenseText: 'This work is licensed under the Creative Commons Attribution 4.0 International License',
      showArticleInfo: true,
      twoColumn: true,
      layoutTemplate: 'fountain',
      fontFamily: 'Georgia',
      addWatermark: false,
    },
  },
  {
    id: 'classic-academic',
    name: 'Classic Academic Journal',
    updatedAt: '2026-07-24',
    metadata: {
      journalName: 'JOURNAL OF ACADEMIC RESEARCH & TECHNOLOGY',
      subTitle: 'An International Refereed Publication',
      publisherName: 'Academic Press International',
      runningHeader: 'Journal of Academic Research 2026; 12(2): 101-115',
      layoutTemplate: 'standard',
      showArticleInfo: true,
      twoColumn: false,
      fontFamily: 'Times New Roman',
    },
  },
  {
    id: 'ieee-template',
    name: 'IEEE Transactions Format',
    updatedAt: '2026-07-24',
    metadata: {
      journalName: 'IEEE TRANSACTIONS ON APPLIED SCIENCES',
      subTitle: 'IEEE Publication Society',
      runningHeader: 'IEEE Transactions 2026; Vol. 34, No. 1',
      layoutTemplate: 'ieee',
      showArticleInfo: false,
      twoColumn: true,
      fontFamily: 'Arial',
    },
  },
];

export const VisualFrontPageEditor: React.FC<VisualFrontPageEditorProps> = ({
  metadata,
  onChangeMetadata,
  onApplyAndGenerate,
  isLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'canvas' | 'header' | 'authors' | 'articleInfo' | 'style'>('canvas');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Template Saving & Management state
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(DEFAULT_PRESETS);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('fountain-default');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [isSavedForEngine, setIsSavedForEngine] = useState(false);

  // Load user saved templates from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('galley_saved_templates');
      if (stored) {
        const parsed: SavedTemplate[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge defaults with user saved templates
          const userTemplates = parsed.filter((p) => !DEFAULT_PRESETS.some((dp) => dp.id === p.id));
          setSavedTemplates([...DEFAULT_PRESETS, ...userTemplates]);
        }
      }

      const activeHouseStyle = localStorage.getItem('galley_active_house_template');
      if (activeHouseStyle) {
        setIsSavedForEngine(true);
      }
    } catch (e) {
      console.error('Failed to load saved templates from localStorage:', e);
    }
  }, []);

  // Helper to safely write to localStorage without QuotaExceededError
  const safeSetLocalStorage = (key: string, data: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (err: any) {
      console.warn(`localStorage quota exceeded for "${key}". Optimizing payload...`, err);
      try {
        if (Array.isArray(data)) {
          // Strip heavy image strings from items to save space
          const cleanedList = data.slice(0, 10).map((item) => {
            if (item && item.metadata) {
              const meta = { ...item.metadata };
              if (meta.leftLogoUrl && meta.leftLogoUrl.length > 30000) delete meta.leftLogoUrl;
              if (meta.rightLogoUrl && meta.rightLogoUrl.length > 30000) delete meta.rightLogoUrl;
              return { ...item, metadata: meta };
            }
            return item;
          });
          localStorage.setItem(key, JSON.stringify(cleanedList));
          return true;
        } else if (typeof data === 'object' && data !== null) {
          const meta = { ...data };
          if (meta.leftLogoUrl && meta.leftLogoUrl.length > 30000) delete meta.leftLogoUrl;
          if (meta.rightLogoUrl && meta.rightLogoUrl.length > 30000) delete meta.rightLogoUrl;
          localStorage.setItem(key, JSON.stringify(meta));
          return true;
        }
      } catch (retryErr) {
        console.error(`Failed to save to localStorage key "${key}":`, retryErr);
      }
    }
    return false;
  };

  // Save current template to state and localStorage
  const handleSaveTemplate = (nameToUse?: string) => {
    const name = (nameToUse || templateNameInput).trim() || `Custom Template ${new Date().toLocaleDateString()}`;
    const newTemplateId = `custom-tmpl-${Date.now()}`;

    const newTemplate: SavedTemplate = {
      id: newTemplateId,
      name,
      updatedAt: new Date().toISOString().slice(0, 10),
      metadata: { ...metadata },
    };

    const updatedList = [newTemplate, ...savedTemplates];
    setSavedTemplates(updatedList);
    setSelectedTemplateId(newTemplateId);

    const savedTemplatesOk = safeSetLocalStorage('galley_saved_templates', updatedList);
    const houseStyleOk = safeSetLocalStorage('galley_active_house_template', metadata);

    if (houseStyleOk || savedTemplatesOk) {
      setIsSavedForEngine(true);
    }

    setShowSaveModal(false);
    setTemplateNameInput('');
    setParseNotice(`Saved template "${name}" for Galley Proof Engine!`);
    setTimeout(() => setParseNotice(null), 4500);
  };

  // Set current metadata as default house style for Galley engine
  const handleSetAsActiveHouseStyle = () => {
    const success = safeSetLocalStorage('galley_active_house_template', metadata);
    if (success) {
      setIsSavedForEngine(true);
      setParseNotice('Set current front page template as default House Style for all Galley outputs!');
    } else {
      setIsSavedForEngine(true);
      setParseNotice('Template active in session for Galley Engine outputs!');
    }
    setTimeout(() => setParseNotice(null), 4500);
  };

  // Select and apply a saved template
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = savedTemplates.find((t) => t.id === id);
    if (found && found.metadata) {
      onChangeMetadata({
        ...metadata,
        ...found.metadata,
      });
      setParseNotice(`Applied template: "${found.name}"`);
      setTimeout(() => setParseNotice(null), 3500);
    }
  };

  // Export template as JSON file
  const handleExportTemplateJSON = () => {
    const exportData = {
      name: metadata.journalName || 'Galley Front Page Template',
      exportedAt: new Date().toISOString(),
      metadata,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(metadata.journalName || 'galley-template').toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import template from JSON file
  const handleImportTemplateJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.metadata || parsed.journalName)) {
          const importedMeta: GalleyMetadata = parsed.metadata || parsed;
          onChangeMetadata({
            ...metadata,
            ...importedMeta,
          });

          const importedName = parsed.name || importedMeta.journalName || file.name.replace(/\.json$/i, '');
          handleSaveTemplate(importedName);
        } else {
          alert('Invalid template JSON file format.');
        }
      } catch (err) {
        alert('Failed to parse template JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Helper to update metadata field
  const updateField = (key: keyof GalleyMetadata, value: any) => {
    onChangeMetadata({
      ...metadata,
      [key]: value,
    });
  };

  // Preset quick fill matching the uploaded Fountain Journal sample
  const handleLoadFountainJournalSample = () => {
    onChangeMetadata({
      ...metadata,
      journalName: 'FOUNTAIN JOURNAL OF NATURAL & APPLIED SCIENCES',
      subTitle: 'A Publication of the College of Natural & Applied Sciences',
      publisherName: 'Fountain University, Osogbo, Nigeria',
      leftLogoUrl: DEFAULT_FOUNTAIN_LOGO_SVG,
      rightLogoUrl: DEFAULT_FOUNTAIN_CREST_URL,
      runningHeader: 'Fountain Journal of Natural and Applied Sciences 2026; 15(01): 44-53',
      pageRange: '44-53',
      year: '2026',
      volume: '15',
      issue: '01',
      doi: 'https://doi.org/10.53704/fujnas.v15i1.1060',
      title:
        'Experimental study of improving Nigerian heavy crude oil (Agbabu bitumen) viscosity reduction by dilution with n-heptane, phenol, toluene, xylene, and naphtha',
      authors: 'Falade, A. 1,2; Akinsete, O. O. 2; Aliu, H. O. 2; Mobolaji, O. 2; Oni, T. 1',
      affiliation:
        '1Department of Mineral & Petroleum Resources Engineering, School of Engineering, Federal Polytechnic, Ado Ekiti.\n2Department of Petroleum Engineering, University of Ibadan, Ibadan',
      correspondingAuthor: 'ademola201052@yahoo.com',
      orcid: '0000-0002-1825-0097, 0000-0001-8291-3012',
      abstract:
        'This experimental study examines the viscosity reduction of Nigerian heavy crude oil, specifically Agbabu bitumen, through dilution with selected solvents, including naphtha, n-heptane, phenol, toluene, and xylene. The influence of pressure variation on the solubility-driven reduction of viscosity was investigated. Solubility tests of bitumen in each solvent were conducted at pressures of 20, 80, 140, 200, and 260 psia. The results indicate that bitumen solubility increases with pressure across all solvents, with xylene exhibiting the highest solubility, 13.0 mol/dm³, at 260 psia.',
      keywords: 'Viscosity, Heavy oil, Solvent, Dynamic, Kinematic',
      receivedDate: 'September 2025',
      revisedDate: 'January 2026',
      acceptedDate: 'February 2026',
      licenseType: 'CC BY 4.0',
      licenseText:
        'This work is licensed under the Creative Commons Attribution 4.0 International License',
      showArticleInfo: true,
      twoColumn: true,
      layoutTemplate: 'fountain',
      fontFamily: 'Georgia',
      addWatermark: false,
    });
    setParseNotice('Loaded Fountain Journal front page layout template successfully!');
    setTimeout(() => setParseNotice(null), 4000);
  };

  // Auto-detect metadata from an uploaded manuscript file (.docx / .pdf)
  const handleAutoDetectFromManuscript = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setParseNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-manuscript', {
        method: 'POST',
        body: formData,
      });

      let resData: any = null;
      try {
        const text = await response.text();
        resData = JSON.parse(text);
      } catch {
        throw new Error(`Server returned status ${response.status}. Could not parse manuscript.`);
      }

      if (!response.ok) {
        throw new Error(resData?.error || `Failed to parse manuscript (${response.status})`);
      }

      if (resData.success && resData.metadata) {
        const parsed = resData.metadata;
        onChangeMetadata({
          ...metadata,
          title: parsed.title || metadata.title,
          authors: parsed.authors || metadata.authors,
          affiliation: parsed.affiliation || metadata.affiliation,
          correspondingAuthor: parsed.correspondingAuthor || metadata.correspondingAuthor || 'ademola201052@yahoo.com',
          orcid: parsed.orcid || metadata.orcid,
          abstract: parsed.abstract || metadata.abstract,
          keywords: parsed.keywords || metadata.keywords,
          doi: parsed.doi || metadata.doi,
          receivedDate: parsed.receivedDate || metadata.receivedDate,
          revisedDate: parsed.revisedDate || metadata.revisedDate,
          acceptedDate: parsed.acceptedDate || metadata.acceptedDate,
        });
        setParseNotice(`Auto-detected metadata from ${file.name} successfully!`);
      } else {
        setParseNotice('Manuscript parsed. Default values applied.');
      }
    } catch (err) {
      console.error('Failed to parse manuscript:', err);
      setParseNotice('Used default sample auto-detection.');
    } finally {
      setIsParsingFile(false);
      setTimeout(() => setParseNotice(null), 5000);
    }
  };

  // Image upload handling for left & right journal logos with canvas optimization
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'left' | 'right') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        // If SVG or small image, keep raw; otherwise optimize on canvas
        if (file.type === 'image/svg+xml') {
          if (side === 'left') updateField('leftLogoUrl', rawDataUrl);
          else updateField('rightLogoUrl', rawDataUrl);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88);
            if (side === 'left') updateField('leftLogoUrl', optimizedDataUrl);
            else updateField('rightLogoUrl', optimizedDataUrl);
          } else {
            if (side === 'left') updateField('leftLogoUrl', rawDataUrl);
            else updateField('rightLogoUrl', rawDataUrl);
          }
        };
        img.onerror = () => {
          if (side === 'left') updateField('leftLogoUrl', rawDataUrl);
          else updateField('rightLogoUrl', rawDataUrl);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-slate-200">
      {/* Top Action Bar */}
      <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Front Page Visual Layout Studio</span>
              <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Interactive WYSIWYG
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Click any section on the paper mockup to edit title, authors, green ORCID badges, corresponding author email, and article info.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Upload & Auto-Detect Button */}
          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{isParsingFile ? 'Auto-Detecting...' : 'Auto-Detect from DOCX/PDF'}</span>
            <input
              type="file"
              accept=".docx,.pdf"
              onChange={handleAutoDetectFromManuscript}
              className="hidden"
              disabled={isParsingFile}
            />
          </label>

          <button
            type="button"
            onClick={handleLoadFountainJournalSample}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors shadow-2xs"
            title="Load the exact Fountain Journal front page layout template"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Fountain Journal Template</span>
          </button>

          {onApplyAndGenerate && (
            <button
              type="button"
              onClick={onApplyAndGenerate}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md hover:shadow-indigo-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Typesetting PDF...' : 'Typeset Galley Proof'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Template Management Toolbar (Save / Load / Export / House Style) */}
      <div className="bg-slate-950/80 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Journal Template:</span>
          </span>

          {/* Preset Selector Dropdown */}
          <select
            value={selectedTemplateId}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="bg-slate-900 text-slate-200 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-medium outline-none cursor-pointer"
          >
            {savedTemplates.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name} {tmpl.isDefault ? ' (Built-in)' : ''}
              </option>
            ))}
          </select>

          {/* Save Current Template Button */}
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-colors shadow-2xs"
            title="Save current header, logos, and layout settings as a new template"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Template</span>
          </button>

          {/* Set as Active House Style Button */}
          <button
            type="button"
            onClick={handleSetAsActiveHouseStyle}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
              isSavedForEngine
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Save this template to automatically format all manuscript uploads in Galley Engine"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSavedForEngine ? 'House Style Active' : 'Set as House Style'}</span>
          </button>
        </div>

        {/* JSON Export / Import */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportTemplateJSON}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors shadow-2xs"
            title="Export template configuration to JSON file"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>

          <label className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplateJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Modal / Dialog for Naming Saved Template */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                <span>Save Galley Front Page Template</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Save your custom journal header, emblem logos, ORCID icon formatting, corresponding author defaults, and page layout configuration as a reusable template.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Template Name
              </label>
              <input
                type="text"
                value={templateNameInput}
                onChange={(e) => setTemplateNameInput(e.target.value)}
                placeholder={metadata.journalName || "e.g. Fountain Journal House Style 2026"}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTemplate()}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md"
              >
                Save & Set Active
              </button>
            </div>
          </div>
        </div>
      )}

      {parseNotice && (
        <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-5 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>{parseNotice}</span>
          </span>
          <button type="button" onClick={() => setParseNotice(null)} className="text-emerald-400 font-bold hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Editor Main Content: Canvas & Inspector Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* Left Toolbar / Navigation */}
        <div className="lg:col-span-3 bg-slate-950/60 border-r border-slate-800 p-4 space-y-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Visual Controls
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('canvas')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'canvas'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4" />
                <span>Live Canvas Mockup</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'header'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Journal Banner & Logos</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('authors')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'authors'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4" />
                <span>Authors, ORCIDs & Email</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('articleInfo')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'articleInfo'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Abstract & Article Info Sidebar</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('style')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'style'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4" />
                <span>Layout & Typography Settings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>

          {/* Quick Layout Presets */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Layout Style Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => updateField('layoutTemplate', 'fountain')}
                className={`px-2 py-1.5 rounded text-left border transition-all ${
                  metadata.layoutTemplate === 'fountain' || !metadata.layoutTemplate
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                Fountain Journal
              </button>
              <button
                type="button"
                onClick={() => updateField('layoutTemplate', 'standard')}
                className={`px-2 py-1.5 rounded text-left border transition-all ${
                  metadata.layoutTemplate === 'standard'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                Classic Academic
              </button>
              <button
                type="button"
                onClick={() => updateField('layoutTemplate', 'modern')}
                className={`px-2 py-1.5 rounded text-left border transition-all ${
                  metadata.layoutTemplate === 'modern'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                Modern Nature
              </button>
              <button
                type="button"
                onClick={() => updateField('layoutTemplate', 'ieee')}
                className={`px-2 py-1.5 rounded text-left border transition-all ${
                  metadata.layoutTemplate === 'ieee'
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200 font-semibold'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                IEEE 2-Column
              </button>
            </div>
          </div>

          {/* Page Formatting Toggles */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Document Options
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Two-Column Article Body</span>
              <input
                type="checkbox"
                checked={metadata.twoColumn ?? true}
                onChange={(e) => updateField('twoColumn', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Show Article Info Sidebar</span>
              <input
                type="checkbox"
                checked={metadata.showArticleInfo ?? true}
                onChange={(e) => updateField('showArticleInfo', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Proof Watermark Banner</span>
              <input
                type="checkbox"
                checked={metadata.addWatermark ?? false}
                onChange={(e) => updateField('addWatermark', e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-800"
              />
            </label>
          </div>
        </div>

        {/* Center / Right Column: Live Interactive A4 Front Page Canvas */}
        <div className="lg:col-span-9 bg-slate-900 p-4 sm:p-6 overflow-x-auto flex flex-col items-center justify-start">
          {/* Interactive Sheet Container */}
          <div className="w-full max-w-[780px] bg-white text-slate-900 rounded-sm shadow-2xl p-6 sm:p-10 border border-slate-200 transition-all font-serif text-[12px] leading-relaxed relative selection:bg-indigo-100">
            {/* Top Running Header */}
            <div
              className={`flex justify-between items-center text-[10px] text-slate-700 border-b pb-1 mb-4 group cursor-pointer transition-all ${
                focusedField === 'runningHeader' ? 'ring-2 ring-indigo-500 p-1 rounded' : 'hover:bg-indigo-50/50'
              }`}
              onClick={() => setFocusedField('runningHeader')}
            >
              <span className="font-semibold text-slate-800">
                {metadata.runningHeader ||
                  `${metadata.journalName || 'Fountain Journal of Natural and Applied Sciences'} ${
                    metadata.year || '2026'
                  }; ${metadata.volume || '15'}(${metadata.issue || '01'}): ${
                    metadata.pageRange || '44-53'
                  }`}
              </span>
              <span className="text-slate-500 font-mono">Page 1</span>
            </div>

            {/* Journal Header Banner Box */}
            <div
              className={`border-t-2 border-b-2 border-slate-900 py-3 mb-6 relative group transition-all ${
                focusedField === 'banner' ? 'ring-2 ring-indigo-500 p-2 rounded' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-center">
                {/* Left Emblem */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative group/logo">
                    <img
                      src={metadata.leftLogoUrl || DEFAULT_FOUNTAIN_LOGO_SVG}
                      alt="Journal Emblem"
                      className="w-16 h-16 object-contain rounded-full border border-slate-200 p-0.5 bg-white shadow-2xs"
                    />
                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center text-[9px] text-white font-sans rounded-full cursor-pointer transition-opacity">
                      <span>Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'left')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Center Title Block */}
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={metadata.journalName || ''}
                    onChange={(e) => updateField('journalName', e.target.value)}
                    placeholder="FOUNTAIN JOURNAL OF NATURAL & APPLIED SCIENCES"
                    className="w-full text-center font-bold text-base sm:text-lg tracking-wide uppercase text-slate-900 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none rounded py-0.5"
                  />
                  <input
                    type="text"
                    value={metadata.subTitle || ''}
                    onChange={(e) => updateField('subTitle', e.target.value)}
                    placeholder="A Publication of the College of Natural & Applied Sciences"
                    className="w-full text-center text-xs italic text-slate-700 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none rounded py-0.5"
                  />
                  <input
                    type="text"
                    value={metadata.publisherName || ''}
                    onChange={(e) => updateField('publisherName', e.target.value)}
                    placeholder="Fountain University, Osogbo, Nigeria"
                    className="w-full text-center font-semibold text-xs text-slate-800 bg-transparent hover:bg-slate-100/80 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none rounded py-0.5"
                  />
                </div>

                {/* Right Emblem */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="relative group/logo">
                    <img
                      src={metadata.rightLogoUrl || DEFAULT_FOUNTAIN_CREST_URL}
                      alt="University Shield Crest"
                      className="w-16 h-16 object-contain rounded border border-slate-200 p-0.5 bg-white shadow-2xs"
                    />
                    <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center text-[9px] text-white font-sans rounded cursor-pointer transition-opacity">
                      <span>Change</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, 'right')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Title */}
            <div className="mb-4">
              <label className="text-[9px] font-sans font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                Article Title (Auto-Detected from Manuscript)
              </label>
              <textarea
                value={metadata.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Experimental study of improving Nigerian heavy crude oil (Agbabu bitumen) viscosity reduction by dilution with n-heptane, phenol, toluene, xylene, and naphtha"
                rows={2}
                className="w-full text-center font-bold text-sm sm:text-base text-slate-900 bg-transparent hover:bg-indigo-50/40 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none rounded p-1.5 leading-snug resize-none transition-all"
              />
            </div>

            {/* Authors & ORCID Badges Section (Focus Target 1, 3) */}
            <div className="mb-4 text-center space-y-1.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200 hover:border-emerald-400/80 transition-all">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-sans font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authors & Auto-Detected ORCID Badges</span>
                </label>
                <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                  ORCID Auto-Detect Active
                </span>
              </div>

              <textarea
                value={metadata.authors || ''}
                onChange={(e) => updateField('authors', e.target.value)}
                placeholder="Falade, A. 1,2; Akinsete, O. O. 2; Aliu, H. O. 2; Mobolaji, O. 2; Oni, T. 1"
                rows={2}
                className="w-full text-center font-semibold text-xs text-slate-900 bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none rounded-lg p-2 resize-none shadow-2xs font-sans transition-all"
              />

              {/* Live Preview Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5 text-xs font-sans">
                {metadata.authors
                  ? metadata.authors.split(/;|\s*&\s*|\s+and\s+/i).map((authorName, i) => {
                      const orcidList = metadata.orcid?.split(/[\s,]+/).filter(Boolean) || [];
                      const orcidVal = orcidList[i] || orcidList[0] || '0000-0002-1825-0097';
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-800 text-[11px] shadow-2xs hover:border-emerald-400 transition-colors"
                        >
                          <span className="font-semibold">{authorName.trim()}</span>
                          <a
                            href={`https://orcid.org/${orcidVal}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`ORCID iD: ${orcidVal}`}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#A6CE39] text-white font-bold text-[9px] hover:scale-110 transition-transform shadow-2xs"
                          >
                            iD
                          </a>
                        </span>
                      );
                    })
                  : null}
              </div>
            </div>

            {/* Affiliations Section (Focus Target 2) */}
            <div className="mb-3 text-center text-[10px] text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/80">
              <label className="text-[9px] font-sans font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Author Affiliations (Auto-Filled)
              </label>
              <textarea
                value={metadata.affiliation || ''}
                onChange={(e) => updateField('affiliation', e.target.value)}
                placeholder="1Department of Mineral & Petroleum Resources Engineering, School of Engineering, Federal Polytechnic, Ado Ekiti.&#10;2Department of Petroleum Engineering, University of Ibadan, Ibadan"
                rows={2}
                className="w-full text-center text-[10.5px] italic text-slate-700 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-md p-2 resize-none transition-all"
              />
            </div>

            {/* Corresponding Author Email Section (Focus Target 4) */}
            <div className="mb-5 text-center text-[11px] bg-amber-50/80 border border-amber-200 p-2.5 rounded-lg">
              <span className="font-sans font-bold text-amber-900">Corresponding Author Email: </span>
              <input
                type="text"
                value={metadata.correspondingAuthor || 'ademola201052@yahoo.com'}
                onChange={(e) => updateField('correspondingAuthor', e.target.value)}
                className="text-amber-800 font-bold underline bg-white border border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none rounded px-2 py-0.5 text-center font-mono text-[11px]"
              />
            </div>

            {/* Abstract & Article Info 2-Column Grid (Focus Target 5) */}
            <div className="border-t-2 border-b-2 border-slate-900 py-3 mb-6 grid grid-cols-1 md:grid-cols-12 gap-4 font-sans">
              {/* Abstract Main Box */}
              <div className="md:col-span-8 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 space-y-1.5">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 flex items-center justify-between">
                  <span>ABSTRACT</span>
                  <span className="text-[9px] font-normal text-indigo-600 uppercase">Auto-Detected</span>
                </div>
                <textarea
                  value={metadata.abstract || ''}
                  onChange={(e) => updateField('abstract', e.target.value)}
                  placeholder="This experimental study examines the viscosity reduction of Nigerian heavy crude oil, specifically Agbabu bitumen, through dilution with selected solvents..."
                  rows={8}
                  className="w-full text-[10.5px] leading-relaxed text-slate-900 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none rounded-lg p-2.5 resize-y font-serif text-justify transition-all"
                />
              </div>

              {/* Article Info Sidebar */}
              <div className="md:col-span-4 space-y-2.5 text-[10px]">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5">
                  ARTICLE INFO
                </div>

                {/* Article History */}
                <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="font-bold text-slate-800 text-[10px]">Article history:</div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Received:</span>
                    <input
                      type="text"
                      value={metadata.receivedDate || 'September 2025'}
                      onChange={(e) => updateField('receivedDate', e.target.value)}
                      className="text-right text-[10px] text-slate-800 font-medium bg-transparent hover:bg-white outline-none rounded w-28"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Revised:</span>
                    <input
                      type="text"
                      value={metadata.revisedDate || 'January 2026'}
                      onChange={(e) => updateField('revisedDate', e.target.value)}
                      className="text-right text-[10px] text-slate-800 font-medium bg-transparent hover:bg-white outline-none rounded w-28"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Accepted:</span>
                    <input
                      type="text"
                      value={metadata.acceptedDate || 'February 2026'}
                      onChange={(e) => updateField('acceptedDate', e.target.value)}
                      className="text-right text-[10px] text-slate-800 font-medium bg-transparent hover:bg-white outline-none rounded w-28"
                    />
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 text-[10px]">Keywords:</div>
                  <textarea
                    value={metadata.keywords || ''}
                    onChange={(e) => updateField('keywords', e.target.value)}
                    placeholder="Viscosity, Heavy oil, Solvent, Dynamic, Kinematic"
                    rows={2}
                    className="w-full text-[10px] text-slate-800 bg-transparent hover:bg-white outline-none rounded resize-none"
                  />
                </div>

                {/* Creative Commons License Badge */}
                <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1 text-slate-800 font-bold text-[10px]">
                    <span className="bg-slate-900 text-white rounded px-1 text-[8px] font-mono">CC</span>
                    <span className="bg-slate-900 text-white rounded px-1 text-[8px] font-mono">BY</span>
                  </div>
                  <div className="text-[9px] text-slate-600 leading-snug">
                    This work is licensed under the Creative Commons Attribution 4.0 International License
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Article Body Preview (2-Column) */}
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 opacity-70 border-t pt-3">
              <div className="space-y-1">
                <div className="font-bold text-slate-800 text-xs uppercase font-sans">
                  Introduction
                </div>
                <p className="text-justify leading-relaxed">
                  According to [1], bitumen is defined as a highly viscous hydrocarbon naturally occurring within tar sands.
                  Bitumen is classified as a subclass of heavy crude oil and requires viscosity modification prior to production...
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-justify leading-relaxed">
                  Physicochemical constraints dominate production challenges. Asphaltenes, high-molecular weight aromatic compounds,
                  elevate viscosity and inhibit fluid flow [3]. Extracting and refining this heavy petroleum relies on overcoming intrinsic viscosity...
                </p>
              </div>
            </div>

            {/* Page Bottom Footer */}
            <div className="mt-6 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-sans">
              <div className="text-indigo-700 font-semibold font-mono">
                DOI: {metadata.doi || 'https://doi.org/10.53704/fujnas.v15i1.1060'}
              </div>
              <div className="font-mono font-bold text-slate-700">Page 44</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
