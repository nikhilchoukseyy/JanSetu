import crypto from 'crypto';

const TOKEN_TTL_SECONDS = 60 * 60 * 8;

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const sign = (value, secret) =>
  crypto.createHmac('sha256', secret).update(value).digest('base64url');

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const createToken = ({ email, secret }) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({ sub: email, role: 'policymaker', iat: now, exp: now + TOKEN_TTL_SECONDS })
  );
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
};

export const loginPolicymaker = (req, res) => {
  const configuredEmail = process.env.POLICYMAKER_EMAIL;
  const configuredPassword = process.env.POLICYMAKER_PASSWORD;
  const secret = process.env.JWT_SECRET;

  if (!configuredEmail || !configuredPassword || !secret) {
    return res.status(503).json({
      success: false,
      message: 'Policymaker login is not configured on this server.',
    });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password || !safeEqual(email, configuredEmail) || !safeEqual(password, configuredPassword)) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = createToken({ email: configuredEmail, secret });
  return res.status(200).json({
    success: true,
    token,
    user: { email: configuredEmail, role: 'policymaker' },
  });
};
