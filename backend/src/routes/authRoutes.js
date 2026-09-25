import express from "express";
import { loginPolicymaker } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginPolicymaker);

export default router;