import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';

import { getCorsOptions } from './config/corsConfig.js';

const app = express();

// CORS middleware configuration with preflight support
app.use(cors(getCorsOptions()));

// Built-in body parsing middlewares with safe payload size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/auth', authRoutes);

// Catch 404 and forward to error handler
app.use(notFound);

// Centralized error handling
app.use(errorHandler);

export default app;
