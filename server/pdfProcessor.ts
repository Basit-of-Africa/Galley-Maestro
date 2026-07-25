import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { GalleyMetadata } from '../src/types.js';

export async function processPdfOverlay(
  fileBuffer: Buffer,
  metadata: GalleyMetadata
): Promise<{ pdfBuffer: Buffer; pageCount: number }> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const fontSans = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const journalName = (metadata.journalName?.trim() || 'ACADEMIC JOURNAL OF RESEARCH').toUpperCase();
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
  const showWatermark = metadata.addWatermark ?? true;

  for (let i = 0; i < totalPages; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNumber = i + 1;

    // 1. Running Header (Suppressed on Page 1)
    if (i > 0) {
      const headerText = journalName;
      const headerFontSize = 8.5;
      const headerWidth = fontSansBold.widthOfTextAtSize(headerText, headerFontSize);
      const headerX = (width / 2) - (headerWidth / 2);
      const headerY = height - 34;

      page.drawText(headerText, {
        x: headerX,
        y: headerY,
        size: headerFontSize,
        font: fontSansBold,
        color: rgb(0.3, 0.35, 0.42),
      });

      // Thin rule underneath header
      page.drawLine({
        start: { x: 40, y: height - 42 },
        end: { x: width - 40, y: height - 42 },
        thickness: 0.5,
        color: rgb(0.8, 0.83, 0.88),
      });
    }

    // 2. Footer (3 Zones)
    const footerY = 24;
    const footerFontSize = 8;
    const textColor = rgb(0.3, 0.35, 0.42);

    // Left zone: Vol / Issue / Year
    page.drawText(volIssueYear, {
      x: 40,
      y: footerY,
      size: footerFontSize,
      font: fontSansBold,
      color: textColor,
    });

    // Center zone: DOI & Corresponding Author
    const corrEmail = metadata.correspondingAuthor?.trim() || 'ademola201052@yahoo.com';
    const centerParts = [doiStr, `Corr. Author: ${corrEmail}`].filter(Boolean);
    const centerText = centerParts.join(' | ');

    if (centerText) {
      const centerWidth = fontSans.widthOfTextAtSize(centerText, footerFontSize);
      page.drawText(centerText, {
        x: (width / 2) - (centerWidth / 2),
        y: footerY,
        size: footerFontSize,
        font: fontSans,
        color: textColor,
      });
    }

    // Right zone: Page N of Total
    const pageStr = `Page ${pageNumber} of ${totalPages}`;
    const pageStrWidth = fontSans.widthOfTextAtSize(pageStr, footerFontSize);
    page.drawText(pageStr, {
      x: width - 40 - pageStrWidth,
      y: footerY,
      size: footerFontSize,
      font: fontSans,
      color: textColor,
    });

    // Thin rule above footer
    page.drawLine({
      start: { x: 40, y: 38 },
      end: { x: width - 40, y: 38 },
      thickness: 0.5,
      color: rgb(0.8, 0.83, 0.88),
    });

    // 3. Optional Diagonal Watermark
    if (showWatermark) {
      const watermarkText = 'GALLEY PROOF';
      const watermarkSize = 52;
      const watermarkWidth = fontSansBold.widthOfTextAtSize(watermarkText, watermarkSize);
      const watermarkHeight = fontSansBold.heightAtSize(watermarkSize);

      page.drawText(watermarkText, {
        x: (width / 2) - (watermarkWidth / 2),
        y: (height / 2) - (watermarkHeight / 2),
        size: watermarkSize,
        font: fontSansBold,
        color: rgb(0.7, 0.75, 0.8),
        opacity: 0.12,
        rotate: degrees(45),
      });
    }
  }

  const outputBytes = await pdfDoc.save();
  return {
    pdfBuffer: Buffer.from(outputBytes),
    pageCount: totalPages,
  };
}
