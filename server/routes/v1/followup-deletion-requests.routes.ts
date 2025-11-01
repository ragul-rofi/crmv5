import { Router, RequestHandler } from "express";
import { query } from "../../db.js";
import { z } from "zod";
import { verifyToken } from "../../auth.js";
import { enforceReadOnly } from "../../middleware/roleMiddleware.js";
import { validateRequest, validateParams } from "../../middleware/validation.js";
import { sendError, sendSuccess } from "../../utils/standardResponse.js";

const router = Router();

// Validation schemas
const createDeletionRequestSchema = z.object({
  followup_id: z.string().uuid('Invalid follow-up ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').optional(),
});

const reviewDeletionRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

// GET /api/v1/followup-deletion-requests - Get all deletion requests (for managers)
const getDeletionRequests: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Only managers and above can view all deletion requests
    const allowedRoles = ['Admin', 'Head', 'SubHead', 'Manager'];
    if (!allowedRoles.includes(userRole)) {
      return sendError(res, "Unauthorized to view deletion requests", 403);
    }

    const result = await query(
      `SELECT 
        fdr.*,
        f.contacted_date,
        f.follow_up_date,
        f.follow_up_notes,
        c.name as company_name,
        u.full_name as requested_by_name,
        u.role as requested_by_role,
        reviewer.full_name as reviewed_by_name
       FROM followup_deletion_requests fdr
       LEFT JOIN follow_ups f ON fdr.followup_id = f.id
       LEFT JOIN companies c ON fdr.company_id = c.id
       LEFT JOIN users u ON fdr.requested_by_id = u.id
       LEFT JOIN users reviewer ON fdr.reviewed_by_id = reviewer.id
       ORDER BY 
         CASE WHEN fdr.status = 'pending' THEN 0 ELSE 1 END,
         fdr.created_at DESC`
    );

    return sendSuccess(res, result.rows);
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return sendError(res, "Failed to fetch deletion requests", 500);
  }
};

// GET /api/v1/followup-deletion-requests/my - Get user's own deletion requests
const getMyDeletionRequests: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    const result = await query(
      `SELECT 
        fdr.*,
        f.contacted_date,
        f.follow_up_date,
        f.follow_up_notes,
        c.name as company_name,
        reviewer.full_name as reviewed_by_name
       FROM followup_deletion_requests fdr
       LEFT JOIN follow_ups f ON fdr.followup_id = f.id
       LEFT JOIN companies c ON fdr.company_id = c.id
       LEFT JOIN users reviewer ON fdr.reviewed_by_id = reviewer.id
       WHERE fdr.requested_by_id = $1
       ORDER BY fdr.created_at DESC`,
      [userId]
    );

    return sendSuccess(res, result.rows);
  } catch (error) {
    console.error("Error fetching user's deletion requests:", error);
    return sendError(res, "Failed to fetch deletion requests", 500);
  }
};

// POST /api/v1/followup-deletion-requests - Create deletion request
const createDeletionRequest: RequestHandler = async (req, res) => {
  try {
    const validatedData = createDeletionRequestSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Get the follow-up to find the company_id
    const followUpResult = await query(
      `SELECT company_id FROM follow_ups WHERE id = $1`,
      [validatedData.followup_id]
    );

    if (followUpResult.rows.length === 0) {
      return sendError(res, "Follow-up not found", 404);
    }

    const companyId = followUpResult.rows[0].company_id;

    // Check if there's already a pending request for this follow-up
    const existingRequest = await query(
      `SELECT id FROM followup_deletion_requests 
       WHERE followup_id = $1 AND status = 'pending'`,
      [validatedData.followup_id]
    );

    if (existingRequest.rows.length > 0) {
      return sendError(res, "A deletion request for this follow-up is already pending", 400);
    }

    // Create the deletion request
    const result = await query(
      `INSERT INTO followup_deletion_requests (
        followup_id,
        company_id,
        requested_by_id,
        reason
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        validatedData.followup_id,
        companyId,
        userId,
        validatedData.reason || null,
      ]
    );

    // Create notification for managers
    await query(
      `INSERT INTO notifications (user_id, message, type, entity_type, entity_id)
       SELECT id, $1, 'info', 'followup_deletion_request', $2
       FROM users
       WHERE role IN ('Admin', 'Head', 'SubHead', 'Manager')`,
      [
        `New follow-up deletion request from ${(req as any).user?.full_name}`,
        result.rows[0].id
      ]
    );

    return sendSuccess(res, result.rows[0], undefined, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, "Validation error", 400, error.errors);
    }
    console.error("Error creating deletion request:", error);
    return sendError(res, "Failed to create deletion request", 500);
  }
};

// PUT /api/v1/followup-deletion-requests/:id/review - Review deletion request
const reviewDeletionRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = reviewDeletionRequestSchema.parse(req.body);
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Only managers and above can review deletion requests
    const allowedRoles = ['Admin', 'Head', 'SubHead', 'Manager'];
    if (!allowedRoles.includes(userRole)) {
      return sendError(res, "Unauthorized to review deletion requests", 403);
    }

    // Get the deletion request
    const requestResult = await query(
      `SELECT * FROM followup_deletion_requests WHERE id = $1`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return sendError(res, "Deletion request not found", 404);
    }

    const deletionRequest = requestResult.rows[0];

    if (deletionRequest.status !== 'pending') {
      return sendError(res, "This deletion request has already been reviewed", 400);
    }

    // Update the deletion request
    const updateResult = await query(
      `UPDATE followup_deletion_requests
       SET status = $1,
           reviewed_by_id = $2,
           reviewed_at = CURRENT_TIMESTAMP,
           rejection_reason = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        validatedData.action === 'approve' ? 'approved' : 'rejected',
        userId,
        validatedData.rejection_reason || null,
        id
      ]
    );

    // If approved, delete the follow-up
    if (validatedData.action === 'approve') {
      await query(
        `DELETE FROM follow_ups WHERE id = $1`,
        [deletionRequest.followup_id]
      );
    }

    // Notify the requester
    const statusMessage = validatedData.action === 'approve' 
      ? 'Your follow-up deletion request has been approved'
      : `Your follow-up deletion request has been rejected${validatedData.rejection_reason ? ': ' + validatedData.rejection_reason : ''}`;

    await query(
      `INSERT INTO notifications (user_id, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, 'followup_deletion_request', $4)`,
      [
        deletionRequest.requested_by_id,
        statusMessage,
        validatedData.action === 'approve' ? 'success' : 'warning',
        id
      ]
    );

    return sendSuccess(res, updateResult.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, "Validation error", 400, error.errors);
    }
    console.error("Error reviewing deletion request:", error);
    return sendError(res, "Failed to review deletion request", 500);
  }
};

// DELETE /api/v1/followup-deletion-requests/:id - Cancel deletion request
const cancelDeletionRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendError(res, "User not authenticated", 401);
    }

    // Check if the request exists and belongs to the user
    const requestResult = await query(
      `SELECT * FROM followup_deletion_requests 
       WHERE id = $1 AND requested_by_id = $2`,
      [id, userId]
    );

    if (requestResult.rows.length === 0) {
      return sendError(res, "Deletion request not found or unauthorized", 404);
    }

    const deletionRequest = requestResult.rows[0];

    if (deletionRequest.status !== 'pending') {
      return sendError(res, "Cannot cancel a request that has already been reviewed", 400);
    }

    // Delete the request
    await query(
      `DELETE FROM followup_deletion_requests WHERE id = $1`,
      [id]
    );

    return sendSuccess(res, { message: "Deletion request cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling deletion request:", error);
    return sendError(res, "Failed to cancel deletion request", 500);
  }
};

router.get("/", verifyToken, getDeletionRequests);
router.get("/my", verifyToken, getMyDeletionRequests);
router.post("/", verifyToken, enforceReadOnly, validateRequest(createDeletionRequestSchema), createDeletionRequest);
router.put("/:id/review", verifyToken, enforceReadOnly, validateParams(uuidParamSchema), validateRequest(reviewDeletionRequestSchema), reviewDeletionRequest);
router.delete("/:id", verifyToken, validateParams(uuidParamSchema), cancelDeletionRequest);

export default router;
