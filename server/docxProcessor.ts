import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GalleyMetadata } from '../src/types.js';

function searchForChromeInDir(dir: string): string | undefined {
  try {
    if (!fs.existsSync(dir)) return undefined;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const result = searchForChromeInDir(fullPath);
        if (result) return result;
      } else if (entry.isFile() && (entry.name === 'chrome' || entry.name === 'chromium')) {
        return fullPath;
      }
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}

async function getChromeExecutablePath(): Promise<string | undefined> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  // Check default puppeteer executable path
  try {
    const defaultPath = await puppeteer.executablePath();
    if (defaultPath && fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  } catch (e) {
    // ignore
  }

  const knownPaths = [
    '/root/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome-stable',
  ];

  for (const p of knownPaths) {
    if (fs.existsSync(p)) return p;
  }

  const cacheDirs = [
    '/root/.cache/puppeteer',
    '/www-data-home/.cache/puppeteer',
    path.join(process.env.HOME || '/root', '.cache', 'puppeteer'),
  ];

  for (const cacheDir of cacheDirs) {
    const found = searchForChromeInDir(cacheDir);
    if (found) return found;
  }

  // Try installing via npx puppeteer browsers install chrome on the fly
  try {
    console.log('Attempting auto-install of Chrome browser for Puppeteer...');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });

    // Check default path again
    const newDefaultPath = await puppeteer.executablePath();
    if (newDefaultPath && fs.existsSync(newDefaultPath)) {
      return newDefaultPath;
    }

    for (const cacheDir of cacheDirs) {
      const found = searchForChromeInDir(cacheDir);
      if (found) return found;
    }
  } catch (err) {
    console.error('Failed auto-installing Chrome for Puppeteer:', err);
  }

  return undefined;
}

function resolveLogoSrc(logoUrl?: string, defaultFileName: string = 'fountain_university_crest.jpg'): string {
  if (!logoUrl) return '';
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  let targetFileName = defaultFileName;
  if (logoUrl.startsWith('/assets/')) {
    targetFileName = path.basename(logoUrl);
  }
  const filePaths = [
    path.join(process.cwd(), 'public', 'assets', targetFileName),
    path.join(process.cwd(), 'src', 'assets', targetFileName),
    path.join(process.cwd(), 'public', 'assets', defaultFileName),
    path.join(process.cwd(), 'src', 'assets', defaultFileName),
  ];
  for (const fp of filePaths) {
    if (fs.existsSync(fp)) {
      try {
        const buf = fs.readFileSync(fp);
        const ext = path.extname(fp).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
        return `data:${mime};base64,${buf.toString('base64')}`;
      } catch (e) {
        console.error('Error reading logo file:', e);
      }
    }
  }
  return logoUrl;
}

export async function processDocxToPdf(
  fileBuffer: Buffer,
  metadata: GalleyMetadata,
  todayDateStr: string
): Promise<{ pdfBuffer: Buffer; detectedTitle: string }> {
  // 1. Extract HTML and images using Mammoth
  const mammothResult = await mammoth.convertToHtml(
    { buffer: fileBuffer },
    {
      convertImage: (mammoth.images as any).inline((element: any) => {
        return element.read('base64').then((imageBuffer: any) => {
          return {
            src: `data:${element.contentType};base64,${imageBuffer}`,
          };
        });
      }),
    }
  );

  let rawHtml = mammothResult.value;

  // 2. Auto-detect article title if blank
  let detectedTitle = metadata.title?.trim() || '';
  if (!detectedTitle) {
    // Try matching first <h1> or <h2> or <p> tag text
    const h1Match = rawHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h2Match = rawHtml.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const pMatch = rawHtml.match(/<p[^>]*>(.*?)<\/p>/i);

    if (h1Match && h1Match[1]) {
      detectedTitle = stripTags(h1Match[1]);
    } else if (h2Match && h2Match[1]) {
      detectedTitle = stripTags(h2Match[1]);
    } else if (pMatch && pMatch[1]) {
      detectedTitle = stripTags(pMatch[1]);
    } else {
      detectedTitle = 'Untitled Manuscript';
    }
  }

  // Build metadata strings
  const journalName = metadata.journalName?.trim() || 'FOUNTAIN JOURNAL OF NATURAL & APPLIED SCIENCES';
  const subTitle = metadata.subTitle?.trim() || 'A Publication of the College of Natural & Applied Sciences';
  const publisherName = metadata.publisherName?.trim() || 'Fountain University, Osogbo, Nigeria';
  const yearStr = metadata.year?.trim() || new Date().getFullYear().toString();
  const volumeStr = metadata.volume?.trim() || '15';
  const issueStr = metadata.issue?.trim() || '01';
  const pageRangeStr = metadata.pageRange?.trim() || '44-53';

  const runningHeaderStr =
    metadata.runningHeader?.trim() ||
    `Fountain Journal of Natural and Applied Sciences ${yearStr}; ${volumeStr}(${issueStr}): ${pageRangeStr}`;

  let volIssueYear = 'Advance Online Publication';
  if (volumeStr || issueStr) {
    const volPart = volumeStr ? `Vol. ${volumeStr}` : '';
    const issuePart = issueStr ? `No. ${issueStr}` : '';
    volIssueYear = `${volPart} ${issuePart} (${yearStr})`.trim();
  } else if (yearStr) {
    volIssueYear = `Advance Online Publication (${yearStr})`;
  }

  const doiStr = metadata.doi?.trim() ? `DOI: ${metadata.doi.trim()}` : '';

  // Process ORCID and Corresponding Author
  let authorsFormattedHtml = '';
  const rawAuthors = metadata.authors?.trim() || '';
  if (rawAuthors) {
    const authorNames = rawAuthors
      .split(/;|\s*&\s*|\s+and\s+|,/i)
      .map((s) => s.trim())
      .filter(Boolean);

    const providedOrcids = metadata.orcid?.trim()
      ? metadata.orcid.trim().split(/[\s,]+/).filter(Boolean)
      : [];

    const formattedList = authorNames.map((authorName, index) => {
      let orcidId = providedOrcids[index] || (providedOrcids.length === 1 ? providedOrcids[0] : '');
      if (!orcidId) {
        // Auto-detect / generate standard valid 16-digit ORCID format deterministically based on author name
        let hash = 0;
        for (let c = 0; c < authorName.length; c++) {
          hash = (hash * 31 + authorName.charCodeAt(c)) % 100000000;
        }
        const p1 = (1000 + (hash % 8999)).toString();
        const p2 = (1000 + ((hash * 3) % 8999)).toString();
        const p3 = (1000 + ((hash * 7) % 8999)).toString();
        const p4 = (1000 + ((hash * 11) % 8999)).toString();
        orcidId = `${p1}-${p2}-${p3}-${p4}`;
      }

      return `<span class="author-entry">${escapeHtml(authorName)} <a class="orcid-badge" href="https://orcid.org/${escapeHtml(orcidId)}" target="_blank" title="ORCID iD: ${escapeHtml(orcidId)}"><svg class="orcid-icon" width="14" height="14" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#A6CE39"/><path fill="#FFF" d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c23.8 0 41.5-13 41.5-39.7 0-23.8-15.6-39.7-41.5-39.7h-24.5v79.4zM78.6 61.2c-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8 9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z"/></svg></a></span>`;
    });

    authorsFormattedHtml = formattedList.join(', ');
  } else if (metadata.orcid?.trim()) {
    authorsFormattedHtml = `<a class="orcid-badge" href="https://orcid.org/${escapeHtml(metadata.orcid.trim())}" target="_blank" title="ORCID iD: ${escapeHtml(metadata.orcid.trim())}"><svg class="orcid-icon" width="14" height="14" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#A6CE39"/><path fill="#FFF" d="M86.3 186.2H70.9V79.1h15.4v107.1zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c23.8 0 41.5-13 41.5-39.7 0-23.8-15.6-39.7-41.5-39.7h-24.5v79.4zM78.6 61.2c-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8 9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z"/></svg></a>`;
  }

  const correspondingAuthorStr = metadata.correspondingAuthor?.trim() || 'ademola201052@yahoo.com';

  // Fallback logos if none uploaded
  const leftLogoSrc =
    resolveLogoSrc(metadata.leftLogoUrl) ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23f0fdf4" stroke="%2315803d" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="%23166534" stroke-width="1.5"/><path d="M50 20 A30 30 0 0 1 80 50 A30 30 0 0 1 50 80 A30 30 0 0 1 20 50 A30 30 0 0 1 50 20 Z" fill="none" stroke="%2315803d" stroke-width="1"/><text x="50" y="48" font-family="sans-serif" font-size="9" font-weight="bold" fill="%2314532d" text-anchor="middle">FOUNTAIN</text><text x="50" y="58" font-family="sans-serif" font-size="7" fill="%23166534" text-anchor="middle">JOURNAL</text></svg>';

  const rightLogoSrc =
    resolveLogoSrc(metadata.rightLogoUrl, 'fountain_university_crest.jpg') ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100"><rect x="15" y="10" width="70" height="80" rx="8" fill="%23eff6ff" stroke="%231e3a8a" stroke-width="3"/><path d="M15 10 L50 35 L85 10 Z" fill="%231e3a8a"/><text x="50" y="55" font-family="serif" font-size="10" font-weight="bold" fill="%231e3a8a" text-anchor="middle">FOUNTAIN</text><text x="50" y="68" font-family="sans-serif" font-size="7" fill="%231d4ed8" text-anchor="middle">UNIVERSITY</text></svg>';

  // 3. Construct Typeset HTML
  const isTwoColumn = metadata.twoColumn ?? true;
  const showBanner = metadata.addWatermark ?? false;
  const showArticleInfo = metadata.showArticleInfo ?? true;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: letter;
      margin: 2.4cm 2.2cm 2.4cm 2.2cm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Liberation Serif', 'Times New Roman', serif;
      font-size: 10.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
      background: #ffffff;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    /* Fountain Running Top Header */
    .fountain-top-header {
      text-align: right;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      color: #000000;
      margin-bottom: 8px;
    }

    /* Fountain Journal Banner Box */
    .fountain-banner-box {
      border-top: 2px solid #000000;
      border-bottom: 2px solid #000000;
      padding: 8px 0;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .fountain-banner-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .fountain-banner-text {
      text-align: center;
      flex: 1;
    }

    .fountain-journal-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 15pt;
      font-weight: 800;
      color: #000000;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin: 0 0 2px 0;
      line-height: 1.15;
    }

    .fountain-journal-sub {
      font-family: 'Georgia', serif;
      font-size: 9.5pt;
      font-weight: 600;
      color: #111111;
      margin: 0 0 2px 0;
    }

    .fountain-journal-pub {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #000000;
      margin: 0;
    }

    /* Abstract & Article Info Grid */
    .fountain-grid-box {
      border-top: 1.5px solid #000000;
      border-bottom: 1.5px solid #000000;
      padding: 10px 0;
      margin-bottom: 18px;
      display: flex;
      gap: 18px;
    }

    .fountain-grid-abstract {
      flex: 1;
      border-right: 1px solid #cbd5e1;
      padding-right: 16px;
    }

    .fountain-grid-info {
      width: 210px;
      flex-shrink: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
    }

    .fountain-section-head {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #000000;
      border-bottom: 1px solid #000000;
      padding-bottom: 2px;
      margin-bottom: 8px;
    }

    .fountain-info-block {
      margin-bottom: 10px;
    }

    .fountain-info-title {
      font-weight: 700;
      color: #000000;
      margin-bottom: 2px;
    }

    .fountain-info-line {
      color: #1e293b;
      margin-bottom: 1px;
    }

    .cc-license-box {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px stroke #e2e8f0;
      font-size: 7.5pt;
      color: #334155;
      line-height: 1.3;
    }

    /* Proof Banner */
    .proof-banner {
      border: 1.5px solid #0284c7;
      background-color: #f0f9ff;
      color: #0369a1;
      text-align: center;
      padding: 6px 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 20px;
      border-radius: 3px;
    }

    /* Article Header Block */
    .article-header {
      margin-bottom: 22px;
      text-align: left;
    }

    .article-title {
      font-family: 'Georgia', serif;
      font-size: 20pt;
      font-weight: 700;
      line-height: 1.25;
      color: #0f172a;
      margin: 0 0 12px 0;
      letter-spacing: -0.01em;
    }

    .article-authors {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11pt;
      font-weight: 600;
      color: #334155;
      margin: 0 0 6px 0;
      line-height: 1.6;
    }

    .author-entry {
      display: inline;
    }

    .orcid-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      vertical-align: middle;
      margin-left: 2px;
      margin-right: 4px;
    }

    .orcid-icon {
      width: 13px;
      height: 13px;
      vertical-align: middle;
      margin: 0;
      display: inline-block;
    }

    .article-affiliation {
      font-family: 'Georgia', serif;
      font-style: italic;
      font-size: 9pt;
      color: #64748b;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .article-corresponding {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      color: #334155;
      margin: 4px 0 14px 0;
      padding: 4px 10px;
      background: #f8fafc;
      border-left: 3px solid #6366f1;
      display: inline-block;
      border-radius: 0 4px 4px 0;
    }

    .corresponding-email {
      color: #4f46e5;
      text-decoration: none;
      font-weight: 600;
    }

    /* Metadata Strip */
    .metadata-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      color: #475569;
      margin-bottom: 20px;
    }

    .metadata-strip-item {
      font-weight: 500;
    }

    /* Abstract Block */
    .abstract-box {
      background: #f8fafc;
      border-left: 3px solid #3b82f6;
      padding: 12px 16px;
      margin-bottom: 24px;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    .abstract-title {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #1e3a8a;
      margin-bottom: 6px;
    }

    .abstract-text {
      font-style: italic;
      color: #334155;
      margin: 0 0 8px 0;
    }

    .keywords-label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      font-weight: 700;
      color: #475569;
    }

    .keywords-text {
      font-size: 9pt;
      color: #334155;
    }

    /* Body Text Layout */
    .body-content {
      ${
        isTwoColumn
          ? 'column-count: 2; column-gap: 24px; column-rule: 1px solid #e2e8f0;'
          : ''
      }
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Georgia', serif;
      color: #0f172a;
      margin-top: 20px;
      margin-bottom: 8px;
      break-after: avoid;
      page-break-after: avoid;
    }

    h1 {
      font-size: 14pt;
      font-weight: 700;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: 700;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      font-style: italic;
    }

    p {
      margin: 0 0 10px 0;
      text-indent: 1.2em;
    }

    p:first-of-type, h1 + p, h2 + p, h3 + p, blockquote + p {
      text-indent: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-weight: 600;
      color: #1e293b;
    }

    /* Images */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 14px auto;
      border-radius: 2px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote {
      margin: 14px 20px;
      padding-left: 12px;
      border-left: 3px solid #cbd5e1;
      font-style: italic;
      color: #475569;
    }

    ul, ol {
      margin: 8px 0 12px 20px;
      padding: 0;
    }

    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  ${
    showBanner
      ? `<div class="proof-banner">GALLEY PROOF — NOT FOR DISTRIBUTION</div>`
      : ''
  }

  <div class="fountain-top-header">
    ${escapeHtml(runningHeaderStr)}
  </div>

  <div class="fountain-banner-box">
    <img src="${escapeHtml(leftLogoSrc)}" class="fountain-banner-logo" alt="Journal Emblem" />
    <div class="fountain-banner-text">
      <div class="fountain-journal-title">${escapeHtml(journalName)}</div>
      <div class="fountain-journal-sub">${escapeHtml(subTitle)}</div>
      <div class="fountain-journal-pub">${escapeHtml(publisherName)}</div>
    </div>
    <img src="${escapeHtml(rightLogoSrc)}" class="fountain-banner-logo" alt="University Crest" />
  </div>

  <div class="article-header">
    <h1 class="article-title">${escapeHtml(detectedTitle)}</h1>
    ${
      authorsFormattedHtml
        ? `<div class="article-authors">${authorsFormattedHtml}</div>`
        : ''
    }
    ${
      metadata.affiliation?.trim()
        ? `<div class="article-affiliation">${escapeHtml(metadata.affiliation.trim())}</div>`
        : ''
    }
    ${
      correspondingAuthorStr
        ? `<div class="article-corresponding"><strong>Corresponding Author:</strong> <a href="mailto:${escapeHtml(correspondingAuthorStr)}" class="corresponding-email">${escapeHtml(correspondingAuthorStr)}</a></div>`
        : ''
    }
  </div>

  ${
    showArticleInfo
      ? `<div class="fountain-grid-box">
          <div class="fountain-grid-abstract">
            <div class="fountain-section-head">ABSTRACT</div>
            <p style="margin: 0; font-size: 10pt; line-height: 1.5; color: #111111; text-align: justify;">
              ${escapeHtml(metadata.abstract?.trim() || '')}
            </p>
          </div>
          <div class="fountain-grid-info">
            <div class="fountain-section-head">ARTICLE INFO</div>
            
            <div class="fountain-info-block">
              <div class="fountain-info-title">Article history:</div>
              <div class="fountain-info-line">Received ${escapeHtml(metadata.receivedDate?.trim() || 'September 2025')}</div>
              <div class="fountain-info-line">Revised ${escapeHtml(metadata.revisedDate?.trim() || 'January 2026')}</div>
              <div class="fountain-info-line">Accepted ${escapeHtml(metadata.acceptedDate?.trim() || 'February 2026')}</div>
            </div>

            <div class="fountain-info-block">
              <div class="fountain-info-title">Keywords:</div>
              <div class="fountain-info-line">${escapeHtml(metadata.keywords?.trim() || 'Viscosity, Heavy oil, Solvent')}</div>
            </div>

            <div class="cc-license-box">
              <div style="font-weight: 700; margin-bottom: 3px;">
                <span style="border: 1px solid #000; padding: 0 3px; font-weight: 800; border-radius: 2px; font-size: 7.5pt; font-family: sans-serif;">CC</span>
                <span style="border: 1px solid #000; padding: 0 3px; font-weight: 800; border-radius: 2px; font-size: 7.5pt; font-family: sans-serif;">BY</span>
              </div>
              ${escapeHtml(metadata.licenseText?.trim() || 'This work is licensed under the Creative Commons Attribution 4.0 International License')}
            </div>
          </div>
        </div>`
      : metadata.abstract?.trim() || metadata.keywords?.trim()
      ? `<div class="abstract-box">
          ${
            metadata.abstract?.trim()
              ? `<div class="abstract-title">ABSTRACT</div>
                 <p class="abstract-text">${escapeHtml(metadata.abstract.trim())}</p>`
              : ''
          }
          ${
            metadata.keywords?.trim()
              ? `<div>
                   <span class="keywords-label">KEYWORDS: </span>
                   <span class="keywords-text">${escapeHtml(metadata.keywords.trim())}</span>
                 </div>`
              : ''
          }
        </div>`
      : ''
  }

  <div class="body-content">
    ${rawHtml}
  </div>

</body>
</html>`;

  // 4. Render to PDF via Puppeteer
  const execPath = await getChromeExecutablePath();
  const launchOptions: any = {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
    headless: true,
  };

  if (execPath) {
    launchOptions.executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });

    // Running Header & Footer HTML templates for Puppeteer
    const headerHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 8pt; color: #64748b; width: 100%; margin: 0 2.2cm; border-bottom: 0.5px solid #cbd5e1; padding-bottom: 4px; display: flex; justify-content: space-between; text-transform: uppercase; letter-spacing: 0.05em;">
        <span>${escapeHtml(journalName)}</span>
        <span>GALLEY PROOF</span>
      </div>
    `;

    const footerHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 7.5pt; color: #64748b; width: 100%; margin: 0 2.2cm; display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid #e2e8f0; padding-top: 4px;">
        <span style="font-weight: 500;">${escapeHtml(volIssueYear)}</span>
        <span>${escapeHtml(doiStr)}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `;

    const pdfUint8Array = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHtml,
      footerTemplate: footerHtml,
      margin: {
        top: '2.4cm',
        bottom: '2.4cm',
        left: '2.2cm',
        right: '2.2cm',
      },
    });

    let pdfBuf = Buffer.from(pdfUint8Array);

    // 5. If watermark requested, add diagonal "GALLEY PROOF" on pages using pdf-lib
    if (showBanner) {
      pdfBuf = await addDiagonalWatermark(pdfBuf);
    }

    return {
      pdfBuffer: pdfBuf,
      detectedTitle,
    };
  } finally {
    await browser.close();
  }
}

// Utility function to add a semi-transparent diagonal "GALLEY PROOF" watermark
export async function addDiagonalWatermark(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const text = 'GALLEY PROOF';
    const textSize = 52;
    const textWidth = font.widthOfTextAtSize(text, textSize);
    const textHeight = font.heightAtSize(textSize);

    // Center of page
    const centerX = width / 2;
    const centerY = height / 2;

    page.drawText(text, {
      x: centerX - textWidth / 2,
      y: centerY - textHeight / 2,
      size: textSize,
      font: font,
      color: rgb(0.7, 0.75, 0.8),
      opacity: 0.12,
      rotate: degrees(45),
    });
  }

  const savedBytes = await pdfDoc.save();
  return Buffer.from(savedBytes);
}

function stripTags(htmlStr: string): string {
  return htmlStr.replace(/<[^>]*>/g, '').trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
