require('dotenv').config();

const mongoose = require('mongoose');
const { port, mongoUri, google } = require('./config/env');
const app = require('./app');

async function connect() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] connected');
  } catch (err) {
    console.error(`[db] connection failed (${err.message}), retrying in 10s`);
    setTimeout(connect, 10_000);
  }
}

mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  console.log(`[api] Google sign-in ${google.enabled ? 'enabled' : 'disabled (no credentials)'}`);
});

connect();
