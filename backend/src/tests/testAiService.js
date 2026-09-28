import http from 'http';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

import {
  analyzeComplaintText,
  transcribeAudio,
  findDuplicateComplaints,
  formatFastApiResponse,
  AiServiceError,
  COMPLAINT_CATEGORIES,
  DEFAULT_AI_SERVICE_URL,
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

/**
 * Helper to spin up a lightweight mock HTTP server for testing adapter interactions
 */
const createMockServer = (handler) => {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
};

const runTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 JANSETU BACKEND - FASTAPI AI ADAPTER TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: Input Validation for analyzeComplaintText
  console.log('📦 Test Suite 1: Input Validation & Defensive Guardrails');
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

    // Non-string input
    try {
      await analyzeComplaintText(98765);
      assert(false, 'Should reject numeric input');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects numeric input with INVALID_INPUT');
    }
  }

  // TEST SUITE 2: FastAPI snake_case to camelCase Mapping & Taxonomy
  console.log('\n📐 Test Suite 2: Response Mapping & Taxonomy Normalization');
  {
    // Standard FastAPI snake_case response
    const mockFastApiResponse = {
      detected_language: 'Hindi',
      translated_text: 'There has been no water supply in Ward 12 for 3 days.',
      category: 'Water Supply',
      summary: 'No water supply in Ward 12 for 3 days.',
    };

    try {
      const mapped = formatFastApiResponse(mockFastApiResponse);
      assert(
        mapped.language === 'Hindi' &&
          mapped.translatedText === 'There has been no water supply in Ward 12 for 3 days.' &&
          mapped.category === 'Water Supply' &&
          mapped.summary === 'No water supply in Ward 12 for 3 days.',
        'Maps snake_case FastAPI response to camelCase contract'
      );
    } catch (err) {
      assert(false, 'Failed snake_case mapping', err.message);
    }

    // Case-insensitive taxonomy matching
    const lowerCaseCategory = {
      detected_language: 'Marathi',
      translated_text: 'Potholes on main road.',
      category: 'roads & infrastructure',
      summary: 'Potholes on road.',
    };
    try {
      const mapped = formatFastApiResponse(lowerCaseCategory);
      assert(mapped.category === 'Roads & Infrastructure', 'Normalizes lowercase category to standard taxonomy casing');
    } catch (err) {
      assert(false, 'Failed case-insensitive taxonomy mapping', err.message);
    }

    // Partial category matching (e.g. "water" -> "Water Supply")
    const partialCategory = {
      detected_language: 'Bengali',
      translated_text: 'Water pipe leaked.',
      category: 'water',
      summary: 'Leaked water pipe.',
    };
    try {
      const mapped = formatFastApiResponse(partialCategory);
      assert(mapped.category === 'Water Supply', 'Normalizes partial category ("water") to "Water Supply"');
    } catch (err) {
      assert(false, 'Failed partial category mapping', err.message);
    }

    // Unrecognized category fallback to "Other"
    const unknownCategory = {
      detected_language: 'Tamil',
      translated_text: 'Noise in playground.',
      category: 'Parks & Entertainment',
      summary: 'Noise issue in playground.',
    };
    try {
      const mapped = formatFastApiResponse(unknownCategory);
      assert(mapped.category === 'Other', 'Falls back to "Other" for unmapped category');
    } catch (err) {
      assert(false, 'Failed unknown category fallback', err.message);
    }

    // Missing field validation
    try {
      formatFastApiResponse({ detected_language: 'Hindi' });
      assert(false, 'Should throw error when translated_text and category are missing');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'PARSE_ERROR', 'Throws PARSE_ERROR for missing required fields');
    }
  }

  // TEST SUITE 3: HTTP Adapter & Mock Server Integration for analyzeComplaintText
  console.log('\n🌐 Test Suite 3: HTTP Adapter & Mock Server Integration');
  {
    // 3.1 Successful 200 response from FastAPI mock server
    const successMockServer = await createMockServer((req, res) => {
      if (req.method === 'POST' && req.url === '/process-complaint') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              original_text: parsed.text,
              detected_language: 'Hindi',
              translated_text: 'Garbage not collected for a week near market.',
              category: 'Sanitation & Waste Management',
              summary: 'Garbage accumulation near market for a week.',
            })
          );
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      const result = await analyzeComplaintText('बाजार के पास एक हफ्ते से कचरा नहीं उठाया गया है', {
        aiServiceUrl: successMockServer.url,
      });
      assert(
        result.language === 'Hindi' &&
          result.translatedText === 'Garbage not collected for a week near market.' &&
          result.category === 'Sanitation & Waste Management',
        'Successfully calls mock FastAPI /process-complaint and parses output'
      );
    } catch (err) {
      assert(false, 'Mock server call failed', err.message);
    } finally {
      await successMockServer.close();
    }

    // 3.2 FastAPI returns 500 error
    const error500MockServer = await createMockServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Internal model inference error' }));
    });

    try {
      await analyzeComplaintText('Complaint text', {
        aiServiceUrl: error500MockServer.url,
      });
      assert(false, 'Should throw on HTTP 500 error');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'HTTP_ERROR' && err.statusCode === 500,
        'Handles HTTP 500 with structured HTTP_ERROR code and status'
      );
    } finally {
      await error500MockServer.close();
    }

    // 3.3 Connection failure (unreachable port)
    try {
      await analyzeComplaintText('Some text', {
        aiServiceUrl: 'http://127.0.0.1:59999',
        timeout: 1000,
      });
      assert(false, 'Should throw on unreachable network endpoint');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'NETWORK_ERROR',
        'Handles network connection failure with NETWORK_ERROR code'
      );
    }

    // 3.4 Request Timeout
    const slowMockServer = await createMockServer((req, res) => {
      // Deliberately do not respond to trigger client timeout
    });

    try {
      await analyzeComplaintText('Some text', {
        aiServiceUrl: slowMockServer.url,
        timeout: 200,
      });
      assert(false, 'Should throw on timeout');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'TIMEOUT_ERROR',
        'Handles request timeout with TIMEOUT_ERROR code'
      );
    } finally {
      await slowMockServer.close();
    }
  }

  // TEST SUITE 4: Audio Transcription Adapter (transcribeAudio)
  console.log('\n🎙️ Test Suite 4: Audio Transcription Adapter (transcribeAudio)');
  {
    // 4.1 Input validation guards
    try {
      await transcribeAudio(null);
      assert(false, 'Should reject null audio input');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects null audio with INVALID_INPUT');
    }

    try {
      await transcribeAudio(Buffer.alloc(0));
      assert(false, 'Should reject empty buffer');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects empty audio buffer with INVALID_INPUT');
    }

    // 4.2 Successful transcription via mock server
    const mockAudioServer = await createMockServer((req, res) => {
      if (req.method === 'POST' && req.url === '/transcribe') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: 'Main road has large potholes near the junction.' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      const fakeAudioBuffer = Buffer.from('RIFF_FAKE_AUDIO_DATA_FOR_TEST');
      const result = await transcribeAudio(fakeAudioBuffer, {
        aiServiceUrl: mockAudioServer.url,
      });

      assert(
        result && result.text === 'Main road has large potholes near the junction.',
        'transcribeAudio successfully receives and normalizes transcribed text'
      );
      assert(
        String(result) === 'Main road has large potholes near the junction.',
        'transcribeAudio result supports string coercion'
      );
    } catch (err) {
      assert(false, 'transcribeAudio mock call failed', err.message);
    } finally {
      await mockAudioServer.close();
    }

    // 4.3 Handles Multer file object shape
    const mockMulterServer = await createMockServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: 'Multer audio transcription test.' }));
    });

    try {
      const multerFile = {
        buffer: Buffer.from('AUDIO_BUFFER_CONTENT'),
        originalname: 'voice.wav',
        mimetype: 'audio/wav',
      };
      const result = await transcribeAudio(multerFile, {
        aiServiceUrl: mockMulterServer.url,
      });
      assert(result.text === 'Multer audio transcription test.', 'Handles multer-style file objects');
    } catch (err) {
      assert(false, 'Multer file transcription failed', err.message);
    } finally {
      await mockMulterServer.close();
    }

    // 4.4 HTTP 500 error handling
    const errorAudioServer = await createMockServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Whisper Groq API error' }));
    });

    try {
      await transcribeAudio(Buffer.from('AUDIO'), {
        aiServiceUrl: errorAudioServer.url,
      });
      assert(false, 'Should throw on HTTP 500');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'HTTP_ERROR' && err.statusCode === 500,
        'transcribeAudio handles HTTP 500 with HTTP_ERROR'
      );
    } finally {
      await errorAudioServer.close();
    }

    // 4.5 Timeout error handling
    const slowAudioServer = await createMockServer(() => {});
    try {
      await transcribeAudio(Buffer.from('AUDIO'), {
        aiServiceUrl: slowAudioServer.url,
        timeout: 150,
      });
      assert(false, 'Should throw on timeout');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'TIMEOUT_ERROR',
        'transcribeAudio handles timeout with TIMEOUT_ERROR'
      );
    } finally {
      await slowAudioServer.close();
    }

    // 4.6 Malformed response handling
    const malformedAudioServer = await createMockServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ missing_text: true }));
    });

    try {
      await transcribeAudio(Buffer.from('AUDIO'), {
        aiServiceUrl: malformedAudioServer.url,
      });
      assert(false, 'Should throw on missing text field');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'PARSE_ERROR',
        'transcribeAudio handles missing text field with PARSE_ERROR'
      );
    } finally {
      await malformedAudioServer.close();
    }
  }

  // TEST SUITE 5: Duplicate Detection Adapter (findDuplicateComplaints)
  console.log('\n🔍 Test Suite 5: Duplicate Detection Adapter (findDuplicateComplaints)');
  {
    // 5.1 Input validation guards
    try {
      await findDuplicateComplaints('');
      assert(false, 'Should reject empty newText');
    } catch (err) {
      assert(err instanceof AiServiceError && err.code === 'INVALID_INPUT', 'Rejects empty newText with INVALID_INPUT');
    }

    try {
      await findDuplicateComplaints('Some valid text', 'not an array');
      assert(false, 'Should reject non-array existingComplaints');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'INVALID_INPUT',
        'Rejects non-array existingComplaints with INVALID_INPUT'
      );
    }

    // 5.2 Successful match response from mock server
    const mockClusterServer = await createMockServer((req, res) => {
      if (req.method === 'POST' && req.url === '/find-duplicate') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body);
          if (parsed.new_text && parsed.existing_complaints) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                match: {
                  id: 'c101',
                  text: 'Pothole on Main St',
                  similarity: 0.89,
                },
              })
            );
          } else {
            res.writeHead(400);
            res.end();
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    try {
      const result = await findDuplicateComplaints(
        'Dangerous pothole on Main St near signal',
        [{ id: 'c101', text: 'Pothole on Main St' }],
        { aiServiceUrl: mockClusterServer.url }
      );

      assert(
        result &&
          result.match &&
          result.match.id === 'c101' &&
          result.match.text === 'Pothole on Main St' &&
          result.match.similarity === 0.89,
        'findDuplicateComplaints successfully parses duplicate match'
      );
    } catch (err) {
      assert(false, 'findDuplicateComplaints match call failed', err.message);
    } finally {
      await mockClusterServer.close();
    }

    // 5.3 Successful no-match response from mock server
    const mockNoMatchServer = await createMockServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ match: null }));
    });

    try {
      const result = await findDuplicateComplaints(
        'Water pipe burst in colony',
        [{ id: 'c101', text: 'Pothole on Main St' }],
        { aiServiceUrl: mockNoMatchServer.url }
      );

      assert(result && result.match === null, 'findDuplicateComplaints returns { match: null } when no match');
    } catch (err) {
      assert(false, 'findDuplicateComplaints no-match call failed', err.message);
    } finally {
      await mockNoMatchServer.close();
    }

    // 5.4 HTTP 500 error handling
    const errorClusterServer = await createMockServer((req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ detail: 'Embedding computation failed' }));
    });

    try {
      await findDuplicateComplaints('Some text', [], {
        aiServiceUrl: errorClusterServer.url,
      });
      assert(false, 'Should throw on HTTP 500');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'HTTP_ERROR' && err.statusCode === 500,
        'findDuplicateComplaints handles HTTP 500 with HTTP_ERROR'
      );
    } finally {
      await errorClusterServer.close();
    }

    // 5.5 Timeout handling
    const slowClusterServer = await createMockServer(() => {});
    try {
      await findDuplicateComplaints('Some text', [], {
        aiServiceUrl: slowClusterServer.url,
        timeout: 150,
      });
      assert(false, 'Should throw on timeout');
    } catch (err) {
      assert(
        err instanceof AiServiceError && err.code === 'TIMEOUT_ERROR',
        'findDuplicateComplaints handles timeout with TIMEOUT_ERROR'
      );
    } finally {
      await slowClusterServer.close();
    }
  }

  // TEST SUITE 6: Express App & Routing Regression
  console.log('\n🛡️ Test Suite 6: Express App & Routing Regression');
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
