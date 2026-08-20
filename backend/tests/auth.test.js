const request = require('supertest');
const app = require('../server');
const pool = require('../config/database');

describe('POST /api/auth/login', () => {
  test('valid admin credentials return a token', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'password' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
  });

  test('wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('missing username/password returns 400, not 401', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('unknown username returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'no-such-user', password: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/register (removed)', () => {
  test('no longer exists — must not allow anonymous privilege escalation to admin', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'x', password: 'x', role: 'admin' });
    expect(res.status).toBe(404);
  });
});

describe('forgot-password / reset-password', () => {
  const testUsername = `jest_reset_${Date.now()}`;
  let userId;

  beforeAll(async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('originalpass', 10);
    const r = await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,'student') RETURNING id",
      [testUsername, `${testUsername}@example.com`, hash]
    );
    userId = r.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  });

  test('unknown username still returns 200 (does not leak existence)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ username: 'no-such-user' });
    expect(res.status).toBe(200);
    expect(res.body.devToken).toBeUndefined();
  });

  test('issues a dev token and resets the password end-to-end', async () => {
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ username: testUsername });
    expect(forgotRes.status).toBe(200);
    const token = forgotRes.body.devToken;
    expect(token).toBeTruthy();

    const resetRes = await request(app).post('/api/auth/reset-password').send({ token, password: 'newpassword123' });
    expect(resetRes.status).toBe(200);

    const loginOld = await request(app).post('/api/auth/login').send({ username: testUsername, password: 'originalpass' });
    expect(loginOld.status).toBe(401);

    const loginNew = await request(app).post('/api/auth/login').send({ username: testUsername, password: 'newpassword123' });
    expect(loginNew.status).toBe(200);
  });

  test('a used token cannot be reused', async () => {
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({ username: testUsername });
    const token = forgotRes.body.devToken;
    await request(app).post('/api/auth/reset-password').send({ token, password: 'anotherpass1' });
    const secondUse = await request(app).post('/api/auth/reset-password').send({ token, password: 'yetanotherpass' });
    expect(secondUse.status).toBe(400);
  });
});
