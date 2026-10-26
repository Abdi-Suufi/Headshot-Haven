const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signToken(userId) {
  return jwt.sign({ userId: userId.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function authenticateToken(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    const { userId } = jwt.verify(token, jwtSecret);
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'Account not found' });
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expired, please sign in again' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid session' });
    return next(err);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  return next();
}

/** Fail fast with 503 instead of letting queries hang while MongoDB is unreachable. */
function requireDb(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database unavailable, try again shortly' });
  }
  return next();
}

module.exports = { signToken, authenticateToken, requireAdmin, requireDb };
