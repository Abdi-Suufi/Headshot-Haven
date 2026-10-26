const express = require('express');
const User = require('../models/User');
const { USERNAME_RE } = require('../models/User');
const GameScore = require('../models/GameScore');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', (req, res) => {
  res.json({ user: req.user.toProfileJSON() });
});

router.put('/profile', async (req, res, next) => {
  try {
    const { username, profilePicture } = req.body;
    if (username !== undefined) {
      const name = String(username).trim();
      if (!USERNAME_RE.test(name)) {
        return res.status(400).json({ error: 'Username must be 3-20 letters, numbers or underscores' });
      }
      if (await User.exists({ username: name, _id: { $ne: req.user._id } })) {
        return res.status(409).json({ error: 'That username is already taken' });
      }
      req.user.username = name;
    }
    if (profilePicture !== undefined) {
      const url = String(profilePicture).trim();
      if (url && !/^https:\/\//.test(url)) return res.status(400).json({ error: 'Profile picture must be an https URL' });
      req.user.profilePicture = url;
    }
    await req.user.save();
    return res.json({ user: req.user.toProfileJSON() });
  } catch (err) {
    return next(err);
  }
});

router.put('/change-password', async (req, res, next) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body;
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const user = await User.findById(req.user._id).select('+password');
    if (user.password && !(await user.comparePassword(String(currentPassword)))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    user.password = String(newPassword);
    await user.save();
    return res.json({ message: 'Password changed' });
  } catch (err) {
    return next(err);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const perGame = await GameScore.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: { game: '$gameType', variant: '$variant' }, runs: { $sum: 1 }, lastPlayed: { $max: '$createdAt' } } },
    ]);
    res.json({
      bests: Object.fromEntries(req.user.bests),
      totalRuns: perGame.reduce((n, g) => n + g.runs, 0),
      games: perGame.map((g) => ({ game: g._id.game, variant: g._id.variant, runs: g.runs, lastPlayed: g.lastPlayed })),
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/account', async (req, res, next) => {
  try {
    await GameScore.deleteMany({ userId: req.user._id });
    await User.deleteOne({ _id: req.user._id });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
