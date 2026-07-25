import mammoth from 'mammoth';
import { GalleyMetadata } from '../src/types.js';

export async function parseManuscriptBuffer(fileBuffer: Buffer, filename: string): Promise<Partial<GalleyMetadata>> {
  let textContent = '';
  let htmlContent = '';

  const ext = filename.toLowerCase();

  if (ext.endsWith('.docx')) {
    try {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      htmlContent = result.value || '';
      // Raw text string for regex parsing
      const rawTextResult = await mammoth.extractRawText({ buffer: fileBuffer });
      textContent = rawTextResult.value || '';
    } catch (e) {
      console.error('Error extracting docx text:', e);
    }
  }

  // Fallback defaults or regex detections
  const detected: Partial<GalleyMetadata> = {};

  // 1. Auto-detect Email / Corresponding Author
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emailMatches = textContent.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    detected.correspondingAuthor = emailMatches[0];
  } else {
    detected.correspondingAuthor = 'ademola201052@yahoo.com';
  }

  // 2. Auto-detect DOI
  const doiRegex = /(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/gi;
  const doiMatch = textContent.match(doiRegex);
  if (doiMatch && doiMatch.length > 0) {
    detected.doi = `https://doi.org/${doiMatch[0]}`;
  }

  // 3. Auto-detect ORCIDs
  const orcidRegex = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/gi;
  const orcidMatches = textContent.match(orcidRegex);
  if (orcidMatches && orcidMatches.length > 0) {
    // Unique list
    const uniqueOrcids = Array.from(new Set(orcidMatches));
    detected.orcid = uniqueOrcids.join(', ');
  }

  // 4. Auto-detect Title
  // Look for first <h1> or paragraph before ABSTRACT
  if (htmlContent) {
    const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      detected.title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
  }
  if (!detected.title && textContent) {
    const lines = textContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      detected.title = lines[0];
    }
  }

  // 5. Auto-detect Abstract
  const abstractPos = textContent.search(/ABSTRACT/i);
  if (abstractPos !== -1) {
    const afterAbstract = textContent.substring(abstractPos + 8).trim();
    // End abstract at ARTICLE INFO, Introduction, Keywords, or 1000 chars
    const endPos = afterAbstract.search(/(ARTICLE INFO|Keywords|Introduction|1\.\s*Introduction)/i);
    let abstractText = endPos !== -1 ? afterAbstract.substring(0, endPos).trim() : afterAbstract.substring(0, 800).trim();
    // Clean leading colon or dashes
    abstractText = abstractText.replace(/^[:\s-]+/, '');
    if (abstractText) {
      detected.abstract = abstractText;
    }
  }

  // 6. Auto-detect Keywords
  const keywordsPos = textContent.search(/Keywords:/i);
  if (keywordsPos !== -1) {
    const afterKw = textContent.substring(keywordsPos + 9).trim();
    const endKw = afterKw.search(/(\n\n|Introduction|This work|Received)/i);
    let kwText = endKw !== -1 ? afterKw.substring(0, endKw).trim() : afterKw.substring(0, 150).trim();
    kwText = kwText.replace(/[\r\n]+/g, ' ');
    if (kwText) {
      detected.keywords = kwText;
    }
  }

  // 7. Auto-detect Received, Revised, Accepted Dates
  const receivedMatch = textContent.match(/Received\s+([A-Za-z]+\s+\d{4})/i);
  if (receivedMatch) detected.receivedDate = receivedMatch[1];

  const revisedMatch = textContent.match(/Revised\s+([A-Za-z]+\s+\d{4})/i);
  if (revisedMatch) detected.revisedDate = revisedMatch[1];

  const acceptedMatch = textContent.match(/Accepted\s+([A-Za-z]+\s+\d{4})/i);
  if (acceptedMatch) detected.acceptedDate = acceptedMatch[1];

  // 8. Auto-detect Authors & Affiliations
  // If text has lines between title and abstract
  if (textContent) {
    const lines = textContent.split('\n').map((l) => l.trim()).filter(Boolean);
    // Find index of title and index of abstract
    let titleIdx = 0;
    let absIdx = lines.findIndex((l) => /ABSTRACT/i.test(l));
    if (absIdx > titleIdx + 1) {
      const authorCandidateLines = lines.slice(titleIdx + 1, absIdx);
      if (authorCandidateLines.length > 0) {
        // author line is usually the first 1-2 lines
        const authorLine = authorCandidateLines[0];
        if (authorLine && authorLine.length < 200 && !authorLine.toLowerCase().includes('department')) {
          detected.authors = authorLine;
        }
        if (authorCandidateLines.length > 1) {
          const affilLines = authorCandidateLines.slice(1).filter((l) => l.length > 5);
          if (affilLines.length > 0) {
            detected.affiliation = affilLines.join('\n');
          }
        }
      }
    }
  }

  return detected;
}
