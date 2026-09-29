import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

import app from '../app.js';
import {
  DEFAULT_ALLOWED_ORIGINS,
  parseAllowedOrigins,
  isOriginAllowed,
  getCorsOptions,
} from '../config/corsConfig.js';

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
 * Helper to make raw HTTP requests against the test server
 */
const makeRawHttpRequest = (serverUrl, path, method = 'GET', body = null, customHeaders = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: customHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body !== null) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n==================================================================');
  console.log('🌐 JANSETU BACKEND - CORS CONFIGURATION & PREFLIGHT TEST SUITE');
  console.log('==================================================================\n');

  // TEST SUITE 1: Configuration & Origin Parsing Unit Tests
  console.log('📦 Test Suite 1: Origin Parsing & Configuration Unit Tests');
  {
    assert(
      DEFAULT_ALLOWED_ORIGINS.includes('https://jansetulive.vercel.app'),
      'Default origins includes https://jansetulive.vercel.app'
    );
    assert(
      DEFAULT_ALLOWED_ORIGINS.includes('https://jansetuadmin.vercel.app'),
      'Default origins includes https://jansetuadmin.vercel.app'
    );

    // Default parsing when empty/undefined
    const defaultParsed = parseAllowedOrigins(undefined);
    assert(Array.isArray(defaultParsed), 'parseAllowedOrigins(undefined) returns an array');
    assert(defaultParsed.includes('https://jansetulive.vercel.app'), 'parseAllowedOrigins default includes jansetulive');
    assert(defaultParsed.includes('https://jansetuadmin.vercel.app'), 'parseAllowedOrigins default includes jansetuadmin');

    // Wildcard parsing
    assert(parseAllowedOrigins('*') === '*', "parseAllowedOrigins('*') returns '*'");
    assert(parseAllowedOrigins(' * ') === '*', "parseAllowedOrigins(' * ') trims and returns '*'");

    // Comma-separated list parsing with trailing slashes & whitespace
    const customList = 'https://jansetulive.vercel.app/, https://jansetuadmin.vercel.app , http://localhost:5173/ ';
    const parsedCustom = parseAllowedOrigins(customList);
    assert(Array.isArray(parsedCustom) && parsedCustom.length === 3, 'parseAllowedOrigins parses 3 comma-separated origins');
    assert(parsedCustom.includes('https://jansetulive.vercel.app'), 'Strips trailing slash from jansetulive');
    assert(parsedCustom.includes('https://jansetuadmin.vercel.app'), 'Trims whitespace from jansetuadmin');
    assert(parsedCustom.includes('http://localhost:5173'), 'Normalizes local origin');

    // isOriginAllowed checks
    assert(isOriginAllowed(undefined, DEFAULT_ALLOWED_ORIGINS), 'Allows requests with no origin (e.g. mobile/curl)');
    assert(isOriginAllowed('https://jansetulive.vercel.app', DEFAULT_ALLOWED_ORIGINS), 'Validates https://jansetulive.vercel.app is allowed');
    assert(isOriginAllowed('https://jansetulive.vercel.app/', DEFAULT_ALLOWED_ORIGINS), 'Validates https://jansetulive.vercel.app/ with trailing slash is allowed');
    assert(isOriginAllowed('https://jansetuadmin.vercel.app', DEFAULT_ALLOWED_ORIGINS), 'Validates https://jansetuadmin.vercel.app is allowed');
    assert(!isOriginAllowed('https://unauthorized-domain.com', DEFAULT_ALLOWED_ORIGINS), 'Rejects unauthorized domain');
    assert(isOriginAllowed('https://any-domain.com', '*'), 'Wildcard allowedOrigins permits any domain');
  }

  // TEST SUITE 2: Live Express App CORS Verification
  console.log('\n🚀 Test Suite 2: Live Express Server CORS Integration');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((res) => s.close(res)),
      });
    });
  });

  try {
    // 2.1 GET /api/health from jansetulive
    const liveRes = await makeRawHttpRequest(server.url, '/api/health', 'GET', null, {
      Origin: 'https://jansetulive.vercel.app',
    });
    assert(liveRes.status === 200, 'GET /api/health returns 200');
    assert(
      liveRes.headers['access-control-allow-origin'] === 'https://jansetulive.vercel.app',
      'Returns Access-Control-Allow-Origin for https://jansetulive.vercel.app'
    );
    assert(
      liveRes.headers['access-control-allow-credentials'] === 'true',
      'Returns Access-Control-Allow-Credentials: true'
    );

    // 2.2 GET /api/health from jansetuadmin
    const adminRes = await makeRawHttpRequest(server.url, '/api/health', 'GET', null, {
      Origin: 'https://jansetuadmin.vercel.app',
    });
    assert(adminRes.status === 200, 'GET /api/health from admin returns 200');
    assert(
      adminRes.headers['access-control-allow-origin'] === 'https://jansetuadmin.vercel.app',
      'Returns Access-Control-Allow-Origin for https://jansetuadmin.vercel.app'
    );

    // 2.3 GET /api/health without Origin header (same-origin / server-to-server)
    const noOriginRes = await makeRawHttpRequest(server.url, '/api/health', 'GET', null);
    assert(noOriginRes.status === 200, 'GET /api/health without Origin header succeeds with 200');

    // 2.4 Preflight OPTIONS request for https://jansetulive.vercel.app
    console.log('\n⚡ Test Suite 3: Preflight OPTIONS Requests');
    const preflightLive = await makeRawHttpRequest(server.url, '/api/complaints', 'OPTIONS', null, {
      Origin: 'https://jansetulive.vercel.app',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });
    assert(
      preflightLive.status === 204 || preflightLive.status === 200,
      `Preflight OPTIONS returns ${preflightLive.status} (expected 204/200)`
    );
    assert(
      preflightLive.headers['access-control-allow-origin'] === 'https://jansetulive.vercel.app',
      'Preflight returns Access-Control-Allow-Origin for https://jansetulive.vercel.app'
    );
    assert(
      preflightLive.headers['access-control-allow-methods'] &&
        preflightLive.headers['access-control-allow-methods'].includes('POST'),
      'Preflight returns Access-Control-Allow-Methods containing POST'
    );
    assert(
      preflightLive.headers['access-control-allow-headers'] &&
        preflightLive.headers['access-control-allow-headers'].toLowerCase().includes('content-type'),
      'Preflight returns Access-Control-Allow-Headers containing Content-Type'
    );

    // 2.5 Preflight OPTIONS request for https://jansetuadmin.vercel.app
    const preflightAdmin = await makeRawHttpRequest(server.url, '/api/complaints', 'OPTIONS', null, {
      Origin: 'https://jansetuadmin.vercel.app',
      'Access-Control-Request-Method': 'PATCH',
      'Access-Control-Request-Headers': 'Content-Type, Authorization',
    });
    assert(
      preflightAdmin.status === 204 || preflightAdmin.status === 200,
      `Preflight OPTIONS for admin returns ${preflightAdmin.status}`
    );
    assert(
      preflightAdmin.headers['access-control-allow-origin'] === 'https://jansetuadmin.vercel.app',
      'Preflight returns Access-Control-Allow-Origin for https://jansetuadmin.vercel.app'
    );

    // 2.6 Preflight OPTIONS request from unauthorized origin with strict CORS configuration
    console.log('\n🛡️ Test Suite 4: Strict CORS Isolation');
    const customTestApp = express();
    const strictCorsOptions = getCorsOptions('https://jansetulive.vercel.app,https://jansetuadmin.vercel.app');
    customTestApp.use(cors(strictCorsOptions));
    customTestApp.get('/test', (req, res) => res.json({ ok: true }));

    const strictServer = await new Promise((resolve) => {
      const s = customTestApp.listen(0, '127.0.0.1', () => {
        const port = s.address().port;
        resolve({
          url: `http://127.0.0.1:${port}`,
          close: () => new Promise((res) => s.close(res)),
        });
      });
    });

    try {
      // Allowed in strict mode
      const strictAllowed = await makeRawHttpRequest(strictServer.url, '/test', 'GET', null, {
        Origin: 'https://jansetulive.vercel.app',
      });
      assert(
        strictAllowed.headers['access-control-allow-origin'] === 'https://jansetulive.vercel.app',
        'Strict mode allows jansetulive'
      );

      // Disallowed origin in strict mode
      const strictBlocked = await makeRawHttpRequest(strictServer.url, '/test', 'GET', null, {
        Origin: 'https://unauthorized-domain.com',
      });
      assert(
        !strictBlocked.headers['access-control-allow-origin'],
        'Strict mode omits Access-Control-Allow-Origin for unauthorized origin'
      );

      // Disallowed preflight in strict mode
      const strictPreflightBlocked = await makeRawHttpRequest(strictServer.url, '/test', 'OPTIONS', null, {
        Origin: 'https://unauthorized-domain.com',
        'Access-Control-Request-Method': 'POST',
      });
      assert(
        !strictPreflightBlocked.headers['access-control-allow-origin'],
        'Strict mode omits Access-Control-Allow-Origin on preflight for unauthorized origin'
      );
    } finally {
      await strictServer.close();
    }
  } finally {
    await server.close();
  }

  // SUMMARY
  console.log('\n==================================================================');
  console.log(`📊 TEST RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('==================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
};

runTests();
