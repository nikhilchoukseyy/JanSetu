import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

import app from '../app.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

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
 * Helper to make raw HTTP requests against the running Express test server
 */
const makeRawHttpRequest = (serverUrl, path, method = 'GET', body = null, customHeaders = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body !== null) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('🛡️ JANSETU BACKEND - HARDENING & RATE LIMITING TEST SUITE');
  console.log('==================================================================\n');

  // Connect to MongoDB if available
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jansetu';
  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.log(`  (Running in offline/unconnected DB mode: ${err.message})`);
  }

  // Start Express server for API testing
  const expressServer = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => s.close(res)),
      });
    });
  });

  try {
    // TEST SUITE 1: Input Validation & Hardening on POST /api/complaints
    console.log('📦 Test Suite 1: Input Validation & Hardening on POST /api/complaints');
    {
      // 1.1 Non-object / Array body
      const arrayBodyRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', [1, 2, 3]);
      assert(
        arrayBodyRes.status === 400 && arrayBodyRes.body.success === false,
        '1.1 Rejects array body with 400 and success: false'
      );

      // 1.2 Empty body
      const emptyBodyRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {});
      assert(
        emptyBodyRes.status === 400 && emptyBodyRes.body.message.includes('Either originalText or audioReference'),
        '1.2 Rejects body without text or audio'
      );

      // 1.3 Missing location
      const noLocationRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Water pipe broken',
      });
      assert(
        noLocationRes.status === 400 && noLocationRes.body.message.includes('Location is required'),
        '1.3 Rejects request without location'
      );

      // 1.4 Invalid coordinates (not array of 2)
      const invalidCoordsRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Water pipe broken',
        location: { coordinates: [77.5946] },
      });
      assert(
        invalidCoordsRes.status === 400 && invalidCoordsRes.body.message.includes('Location coordinates must be an array of exactly [longitude, latitude]'),
        '1.4 Rejects coordinates with length !== 2'
      );

      // 1.5 Non-number coordinates
      const nonNumCoordsRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Water pipe broken',
        location: { coordinates: ['77.59', '12.97'] },
      });
      assert(
        nonNumCoordsRes.status === 400 && nonNumCoordsRes.body.message.includes('Coordinates must be valid finite numbers'),
        '1.5 Rejects string coordinates'
      );

      // 1.6 Out of bounds coordinates (longitude > 180)
      const outOfBoundsRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Water pipe broken',
        location: { coordinates: [200, 12.97] },
      });
      assert(
        outOfBoundsRes.status === 400 && outOfBoundsRes.body.message.includes('Coordinates out of bounds'),
        '1.6 Rejects out of bounds longitude (> 180)'
      );

      // 1.7 Oversized originalText (> 5000 chars)
      const hugeText = 'A'.repeat(5001);
      const oversizedTextRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: hugeText,
        location: { coordinates: [77.59, 12.97] },
      });
      assert(
        oversizedTextRes.status === 400 && oversizedTextRes.body.message.includes('exceeds maximum allowed length'),
        '1.7 Rejects originalText exceeding 5000 chars'
      );

      // 1.8 Oversized language (> 50 chars)
      const hugeLang = 'A'.repeat(55);
      const oversizedLangRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Valid complaint text',
        language: hugeLang,
        location: { coordinates: [77.59, 12.97] },
      });
      assert(
        oversizedLangRes.status === 400 && oversizedLangRes.body.message.includes('language code exceeds maximum allowed length'),
        '1.8 Rejects language exceeding 50 chars'
      );

      // 1.9 Invalid non-string types for originalText
      const nonStringTextRes = await makeRawHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 123456,
        location: { coordinates: [77.59, 12.97] },
      });
      assert(
        nonStringTextRes.status === 400 && nonStringTextRes.body.message.includes('originalText must be a string'),
        '1.9 Rejects non-string originalText'
      );
    }

    // TEST SUITE 2: Query Validation on GET /api/complaints
    console.log('\n🔍 Test Suite 2: Query Parameter Validation on GET /api/complaints');
    {
      // 2.1 Invalid status filter
      const invalidStatusRes = await makeRawHttpRequest(expressServer.url, '/api/complaints?status=unknown_status', 'GET');
      assert(
        invalidStatusRes.status === 400 && invalidStatusRes.body.message.includes('Invalid status filter'),
        '2.1 Rejects invalid status query filter'
      );

      // 2.2 Invalid page parameter
      const invalidPageRes = await makeRawHttpRequest(expressServer.url, '/api/complaints?page=-1', 'GET');
      assert(
        invalidPageRes.status === 400 && invalidPageRes.body.message.includes('Query parameter "page" must be a positive integer'),
        '2.2 Rejects negative page query parameter'
      );

      // 2.3 Invalid limit parameter
      const invalidLimitRes = await makeRawHttpRequest(expressServer.url, '/api/complaints?limit=abc', 'GET');
      assert(
        invalidLimitRes.status === 400 && invalidLimitRes.body.message.includes('Query parameter "limit" must be a positive integer'),
        '2.3 Rejects non-numeric limit query parameter'
      );

      // 2.4 Oversized category query filter
      const hugeCategory = 'X'.repeat(105);
      const invalidCategoryRes = await makeRawHttpRequest(expressServer.url, `/api/complaints?category=${hugeCategory}`, 'GET');
      assert(
        invalidCategoryRes.status === 400 && invalidCategoryRes.body.message.includes('Category filter exceeds maximum allowed length'),
        '2.4 Rejects oversized category filter'
      );
    }

    // TEST SUITE 3: ID Parameter Validation on /api/complaints/:id
    console.log('\n🔑 Test Suite 3: ObjectId Validation on :id Routes');
    {
      // 3.1 Invalid ID on GET /api/complaints/:id
      const invalidGetIdRes = await makeRawHttpRequest(expressServer.url, '/api/complaints/not-an-id', 'GET');
      assert(
        invalidGetIdRes.status === 400 && invalidGetIdRes.body.message === 'Invalid complaint ID format',
        '3.1 Rejects malformed ID on GET /api/complaints/:id'
      );

      // 3.2 Invalid ID on POST /api/complaints/:id/process
      const invalidProcessIdRes = await makeRawHttpRequest(expressServer.url, '/api/complaints/123-bad-id/process', 'POST');
      assert(
        invalidProcessIdRes.status === 400 && invalidProcessIdRes.body.message === 'Invalid complaint ID format',
        '3.2 Rejects malformed ID on POST /api/complaints/:id/process'
      );
    }

    // TEST SUITE 4: Malformed JSON Request Handling
    console.log('\n🛑 Test Suite 4: Malformed JSON Request Handling');
    {
      const malformedJsonRes = await makeRawHttpRequest(
        expressServer.url,
        '/api/complaints',
        'POST',
        '{ bad_json: true, }' // Syntax error
      );
      assert(
        malformedJsonRes.status === 400 && malformedJsonRes.body.message === 'Malformed JSON payload in request body',
        '4.1 Gracefully catches syntax error in JSON body without 500 stack trace'
      );
    }

    // TEST SUITE 5: Rate Limiting & HTTP 429 Verification
    console.log('\n⏱️ Test Suite 5: Rate Limiting & HTTP 429 Verification');
    {
      // 5.1 Verify custom rate limiter unit behavior
      const testLimiter = createRateLimiter({
        windowMs: 10000,
        max: 3,
        message: 'Rate limit exceeded for test',
      });

      let testResStatus = null;
      let testResJson = null;
      const headersMap = {};

      const mockReq = { headers: { 'x-forwarded-for': '192.168.1.100' }, socket: {} };
      const mockRes = {
        setHeader: (k, v) => { headersMap[k] = v; },
        status: (code) => {
          testResStatus = code;
          return {
            json: (obj) => { testResJson = obj; },
          };
        },
      };

      let nextCalledCount = 0;
      const mockNext = () => { nextCalledCount++; };

      // Request 1
      testLimiter(mockReq, mockRes, mockNext);
      assert(nextCalledCount === 1, '5.1 Request 1 passes rate limiter');
      assert(headersMap['X-RateLimit-Limit'] === 3, '5.1 Sets X-RateLimit-Limit header');
      assert(headersMap['X-RateLimit-Remaining'] === 2, '5.1 Decrements X-RateLimit-Remaining to 2');

      // Request 2
      testLimiter(mockReq, mockRes, mockNext);
      assert(nextCalledCount === 2, '5.1 Request 2 passes rate limiter');
      assert(headersMap['X-RateLimit-Remaining'] === 1, '5.1 Decrements X-RateLimit-Remaining to 1');

      // Request 3
      testLimiter(mockReq, mockRes, mockNext);
      assert(nextCalledCount === 3, '5.1 Request 3 passes rate limiter');
      assert(headersMap['X-RateLimit-Remaining'] === 0, '5.1 Decrements X-RateLimit-Remaining to 0');

      // Request 4 (exceeds max of 3)
      testLimiter(mockReq, mockRes, mockNext);
      assert(nextCalledCount === 3, '5.2 Request 4 blocked by rate limiter');
      assert(testResStatus === 429, '5.2 Returns HTTP 429 Too Many Requests');
      assert(testResJson && testResJson.success === false, '5.2 Returns success: false');
      assert(headersMap['Retry-After'] !== undefined, '5.2 Returns Retry-After header');
      assert(headersMap['X-RateLimit-Reset'] !== undefined, '5.2 Returns X-RateLimit-Reset header');

      // 5.3 Live endpoint headers verification on GET /api/complaints
      const liveEndpointRes = await makeRawHttpRequest(expressServer.url, '/api/complaints?page=1&limit=5', 'GET');
      assert(
        liveEndpointRes.headers['x-ratelimit-limit'] !== undefined,
        '5.3 Live endpoint contains x-ratelimit-limit header'
      );
      assert(
        liveEndpointRes.headers['x-ratelimit-remaining'] !== undefined,
        '5.3 Live endpoint contains x-ratelimit-remaining header'
      );
    }
  } finally {
    await expressServer.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  // SUMMARY
  console.log('\n==================================================================');
  console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
};

runTests();
