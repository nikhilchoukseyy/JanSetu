import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
} from '../controllers/complaintController.js';

const router = Router();

router.route('/')
  .post(createComplaint)
  .get(getComplaints);

router.route('/:id')
  .get(getComplaintById);

export default router;
