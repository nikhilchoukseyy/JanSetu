import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import Cluster from '../models/Cluster.js';

export const CLUSTER_RADIUS_METERS = 1000;
export const MAX_CANDIDATES_LIMIT = 30;

/**
 * Finds candidate processed complaints in the same category within 1000 meters for duplicate detection.
 *
 * @param {object} complaint - Current complaint document or object
 * @param {object} [options={}] - Query options
 * @param {number} [options.maxDistance=1000] - Distance in meters
 * @param {number} [options.limit=30] - Max candidates to return
 * @returns {Promise<Array<object>>} Array of candidate complaint documents (lean objects)
 */
export const findCandidateComplaints = async (complaint, options = {}) => {
  if (!complaint) {
    return [];
  }

  const complaintId = complaint._id || complaint.id;
  const category = complaint.category;
  const coordinates = complaint.location && Array.isArray(complaint.location.coordinates)
    ? complaint.location.coordinates
    : null;

  // If no location coordinates or category, geospatial candidate matching cannot run
  if (!coordinates || coordinates.length !== 2 || !category) {
    return [];
  }

  const [longitude, latitude] = coordinates;
  if (
    typeof longitude !== 'number' ||
    typeof latitude !== 'number' ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    return [];
  }

  const maxDistance = typeof options.maxDistance === 'number' && options.maxDistance > 0
    ? options.maxDistance
    : CLUSTER_RADIUS_METERS;

  const limit = typeof options.limit === 'number' && options.limit > 0
    ? options.limit
    : MAX_CANDIDATES_LIMIT;

  const query = {
    status: 'processed',
    category,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  };

  // Exclude current complaint if it already exists in DB
  if (complaintId && mongoose.Types.ObjectId.isValid(complaintId)) {
    query._id = { $ne: complaintId };
  }

  return Complaint.find(query)
    .select('_id originalText translatedText summary category clusterId location createdAt')
    .limit(limit)
    .lean();
};

/**
 * Creates a new Cluster when a semantic duplicate match is found between two standalone complaints.
 * Updates both complaints in MongoDB with the new clusterId and sets complaintCount to 2.
 *
 * @param {object} currentComplaint - The new/current complaint document or object
 * @param {object} matchedComplaint - The existing candidate complaint document or object that matched
 * @returns {Promise<object>} The created Cluster document
 */
export const createClusterFromMatch = async (currentComplaint, matchedComplaint) => {
  if (!currentComplaint || !matchedComplaint) {
    throw new Error('Both currentComplaint and matchedComplaint are required to create a cluster');
  }

  const category = currentComplaint.category || matchedComplaint.category;
  if (!category) {
    throw new Error('Complaint category is required to create a cluster');
  }

  const location = currentComplaint.location || matchedComplaint.location;
  if (!location || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
    throw new Error('Valid GeoJSON location is required to create a cluster');
  }

  // Derive descriptive cluster title from summaries or translated text
  const title = (
    currentComplaint.summary ||
    matchedComplaint.summary ||
    currentComplaint.translatedText ||
    matchedComplaint.translatedText ||
    currentComplaint.originalText ||
    matchedComplaint.originalText ||
    `${category} Issue`
  ).trim();

  const currentCreated = currentComplaint.createdAt ? new Date(currentComplaint.createdAt) : new Date();
  const matchedCreated = matchedComplaint.createdAt ? new Date(matchedComplaint.createdAt) : new Date();

  const firstReportedAt = currentCreated < matchedCreated ? currentCreated : matchedCreated;
  const lastReportedAt = currentCreated > matchedCreated ? currentCreated : matchedCreated;

  // 1. Create the new Cluster with initial count = 2
  const cluster = await Cluster.create({
    title,
    category,
    location: {
      type: 'Point',
      coordinates: [location.coordinates[0], location.coordinates[1]],
    },
    status: 'open',
    complaintCount: 2,
    firstReportedAt,
    lastReportedAt,
  });

  const clusterId = cluster._id;

  // 2. Assign clusterId to matched complaint in DB
  const matchedId = matchedComplaint._id || matchedComplaint.id;
  if (matchedId && mongoose.Types.ObjectId.isValid(matchedId)) {
    await Complaint.updateOne({ _id: matchedId }, { $set: { clusterId } });
  }
  matchedComplaint.clusterId = clusterId;

  // 3. Assign clusterId to current complaint in DB and in memory
  const currentId = currentComplaint._id || currentComplaint.id;
  if (currentId && mongoose.Types.ObjectId.isValid(currentId)) {
    await Complaint.updateOne({ _id: currentId }, { $set: { clusterId } });
  }
  currentComplaint.clusterId = clusterId;

  return cluster;
};

/**
 * Adds a complaint to an existing cluster, atomically incrementing complaintCount and updating lastReportedAt.
 *
 * @param {object} currentComplaint - The current complaint document or object
 * @param {string|mongoose.Types.ObjectId} clusterId - Target cluster MongoDB ObjectId
 * @returns {Promise<object>} The updated Cluster document
 */
export const addComplaintToCluster = async (currentComplaint, clusterId) => {
  if (!currentComplaint) {
    throw new Error('currentComplaint is required to add complaint to cluster');
  }

  if (!clusterId || !mongoose.Types.ObjectId.isValid(clusterId)) {
    throw new Error('Invalid clusterId provided');
  }

  // 1. Atomically increment complaint count and update timestamp
  const updatedCluster = await Cluster.findByIdAndUpdate(
    clusterId,
    {
      $inc: { complaintCount: 1 },
      $set: { lastReportedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!updatedCluster) {
    throw new Error(`Cluster with ID ${clusterId} not found`);
  }

  // 2. Update complaint with clusterId in memory and DB
  const currentId = currentComplaint._id || currentComplaint.id;
  if (currentId && mongoose.Types.ObjectId.isValid(currentId)) {
    await Complaint.updateOne({ _id: currentId }, { $set: { clusterId } });
  }
  currentComplaint.clusterId = clusterId;

  return updatedCluster;
};
