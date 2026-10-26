const isProduction = process.env.NODE_ENV === 'production';

const DEV_SECRET = 'dev-only-insecure-secret';

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('[config] JWT_SECRET not set, using an insecure development secret.');
}

const placeholder = (v) => !v || v.startsWith('your-');

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/headshot-haven',
  jwtSecret: process.env.JWT_SECRET || DEV_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list, e.g. "https://headshothaven.app,http://localhost:3000"
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s) => s.trim()),
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    enabled: !placeholder(process.env.GOOGLE_CLIENT_ID) && !placeholder(process.env.GOOGLE_CLIENT_SECRET),
  },
};
