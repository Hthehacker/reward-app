import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

// Helper to generate random email
const randomEmail = () => `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@example.com`;

describe('Authentication & RBAC Integration Tests', () => {
  let server;
  const testUser = {
    name: 'Test User',
    email: randomEmail(),
    password: 'Passw0rd!'
  };
  const adminCreds = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD
  };

  beforeAll(async () => {
    // Ensure DB connection
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    server = app.listen();
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [testUser.email, adminCreds.email] } });
    await mongoose.disconnect();
    server.close();
  });

  test('Register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email', testUser.email);
  });

  test('Login with registered user', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Cookies should be set
    expect(res.headers['set-cookie']).toBeDefined();
    // Store cookies for subsequent requests
    const cookies = res.headers['set-cookie'];
    // Get current user (me)
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data).toHaveProperty('email', testUser.email);
  });

  test('Access admin endpoint as regular user should be forbidden', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    const cookies = loginRes.headers['set-cookie'];
    const adminRes = await request(app).get('/api/admin/users').set('Cookie', cookies);
    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
  });

  test('Admin can access admin endpoint after login', async () => {
    // Ensure admin exists via seed script; if not, create directly
    let adminUser = await User.findOne({ email: adminCreds.email });
    if (!adminUser) {
      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.default.hash(adminCreds.password, 12);
      adminUser = new User({
        userId: `ADM-${Date.now()}`,
        name: 'Admin',
        email: adminCreds.email,
        password: hashed,
        role: 'admin'
      });
      await adminUser.save();
    }
    const loginRes = await request(app).post('/api/auth/login').send(adminCreds);
    const cookies = loginRes.headers['set-cookie'];
    const adminRes = await request(app).get('/api/admin/users').set('Cookie', cookies);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(Array.isArray(adminRes.body.data.users)).toBe(true);
  });
});
