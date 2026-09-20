import mongoose from 'mongoose';

/**
 * GeoJSON Point Schema for geospatial queries and hotspot clustering.
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
 * Complaint Schema representing citizen development requests.
 * Designed to support lifecycle transitions and asynchronous AI processing.
 */
const complaintSchema = new mongoose.Schema(
  {
    // Raw citizen input (text or audio reference)
    originalText: {
      type: String,
      trim: true,
      default: null,
    },
    audioReference: {
      type: String,
      trim: true,
      default: null,
    },
    language: {
      type: String,
      trim: true,
      default: null,
    },

    // AI-derived fields (populated asynchronously by the AI pipeline)
    translatedText: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      trim: true,
      default: null, // Category taxonomy will be defined during AI integration
    },
    summary: {
      type: String,
      trim: true,
      default: null,
    },
    clusterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cluster',
      default: null,
    },

    // Geolocation data for demand mapping and spatial clustering
    location: {
      type: pointSchema,
      required: [true, 'Location is required for citizen demand aggregation'],
    },

    // Processing status lifecycle
    status: {
      type: String,
      enum: {
        values: ['received', 'processing', 'processed', 'failed'],
        message: '{VALUE} is not a recognized complaint status',
      },
      default: 'received',
      required: true,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Validation: Ensure at least originalText or audioReference is provided
complaintSchema.pre('validate', function () {
  const hasText = this.originalText && typeof this.originalText === 'string' && this.originalText.trim().length > 0;
  const hasAudio = this.audioReference && typeof this.audioReference === 'string' && this.audioReference.trim().length > 0;

  if (!hasText && !hasAudio) {
    this.invalidate('originalText', 'Either originalText or audioReference must be provided.');
  }
});

// Indexes for performance and query optimization
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ clusterId: 1 });
complaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
