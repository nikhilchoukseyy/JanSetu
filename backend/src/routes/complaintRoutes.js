import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  processComplaintById,
} from '../controllers/complaintController.js';
import {
  complaintCreateLimiter,
  complaintProcessLimiter,
  complaintGeneralLimiter,
} from '../middleware/rateLimiter.js';
import {
  validateCreateComplaint,
  validateComplaintId,
  validateGetComplaintsQuery,
} from '../middleware/validation.js';

const router = Router();

router.route('/')
  .post(complaintCreateLimiter, validateCreateComplaint, createComplaint)
  .get(complaintGeneralLimiter, validateGetComplaintsQuery, getComplaints);

router.route('/:id')
  .get(complaintGeneralLimiter, validateComplaintId, getComplaintById);

router.route('/:id/process')
  .post(complaintProcessLimiter, validateComplaintId, processComplaintById);

export default router;
