import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  processComplaintById,
} from '../controllers/complaintController.js';

const router = Router();

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById);

router.route('/:id/process')
  .post(processComplaintById);

export default router;
