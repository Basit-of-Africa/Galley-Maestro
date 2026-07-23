import { Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates a realistic sample academic manuscript as a .docx buffer
 */
export async function createSampleDocxBuffer(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Quantum Coherence in Photosynthetic Light-Harvesting Complexes',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Dr. Elena Rostova',
                bold: true,
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Department of Applied Physics, Bio-Quantum Laboratory, Zurich Institute of Science',
                italics: true,
                size: 18,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '1. Introduction',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Light-harvesting complexes in photosynthetic organisms demonstrate remarkable energy transfer efficiency exceeding 95%. Recent ultrafast spectroscopic observations suggest that quantum coherence plays a pivotal role in optimizing electronic energy migration through chromophore networks.'
              ),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(
                'In this study, we present a generalized quantum master equation approach to simulate exciton dynamics under physiological thermal fluctuations. Our model incorporates non-Markovian bath interactions and vibrational-electronic coupling.'
              ),
            ],
          }),
          new Paragraph({
            text: '2. Theoretical Framework and Methods',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'The system Hamiltonian is partitioned into site energies, inter-site electronic couplings, and bath oscillators. Energy dynamics are evaluated using time-dependent perturbation theory integrated over femtosecond timescales.'
              ),
            ],
          }),
          new Paragraph({
            text: 'Experimental Parameter Comparisons',
            heading: HeadingLevel.HEADING_3,
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Parameter', bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Standard Markovian', bold: true })] })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Proposed Non-Markovian', bold: true })] })],
                    width: { size: 35, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Coherence Lifetime (fs)' })] }),
                  new TableCell({ children: [new Paragraph({ text: '120 ± 15' })] }),
                  new TableCell({ children: [new Paragraph({ text: '410 ± 22' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Transfer Efficiency (%)' })] }),
                  new TableCell({ children: [new Paragraph({ text: '84.2%' })] }),
                  new TableCell({ children: [new Paragraph({ text: '98.7%' })] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: '3. Results and Discussion',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'Our simulations confirm that long-lived quantum beating signals observed in 2D electronic spectra are sustained by specific intramolecular vibrational modes. These resonant modes prevent rapid decoherence and construct destructive interference paths against thermal energy sinks.'
              ),
            ],
          }),
          new Paragraph({
            text: '4. Conclusion',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun(
                'By establishing a quantitative link between vibrational resonance and quantum transport efficiency, these findings offer architectural blueprints for next-generation biomimetic solar energy harvesting devices.'
              ),
            ],
          }),
        ],
      },
    ],
  });

  const Packer = (await import('docx')).Packer;
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Generates a sample pre-typeset PDF manuscript as a Buffer
 */
export async function createSamplePdfBuffer(): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();

  let y = height - 60;

  // Title
  const title = 'Neural Signal Decoding via Deep Transformer Architectures';
  page.drawText(title, {
    x: 54,
    y,
    size: 18,
    font: fontTimesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 25;

  // Author
  page.drawText('Prof. Marcus Vance & Dr. Sarah Jenkins', {
    x: 54,
    y,
    size: 11,
    font: fontTimesBold,
    color: rgb(0.2, 0.25, 0.3),
  });
  y -= 16;

  // Affiliation
  page.drawText('Center for Neuro-Engineering & Brain-Computer Interfaces, MIT', {
    x: 54,
    y,
    size: 9.5,
    font: fontTimesItalic,
    color: rgb(0.4, 0.45, 0.5),
  });
  y -= 30;

  // Divider
  page.drawLine({
    start: { x: 54, y },
    end: { x: width - 54, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Abstract
  page.drawText('ABSTRACT', {
    x: 54,
    y,
    size: 9,
    font: fontTimesBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y -= 14;

  const abstractLines = [
    'Brain-computer interfaces require robust signal classification from high-density electroencephalography (EEG).',
    'Here we evaluate multi-head attention mechanisms for continuous motor imagery decoding across 120 subjects.',
    'Our Transformer network achieves 94.8% classification accuracy, surpassing classical convolutional baselines.',
  ];

  for (const line of abstractLines) {
    page.drawText(line, {
      x: 54,
      y,
      size: 9.5,
      font: fontTimesItalic,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 13;
  }
  y -= 20;

  // Section 1
  page.drawText('1. Introduction and Related Work', {
    x: 54,
    y,
    size: 12,
    font: fontTimesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 18;

  const bodyParagraphs = [
    'Non-invasive brain mapping has experienced unprecedented progress due to advancements in machine learning.',
    'Traditional feature extraction relies on manual bandpass filtering and spatial patterns, which are prone to artifact noise.',
    'By leveraging temporal attention layers, our architecture dynamically isolates neural rhythms associated with intended actions.',
    'Furthermore, cross-subject transfer learning reduces calibration session requirements from 45 minutes to under 3 minutes.',
  ];

  for (const p of bodyParagraphs) {
    page.drawText(p, {
      x: 54,
      y,
      size: 10.5,
      font: fontTimes,
      color: rgb(0.15, 0.15, 0.15),
    });
    y -= 18;
  }

  // Second page
  const page2 = pdfDoc.addPage([612, 792]);
  let y2 = 730;

  page2.drawText('2. Experimental Results and Discussion', {
    x: 54,
    y: y2,
    size: 12,
    font: fontTimesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y2 -= 20;

  page2.drawText('Table 1: Classification Performance Comparisons across Models', {
    x: 54,
    y: y2,
    size: 10,
    font: fontTimesBold,
    color: rgb(0.2, 0.2, 0.2),
  });
  y2 -= 20;

  page2.drawText('Model Architecture         Accuracy (%)     Latency (ms)', {
    x: 54,
    y: y2,
    size: 9.5,
    font: fontTimesBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  y2 -= 14;

  const tableRows = [
    'Common Spatial Pattern      78.2% ± 3.1      12 ms',
    'Deep ConvNet (2017)         86.4% ± 2.4      28 ms',
    'EEG-Conformer (2022)        91.1% ± 1.8      45 ms',
    'Proposed Transformer        94.8% ± 1.1      18 ms',
  ];

  for (const row of tableRows) {
    page2.drawText(row, {
      x: 54,
      y: y2,
      size: 9.5,
      font: fontTimes,
      color: rgb(0.2, 0.2, 0.2),
    });
    y2 -= 14;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
