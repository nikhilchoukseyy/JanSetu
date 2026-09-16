import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env
dotenv.config();

import {
  analyzeComplaintText,
  getGeminiClient,
  parseAndValidateAiResponse,
  AiServiceError,
  COMPLAINT_CATEGORIES,
  DEFAULT_GEMINI_MODEL,
} from '../services/aiService.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, testName, details = '') => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
  }
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 JANSETU BACKEND - SESSION 2 CHECKPOINT 1 TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: Input Validation & Defensive Guardrails
  console.log('📦 Test Suite 1: Input Validation & Edge Cases');
  {
    // Empty string
    try {
      await analyzeComplaintText('');
      assert(false, 'Should reject empty string');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects empty string with INVALID_INPUT');
    }

    // Whitespace string
    try {
      await analyzeComplaintText('    \n\t  ');
      assert(false, 'Should reject whitespace-only string');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects whitespace-only string with INVALID_INPUT');
    }

    // Null input
    try {
      await analyzeComplaintText(null);
      assert(false, 'Should reject null input');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects null input with INVALID_INPUT');
    }

    // Non-string input (number/object)
    try {
      await analyzeComplaintText(12345);
      assert(false, 'Should reject numeric input');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects numeric input with INVALID_INPUT');
    }
  }

  // TEST SUITE 2: API Key Configuration & Handling
  console.log('\n🔑 Test Suite 2: API Key Handling & Initialization');
  {
    // Explicitly missing API key
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      getGeminiClient(null);
      assert(false, 'Should throw when GEMINI_API_KEY is unset');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'MISSING_API_KEY', 'Throws MISSING_API_KEY when key is missing');
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }

    // Explicitly empty API key override
    try {
      getGeminiClient('   ');
      assert(false, 'Should throw when custom API key is blank whitespace');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'MISSING_API_KEY', 'Throws MISSING_API_KEY when custom key is blank');
    }

    // Valid dummy API key initialization
    try {
      const dummyClient = getGeminiClient('dummy_test_key_123');
      assert(Boolean(dummyClient), 'Successfully instantiates GoogleGenAI client with provided key');
    } catch (err) {
      assert(false, 'Failed to instantiate GoogleGenAI client with key', err.message);
    }
  }

  // TEST SUITE 3: Structured AI Response Parser & Taxonomy Validation
  console.log('\n📐 Test Suite 3: Structured Response Parsing & Taxonomy');
  {
    // Valid standard JSON
    const validJson = JSON.stringify({
      language: 'Hindi',
      translatedText: 'Potholes on Station Road causing accidents.',
      category: 'Roads & Infrastructure',
      summary: 'Hazardous potholes on Station Road causing accidents.',
    });

    try {
      const parsed = parseAndValidateAiResponse(validJson);
      assert(
        parsed.language === 'Hindi' &&
          parsed.translatedText === 'Potholes on Station Road causing accidents.' &&
          parsed.category === 'Roads & Infrastructure' &&
          parsed.summary === 'Hazardous potholes on Station Road causing accidents.',
        'Correctly parses valid JSON response matching schema'
      );
    } catch (err) {
      assert(false, 'Failed on valid JSON parsing', err.message);
    }

    // JSON wrapped in Markdown code blocks (```json ... ```)
    const markdownWrappedJson = `\`\`\`json\n${validJson}\n\`\`\``;
    try {
      const parsed = parseAndValidateAiResponse(markdownWrappedJson);
      assert(parsed.language === 'Hindi', 'Handles markdown code fences (```json ... ```) transparently');
    } catch (err) {
      assert(false, 'Failed on markdown wrapped JSON', err.message);
    }

    // Missing required field
    const incompleteJson = JSON.stringify({
      language: 'Hindi',
      translatedText: 'Potholes on Station Road.',
      // category missing
      summary: 'Potholes on road.',
    });

    try {
      parseAndValidateAiResponse(incompleteJson);
      assert(false, 'Should throw error when required field is missing');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'PARSE_ERROR', 'Rejects payload with missing field with PARSE_ERROR');
    }

    // Malformed JSON string
    try {
      parseAndValidateAiResponse('Invalid non-json text string');
      assert(false, 'Should throw error on non-JSON payload');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'PARSE_ERROR', 'Rejects non-JSON payload with PARSE_ERROR');
    }

    // Taxonomy normalization: unrecognized category maps to "Other"
    const unlistedCategoryJson = JSON.stringify({
      language: 'English',
      translatedText: 'Parks need more benches.',
      category: 'Gardening & Recreation',
      summary: 'Request for more benches in local parks.',
    });

    try {
      const parsed = parseAndValidateAiResponse(unlistedCategoryJson);
      assert(parsed.category === 'Other', 'Normalizes unlisted category to "Other" fallback');
    } catch (err) {
      assert(false, 'Failed category normalization test', err.message);
    }
  }

  // TEST SUITE 4: Live Gemini API Call (if GEMINI_API_KEY is configured)
  console.log('\n🌐 Test Suite 4: Live Gemini Integration Test');
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim().length > 0) {
    try {
      console.log(`  ℹ️ Live GEMINI_API_KEY detected. Testing live call with model: ${process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL}...`);
      const sampleText = 'हमारे वार्ड 12 में पिछले 4 दिनों से गंदा और बदबूदार पानी आ रहा है, कृपया इसे जल्द ठीक कराएं।';
      const result = await analyzeComplaintText(sampleText);
      console.log('  Live Analysis Output:', JSON.stringify(result, null, 2));

      assert(typeof result.language === 'string' && result.language.length > 0, 'Live call returned detected language');
      assert(typeof result.translatedText === 'string' && result.translatedText.length > 0, 'Live call returned translated English text');
      assert(COMPLAINT_CATEGORIES.includes(result.category), `Live call returned recognized taxonomy category (${result.category})`);
      assert(typeof result.summary === 'string' && result.summary.length > 0, 'Live call returned summary');
    } catch (err) {
      console.error('  ⚠️ Live Gemini Call Note:', err.message);
      assert(false, 'Live Gemini Call execution', err.message);
    }
  } else {
    console.log('  ℹ️ GEMINI_API_KEY not configured or is placeholder in .env. Live network call skipped safely.');
    assert(true, 'Live call skipped safely without error (API key placeholder)');
  }

  // TEST SUITE 5: Regression & Express App Integrity
  console.log('\n🛡️ Test Suite 5: Express App & Routing Regression');
  try {
    const { default: app } = await import('../app.js');
    assert(Boolean(app && typeof app.use === 'function'), 'Express app imports cleanly without module resolution errors');
  } catch (err) {
    assert(false, 'Express app import regression', err.message);
  }

  // SUMMARY
  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
};

runTests();
