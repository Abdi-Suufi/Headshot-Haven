const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const { frontendUrls, google, isProduction } = require('./config/env');
const { requireDb } = require('./middleware/auth');

const app = express();

if (isProduction) app.set('trust proxy', 1); // correct client IPs for rate limiting behind a proxy

app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Same-origin and non-browser requests have no Origin header.
      if (!origin || frontendUrls.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(passport.initialize());

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: DB_STATES[mongoose.connection.readyState] || 'unknown',
    googleAuth: google.enabled,
  });
});

app.use('/api', requireDb);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors)[0];
    return res.status(400).json({ error: first?.message || 'Invalid data' });
  }
  if (err.code === 11000) return res.status(409).json({ error: 'That value is already taken' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
