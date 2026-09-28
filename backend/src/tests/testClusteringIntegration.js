import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Complaint from '../models/Complaint.js';
import Cluster from '../models/Cluster.js';
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
 * Spin up a mock AI microservice that handles /process-complaint and /find-duplicate
 */
const createMockAiMicroservice = (customDuplicateHandler = null, customProcessHandler = null) => {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : {};

        if (req.method === 'POST' && req.url === '/process-complaint') {
          if (customProcessHandler) {
            return customProcessHandler(req, res, parsed);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({
              detected_language: 'English',
              translated_text: parsed.text,
              category: 'Water Supply',
              summary: parsed.text,
            })
          );
        }

        if (req.method === 'POST' && req.url === '/find-duplicate') {
          if (customDuplicateHandler) {
            return customDuplicateHandler(req, res, parsed);
          }
          // Default: no duplicate
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ match: null }));
        }

        res.writeHead(404);
        res.end();
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
};

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('🧪 JANSETU BACKEND - CLUSTERING INTEGRATION TESTS');
  console.log('==================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jansetu';
  try {
    await mongoose.connect(mongoUri);
    console.log(`  Connected to MongoDB at ${mongoUri}`);
  } catch (err) {
    console.error('  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  // Use isolated test base location
  const baseLng = 81.2345;
  const baseLat = 16.6789;

  try {
    // Clean up test data
    await Complaint.deleteMany({ originalText: { $regex: /^TEST_INT_/ } });
    await Cluster.deleteMany({ title: { $regex: /^TEST_INT_/ } });

    // TEST 1: Processed complaint with no candidates -> clusterId remains null
    console.log('\n📦 Test Suite 1: No Candidates -> clusterId Remains Null');
    {
      const mockAi = await createMockAiMicroservice();

      const complaint = await Complaint.create({
        originalText: 'TEST_INT_ Isolated broken pipe on highway',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        status: 'received',
      });

      const result = await processComplaint(complaint._id.toString(), {
        aiServiceUrl: mockAi.url,
      });

      assert(result.success === true, '1.1 Process returned success');
      assert(result.statusCode === 200, '1.1 Status code is 200');
      assert(result.code === 'PROCESSED', '1.1 Return code is PROCESSED');

      const saved = await Complaint.findById(complaint._id);
      assert(saved.status === 'processed', '1.2 Complaint status is processed');
      assert(saved.clusterId === null, '1.3 Complaint clusterId remains null when no candidates exist');

      await mockAi.close();
    }

    // TEST 2: Duplicate with no existing cluster -> creates cluster and assigns clusterId to both
    console.log('\n🔗 Test Suite 2: Duplicate with No Existing Cluster -> Creates Cluster');
    {
      // Existing seed complaint already processed
      const existingComplaint = await Complaint.create({
        originalText: 'TEST_INT_ Water pipe leakage in market square',
        translatedText: 'Water pipe leakage in market square',
        summary: 'TEST_INT_ Water pipe leakage in market square',
        category: 'Water Supply',
        status: 'processed',
        location: { type: 'Point', coordinates: [baseLng + 0.0002, baseLat + 0.0002] }, // ~30m
        clusterId: null,
      });

      // Mock AI that detects duplicate
      const mockAi = await createMockAiMicroservice((req, res, parsed) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            match: {
              id: existingComplaint._id.toString(),
              text: existingComplaint.translatedText,
              similarity: 0.88,
            },
          })
        );
      });

      const newComplaint = await Complaint.create({
        originalText: 'TEST_INT_ Massive water leaking from pipe near market',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        status: 'received',
      });

      const result = await processComplaint(newComplaint._id.toString(), {
        aiServiceUrl: mockAi.url,
      });

      assert(result.success === true, '2.1 Process returned success');
      assert(result.data.clusterId !== null, '2.2 New complaint has clusterId in response');

      const updatedNew = await Complaint.findById(newComplaint._id);
      const updatedExisting = await Complaint.findById(existingComplaint._id);

      assert(updatedNew.clusterId !== null, '2.3 New complaint has clusterId in DB');
      assert(updatedExisting.clusterId !== null, '2.4 Existing complaint updated with clusterId in DB');
      assert(
        updatedNew.clusterId.toString() === updatedExisting.clusterId.toString(),
        '2.5 Both complaints share the same clusterId'
      );

      const clusterDoc = await Cluster.findById(updatedNew.clusterId);
      assert(clusterDoc !== null, '2.6 Cluster document created in DB');
      assert(clusterDoc.complaintCount === 2, '2.7 Cluster complaintCount is initialized to 2');

      await mockAi.close();
    }

    // TEST 3: Duplicate with existing cluster -> adds complaint to existing cluster
    console.log('\n➕ Test Suite 3: Duplicate with Existing Cluster -> Adds to Cluster');
    {
      // Create existing cluster
      const existingCluster = await Cluster.create({
        title: 'TEST_INT_ Existing Water Outage Cluster',
        category: 'Water Supply',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        complaintCount: 2,
        lastReportedAt: new Date(Date.now() - 30000),
      });

      // Seed complaint that belongs to existingCluster
      const seededComplaint = await Complaint.create({
        originalText: 'TEST_INT_ No water supply in block A',
        translatedText: 'No water supply in block A',
        summary: 'TEST_INT_ No water supply in block A',
        category: 'Water Supply',
        status: 'processed',
        location: { type: 'Point', coordinates: [baseLng + 0.0003, baseLat + 0.0003] },
        clusterId: existingCluster._id,
      });

      // Mock AI that matches seededComplaint
      const mockAi = await createMockAiMicroservice((req, res, parsed) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            match: {
              id: seededComplaint._id.toString(),
              text: seededComplaint.translatedText,
              similarity: 0.92,
            },
          })
        );
      });

      const thirdComplaint = await Complaint.create({
        originalText: 'TEST_INT_ Water completely stopped in block A flats',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        status: 'received',
      });

      const result = await processComplaint(thirdComplaint._id.toString(), {
        aiServiceUrl: mockAi.url,
      });

      assert(result.success === true, '3.1 Process returned success');
      const updatedThird = await Complaint.findById(thirdComplaint._id);
      assert(
        updatedThird.clusterId.toString() === existingCluster._id.toString(),
        '3.2 Third complaint assigned to existingCluster._id'
      );

      const refreshedCluster = await Cluster.findById(existingCluster._id);
      assert(refreshedCluster.complaintCount === 3, '3.3 Cluster complaintCount incremented from 2 to 3');

      await mockAi.close();
    }

    // TEST 4: Clustering failure does NOT fail the complaint
    console.log('\n🛡️ Test Suite 4: Clustering Failure Does Not Fail Complaint');
    {
      // Mock AI where /process-complaint succeeds, but /find-duplicate returns 500
      const mockAi = await createMockAiMicroservice((req, res) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'Similarity model out of memory' }));
      });

      // Seed a nearby processed complaint so candidate search finds something
      await Complaint.create({
        originalText: 'TEST_INT_ Nearby complaint',
        translatedText: 'Nearby complaint',
        category: 'Water Supply',
        status: 'processed',
        location: { type: 'Point', coordinates: [baseLng + 0.0001, baseLat + 0.0001] },
      });

      const complaintWithClusterFailure = await Complaint.create({
        originalText: 'TEST_INT_ Water pressure very low',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        status: 'received',
      });

      const result = await processComplaint(complaintWithClusterFailure._id.toString(), {
        aiServiceUrl: mockAi.url,
      });

      assert(result.success === true, '4.1 Complaint processing succeeds even if clustering fails');
      assert(result.statusCode === 200, '4.1 Returns 200 status');
      assert(result.code === 'PROCESSED', '4.1 Return code is PROCESSED');

      const saved = await Complaint.findById(complaintWithClusterFailure._id);
      assert(saved.status === 'processed', '4.2 Complaint status in DB is "processed"');
      assert(saved.category === 'Water Supply', '4.2 Category persisted from classification');

      await mockAi.close();
    }

    // TEST 5: Existing classification failure behavior remains unchanged
    console.log('\n⚠️ Test Suite 5: Classification Failure Behavior Preserved');
    {
      // Mock AI where /process-complaint fails with 503
      const failingMockAi = await createMockAiMicroservice(null, (req, res) => {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: 'AI classification service unavailable' }));
      });

      const failureDoc = await Complaint.create({
        originalText: 'TEST_INT_ Sewer line overflow',
        location: { type: 'Point', coordinates: [baseLng, baseLat] },
        status: 'received',
      });

      const result = await processComplaint(failureDoc._id.toString(), {
        aiServiceUrl: failingMockAi.url,
      });

      assert(result.success === false, '5.1 Classification failure returns success: false');
      assert(result.statusCode === 503, '5.1 Status code reflects AI service error (503)');

      const failedDocInDb = await Complaint.findById(failureDoc._id);
      assert(failedDocInDb.status === 'failed', '5.2 Complaint transitioned to "failed" on AI classification error');

      await failingMockAi.close();
    }

    // Clean up test data
    await Complaint.deleteMany({ originalText: { $regex: /^TEST_INT_/ } });
    await Cluster.deleteMany({ title: { $regex: /^TEST_INT_/ } });
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n==================================================================');
  console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
};

runTests();
