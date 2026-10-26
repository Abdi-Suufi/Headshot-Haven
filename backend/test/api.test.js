// Integration tests against a real MongoDB (a throwaway database that is dropped afterwards).
// Run with: npm test   (override the server with MONGODB_TEST_URI)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');

process.env.JWT_SECRET = 'test-secret';
const app = require('../app');

const uri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/headshot-haven-test';

before(async () => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

async function signUp(username) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, email: `${username}@example.com`, password: 'password123' })
    .expect(201);
  return res.body.token;
}

test('health reports database state', async () => {
  const res = await request(app).get('/api/health').expect(200);
  assert.equal(res.body.database, 'connected');
});

test('register validates input and rejects duplicates', async () => {
  await request(app).post('/api/auth/register').send({ username: 'a', email: 'x@example.com', password: 'password123' }).expect(400);
  await request(app).post('/api/auth/register').send({ username: 'valid_name', email: 'bad', password: 'password123' }).expect(400);
  await request(app).post('/api/auth/register').send({ username: 'valid_name', email: 'v@example.com', password: 'short' }).expect(400);
  await signUp('dupe_user');
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'dupe_user', email: 'other@example.com', password: 'password123' })
    .expect(409);
  assert.match(res.body.error, /username/);
});

test('login returns a token that authenticates /me, and never leaks the password', async () => {
  await signUp('login_user');
  await request(app).post('/api/auth/login').send({ email: 'login_user@example.com', password: 'wrong-pass' }).expect(401);
  const res = await request(app).post('/api/auth/login').send({ email: 'LOGIN_USER@example.com', password: 'password123' }).expect(200);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`).expect(200);
  assert.equal(me.body.user.username, 'login_user');
  assert.equal(me.body.user.password, undefined);
});

test('score submission requires auth and validates ranges and variants', async () => {
  await request(app).post('/api/games/gridshot').send({ score: 100 }).expect(401);
  const token = await signUp('validator');
  const auth = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/games/gridshot').set(auth).send({ score: 999999 }).expect(400);
  await request(app).post('/api/games/reaction').set(auth).send({ score: 20 }).expect(400);
  await request(app).post('/api/games/cps').set(auth).send({ score: 8, variant: '3s' }).expect(400);
  await request(app).post('/api/games/nope').set(auth).send({ score: 1 }).expect(404);
});

test('reaction leaderboard ranks lower times first, one entry per player', async () => {
  const fast = await signUp('fast_one');
  const slow = await signUp('slow_one');
  const submit = (token, score) =>
    request(app).post('/api/games/reaction').set('Authorization', `Bearer ${token}`).send({ score }).expect(201);

  await submit(slow, 320);
  const first = await submit(fast, 240);
  assert.equal(first.body.isPersonalBest, true);
  assert.equal(first.body.rank, 1);
  const worse = await submit(fast, 300);
  assert.equal(worse.body.isPersonalBest, false);
  assert.equal(worse.body.userBest, 240);

  const res = await request(app).get('/api/games/reaction/leaderboard').expect(200);
  assert.deepEqual(
    res.body.leaderboard.map((r) => [r.username, r.score]),
    [
      ['fast_one', 240],
      ['slow_one', 320],
    ],
  );
});

test('cps leaderboards are separated by variant', async () => {
  const token = await signUp('clicker');
  const auth = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/games/cps').set(auth).send({ score: 9.456, variant: '5s' }).expect(201);
  await request(app).post('/api/games/cps').set(auth).send({ score: 7.1, variant: '10s' }).expect(201);
  const five = await request(app).get('/api/games/cps/leaderboard?variant=5s').expect(200);
  const ten = await request(app).get('/api/games/cps/leaderboard?variant=10s').expect(200);
  assert.equal(five.body.leaderboard[0].score, 9.46);
  assert.equal(ten.body.leaderboard[0].score, 7.1);

  const me = await request(app).get('/api/auth/me').set(auth).expect(200);
  assert.deepEqual(me.body.user.bests, { 'cps:5s': 9.46, 'cps:10s': 7.1 });
});
