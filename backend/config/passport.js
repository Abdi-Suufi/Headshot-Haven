const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { google } = require('./env');

/** Google display names aren't valid usernames; derive a unique one. */
async function uniqueUsername(displayName) {
  let base = (displayName || 'player').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16);
  if (base.length < 3) base = `player${base}`;
  let candidate = base;
  for (let i = 0; i < 20 && (await User.exists({ username: candidate })); i++) {
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return candidate;
}

if (google.enabled) {
  passport.use(
    new GoogleStrategy(
      { clientID: google.clientID, clientSecret: google.clientSecret, callbackURL: google.callbackURL },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          let user = await User.findOne({ googleId: profile.id });
          if (!user && email) {
            // Link Google to an existing email/password account.
            user = await User.findOne({ email });
            if (user) user.googleId = profile.id;
          }
          if (!user) {
            if (!email) return done(null, false);
            user = new User({
              username: await uniqueUsername(profile.displayName),
              email,
              googleId: profile.id,
              profilePicture: profile.photos?.[0]?.value || '',
            });
          }
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}

module.exports = passport;
