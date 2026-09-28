import mongoose from 'mongoose';

const ALLOWED_STATUSES = ['received', 'processing', 'processed', 'failed'];
const MAX_TEXT_LENGTH = 5000;
const MAX_AUDIO_REF_LENGTH = 1024;
const MAX_LANG_LENGTH = 50;
const MAX_CATEGORY_LENGTH = 100;

/**
 * Validates and hardens input for citizen complaint registration.
 * Middleware runs before the controller to reject invalid, malicious, or malformed requests early.
 */
export const validateCreateComplaint = (req, res, next) => {
  // 1. Ensure body exists and is an object
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a valid JSON object',
    });
  }

  const { originalText, audioReference, language, location } = req.body;

  // 2. Type and length checks for text inputs
  if (originalText !== undefined && originalText !== null) {
    if (typeof originalText !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'originalText must be a string if provided',
      });
    }
    if (originalText.trim().length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `originalText exceeds maximum allowed length of ${MAX_TEXT_LENGTH} characters`,
      });
    }
  }

  if (audioReference !== undefined && audioReference !== null) {
    if (typeof audioReference !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'audioReference must be a string if provided',
      });
    }
    if (audioReference.trim().length > MAX_AUDIO_REF_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `audioReference exceeds maximum allowed length of ${MAX_AUDIO_REF_LENGTH} characters`,
      });
    }
  }

  if (language !== undefined && language !== null) {
    if (typeof language !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'language must be a string if provided',
      });
    }
    if (language.trim().length > MAX_LANG_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `language code exceeds maximum allowed length of ${MAX_LANG_LENGTH} characters`,
      });
    }
  }

  // 3. Ensure at least one valid source input is provided
  const hasText = originalText && typeof originalText === 'string' && originalText.trim().length > 0;
  const hasAudio = audioReference && typeof audioReference === 'string' && audioReference.trim().length > 0;

  if (!hasText && !hasAudio) {
    return res.status(400).json({
      success: false,
      message: 'Either originalText or audioReference must be provided',
    });
  }

  // 4. Validate location object and coordinates
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
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

  next();
};

/**
 * Validates that the URL route parameter :id is a valid MongoDB ObjectId.
 */
export const validateComplaintId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid complaint ID format',
    });
  }

  req.params.id = id.trim();
  next();
};

/**
 * Validates and sanitizes query parameters for listing complaints.
 */
export const validateGetComplaintsQuery = (req, res, next) => {
  if (req.query.status) {
    const statusTrimmed = String(req.query.status).trim();
    if (!ALLOWED_STATUSES.includes(statusTrimmed)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }
  }

  if (req.query.category) {
    const categoryTrimmed = String(req.query.category).trim();
    if (categoryTrimmed.length > MAX_CATEGORY_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Category filter exceeds maximum allowed length of ${MAX_CATEGORY_LENGTH} characters`,
      });
    }
  }

  if (req.query.page !== undefined) {
    const pageNum = Number(req.query.page);
    if (isNaN(pageNum) || pageNum <= 0 || !Number.isInteger(pageNum)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "page" must be a positive integer',
      });
    }
  }

  if (req.query.limit !== undefined) {
    const limitNum = Number(req.query.limit);
    if (isNaN(limitNum) || limitNum <= 0 || !Number.isInteger(limitNum)) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "limit" must be a positive integer',
      });
    }
  }

  next();
};
