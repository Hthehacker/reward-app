import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed an admin user from environment variables.
 * Usage: `node src/utils/seedAdmin.js`
 *
 * Expected env vars:
 *   ADMIN_EMAIL – admin email address
 *   ADMIN_PASSWORD – plain‑text password (will be hashed)
 */
const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin account already exists');
      return;
    }
    const hashed = await bcrypt.hash(password, 12);
    const admin = new User({
      userId: `ADM-${Date.now()}`,
      name: 'Admin',
      email,
      password: hashed,
      role: 'admin',
      balances: null
    });
    await admin.save();
    console.log('Admin account created');
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

seedAdmin().then(() => process.exit(0));
