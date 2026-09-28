import { Router } from 'express';
import { loginPolicymaker } from '../controllers/authController.js';

const router = Router();

router.post('/login', loginPolicymaker);

export default router;
