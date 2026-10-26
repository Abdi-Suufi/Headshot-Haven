// Fills a development database with demo players so the leaderboards have something to show.
// Usage: npm run seed            (uses MONGODB_URI from .env)
//        npm run seed -- --reset (removes previous demo players first)
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const GameScore = require('../models/GameScore');
const { mongoUri, isProduction } = require('../config/env');
const { boardKey, isBetter } = require('../config/games');

if (isProduction) {
  console.error('Refusing to seed a production database.');
  process.exit(1);
}

const NAMES = ['aceflick', 'tenz_fan', 'crosshair_cat', 'pixel_peeker', 'jett_main', 'awp_daddy', 'spray_ctrl', 'one_tap_tim', 'clutch_queen', 'lowsens_larry', 'wide_peek', 'headclicker'];
const DEMO_DOMAIN = 'demo.headshothaven.local';

const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Plausible score generators per board.
const BOARDS = [
  { game: 'gridshot', score: () => Math.round(rand(5200, 12500)) },
  { game: 'spidershot', score: () => Math.round(rand(4500, 11000)) },
  { game: 'tracking', score: () => Math.round(rand(1800, 4100)) },
  { game: 'reaction', score: () => Math.round(rand(165, 310)) },
  { game: 'cps', variant: '5s', score: () => Math.round(rand(6, 13.5) * 100) / 100 },
  { game: 'cps', variant: '10s', score: () => Math.round(rand(5.5, 12) * 100) / 100 },
];

async function main() {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const demoQuery = { email: { $regex: `@${DEMO_DOMAIN.replace(/\./g, '\\.')}$` } };

  if (process.argv.includes('--reset')) {
    const old = await User.find(demoQuery).select('_id');
    await GameScore.deleteMany({ userId: { $in: old.map((u) => u._id) } });
    await User.deleteMany(demoQuery);
  }

  let created = 0;
  for (const name of NAMES) {
    if (await User.exists({ username: name })) continue;
    // Demo accounts get a random password nobody knows; they exist only to populate rankings.
    const user = new User({ username: name, email: `${name}@${DEMO_DOMAIN}`, password: require('crypto').randomBytes(24).toString('hex') });
    for (const board of BOARDS) {
      if (Math.random() < 0.15) continue; // not everyone plays everything
      const runs = Array.from({ length: 1 + Math.floor(Math.random() * 4) }, board.score);
      const key = boardKey(board.game, board.variant);
      for (const score of runs) {
        await GameScore.create({ userId: user._id, username: name, gameType: board.game, variant: board.variant ?? null, score, gameData: { demo: true } });
        if (isBetter(board.game, score, user.bests.get(key))) user.bests.set(key, score);
      }
    }
    await user.save();
    created++;
  }

  console.log(`Seeded ${created} demo players into ${mongoose.connection.name}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
