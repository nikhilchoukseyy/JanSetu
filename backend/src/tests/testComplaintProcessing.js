import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

import app from '../app.js';
import Complaint from '../models/Complaint.js';
import { processComplaint } from '../services/complaintProcessingService.js';

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
 * Helper to spin up a mock FastAPI HTTP server
 */
const createMockFastApiServer = (customHandler = null) => {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (customHandler) {
        return customHandler(req, res);
      }

      if (req.method === 'POST' && req.url === '/process-complaint') {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          const parsed = JSON.parse(body || '{}');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              original_text: parsed.text,
              detected_language: 'Hindi',
              translated_text: 'There is a severe water leakage on 5th cross street.',
              category: 'Water Supply',
              summary: 'Severe water leakage on 5th cross street.',
            })
          );
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => server.close(res)),
      });
    });
  });
};

/**
 * Helper to make HTTP requests against the running Express test server
 */
const makeHttpRequest = (serverUrl, path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('🧪 JANSETU BACKEND - SESSION 2 CHECKPOINT 2 ORCHESTRATION TESTS');
  console.log('==================================================================\n');

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jansetu';
  try {
    await mongoose.connect(mongoUri);
    console.log(`  Connected to MongoDB at ${mongoUri}`);
  } catch (err) {
    console.error('  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Start Express server for API endpoint testing
  const expressServer = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => s.close(res)),
      });
    });
  });

  // Start Mock FastAPI server
  let mockFastApi = await createMockFastApiServer();
  const originalAiUrl = process.env.AI_SERVICE_URL;
  process.env.AI_SERVICE_URL = mockFastApi.url;

  try {
    // TEST SUITE 1: End-to-End Successful Processing Flow
    console.log('\n📦 Test Suite 1: Full Successful Processing Lifecycle');
    {
      // 1.1 Create complaint in MongoDB (status = received)
      const createdComplaint = await Complaint.create({
        originalText: 'हमारे वार्ड में 5वीं क्रॉस स्ट्रीट पर पाइप फूट गया है और पानी बह रहा है',
        language: 'hi',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        status: 'received',
      });

      assert(createdComplaint.status === 'received', '1.1 Complaint initially saved with status "received"');
      assert(createdComplaint.translatedText === null, '1.1 translatedText initially null');

      // 1.2 Process complaint via service
      const processResult = await processComplaint(createdComplaint._id.toString(), {
        aiServiceUrl: mockFastApi.url,
      });

      assert(processResult.success === true, '1.2 processComplaint returns success: true');
      assert(processResult.statusCode === 200, '1.2 processComplaint returns statusCode: 200');
      assert(processResult.code === 'PROCESSED', '1.2 processComplaint returns code: PROCESSED');

      // 1.3 Verify persisted fields in MongoDB
      const updatedDoc = await Complaint.findById(createdComplaint._id);
      assert(updatedDoc.status === 'processed', '1.3 MongoDB document status transitioned to "processed"');
      assert(updatedDoc.translatedText === 'There is a severe water leakage on 5th cross street.', '1.3 translatedText correctly persisted in MongoDB');
      assert(updatedDoc.category === 'Water Supply', '1.3 category correctly persisted in MongoDB');
      assert(updatedDoc.summary === 'Severe water leakage on 5th cross street.', '1.3 summary correctly persisted in MongoDB');
      assert(updatedDoc.language === 'Hindi', '1.3 language correctly updated in MongoDB');
    }

    // TEST SUITE 2: Validation & Error Guards
    console.log('\n🛡️ Test Suite 2: Validation & Not Found Guards');
    {
      // 2.1 Malformed ObjectId
      const invalidIdResult = await processComplaint('not-a-valid-object-id');
      assert(invalidIdResult.success === false && invalidIdResult.statusCode === 400, '2.1 Rejects invalid ObjectId format with 400');

      // 2.2 Nonexistent complaint ID
      const randomValidId = new mongoose.Types.ObjectId().toString();
      const notFoundResult = await processComplaint(randomValidId);
      assert(notFoundResult.success === false && notFoundResult.statusCode === 404, '2.2 Returns 404 for nonexistent complaint ID');

      // 2.3 Complaint without originalText
      const audioOnlyComplaint = await Complaint.create({
        audioReference: 's3://jansetu-audio/recordings/sample123.wav',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        status: 'received',
      });
      const missingTextResult = await processComplaint(audioOnlyComplaint._id.toString());
      assert(missingTextResult.success === false && missingTextResult.statusCode === 400, '2.3 Safely rejects complaint without originalText with 400');
      const refreshedAudioDoc = await Complaint.findById(audioOnlyComplaint._id);
      assert(refreshedAudioDoc.status === 'failed', '2.3 Complaint without originalText transitioned to status "failed"');
    }

    // TEST SUITE 3: AI Service Failure Handling
    console.log('\n⚠️ Test Suite 3: AI Service Failure & Status Transition');
    {
      // Mock server that returns 500 error
      const failingMockServer = await createMockFastApiServer((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'AI model service unavailable' }));
      });

      const failureTestDoc = await Complaint.create({
        originalText: 'Road broken near railway station',
        location: { type: 'Point', coordinates: [72.8777, 19.076] },
        status: 'received',
      });

      const failureResult = await processComplaint(failureTestDoc._id.toString(), {
        aiServiceUrl: failingMockServer.url,
      });

      assert(failureResult.success === false, '3.1 AI error returns success: false');
      assert(failureResult.statusCode === 500, '3.1 AI error returns 500 status code');

      const failedDocInDb = await Complaint.findById(failureTestDoc._id);
      assert(failedDocInDb.status === 'failed', '3.2 Complaint transitioned to "failed" on AI error without server crash');
      assert(failedDocInDb.originalText === 'Road broken near railway station', '3.2 Original complaint data preserved on failure');

      // 3.3 Retry capability: retrying a failed complaint
      const retryResult = await processComplaint(failureTestDoc._id.toString(), {
        aiServiceUrl: mockFastApi.url, // Healthy mock server
      });
      assert(retryResult.success === true, '3.3 Retrying failed complaint succeeds');
      const retriedDoc = await Complaint.findById(failureTestDoc._id);
      assert(retriedDoc.status === 'processed', '3.3 Retried complaint transitioned to "processed"');

      await failingMockServer.close();
    }

    // TEST SUITE 4: Concurrency & Idempotency Guards
    console.log('\n🔒 Test Suite 4: Concurrency & Idempotency Guards');
    {
      // 4.1 Already processed complaint
      const processedDoc = await Complaint.create({
        originalText: 'Electricity power cut',
        translatedText: 'Power outage in Sector 4',
        category: 'Electricity & Power',
        summary: 'Power outage in Sector 4',
        location: { type: 'Point', coordinates: [77.209, 28.6139] },
        status: 'processed',
      });

      const alreadyProcessedResult = await processComplaint(processedDoc._id.toString());
      assert(alreadyProcessedResult.success === true && alreadyProcessedResult.code === 'ALREADY_PROCESSED', '4.1 Already processed complaint returns ALREADY_PROCESSED without reprocessing');

      // 4.2 Concurrency guard: already processing complaint
      const inProgressDoc = await Complaint.create({
        originalText: 'Drainage overflowing',
        location: { type: 'Point', coordinates: [77.209, 28.6139] },
        status: 'processing',
      });

      const alreadyProcessingResult = await processComplaint(inProgressDoc._id.toString());
      assert(alreadyProcessingResult.success === false && alreadyProcessingResult.statusCode === 409 && alreadyProcessingResult.code === 'ALREADY_PROCESSING', '4.2 Already processing complaint returns 409 ALREADY_PROCESSING');
    }

    // TEST SUITE 5: Express REST API Endpoints Verification
    console.log('\n🌐 Test Suite 5: Express REST API Endpoints Verification');
    {
      // 5.1 POST /api/complaints creates with status "received"
      const createResponse = await makeHttpRequest(expressServer.url, '/api/complaints', 'POST', {
        originalText: 'Garbage dump near public school needs clearing',
        location: { coordinates: [77.5946, 12.9716] },
      });

      assert(createResponse.status === 201, '5.1 POST /api/complaints returns 201 Created');
      assert(createResponse.body.success === true, '5.1 POST /api/complaints returns success: true');
      assert(createResponse.body.data.status === 'received', '5.1 Newly submitted complaint has status "received"');

      const newId = createResponse.body.data._id;

      // 5.2 POST /api/complaints/:id/process triggers processing
      const processResponse = await makeHttpRequest(
        expressServer.url,
        `/api/complaints/${newId}/process`,
        'POST'
      );

      assert(processResponse.status === 200, '5.2 POST /api/complaints/:id/process returns 200 OK');
      assert(processResponse.body.success === true, '5.2 Process API returns success: true');
      assert(processResponse.body.data.status === 'processed', '5.2 Process API response has status "processed"');
      assert(processResponse.body.data.category === 'Water Supply', '5.2 Process API response includes AI category');

      // 5.3 GET /api/complaints/:id retrieves processed complaint
      const getResponse = await makeHttpRequest(expressServer.url, `/api/complaints/${newId}`, 'GET');
      assert(getResponse.status === 200, '5.3 GET /api/complaints/:id returns 200 OK');
      assert(getResponse.body.data.status === 'processed', '5.3 GET /api/complaints/:id returns updated "processed" status');
      assert(getResponse.body.data.summary === 'Severe water leakage on 5th cross street.', '5.3 GET /api/complaints/:id returns persisted summary');

      // 5.4 GET /api/complaints retrieves list
      const listResponse = await makeHttpRequest(expressServer.url, '/api/complaints', 'GET');
      assert(listResponse.status === 200, '5.4 GET /api/complaints returns 200 with list');
      assert(Array.isArray(listResponse.body.data), '5.4 Complaints list is an array');

      // 5.5 GET /api/health remains functional
      const healthResponse = await makeHttpRequest(expressServer.url, '/api/health', 'GET');
      assert(healthResponse.status === 200 && healthResponse.body.success === true, '5.5 GET /api/health returns 200 OK');
    }
  } finally {
    // Cleanup
    process.env.AI_SERVICE_URL = originalAiUrl;
    await mockFastApi.close();
    await expressServer.close();
    await mongoose.disconnect();
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
