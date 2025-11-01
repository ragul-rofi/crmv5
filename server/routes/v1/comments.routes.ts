import { Router } from 'express';
import { CommentController } from '../../controllers/CommentController.js';
import { verifyToken } from '../../auth.js';
import { validateRequest, validateParams } from '../../middleware/validation.js';
import { uuidParamSchema } from '../../schemas/validation.js';
import { z } from 'zod';

const router = Router();
const commentController = new CommentController();

const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  entityType: z.enum(['company', 'task', 'ticket']),
  entityId: z.string().uuid('Invalid entity ID')
});

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required')
});

const commentEntityParamsSchema = z.object({
  entityType: z.enum(['company', 'task', 'ticket']),
  entityId: z.string().uuid('Invalid entity ID')
});

router.get('/:entityType/:entityId', verifyToken, validateParams(commentEntityParamsSchema), commentController.getByEntity.bind(commentController));
router.post('/', verifyToken, validateRequest(createCommentSchema), commentController.create.bind(commentController));
router.put('/:id', verifyToken, validateParams(uuidParamSchema), validateRequest(updateCommentSchema), commentController.update.bind(commentController));
router.delete('/:id', verifyToken, validateParams(uuidParamSchema), commentController.delete.bind(commentController));

export default router;