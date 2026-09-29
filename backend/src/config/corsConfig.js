/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * Configurable via environment variables (CORS_ORIGIN).
 * Supports comma-separated origin lists, wildcard '*', and provides safe defaults
 * including production domains and local development environments.
 */

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://jansetulive.vercel.app',
  'https://jansetuadmin.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5174',
];

export const parseAllowedOrigins = (...args) => {
  const envOrigin = args.length > 0 ? args[0] : process.env.CORS_ORIGIN;
  if (typeof envOrigin !== 'string' || envOrigin.trim() === '') {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const trimmed = envOrigin.trim();
  if (trimmed === '*') {
    return '*';
  }

  const origins = trimmed
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
};

/**
 * Validates whether an incoming request origin is permitted.
 *
 * @param {string|undefined} origin - Request Origin header
 * @param {string[]|string} [allowedOrigins] - Parsed allowed origins list or '*'
 * @returns {boolean}
 */
export const isOriginAllowed = (origin, allowedOrigins) => {
  const allowed = allowedOrigins !== undefined ? allowedOrigins : parseAllowedOrigins();

  // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
  if (!origin) {
    return true;
  }

  if (allowed === '*') {
    return true;
  }

  if (Array.isArray(allowed)) {
    const normalized = origin.trim().replace(/\/+$/, '');
    return allowed.includes(normalized);
  }

  return false;
};

/**
 * Builds the options object for express cors middleware.
 *
 * @param {string|undefined} envOrigin - Optional override for environment origin setting
 * @returns {import('cors').CorsOptions}
 */
export const getCorsOptions = (envOrigin = process.env.CORS_ORIGIN) => {
  return {
    origin: (origin, callback) => {
      const allowed = parseAllowedOrigins(envOrigin);
      if (isOriginAllowed(origin, allowed)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: [
      'Content-Length',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours preflight cache
  };
};
