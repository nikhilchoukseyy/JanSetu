/**
 * In-memory sliding window rate limiter middleware for JanSetu API.
 * Provides protection against brute-force and DoS traffic without external dependencies.
 */

/**
 * Creates a rate limiter middleware with configurable window and thresholds.
 *
 * @param {object} options
 * @param {number} [options.windowMs=60000] - Time window in milliseconds (default: 1 minute)
 * @param {number} [options.max=60] - Max allowed requests per window per IP
 * @param {string} [options.message='Too many requests. Please try again later.'] - Error message
 * @param {Function} [options.keyGenerator] - Custom key generator function (defaults to client IP)
 * @param {Function} [options.skip] - Function to skip rate limiting (e.g., in test mode)
 * @returns {import('express').RequestHandler}
 */
export const createRateLimiter = (options = {}) => {
  const windowMs = Number(options.windowMs) || 60 * 1000;
  const max = Number(options.max) || 60;
  const message = options.message || 'Too many requests. Please try again later.';
  const keyGenerator =
    options.keyGenerator ||
    ((req) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (forwarded) {
        return String(forwarded).split(',')[0].trim();
      }
      return req.ip || req.socket?.remoteAddress || '127.0.0.1';
    });
  const skip = options.skip || (() => false);

  // Map to store request timestamps: key -> number[]
  const store = new Map();

  // Periodic cleanup every 2 minutes to prevent unbounded memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);
      if (validTimestamps.length === 0) {
        store.delete(key);
      } else {
        store.set(key, validTimestamps);
      }
    }
  }, Math.max(windowMs, 60000));

  // Ensure timer does not prevent process exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  const rateLimiter = (req, res, next) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const timestamps = (store.get(key) || []).filter((ts) => now - ts < windowMs);

    const currentCount = timestamps.length;
    const remaining = Math.max(0, max - (currentCount + 1));
    const oldestTimestamp = timestamps[0] || now;
    const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs) / 1000);
    const retryAfterSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', currentCount >= max ? 0 : remaining);
    res.setHeader('X-RateLimit-Reset', resetTimeSeconds);

    if (currentCount >= max) {
      res.setHeader('Retry-After', Math.max(1, retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    timestamps.push(now);
    store.set(key, timestamps);

    next();
  };

  // Helper method for tests to inspect or reset store
  rateLimiter.reset = () => store.clear();
  rateLimiter.getHits = (key) => (store.get(key) || []).length;

  return rateLimiter;
};

// Complaint creation limiter: 30 requests per minute
export const complaintCreateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_CREATE_MAX, 10) || 30,
  message: 'Too many complaint submissions. Please wait before submitting again.',
});

// AI processing trigger limiter: 15 requests per minute per IP
export const complaintProcessLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_PROCESS_MAX, 10) || 15,
  message: 'Too many complaint processing requests. Please wait a moment.',
});

// General read requests limiter: 120 requests per minute per IP
export const complaintGeneralLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX, 10) || 120,
  message: 'Too many requests. Please slow down.',
});
