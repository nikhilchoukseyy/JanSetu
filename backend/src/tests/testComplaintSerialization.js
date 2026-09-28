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

    console.log('\n🎯 Test Suite 3: P2 → P4 Category Alias & Limit Contract Tests');
    {
      // Seed test complaints for each canonical category
      const seededComplaints = await Complaint.insertMany([
        {
          originalText: 'P2 P4 Contract Test: Leaking pipe on MG Road',
          location: { type: 'Point', coordinates: [77.4101, 23.2501] },
          category: 'Water Supply',
          status: 'processed',
        },
        {
          originalText: 'P2 P4 Contract Test: Pothole on Express Highway',
          location: { type: 'Point', coordinates: [77.4102, 23.2502] },
          category: 'Roads & Infrastructure',
          status: 'processed',
        },
        {
          originalText: 'P2 P4 Contract Test: Garbage pile near community park',
          location: { type: 'Point', coordinates: [77.4103, 23.2503] },
          category: 'Sanitation & Waste Management',
          status: 'processed',
        },
        {
          originalText: 'P2 P4 Contract Test: Transformer sparking in block B',
          location: { type: 'Point', coordinates: [77.4104, 23.2504] },
          category: 'Electricity & Power',
          status: 'processed',
        },
        {
          originalText: 'P2 P4 Contract Test: General civic inquiry',
          location: { type: 'Point', coordinates: [77.4105, 23.2505] },
          category: 'Other',
          status: 'processed',
        },
      ]);

      const seededIds = seededComplaints.map((c) => c._id);

      try {
        // 3.1 ?category=Water returns Water Supply complaints
        const waterRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Water');
        assert(waterRes.status === 200, '3.1 GET /api/complaints?category=Water returns 200');
        assert(
          Array.isArray(waterRes.body.data) &&
          waterRes.body.data.length > 0 &&
          waterRes.body.data.every((c) => c.category === 'Water Supply'),
          '3.1 ?category=Water maps to and returns Water Supply complaints'
        );

        // 3.2 ?category=Roads returns Roads & Infrastructure complaints
        const roadsRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Roads');
        assert(roadsRes.status === 200, '3.2 GET /api/complaints?category=Roads returns 200');
        assert(
          Array.isArray(roadsRes.body.data) &&
          roadsRes.body.data.length > 0 &&
          roadsRes.body.data.every((c) => c.category === 'Roads & Infrastructure'),
          '3.2 ?category=Roads maps to and returns Roads & Infrastructure complaints'
        );

        // 3.3 ?category=Sanitation returns Sanitation & Waste Management complaints
        const sanRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Sanitation');
        assert(sanRes.status === 200, '3.3 GET /api/complaints?category=Sanitation returns 200');
        assert(
          Array.isArray(sanRes.body.data) &&
          sanRes.body.data.length > 0 &&
          sanRes.body.data.every((c) => c.category === 'Sanitation & Waste Management'),
          '3.3 ?category=Sanitation maps to and returns Sanitation & Waste Management complaints'
        );

        // 3.4 ?category=Electricity returns Electricity & Power complaints
        const elecRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Electricity');
        assert(elecRes.status === 200, '3.4 GET /api/complaints?category=Electricity returns 200');
        assert(
          Array.isArray(elecRes.body.data) &&
          elecRes.body.data.length > 0 &&
          elecRes.body.data.every((c) => c.category === 'Electricity & Power'),
          '3.4 ?category=Electricity maps to and returns Electricity & Power complaints'
        );

        // 3.5 Existing canonical category filtering still works
        const canonicalWaterRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Water%20Supply');
        assert(canonicalWaterRes.status === 200, '3.5 GET /api/complaints?category=Water%20Supply returns 200');
        assert(
          canonicalWaterRes.body.data.every((c) => c.category === 'Water Supply'),
          '3.5 Canonical "Water Supply" filter returns matching complaints'
        );

        const otherRes = await makeHttpRequest(expressServer.url, '/api/complaints?category=Other');
        assert(otherRes.status === 200, '3.5 GET /api/complaints?category=Other returns 200');
        assert(
          otherRes.body.data.every((c) => c.category === 'Other'),
          '3.5 Canonical "Other" category filter returns matching complaints'
        );

        // 3.6 limit=1000 is accepted
        const limit1000Res = await makeHttpRequest(expressServer.url, '/api/complaints?limit=1000');
        assert(limit1000Res.status === 200, '3.6 GET /api/complaints?limit=1000 returns 200');
        assert(limit1000Res.body.pagination.limit === 1000, '3.6 limit=1000 is accepted and reflected in pagination');

        // 3.7 limit above 1000 is capped at 1000
        const limitAboveRes = await makeHttpRequest(expressServer.url, '/api/complaints?limit=1500');
        assert(limitAboveRes.status === 200, '3.7 GET /api/complaints?limit=1500 returns 200');
        assert(limitAboveRes.body.pagination.limit === 1000, '3.7 limit above 1000 is capped to 1000');
      } finally {
        // Cleanup all seeded test documents
        await Complaint.deleteMany({ _id: { $in: seededIds } });
      }
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
