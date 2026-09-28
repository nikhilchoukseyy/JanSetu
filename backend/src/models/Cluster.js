import mongoose from 'mongoose';

/**
 * GeoJSON Point Schema for cluster coordinates and geospatial hotspot queries.
 * Coordinates are formatted as: [longitude, latitude]
 */
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required for GeoJSON Point [longitude, latitude]'],
      validate: {
        validator: function (coords) {
          if (!Array.isArray(coords) || coords.length !== 2) {
            return false;
          }
          const [longitude, latitude] = coords;
          return (
            typeof longitude === 'number' &&
            typeof latitude === 'number' &&
            !Number.isNaN(longitude) &&
            !Number.isNaN(latitude) &&
            Number.isFinite(longitude) &&
            Number.isFinite(latitude) &&
            longitude >= -180 &&
            longitude <= 180 &&
            latitude >= -90 &&
            latitude <= 90
          );
        },
        message:
          'Coordinates must be a valid [longitude, latitude] pair where -180 <= longitude <= 180 and -90 <= latitude <= 90.',
      },
    },
  },
  { _id: false }
);

/**
 * Cluster Schema representing aggregated duplicate/hotspot citizen issues.
 */
const clusterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required for a cluster'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required for a cluster'],
      trim: true,
      index: true,
    },
    location: {
      type: pointSchema,
      required: [true, 'Location is required for cluster geospatial mapping'],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in_progress', 'resolved'],
        message: '{VALUE} is not a recognized cluster status',
      },
      default: 'open',
      index: true,
    },
    complaintCount: {
      type: Number,
      default: 1,
      min: [1, 'Complaint count must be at least 1'],
    },
    firstReportedAt: {
      type: Date,
      default: Date.now,
    },
    lastReportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index on location for radius queries and geospatial hotspot mapping
clusterSchema.index({ location: '2dsphere' });
clusterSchema.index({ category: 1, status: 1 });
clusterSchema.index({ complaintCount: -1 });
clusterSchema.index({ lastReportedAt: -1 });

const Cluster = mongoose.model('Cluster', clusterSchema);

export default Cluster;
