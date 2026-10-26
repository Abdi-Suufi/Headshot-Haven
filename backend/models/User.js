const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [USERNAME_RE, 'Username must be 3-20 letters, numbers or underscores'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      // Google accounts don't have a password.
      required: function requirePassword() {
        return !this.googleId;
      },
      minlength: 8,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    // Personal best per leaderboard, keyed like "gridshot" or "cps:10s".
    bests: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toProfileJSON = function toProfileJSON() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    isAdmin: this.isAdmin,
    profilePicture: this.profilePicture,
    bests: Object.fromEntries(this.bests || []),
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.USERNAME_RE = USERNAME_RE;
