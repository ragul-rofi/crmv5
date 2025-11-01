import { Router, RequestHandler } from "express";
import { query } from "../../db.js";
import { z } from "zod";
import { verifyToken } from "../../auth.js";
import { enforceReadOnly, logSensitiveOperation } from "../../middleware/roleMiddleware.js";
import { validateRequest, validateParams, validateQuery } from "../../middleware/validation.js";
import { createFollowUpSchema, updateFollowUpSchema, uuidParamSchema } from "../../schemas/validation.js";
import { auditMiddleware } from "../../middleware/audit.js";

const router = Router();

// Query validation schema for follow-ups
const followUpQuerySchema = z.object({
  companyId: z.string().uuid('Invalid company ID'),
});

// GET /api/v1/follow-ups - Get follow-ups for a company
const getFollowUps: RequestHandler = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Company ID is required",
        timestamp: new Date().toISOString()
      });
    }

    const result = await query(
      `SELECT 
        f.*,
        u.full_name as contacted_by_name
       FROM follow_ups f
       LEFT JOIN users u ON f.contacted_by_id = u.id
       WHERE f.company_id = $1
       ORDER BY f.follow_up_date DESC, f.created_at DESC`,
      [companyId]
    );

    return res.json({
      success: true,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch follow-ups",
      timestamp: new Date().toISOString()
    });
  }
};

// POST /api/v1/follow-ups - Create new follow-up
const createFollowUp: RequestHandler = async (req, res) => {
  try {
    const validatedData = createFollowUpSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated",
        timestamp: new Date().toISOString()
      });
    }

    const result = await query(
      `INSERT INTO follow_ups (
        company_id,
        contacted_date,
        follow_up_date,
        follow_up_notes,
        contacted_by_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        validatedData.company_id,
        validatedData.contacted_date,
        validatedData.follow_up_date,
        validatedData.follow_up_notes || null,
        userId,
      ]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: "Validation error", 
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }
    console.error("Error creating follow-up:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create follow-up",
      timestamp: new Date().toISOString()
    });
  }
};

// PUT /api/v1/follow-ups/:id - Update follow-up
const updateFollowUp: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { contacted_date, follow_up_date, follow_up_notes } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated",
        timestamp: new Date().toISOString()
      });
    }

    const result = await query(
      `UPDATE follow_ups
       SET contacted_date = COALESCE($1, contacted_date),
           follow_up_date = COALESCE($2, follow_up_date),
           follow_up_notes = COALESCE($3, follow_up_notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [contacted_date, follow_up_date, follow_up_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Follow-up not found",
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating follow-up:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update follow-up",
      timestamp: new Date().toISOString()
    });
  }
};

// DELETE /api/v1/follow-ups/:id - Delete follow-up (Admin only - others must use deletion request)
const deleteFollowUp: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "User not authenticated",
        timestamp: new Date().toISOString()
      });
    }

    // Only Admin can delete follow-ups directly
    // Other roles must create a deletion request via /followup-deletion-requests
    if (userRole !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can delete follow-ups directly. Please create a deletion request instead.',
        hint: 'Use POST /api/v1/followup-deletion-requests to request deletion',
        timestamp: new Date().toISOString()
      });
    }

    const result = await query(
      `DELETE FROM follow_ups WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Follow-up not found",
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: { message: "Follow-up deleted successfully" },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting follow-up:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete follow-up",
      timestamp: new Date().toISOString()
    });
  }
};

router.get("/", verifyToken, validateQuery(followUpQuerySchema), getFollowUps);
router.post("/", verifyToken, enforceReadOnly, validateRequest(createFollowUpSchema), auditMiddleware('follow_up', {}), createFollowUp);
router.put("/:id", verifyToken, enforceReadOnly, validateParams(uuidParamSchema), validateRequest(updateFollowUpSchema), auditMiddleware('follow_up', {}), updateFollowUp);
router.delete("/:id", verifyToken, enforceReadOnly, validateParams(uuidParamSchema), auditMiddleware('follow_up', { logSensitiveOperations: true }), logSensitiveOperation('DELETE_FOLLOWUP'), deleteFollowUp);

export default router;