const mongoose = require('mongoose');
const { GAME_IDS } = require('../config/games');

const gameScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised for cheap history reads; leaderboards read the live username from users.
    username: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      enum: GAME_IDS,
      required: true,
    },
    // Sub-board within a game, e.g. CPS "5s" vs "10s". null when the game has a single board.
    variant: {
      type: String,
      default: null,
    },
    score: {
      type: Number,
      required: true,
    },
    // Run details shown in history: accuracy, hits, per-second timeline, attempts…
    gameData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

gameScoreSchema.index({ gameType: 1, variant: 1, score: -1 });
gameScoreSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('GameScore', gameScoreSchema);
