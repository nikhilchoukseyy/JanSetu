/**
 * Custom error class for AI Service operations
 */
export class AiServiceError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (e.g. INVALID_INPUT, MISSING_CONFIG, NETWORK_ERROR, HTTP_ERROR, PARSE_ERROR, TIMEOUT_ERROR)
   * @param {number} [statusCode=500] - Associated HTTP status code
   * @param {Error|null} [originalError=null] - Upstream or underlying error if applicable
   */
  constructor(message, code = 'AI_SERVICE_ERROR', statusCode = 500, originalError = null) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * Standard complaint categories taxonomy for JanSetu
 */
export const COMPLAINT_CATEGORIES = [
  'Water Supply',
  'Roads & Infrastructure',
  'Sanitation & Waste Management',
  'Electricity & Power',
  'Public Health',
  'Public Transport',
  'Other',
];

/**
 * Default AI service base URL
 */
export const DEFAULT_AI_SERVICE_URL = 'http://localhost:8000';

/**
 * Default timeout for AI HTTP requests (in milliseconds)
 */
export const DEFAULT_AI_TIMEOUT_MS = 10000;

/**
 * Maps and normalizes raw FastAPI response into standard JanSetu camelCase contract
 *
 * @param {object} data - Raw JSON response from FastAPI microservice
 * @returns {{ language: string, translatedText: string, category: string, summary: string }}
 * @throws {AiServiceError} If response is malformed or missing required content
 */
export const formatFastApiResponse = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new AiServiceError('Invalid response payload from AI microservice', 'PARSE_ERROR', 502);
  }

  // Support both snake_case (FastAPI) and camelCase properties
  const rawLanguage = data.detected_language || data.language || data.detectedLanguage;
  const rawTranslatedText = data.translated_text || data.translatedText || data.text;
  const rawCategory = data.category;
  const rawSummary = data.summary || data.summary_text || data.summaryText || rawTranslatedText;

  if (!rawLanguage || typeof rawLanguage !== 'string') {
    throw new AiServiceError('AI service response missing language field', 'PARSE_ERROR', 502);
  }

  if (!rawTranslatedText || typeof rawTranslatedText !== 'string') {
    throw new AiServiceError('AI service response missing translatedText field', 'PARSE_ERROR', 502);
  }

  if (!rawCategory || typeof rawCategory !== 'string') {
    throw new AiServiceError('AI service response missing category field', 'PARSE_ERROR', 502);
  }

  // Normalize category against defined taxonomy
  const categoryTrimmed = rawCategory.trim();
  let matchedCategory = COMPLAINT_CATEGORIES.find(
    (cat) => cat.toLowerCase() === categoryTrimmed.toLowerCase()
  );

  // Partial match fallback for variations like "water" -> "Water Supply"
  if (!matchedCategory) {
    matchedCategory = COMPLAINT_CATEGORIES.find((cat) =>
      cat.toLowerCase().includes(categoryTrimmed.toLowerCase()) ||
      categoryTrimmed.toLowerCase().includes(cat.toLowerCase())
    );
  }

  return {
    language: rawLanguage.trim(),
    translatedText: rawTranslatedText.trim(),
    category: matchedCategory || 'Other',
    summary: (typeof rawSummary === 'string' && rawSummary.trim().length > 0)
      ? rawSummary.trim()
      : rawTranslatedText.trim(),
  };
};

/**
 * Analyzes citizen complaint text by delegating to the FastAPI AI microservice.
 * Acts as a decoupled HTTP adapter / client.
 *
 * @param {string} text - Raw complaint text submitted by citizen
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.aiServiceUrl] - Override base URL for AI service
 * @param {string} [options.language] - Optional source language hint
 * @param {number} [options.timeout] - Request timeout in milliseconds (default: 10000ms)
 * @returns {Promise<{ language: string, translatedText: string, category: string, summary: string }>}
 * @throws {AiServiceError}
 */
export const analyzeComplaintText = async (text, options = {}) => {
  // 1. Validate Input
  if (text === undefined || text === null || typeof text !== 'string') {
    throw new AiServiceError('Complaint text must be a valid non-empty string.', 'INVALID_INPUT', 400);
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw new AiServiceError('Complaint text cannot be empty or only whitespace.', 'INVALID_INPUT', 400);
  }

  // 2. Resolve AI service endpoint
  const baseUrl = options.aiServiceUrl || process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL;
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new AiServiceError(
      'AI_SERVICE_URL configuration is missing. Please configure AI_SERVICE_URL in your environment.',
      'MISSING_CONFIG',
      500
    );
  }

  const endpoint = `${baseUrl.trim().replace(/\/+$/, '')}/process-complaint`;
  const timeoutMs = options.timeout || DEFAULT_AI_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = {
    text: trimmedText,
    ...(options.language && typeof options.language === 'string' && { language: options.language.trim() }),
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // Response was not JSON
      }

      throw new AiServiceError(
        `AI microservice returned HTTP ${response.status}: ${errorDetail}`,
        'HTTP_ERROR',
        response.status
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new AiServiceError(
        `Failed to parse response from AI microservice as JSON: ${parseErr.message}`,
        'PARSE_ERROR',
        502,
        parseErr
      );
    }

    return formatFastApiResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AiServiceError) {
      throw error;
    }

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new AiServiceError(
        `AI microservice request timed out after ${timeoutMs}ms`,
        'TIMEOUT_ERROR',
        504,
        error
      );
    }

    throw new AiServiceError(
      `Failed to communicate with AI microservice at ${endpoint}: ${error.message || 'Connection failed'}`,
      'NETWORK_ERROR',
      503,
      error
    );
  }
};

/**
 * Transcribes an audio recording by sending it to FastAPI /transcribe via multipart/form-data.
 *
 * @param {Buffer|Blob|File|object} audioFile - Audio data (Buffer, Blob, File, or Multer file object)
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.aiServiceUrl] - Override base URL for AI service
 * @param {string} [options.filename] - Custom filename for the upload
 * @param {number} [options.timeout] - Request timeout in milliseconds (default: 10000ms)
 * @returns {Promise<{ text: string }>}
 * @throws {AiServiceError}
 */
export const transcribeAudio = async (audioFile, options = {}) => {
  // 1. Validate Input
  if (!audioFile) {
    throw new AiServiceError('Audio file input is required for transcription.', 'INVALID_INPUT', 400);
  }

  let blob;
  let filename = options.filename || 'audio.mp3';

  if (typeof Blob !== 'undefined' && audioFile instanceof Blob) {
    blob = audioFile;
    if (audioFile.name) filename = audioFile.name;
  } else if (Buffer.isBuffer(audioFile) || audioFile instanceof Uint8Array) {
    if (audioFile.length === 0) {
      throw new AiServiceError('Audio file buffer cannot be empty.', 'INVALID_INPUT', 400);
    }
    blob = new Blob([audioFile], { type: 'audio/mpeg' });
  } else if (typeof audioFile === 'object') {
    const rawBuffer = audioFile.buffer || audioFile.data;
    if (rawBuffer && (Buffer.isBuffer(rawBuffer) || rawBuffer instanceof Uint8Array)) {
      if (rawBuffer.length === 0) {
        throw new AiServiceError('Audio file buffer cannot be empty.', 'INVALID_INPUT', 400);
      }
      filename = audioFile.originalname || audioFile.filename || filename;
      blob = new Blob([rawBuffer], { type: audioFile.mimetype || 'audio/mpeg' });
    } else if (audioFile instanceof Blob) {
      blob = audioFile;
      if (audioFile.name) filename = audioFile.name;
    } else if (audioFile.path && typeof audioFile.path === 'string') {
      try {
        const fs = await import('fs');
        const fileBuffer = await fs.promises.readFile(audioFile.path);
        if (fileBuffer.length === 0) {
          throw new AiServiceError('Audio file at path is empty.', 'INVALID_INPUT', 400);
        }
        filename = audioFile.originalname || audioFile.filename || filename;
        blob = new Blob([fileBuffer], { type: audioFile.mimetype || 'audio/mpeg' });
      } catch (fsErr) {
        if (fsErr instanceof AiServiceError) throw fsErr;
        throw new AiServiceError(`Failed to read audio file at path: ${fsErr.message}`, 'INVALID_INPUT', 400, fsErr);
      }
    }
  }

  if (!blob) {
    throw new AiServiceError('Invalid audio file format provided for transcription.', 'INVALID_INPUT', 400);
  }

  // 2. Resolve AI service endpoint
  const baseUrl = options.aiServiceUrl || process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL;
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new AiServiceError(
      'AI_SERVICE_URL configuration is missing. Please configure AI_SERVICE_URL in your environment.',
      'MISSING_CONFIG',
      500
    );
  }

  const endpoint = `${baseUrl.trim().replace(/\/+$/, '')}/transcribe`;
  const timeoutMs = options.timeout || DEFAULT_AI_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const formData = new FormData();
  formData.append('file', blob, filename);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // Response was not JSON
      }

      throw new AiServiceError(
        `AI microservice returned HTTP ${response.status}: ${errorDetail}`,
        'HTTP_ERROR',
        response.status
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new AiServiceError(
        `Failed to parse response from AI microservice as JSON: ${parseErr.message}`,
        'PARSE_ERROR',
        502,
        parseErr
      );
    }

    if (!data || typeof data !== 'object' || typeof data.text !== 'string') {
      throw new AiServiceError('AI service response missing text field', 'PARSE_ERROR', 502);
    }

    const transcribedText = data.text.trim();
    const resultObj = { text: transcribedText };
    Object.defineProperty(resultObj, 'toString', {
      value: () => transcribedText,
      enumerable: false,
    });

    return resultObj;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AiServiceError) {
      throw error;
    }

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new AiServiceError(
        `AI microservice request timed out after ${timeoutMs}ms`,
        'TIMEOUT_ERROR',
        504,
        error
      );
    }

    throw new AiServiceError(
      `Failed to communicate with AI microservice at ${endpoint}: ${error.message || 'Connection failed'}`,
      'NETWORK_ERROR',
      503,
      error
    );
  }
};

/**
 * Finds semantic duplicate complaints by comparing newText against candidate complaints via FastAPI /find-duplicate.
 *
 * @param {string} newText - The new complaint text to compare
 * @param {Array<{ id: string|number, text: string }>} existingComplaints - Candidate complaints
 * @param {object} [options={}] - Configuration options
 * @param {string} [options.aiServiceUrl] - Override base URL for AI service
 * @param {number} [options.timeout] - Request timeout in milliseconds (default: 10000ms)
 * @returns {Promise<{ match: { id: string|number, text: string, similarity: number } | null }>}
 * @throws {AiServiceError}
 */
export const findDuplicateComplaints = async (newText, existingComplaints = [], options = {}) => {
  // 1. Validate Input
  if (newText === undefined || newText === null || typeof newText !== 'string') {
    throw new AiServiceError('newText must be a valid non-empty string.', 'INVALID_INPUT', 400);
  }

  const trimmedText = newText.trim();
  if (trimmedText.length === 0) {
    throw new AiServiceError('newText cannot be empty or only whitespace.', 'INVALID_INPUT', 400);
  }

  if (!Array.isArray(existingComplaints)) {
    throw new AiServiceError('existingComplaints must be an array.', 'INVALID_INPUT', 400);
  }

  const formattedExisting = existingComplaints
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      id: item.id ?? item._id ?? '',
      text: (typeof item.text === 'string' ? item.text : item.originalText || item.translatedText || '').trim(),
    }))
    .filter((item) => item.text.length > 0);

  // 2. Resolve AI service endpoint
  const baseUrl = options.aiServiceUrl || process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL;
  if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim().length === 0) {
    throw new AiServiceError(
      'AI_SERVICE_URL configuration is missing. Please configure AI_SERVICE_URL in your environment.',
      'MISSING_CONFIG',
      500
    );
  }

  const endpoint = `${baseUrl.trim().replace(/\/+$/, '')}/find-duplicate`;
  const timeoutMs = options.timeout || DEFAULT_AI_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = {
    new_text: trimmedText,
    existing_complaints: formattedExisting,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } catch {
        // Response was not JSON
      }

      throw new AiServiceError(
        `AI microservice returned HTTP ${response.status}: ${errorDetail}`,
        'HTTP_ERROR',
        response.status
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new AiServiceError(
        `Failed to parse response from AI microservice as JSON: ${parseErr.message}`,
        'PARSE_ERROR',
        502,
        parseErr
      );
    }

    if (!data || typeof data !== 'object') {
      throw new AiServiceError('Invalid response payload from AI microservice', 'PARSE_ERROR', 502);
    }

    if (!data.match) {
      return { match: null };
    }

    const match = data.match;
    return {
      match: {
        id: match.id,
        text: match.text,
        similarity: typeof match.similarity === 'number' ? match.similarity : Number(match.similarity) || 0,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AiServiceError) {
      throw error;
    }

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new AiServiceError(
        `AI microservice request timed out after ${timeoutMs}ms`,
        'TIMEOUT_ERROR',
        504,
        error
      );
    }

    throw new AiServiceError(
      `Failed to communicate with AI microservice at ${endpoint}: ${error.message || 'Connection failed'}`,
      'NETWORK_ERROR',
      503,
      error
    );
  }
};
