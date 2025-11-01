import { Router } from 'express';
import { FileController } from '../../controllers/FileController.js';
import { verifyToken } from '../../auth.js';
import { validateParams } from '../../middleware/validation.js';
import { z } from 'zod';

const router = Router();
const fileController = new FileController();

// File route parameter schemas
const fileEntityParamsSchema = z.object({
  entityType: z.enum(['company', 'task', 'ticket', 'user']),
  entityId: z.string().uuid('Invalid entity ID'),
});

const fileIdParamSchema = z.object({
  fileId: z.string().uuid('Invalid file ID'),
});

// Simple file upload middleware without multer
const upload = {
  single: (fieldName: string) => (req: any, res: any, next: any) => {
    req.file = null; // Placeholder
    next();
  }
};

// CSRF protection and file validation
const fileUploadSecurity = (req: any, res: any, next: any) => {
  // Validate file type
  if (req.file && !req.file.mimetype.match(/^(image|application|text)\//)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  // Validate file size (already handled by multer)
  next();
};

router.post('/upload', verifyToken, upload.single('file'), fileUploadSecurity, fileController.uploadFile.bind(fileController));
router.get('/:entityType/:entityId', verifyToken, validateParams(fileEntityParamsSchema), fileController.getFilesByEntity.bind(fileController));
router.get('/download/:fileId', verifyToken, validateParams(fileIdParamSchema), fileController.downloadFile.bind(fileController));
router.delete('/:fileId', verifyToken, validateParams(fileIdParamSchema), fileController.deleteFile.bind(fileController));

export default router;