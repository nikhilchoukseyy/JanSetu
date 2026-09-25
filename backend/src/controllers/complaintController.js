import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { processComplaint } from '../services/complaintProcessingService.js';
import { serializeComplaint, serializeComplaints } from '../serializers/complaintSerializer.js';
import { COMPLAINT_CATEGORIES } from '../services/aiService.js';

const ALLOWED_STATUSES = ['received', 'processing', 'processed', 'failed'];

/**
 * Maps dashboard category filter aliases to backend canonical categories.
 */
const CATEGORY_ALIASES = {
  water: 'Water Supply',
  roads: 'Roads & Infrastructure',
  sanitation: 'Sanitation & Waste Management',
  electricity: 'Electricity & Power',
};

/**
 * @route   POST /api/complaints
 * @desc    Submit a new citizen complaint
 * @access  Public
 */
export const createComplaint = async (req, res, next) => {
  try {
    const { originalText, audioReference, language, location } = req.body;

    // 1. Validate input source (at least text or audioReference must be provided)
    const hasText = originalText && typeof originalText === 'string' && originalText.trim().length > 0;
    const hasAudio = audioReference && typeof audioReference === 'string' && audioReference.trim().length > 0;

    if (!hasText && !hasAudio) {
      return res.status(400).json({
        success: false,
        message: 'Either originalText or audioReference must be provided',
      });
    }

    // 2. Validate location object
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for citizen demand aggregation',
      });
    }

    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates must be an array of exactly [longitude, latitude]',
      });
    }

    const [longitude, latitude] = location.coordinates;

    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be valid finite numbers: [longitude, latitude]',
      });
    }

    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of bounds: longitude must be between -180 and 180, latitude between -90 and 90',
      });
    }

    // Explicitly construct GeoJSON Point; discard client-supplied AI fields and status
    const complaintData = {
      originalText: hasText ? originalText.trim() : null,
      audioReference: hasAudio ? audioReference.trim() : null,
      language: language && typeof language === 'string' ? language.trim() : null,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      // status defaults to 'received' in schema
    };

    const complaint = await Complaint.create(complaintData);

    return res.status(201).json({
      success: true,
      message: 'Complaint registered successfully',
      data: serializeComplaint(complaint),
    });
  } catch (error) {
    // Handle Mongoose validation errors gracefully
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @route   GET /api/complaints
 * @desc    Retrieve complaints with pagination, sorting (newest first), and optional filtering
 * @access  Public
 */
export const getComplaints = async (req, res, next) => {
  try {
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);

    const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
    let limit = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : 10;
    if (limit > 1000) {
      limit = 1000; // Cap limit to prevent excessive resource consumption
    }

    const filter = {};

    // Optional status filter
    if (req.query.status) {
      const statusTrimmed = String(req.query.status).trim();
      if (!ALLOWED_STATUSES.includes(statusTrimmed)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
        });
      }
      filter.status = statusTrimmed;
    }

    // Optional category filter with dashboard alias mapping
    if (req.query.category) {
      const categoryTrimmed = String(req.query.category).trim();
      if (categoryTrimmed && categoryTrimmed.toLowerCase() !== 'all') {
        const lower = categoryTrimmed.toLowerCase();
        if (CATEGORY_ALIASES[lower]) {
          filter.category = CATEGORY_ALIASES[lower];
        } else {
          const canonicalMatch = COMPLAINT_CATEGORIES.find(
            (cat) => cat.toLowerCase() === lower
          );
          filter.category = canonicalMatch || categoryTrimmed;
        }
      }
    }

    const skip = (page - 1) * limit;

    const [totalDocs, complaints] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
    ]);

    const totalPages = Math.ceil(totalDocs / limit) || 1;

    return res.status(200).json({
      success: true,
      data: serializeComplaints(complaints),
      pagination: {
        total: totalDocs,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/complaints/:id
 * @desc    Retrieve single complaint by ID
 * @access  Public
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID format',
      });
    }

    const complaint = await Complaint.findById(id).select('-__v').lean();

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeComplaint(complaint),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/complaints/:id/process
 * @desc    Explicitly trigger AI processing for a citizen complaint
 * @access  Public
 */
export const processComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await processComplaint(id);

    const responsePayload = {
      success: result.success,
      code: result.code,
      message: result.message,
    };

    if (result.data) {
      responsePayload.data = serializeComplaint(result.data);
    }

    return res.status(result.statusCode).json(responsePayload);
  } catch (error) {
    next(error);
  }
};
