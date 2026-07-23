import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { GalleyMetadata } from '../src/types.js';

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
  const journalName = metadata.journalName?.trim() || 'ACADEMIC JOURNAL OF RESEARCH';
  const yearStr = metadata.year?.trim() || new Date().getFullYear().toString();
  const volumeStr = metadata.volume?.trim();
  const issueStr = metadata.issue?.trim();

  let volIssueYear = 'Advance Online Publication';
  if (volumeStr || issueStr) {
    const volPart = volumeStr ? `Vol. ${volumeStr}` : '';
    const issuePart = issueStr ? `No. ${issueStr}` : '';
    volIssueYear = `${volPart} ${issuePart} (${yearStr})`.trim();
  } else if (yearStr) {
    volIssueYear = `Advance Online Publication (${yearStr})`;
  }

  const doiStr = metadata.doi?.trim() ? `DOI: ${metadata.doi.trim()}` : '';

  // 3. Construct Typeset HTML
  const isTwoColumn = metadata.twoColumn ?? false;
  const showBanner = metadata.addWatermark ?? true;

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
      margin: 0 0 4px 0;
    }

    .article-affiliation {
      font-family: 'Georgia', serif;
      font-style: italic;
      font-size: 9pt;
      color: #64748b;
      margin: 0 0 14px 0;
      line-height: 1.4;
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

  <div class="article-header">
    <h1 class="article-title">${escapeHtml(detectedTitle)}</h1>
    ${
      metadata.authors?.trim()
        ? `<div class="article-authors">${escapeHtml(metadata.authors.trim())}</div>`
        : ''
    }
    ${
      metadata.affiliation?.trim()
        ? `<div class="article-affiliation">${escapeHtml(metadata.affiliation.trim())}</div>`
        : ''
    }
  </div>

  <div class="metadata-strip">
    <span class="metadata-strip-item">${escapeHtml(journalName)}</span>
    <span class="metadata-strip-item">${escapeHtml(volIssueYear)}</span>
    ${
      metadata.doi?.trim()
        ? `<span class="metadata-strip-item">${escapeHtml(doiStr)}</span>`
        : ''
    }
    <span class="metadata-strip-item">Received & Typeset: ${escapeHtml(todayDateStr)}</span>
  </div>

  ${
    metadata.abstract?.trim() || metadata.keywords?.trim()
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
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

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
