const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const GameScore = require('../models/GameScore');
const { GAMES } = require('../config/games');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function paging(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  return next();
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers, totalScores, perGame, recentUsers] = await Promise.all([
      User.countDocuments(),
      GameScore.countDocuments(),
      GameScore.aggregate([{ $group: { _id: '$gameType', runs: { $sum: 1 } } }]),
      User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt'),
    ]);
    res.json({ totalUsers, totalScores, perGame, recentUsers });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);
    const search = String(req.query.search || '').slice(0, 50);
    const query = search
      ? { $or: [{ username: { $regex: escapeRegex(search), $options: 'i' } }, { email: { $regex: escapeRegex(search), $options: 'i' } }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);
    res.json({ users: users.map((u) => u.toProfileJSON()), total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id', validId, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.body.isAdmin !== undefined) user.isAdmin = Boolean(req.body.isAdmin);
    if (req.body.username !== undefined) user.username = String(req.body.username).trim();
    await user.save();
    return res.json({ user: user.toProfileJSON() });
  } catch (err) {
    return next(err);
  }
});

router.delete('/users/:id', validId, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await GameScore.deleteMany({ userId: user._id });
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return next(err);
  }
});

router.get('/scores', async (req, res, next) => {
  try {
    const { page, limit, skip } = paging(req.query);
    const query = {};
    if (GAMES[req.query.game]) query.gameType = req.query.game;
    if (mongoose.isValidObjectId(req.query.userId)) query.userId = req.query.userId;
    const [scores, total] = await Promise.all([
      GameScore.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      GameScore.countDocuments(query),
    ]);
    res.json({ scores, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

/** Removing a run also recomputes that player's best for the board, so leaderboards stay honest. */
router.delete('/scores/:id', validId, async (req, res, next) => {
  try {
    const score = await GameScore.findByIdAndDelete(req.params.id);
    if (!score) return res.status(404).json({ error: 'Score not found' });
    const user = await User.findById(score.userId);
    if (user) {
      const key = score.variant ? `${score.gameType}:${score.variant}` : score.gameType;
      const dir = GAMES[score.gameType].higherIsBetter ? -1 : 1;
      const best = await GameScore.findOne({ userId: user._id, gameType: score.gameType, variant: score.variant }).sort({ score: dir });
      if (best) user.bests.set(key, best.score);
      else user.bests.delete(key);
      await user.save();
    }
    return res.json({ message: 'Score deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
