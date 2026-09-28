/**
 * Complaint Response Normalization / Serialization Layer
 *
 * Formats complaint documents for API responses (GET /api/complaints, GET /api/complaints/:id)
 * to satisfy the frontend integration contract without altering MongoDB schema or persistence.
 */

/**
 * Normalizes a single complaint document/object for API response.
 *
 * Exposes:
 * - id: string, mapped from MongoDB _id
 * - originalText
 * - translatedText
 * - summary
 * - category
 * - status
 * - latitude: number, extracted from location.coordinates[1] (null if missing/invalid)
 * - longitude: number, extracted from location.coordinates[0] (null if missing/invalid)
 *
 * @param {object|null} complaint - Mongoose document or plain object
 * @returns {object|null} Normalized complaint object
 */
export const serializeComplaint = (complaint) => {
  if (!complaint) return null;

  const raw = typeof complaint.toObject === 'function' ? complaint.toObject() : { ...complaint };
  delete raw.__v;

  const id = raw._id ? raw._id.toString() : (raw.id ? String(raw.id) : null);
  const coordinates = raw.location && Array.isArray(raw.location.coordinates) ? raw.location.coordinates : null;

  const longitude = (coordinates && typeof coordinates[0] === 'number' && Number.isFinite(coordinates[0]))
    ? coordinates[0]
    : null;
  const latitude = (coordinates && typeof coordinates[1] === 'number' && Number.isFinite(coordinates[1]))
    ? coordinates[1]
    : null;

  return {
    ...raw,
    id,
    originalText: raw.originalText ?? null,
    translatedText: raw.translatedText ?? null,
    summary: raw.summary ?? null,
    category: raw.category ?? null,
    status: raw.status ?? 'received',
    latitude,
    longitude,
  };
};

/**
 * Normalizes an array of complaint documents/objects for API response.
 *
 * @param {Array} complaints - Array of Mongoose documents or plain objects
 * @returns {Array} Array of normalized complaint objects
 */
export const serializeComplaints = (complaints) => {
  if (!Array.isArray(complaints)) return [];
  return complaints.map(serializeComplaint);
};
