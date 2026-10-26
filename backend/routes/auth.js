const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const User = require('../models/User');
const { USERNAME_RE } = require('../models/User');
const { signToken, authenticateToken } = require('../middleware/auth');
const { google, frontendUrls } = require('../config/env');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
    }
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json({ error: `That ${field} is already taken` });
    }

    const user = await User.create({ username, email, password });
    return res.status(201).json({ token: signToken(user._id), user: user.toProfileJSON() });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    user.lastLogin = new Date();
    await user.save();
    return res.json({ token: signToken(user._id), user: user.toProfileJSON() });
  } catch (err) {
    return next(err);
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user.toProfileJSON() });
});

// Tokens are stateless; logging out is just dropping the token client-side.
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

const frontend = frontendUrls[0];

if (google.enabled) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontend}/auth/callback#error=${encodeURIComponent('Google sign-in was cancelled or failed')}`,
    }),
    (req, res) => {
      // Token goes in the URL fragment so it never reaches server logs or Referer headers.
      res.redirect(`${frontend}/auth/callback#token=${signToken(req.user._id)}`);
    },
  );
} else {
  router.get(['/google', '/google/callback'], (req, res) => {
    res.status(404).json({ error: 'Google sign-in is not configured on this server' });
  });
}

module.exports = router;
