const express = require('express');
const rateLimit = require('express-rate-limit');
const GameScore = require('../models/GameScore');
const { GAMES, boardKey, isBetter, validateScore, sanitizeGameData } = require('../config/games');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const LEADERBOARD_SIZE = 25;

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many score submissions, slow down' },
});

/** 1-based global rank for a user's best score: number of players with a strictly better best, plus one. */
async function rankFor(game, variant, best) {
  const op = GAMES[game].higherIsBetter ? '$gt' : '$lt';
  const [row] = await GameScore.aggregate([
    { $match: { gameType: game, variant, score: { [op]: best } } },
    { $group: { _id: '$userId' } },
    { $count: 'better' },
  ]);
  return (row?.better ?? 0) + 1;
}

router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = { userId: req.user._id };
    if (req.query.game && GAMES[req.query.game]) query.gameType = req.query.game;
    const history = await GameScore.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

router.delete('/reset-scores', authenticateToken, async (req, res, next) => {
  try {
    const game = req.body?.game;
    if (game && !GAMES[game]) return res.status(400).json({ error: 'Unknown game' });
    await GameScore.deleteMany(game ? { userId: req.user._id, gameType: game } : { userId: req.user._id });
    for (const key of [...req.user.bests.keys()]) {
      if (!game || key === game || key.startsWith(`${game}:`)) req.user.bests.delete(key);
    }
    await req.user.save();
    res.json({ message: 'Scores reset', user: req.user.toProfileJSON() });
  } catch (err) {
    next(err);
  }
});

router.post('/:game', authenticateToken, submitLimiter, async (req, res, next) => {
  try {
    const { game } = req.params;
    if (!GAMES[game]) return res.status(404).json({ error: 'Unknown game' });

    const parsed = validateScore(game, req.body.score, req.body.variant);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { score, variant } = parsed;

    const doc = await GameScore.create({
      userId: req.user._id,
      username: req.user.username,
      gameType: game,
      variant,
      score,
      gameData: sanitizeGameData(req.body.gameData),
    });

    const key = boardKey(game, variant);
    const previous = req.user.bests.get(key);
    const isPersonalBest = isBetter(game, score, previous);
    if (isPersonalBest) {
      req.user.bests.set(key, score);
      await req.user.save();
    }
    const userBest = req.user.bests.get(key);

    res.status(201).json({
      score: { id: doc._id, game, variant, score, createdAt: doc.createdAt },
      isPersonalBest,
      userBest,
      rank: await rankFor(game, variant, userBest),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:game/leaderboard', async (req, res, next) => {
  try {
    const { game } = req.params;
    const config = GAMES[game];
    if (!config) return res.status(404).json({ error: 'Unknown game' });

    let variant = null;
    if (config.variants) {
      variant = config.variants.includes(req.query.variant) ? req.query.variant : config.variants[0];
    }
    const dir = config.higherIsBetter ? -1 : 1;

    // Best run per player: sort, take each user's first document, then rank those.
    const rows = await GameScore.aggregate([
      { $match: { gameType: game, variant } },
      { $sort: { score: dir, createdAt: 1 } },
      { $group: { _id: '$userId', score: { $first: '$score' }, createdAt: { $first: '$createdAt' } } },
      { $sort: { score: dir, createdAt: 1 } },
      { $limit: LEADERBOARD_SIZE },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
    ]);

    res.json({
      game,
      variant,
      leaderboard: rows.map((row, i) => ({
        rank: i + 1,
        userId: row._id.toString(),
        username: row.user.username,
        profilePicture: row.user.profilePicture || '',
        score: row.score,
        createdAt: row.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
