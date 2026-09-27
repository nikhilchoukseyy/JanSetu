import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Complaint from '../models/Complaint.js';
import Cluster from '../models/Cluster.js';
import {
  findCandidateComplaints,
  createClusterFromMatch,
  addComplaintToCluster,
  CLUSTER_RADIUS_METERS,
  MAX_CANDIDATES_LIMIT,
} from '../services/clusterService.js';

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
  console.log('\n==================================================================');
  console.log('🧪 JANSETU BACKEND - CLUSTER SERVICE & MODEL TESTS');
  console.log('==================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jansetu';
  try {
    await mongoose.connect(mongoUri);
    console.log(`  Connected to MongoDB at ${mongoUri}`);
  } catch (err) {
    console.error('  Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }

  try {
    // Clean up test data before starting
    await Complaint.deleteMany({ originalText: { $regex: /^TEST_CLUSTER_/ } });
    await Cluster.deleteMany({ title: { $regex: /^TEST_CLUSTER_/ } });

    // TEST SUITE 1: Cluster Model Schema Validation & Index
    console.log('\n📦 Test Suite 1: Cluster Model Validation & Indexes');
    {
      // 1.1 Create valid cluster
      const validCluster = await Cluster.create({
        title: 'TEST_CLUSTER_ Water Pipe Burst on Ring Road',
        category: 'Water Supply',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        status: 'open',
        complaintCount: 1,
      });

      assert(validCluster._id !== undefined, '1.1 Cluster created successfully');
      assert(validCluster.status === 'open', '1.1 Cluster default status is "open"');
      assert(validCluster.complaintCount === 1, '1.1 Cluster default complaintCount is 1');
      assert(validCluster.firstReportedAt instanceof Date, '1.1 firstReportedAt is a valid Date');
      assert(validCluster.lastReportedAt instanceof Date, '1.1 lastReportedAt is a valid Date');

      // 1.2 Validation: invalid coordinates
      try {
        await Cluster.create({
          title: 'TEST_CLUSTER_ Invalid Coords',
          category: 'Water Supply',
          location: {
            type: 'Point',
            coordinates: [200, 100], // Invalid longitude and latitude
          },
        });
        assert(false, '1.2 Rejects out-of-bounds coordinates');
      } catch (err) {
        assert(true, '1.2 Correctly rejected out-of-bounds coordinates');
      }

      // 1.3 Validation: invalid status enum
      try {
        await Cluster.create({
          title: 'TEST_CLUSTER_ Invalid Status',
          category: 'Water Supply',
          location: {
            type: 'Point',
            coordinates: [77.5946, 12.9716],
          },
          status: 'unknown_status',
        });
        assert(false, '1.3 Rejects unrecognized status enum');
      } catch (err) {
        assert(true, '1.3 Correctly rejected unrecognized status enum');
      }
    }

    // TEST SUITE 2: findCandidateComplaints Geospatial & Category Query
    console.log('\n🔍 Test Suite 2: findCandidateComplaints Query');
    {
      // Use unique test coordinates/category for isolated test assertions
      const testCategory = 'Water Supply';
      // Use coordinates in a specific test location [80.1234, 15.5678]
      const baseLng = 80.1234;
      const baseLat = 15.5678;

      const nearbyWaterComplaint = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Water leakage near park',
        translatedText: 'Water leakage near park',
        category: testCategory,
        summary: 'Water leakage near park',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [baseLng + 0.0004, baseLat + 0.0004], // ~60m away
        },
      });

      const farWaterComplaint = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Water pipe burst 10km away',
        translatedText: 'Water pipe burst 10km away',
        category: testCategory,
        summary: 'Water pipe burst far',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [baseLng + 0.1, baseLat + 0.1], // ~15km away
        },
      });

      const nearbyRoadsComplaint = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Pothole near park',
        translatedText: 'Pothole near park',
        category: 'Roads & Infrastructure',
        summary: 'Pothole near park',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [baseLng + 0.0004, baseLat + 0.0004], // Same location, different category
        },
      });

      const nearbyUnprocessedComplaint = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Water leak unprocessed',
        category: testCategory,
        status: 'received', // not processed
        location: {
          type: 'Point',
          coordinates: [baseLng + 0.0004, baseLat + 0.0004],
        },
      });

      const currentWaterComplaint = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Pipe broken in park',
        translatedText: 'Pipe broken in park',
        category: testCategory,
        status: 'processing',
        location: {
          type: 'Point',
          coordinates: [baseLng, baseLat],
        },
      });

      // Execute candidate search
      const candidates = await findCandidateComplaints(currentWaterComplaint);

      assert(Array.isArray(candidates), '2.1 Candidates returned as array');
      assert(candidates.length === 1, '2.1 Exactly 1 candidate found within 1000m matching category & processed status', `found ${candidates.length}`);
      assert(
        candidates[0]._id.toString() === nearbyWaterComplaint._id.toString(),
        '2.2 Found candidate matches nearbyWaterComplaint'
      );
      assert(
        candidates.every((c) => c._id.toString() !== currentWaterComplaint._id.toString()),
        '2.3 Current complaint is excluded from candidate list'
      );
      assert(
        candidates.every((c) => c.category === 'Water Supply'),
        '2.4 Only candidates with matching category are returned'
      );
      assert(
        candidates.every((c) => c.status === 'processed' || c.status === undefined),
        '2.5 Only processed complaints are matched'
      );

      // Edge case: empty input / missing location
      const emptyCandidates = await findCandidateComplaints(null);
      assert(Array.isArray(emptyCandidates) && emptyCandidates.length === 0, '2.6 Null complaint returns empty array');

      const noLocCandidates = await findCandidateComplaints({ category: 'Water Supply' });
      assert(Array.isArray(noLocCandidates) && noLocCandidates.length === 0, '2.7 Complaint without location returns empty array');
    }

    // TEST SUITE 3: createClusterFromMatch
    console.log('\n🔗 Test Suite 3: createClusterFromMatch');
    {
      const complaintA = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Streetlight dark at corner',
        translatedText: 'Streetlight not functioning at corner',
        category: 'Electricity & Power',
        summary: 'Streetlight not functioning',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
      });

      const complaintB = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Street lamp broken here',
        translatedText: 'Street lamp broken here',
        category: 'Electricity & Power',
        summary: 'Street lamp broken',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [77.5947, 12.9717],
        },
      });

      const createdCluster = await createClusterFromMatch(complaintB, complaintA);

      assert(createdCluster !== null, '3.1 Cluster created from match');
      assert(createdCluster.complaintCount === 2, '3.1 Cluster complaintCount is initialized to 2');
      assert(createdCluster.category === 'Electricity & Power', '3.1 Cluster category matches complaints');

      // Verify both complaints have clusterId updated in DB
      const updatedA = await Complaint.findById(complaintA._id);
      const updatedB = await Complaint.findById(complaintB._id);

      assert(
        updatedA.clusterId && updatedA.clusterId.toString() === createdCluster._id.toString(),
        '3.2 Matched complaint A has clusterId updated in MongoDB'
      );
      assert(
        updatedB.clusterId && updatedB.clusterId.toString() === createdCluster._id.toString(),
        '3.3 Current complaint B has clusterId updated in MongoDB'
      );
      assert(
        complaintB.clusterId.toString() === createdCluster._id.toString(),
        '3.4 In-memory current complaint has clusterId updated'
      );
    }

    // TEST SUITE 4: addComplaintToCluster
    console.log('\n➕ Test Suite 4: addComplaintToCluster');
    {
      // Create existing cluster
      const cluster = await Cluster.create({
        title: 'TEST_CLUSTER_ Existing Cluster',
        category: 'Sanitation & Waste Management',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
        complaintCount: 2,
        lastReportedAt: new Date(Date.now() - 60000), // 1 min ago
      });

      const complaintC = await Complaint.create({
        originalText: 'TEST_CLUSTER_ Garbage pile overflowing',
        translatedText: 'Garbage pile overflowing',
        category: 'Sanitation & Waste Management',
        summary: 'Garbage pile overflowing',
        status: 'processed',
        location: {
          type: 'Point',
          coordinates: [77.5948, 12.9718],
        },
      });

      const beforeTime = cluster.lastReportedAt.getTime();
      const updatedCluster = await addComplaintToCluster(complaintC, cluster._id);

      assert(updatedCluster.complaintCount === 3, '4.1 Atomically incremented complaintCount to 3');
      assert(updatedCluster.lastReportedAt.getTime() >= beforeTime, '4.1 Updated lastReportedAt timestamp');

      // Verify complaintC has clusterId in DB
      const updatedC = await Complaint.findById(complaintC._id);
      assert(
        updatedC.clusterId && updatedC.clusterId.toString() === cluster._id.toString(),
        '4.2 Added complaint C has clusterId set in MongoDB'
      );
      assert(
        complaintC.clusterId.toString() === cluster._id.toString(),
        '4.3 In-memory complaint C has clusterId set'
      );
    }

    // Clean up test data
    await Complaint.deleteMany({ originalText: { $regex: /^TEST_CLUSTER_/ } });
    await Cluster.deleteMany({ title: { $regex: /^TEST_CLUSTER_/ } });
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
