import { GoogleGenAI, Type } from '@google/genai';

/**
 * Custom error class for AI Service operations
 */
export class AiServiceError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (e.g. MISSING_API_KEY, INVALID_INPUT, GEMINI_API_ERROR, PARSE_ERROR)
   * @param {Error|null} [originalError=null] - Upstream or underlying error if applicable
   */
  constructor(message, code = 'AI_SERVICE_ERROR', originalError = null) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
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
 * Default Gemini model if not specified in environment
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Response schema for structured output from Gemini
 */
export const COMPLAINT_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    language: {
      type: Type.STRING,
      description: 'The detected language of the original text (e.g. Hindi, English, Marathi, Bengali, Hinglish, etc.)',
    },
    translatedText: {
      type: Type.STRING,
      description: 'The translated complaint text in clear, standard English. If original text is already in English, provide clean English text.',
    },
    category: {
      type: Type.STRING,
      description: `The single best-matching category for this complaint. Must be one of: ${COMPLAINT_CATEGORIES.join(', ')}`,
    },
    summary: {
      type: Type.STRING,
      description: 'A concise one-sentence summary of the core civic demand or issue in English.',
    },
  },
  required: ['language', 'translatedText', 'category', 'summary'],
};

/**
 * System instruction defining the AI engine role, taxonomy, and output specifications
 */
const SYSTEM_INSTRUCTION = `You are JanSetu's AI civic intelligence engine. Your role is to analyze citizen complaints and demand submissions in any Indian or international language/dialect.
For each complaint:
1. Detect the original language (e.g., Hindi, Marathi, Tamil, Bengali, Telugu, Hinglish, English, etc.).
2. Translate the complaint into clear, grammatically correct English while preserving the original meaning, urgency, and specific entities (ward numbers, street names, landmarks).
3. Classify the complaint into exactly ONE of the following categories:
   - Water Supply
   - Roads & Infrastructure
   - Sanitation & Waste Management
   - Electricity & Power
   - Public Health
   - Public Transport
   - Other
4. Provide a concise, clear one-sentence summary of the core issue in English.

Always output valid JSON conforming strictly to the requested schema.`;

/**
 * Helper to obtain an authenticated GoogleGenAI instance.
 * Reads API key from options override or process.env.GEMINI_API_KEY.
 *
 * @param {string|null} [customApiKey=null] - Optional API key override
 * @returns {GoogleGenAI}
 * @throws {AiServiceError} If API key is missing or blank
 */
export const getGeminiClient = (customApiKey = null) => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new AiServiceError(
      'GEMINI_API_KEY environment variable is missing or empty. Please set GEMINI_API_KEY in your environment or .env file.',
      'MISSING_API_KEY'
    );
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

/**
 * Helper to parse, sanitize, and validate structured AI response JSON
 *
 * @param {string} rawText - Raw text returned from Gemini model
 * @returns {{ language: string, translatedText: string, category: string, summary: string }}
 * @throws {AiServiceError} If JSON cannot be parsed or required fields are invalid
 */
export const parseAndValidateAiResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new AiServiceError('AI returned an empty or invalid response payload', 'PARSE_ERROR');
  }

  let cleaned = rawText.trim();
  // Strip markdown code fences if model enclosed JSON in them
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned.trim());
  } catch (err) {
    throw new AiServiceError(`Failed to parse AI response as valid JSON: ${err.message}`, 'PARSE_ERROR', err);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AiServiceError('AI response is not a valid JSON object', 'PARSE_ERROR');
  }

  // Validate required contract fields
  const requiredFields = ['language', 'translatedText', 'category', 'summary'];
  for (const field of requiredFields) {
    if (parsed[field] === undefined || parsed[field] === null || typeof parsed[field] !== 'string') {
      throw new AiServiceError(`AI response missing or invalid string field: '${field}'`, 'PARSE_ERROR');
    }
    parsed[field] = parsed[field].trim();
  }

  // Normalize category against defined taxonomy
  if (!COMPLAINT_CATEGORIES.includes(parsed.category)) {
    const matchedCategory = COMPLAINT_CATEGORIES.find(
      (cat) => cat.toLowerCase() === parsed.category.toLowerCase()
    );
    parsed.category = matchedCategory || 'Other';
  }

  return {
    language: parsed.language,
    translatedText: parsed.translatedText,
    category: parsed.category,
    summary: parsed.summary,
  };
};

/**
 * Analyzes citizen complaint text using Gemini.
 * Independent service function — pure AI abstraction without direct database access.
 *
 * @param {string} text - Raw complaint text submitted by citizen
 * @param {object} [options={}] - Optional configuration options
 * @param {string} [options.apiKey] - Optional API key override
 * @param {string} [options.model] - Optional model override (defaults to process.env.GEMINI_MODEL or 'gemini-2.5-flash')
 * @returns {Promise<{ language: string, translatedText: string, category: string, summary: string }>}
 * @throws {AiServiceError}
 */
export const analyzeComplaintText = async (text, options = {}) => {
  // 1. Input validation
  if (text === undefined || text === null || typeof text !== 'string') {
    throw new AiServiceError('Complaint text must be a valid non-empty string.', 'INVALID_INPUT');
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw new AiServiceError('Complaint text cannot be empty or only whitespace.', 'INVALID_INPUT');
  }

  // 2. Initialize Gemini Client
  const client = getGeminiClient(options.apiKey);
  const modelName = options.model || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  // 3. Call Gemini API
  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: `Please analyze the following citizen complaint:\n"""\n${trimmedText}\n"""`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: COMPLAINT_ANALYSIS_SCHEMA,
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    return parseAndValidateAiResponse(responseText);
  } catch (error) {
    if (error instanceof AiServiceError) {
      throw error;
    }
    throw new AiServiceError(
      `Gemini API request failed: ${error.message || 'Unknown error'}`,
      'GEMINI_API_ERROR',
      error
    );
  }
};
