import express from 'express';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { processDocxToPdf } from './server/docxProcessor.js';
import { processPdfOverlay } from './server/pdfProcessor.js';
import { createSampleDocxBuffer, createSamplePdfBuffer } from './server/sampleGenerator.js';
import { parseManuscriptBuffer } from './server/manuscriptParser.js';
import { GalleyMetadata, GalleyResponse } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Configure Multer memory storage (Max 25 MB file, 50 MB field for base64 logo metadata)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25 MB
      fieldSize: 50 * 1024 * 1024, // 50 MB
    },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.docx' || ext === '.pdf') {
        cb(null, true);
      } else {
        cb(new Error('INVALID_FILE_TYPE'));
      }
    },
  });

  // API Route: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Galley Engine' });
  });

  // API Route: Sample Files Download/Get
  app.get('/api/sample/docx', async (_req, res) => {
    try {
      const buffer = await createSampleDocxBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="sample-manuscript.docx"');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate sample docx: ' + err.message });
    }
  });

  app.get('/api/sample/pdf', async (_req, res) => {
    try {
      const buffer = await createSamplePdfBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="sample-manuscript.pdf"');
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate sample pdf: ' + err.message });
    }
  });

  // API Route: Parse Manuscript Metadata (Auto-detect fields)
  app.post('/api/parse-manuscript', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  }, async (req, res) => {
    try {
      let fileBuffer: Buffer;
      let originalName = 'sample.docx';

      if (req.body.useSampleType === 'docx' || !req.file) {
        fileBuffer = await createSampleDocxBuffer();
        originalName = 'sample-manuscript.docx';
      } else {
        fileBuffer = req.file.buffer;
        originalName = req.file.originalname;
      }

      const parsedData = await parseManuscriptBuffer(fileBuffer, originalName);
      res.json({ success: true, metadata: parsedData });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to parse manuscript: ' + err.message });
    }
  });

  // API Route: Generate Galley Proof PDF
  app.post('/api/generate-galley', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File size exceeds the 25 MB limit. Please upload a smaller manuscript.',
          });
        }
        if (err.code === 'LIMIT_FIELD_VALUE') {
          return res.status(400).json({
            error: 'Form data or logo image size is too large.',
          });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
          return res.status(400).json({
            error: 'Unsupported file type. Only .docx and .pdf manuscript files are accepted.',
          });
        }
        return res.status(400).json({ error: err.message || 'Error uploading manuscript file.' });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const file = req.file;

      // Handle sample shortcut if sent
      const useSampleType = req.body.useSampleType as string | undefined;

      let fileBuffer: Buffer;
      let originalName: string;
      let ext: string;

      if (useSampleType === 'docx') {
        fileBuffer = await createSampleDocxBuffer();
        originalName = 'sample-manuscript.docx';
        ext = '.docx';
      } else if (useSampleType === 'pdf') {
        fileBuffer = await createSamplePdfBuffer();
        originalName = 'sample-manuscript.pdf';
        ext = '.pdf';
      } else {
        if (!file) {
          return res.status(400).json({
            error: 'Manuscript file is required. Please select a .docx or .pdf file.',
          });
        }
        fileBuffer = file.buffer;
        originalName = file.originalname;
        ext = path.extname(originalName).toLowerCase();
      }

      if (ext !== '.docx' && ext !== '.pdf') {
        return res.status(400).json({
          error: 'Unsupported file extension. Only .docx and .pdf files are accepted.',
        });
      }

      // Parse metadata from body
      const metadata: GalleyMetadata = {
        journalName: req.body.journalName || '',
        subTitle: req.body.subTitle || '',
        publisherName: req.body.publisherName || '',
        runningHeader: req.body.runningHeader || '',
        pageRange: req.body.pageRange || '',
        volume: req.body.volume || '',
        issue: req.body.issue || '',
        year: req.body.year || new Date().getFullYear().toString(),
        doi: req.body.doi || '',
        title: req.body.title || '',
        authors: req.body.authors || '',
        affiliation: req.body.affiliation || '',
        abstract: req.body.abstract || '',
        keywords: req.body.keywords || '',
        orcid: req.body.orcid || '',
        correspondingAuthor: req.body.correspondingAuthor || '',
        leftLogoUrl: req.body.leftLogoUrl || '',
        rightLogoUrl: req.body.rightLogoUrl || '',
        receivedDate: req.body.receivedDate || '',
        revisedDate: req.body.revisedDate || '',
        acceptedDate: req.body.acceptedDate || '',
        licenseType: req.body.licenseType || 'CC BY 4.0',
        licenseText: req.body.licenseText || '',
        showArticleInfo: req.body.showArticleInfo === 'true' || req.body.showArticleInfo === true || req.body.showArticleInfo === undefined,
        layoutTemplate: (req.body.layoutTemplate as any) || 'fountain',
        fontFamily: req.body.fontFamily || 'Georgia',
        addWatermark: req.body.addWatermark === 'true' || req.body.addWatermark === true,
        twoColumn: req.body.twoColumn === 'true' || req.body.twoColumn === true,
      };

      const shortId = Math.random().toString(36).substring(2, 8);
      const filename = `galley-proof-${shortId}.pdf`;
      const todayStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      let finalPdfBuffer: Buffer;
      let detectedTitle: string | undefined = undefined;
      let pageCount: number | undefined = undefined;

      if (ext === '.docx') {
        const result = await processDocxToPdf(fileBuffer, metadata, todayStr);
        finalPdfBuffer = result.pdfBuffer;
        detectedTitle = result.detectedTitle;
      } else {
        const result = await processPdfOverlay(fileBuffer, metadata);
        finalPdfBuffer = result.pdfBuffer;
        pageCount = result.pageCount;
      }

      // Format response as JSON containing base64 PDF
      const pdfBase64 = finalPdfBuffer.toString('base64');

      const responsePayload: GalleyResponse = {
        pdfBase64,
        filename,
        fileType: ext === '.docx' ? 'docx' : 'pdf',
        detectedTitle,
        pageCount,
      };

      res.json(responsePayload);
    } catch (err: any) {
      console.error('Galley Generation Error:', err);
      res.status(500).json({
        error: `Galley proof generation failed: ${err.message || 'An unexpected error occurred during processing.'}`,
      });
    }
  });

  // Catch-all 404 for API endpoints so they never fall through to SPA index.html
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Express JSON Error Handler for API routes
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Server Error]', err);
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
      error: err.message || 'An error occurred on the galley engine server.',
    });
  });

  // Vite middleware or production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Galley Engine] Express server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Galley Engine] Server startup error:', err);
  process.exit(1);
});
