import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { analyzeComplaintText, AiServiceError } from './aiService.js';

/**
 * Orchestrates AI processing for a single citizen complaint.
 * Manages atomic status transitions: (received | failed) -> processing -> (processed | failed).
 *
 * @param {string} complaintId - MongoDB ObjectId of the complaint
 * @param {object} [options={}] - Options passed to the AI service (e.g. timeout, aiServiceUrl)
 * @returns {Promise<{ success: boolean, statusCode: number, code: string, message: string, data?: object }>}
 */
export const processComplaint = async (complaintId, options = {}) => {
  // 1. Validate MongoDB ObjectId format
  if (!complaintId || !mongoose.Types.ObjectId.isValid(complaintId)) {
    return {
      success: false,
      statusCode: 400,
      code: 'INVALID_ID',
      message: 'Invalid complaint ID format',
    };
  }

  // 2. Concurrency Control: Atomically acquire processing lock for 'received' or 'failed' complaints
  const complaint = await Complaint.findOneAndUpdate(
    {
      _id: complaintId,
      status: { $in: ['received', 'failed'] },
    },
    {
      $set: { status: 'processing' },
    },
    { returnDocument: 'after' }
  );

  // 3. Handle state if atomic transition did not match
  if (!complaint) {
    const existing = await Complaint.findById(complaintId);
    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Complaint not found',
      };
    }

    if (existing.status === 'processing') {
      return {
        success: false,
        statusCode: 409,
        code: 'ALREADY_PROCESSING',
        message: 'Complaint is currently being processed. Please wait for the current job to complete.',
        data: existing,
      };
    }

    if (existing.status === 'processed') {
      return {
        success: true,
        statusCode: 200,
        code: 'ALREADY_PROCESSED',
        message: 'Complaint has already been processed',
        data: existing,
      };
    }

    return {
      success: false,
      statusCode: 400,
      code: 'INVALID_STATUS',
      message: `Complaint cannot be processed in its current status: '${existing.status}'`,
      data: existing,
    };
  }

  // 4. Validate usable originalText input
  const hasText = complaint.originalText && typeof complaint.originalText === 'string' && complaint.originalText.trim().length > 0;
  if (!hasText) {
    complaint.status = 'failed';
    await complaint.save();
    return {
      success: false,
      statusCode: 400,
      code: 'MISSING_TEXT',
      message: 'Complaint does not contain usable originalText for AI analysis. Status updated to failed.',
      data: complaint,
    };
  }

  // 5. Invoke AI Adapter
  try {
    const aiResult = await analyzeComplaintText(complaint.originalText, options);

    // 6. Persist structured AI fields & transition to 'processed'
    if (aiResult.language) {
      complaint.language = aiResult.language;
    }
    complaint.translatedText = aiResult.translatedText;
    complaint.category = aiResult.category;
    complaint.summary = aiResult.summary;
    complaint.status = 'processed';

    await complaint.save();

    return {
      success: true,
      statusCode: 200,
      code: 'PROCESSED',
      message: 'Complaint processed successfully',
      data: complaint,
    };
  } catch (error) {
    // 7. On failure, safely transition status to 'failed' while preserving existing data
    complaint.status = 'failed';
    await complaint.save();

    const statusCode = error instanceof AiServiceError && error.statusCode ? error.statusCode : 502;
    const errorCode = error instanceof AiServiceError && error.code ? error.code : 'PROCESSING_FAILED';

    return {
      success: false,
      statusCode,
      code: errorCode,
      message: `AI processing failed: ${error.message || 'Unknown error'}. Status set to failed.`,
      data: complaint,
    };
  }
};
