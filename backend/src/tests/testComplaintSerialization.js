import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import app from '../app.js';
import Complaint from '../models/Complaint.js';
import { serializeComplaint, serializeComplaints } from '../serializers/complaintSerializer.js';

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
        Accept: 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body !== null) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('🧪 JANSETU BACKEND - COMPLAINT SERIALIZATION & NORMALIZATION TESTS');
  console.log('==================================================================\n');

  // Test Suite 1: Unit tests for serializer function
  console.log('📦 Test Suite 1: Serializer Unit Tests');
  {
    // 1.1 Null / Undefined input
    assert(serializeComplaint(null) === null, '1.1 serializeComplaint(null) returns null');
    assert(serializeComplaint(undefined) === null, '1.1 serializeComplaint(undefined) returns null');
    assert(Array.isArray(serializeComplaints(null)) && serializeComplaints(null).length === 0, '1.1 serializeComplaints(null) returns empty array');

    // 1.2 Full Complaint Document with coordinates
    const mockDoc = {
      _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d1'),
      originalText: 'Water leakage on MG Road',
      translatedText: 'Water leakage on MG Road',
      summary: 'Water pipe broken on main road',
      category: 'Water Supply',
      status: 'processed',
      location: {
        type: 'Point',
        coordinates: [77.4190, 23.2450], // [lng, lat]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };

    const serialized = serializeComplaint(mockDoc);
    assert(serialized.id === '65f1a2b3c4d5e6f7a8b9c0d1', '1.2 Exposes id as string mapped from _id');
    assert(serialized.latitude === 23.2450, '1.2 Extracts latitude from location.coordinates[1]');
    assert(serialized.longitude === 77.4190, '1.2 Extracts longitude from location.coordinates[0]');
    assert(serialized.originalText === 'Water leakage on MG Road', '1.2 Preserves originalText');
    assert(serialized.translatedText === 'Water leakage on MG Road', '1.2 Preserves translatedText');
    assert(serialized.summary === 'Water pipe broken on main road', '1.2 Preserves summary');
    assert(serialized.category === 'Water Supply', '1.2 Preserves category');
    assert(serialized.status === 'processed', '1.2 Preserves status');
    assert(serialized.__v === undefined, '1.2 Excludes __v from serialized response');

    // 1.3 Missing / Null location does not throw and returns null lat/lng
    const docNoLocation = {
      _id: new mongoose.Types.ObjectId('65f1a2b3c4d5e6f7a8b9c0d2'),
      originalText: 'Streetlight blinking',
      status: 'received',
      location: null,
    };
    const serializedNoLoc = serializeComplaint(docNoLocation);
    assert(serializedNoLoc.id === '65f1a2b3c4d5e6f7a8b9c0d2', '1.3 Handles doc with null location');
    assert(serializedNoLoc.latitude === null, '1.3 Returns null latitude when location is null');
    assert(serializedNoLoc.longitude === null, '1.3 Returns null longitude when location is null');

    // 1.4 Invalid coordinates format does not throw
    const docBadCoords = {
      _id: 'bad-coords-id',
      originalText: 'Road pothole',
      status: 'received',
      location: { type: 'Point', coordinates: ['invalid', null] },
    };
    const serializedBadCoords = serializeComplaint(docBadCoords);
    assert(serializedBadCoords.latitude === null, '1.4 Returns null latitude for invalid coords');
    assert(serializedBadCoords.longitude === null, '1.4 Returns null longitude for invalid coords');

    // 1.5 Array serialization
    const arraySerialized = serializeComplaints([mockDoc, docNoLocation]);
    assert(arraySerialized.length === 2, '1.5 serializeComplaints maps array correctly');
    assert(arraySerialized[0].id === '65f1a2b3c4d5e6f7a8b9c0d1', '1.5 First item serialized properly');
    assert(arraySerialized[1].latitude === null, '1.5 Second item serialized properly');
  }

  // Connect to DB and run HTTP integration tests
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jansetu';
  try {
    await mongoose.connect(mongoUri);
  } catch (err) {
    console.log(`  (Running in offline/unconnected DB mode: ${err.message})`);
  }

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
    console.log('\n🌐 Test Suite 2: HTTP Endpoint Normalization Tests');
    {
      // Create a test complaint in DB
      const testComplaint = await Complaint.create({
        originalText: 'P2 P4 Contract Verification: Water overflow near bus terminal',
        location: {
          type: 'Point',
          coordinates: [77.4125, 23.2599], // [lng, lat]
        },
        category: 'Water Supply',
        status: 'received',
      });

      const testId = testComplaint._id.toString();

      // 2.1 GET /api/complaints/:id
      const getRes = await makeHttpRequest(expressServer.url, `/api/complaints/${testId}`);
      assert(getRes.status === 200, '2.1 GET /api/complaints/:id returns 200 OK');
      assert(getRes.body.success === true, '2.1 Returns success: true');
      assert(getRes.body.data.id === testId, '2.1 Response data has id matching MongoDB _id');
      assert(getRes.body.data.latitude === 23.2599, '2.1 Response data has correct latitude (23.2599)');
      assert(getRes.body.data.longitude === 77.4125, '2.1 Response data has correct longitude (77.4125)');
      assert(getRes.body.data.category === 'Water Supply', '2.1 Preserves category');
      assert(getRes.body.data.status === 'received', '2.1 Preserves status');
      assert(getRes.body.data.originalText.includes('P2 P4 Contract Verification'), '2.1 Preserves originalText');

      // 2.2 GET /api/complaints
      const listRes = await makeHttpRequest(expressServer.url, '/api/complaints');
      assert(listRes.status === 200, '2.2 GET /api/complaints returns 200 OK');
      assert(listRes.body.success === true, '2.2 List response returns success: true');
      assert(Array.isArray(listRes.body.data), '2.2 List response data is an array');
      assert(listRes.body.pagination && typeof listRes.body.pagination.total === 'number', '2.2 Preserves pagination metadata');

      const foundItem = listRes.body.data.find((c) => c.id === testId);
      assert(foundItem !== undefined, '2.2 Newly created complaint found in list with id field');
      if (foundItem) {
        assert(foundItem.id === testId, '2.2 List item exposes id');
        assert(foundItem.latitude === 23.2599, '2.2 List item exposes latitude');
        assert(foundItem.longitude === 77.4125, '2.2 List item exposes longitude');
      }

      // Cleanup test document
      await Complaint.findByIdAndDelete(testId);
    }
  } finally {
    await expressServer.close();
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
