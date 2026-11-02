// Token utilities for VELoop Rewards
// Generates short‑lived access tokens and long‑lived refresh tokens.
// Stores a hashed version of the refresh token in the user document.

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const getJwtSecret = () => process.env.JWT_SECRET || 'veloop_super_secure_jwt_secret_2026';
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET || 'veloop_refresh_secret_2026';

export const generateAccessToken = (payload) => {
  const expires = process.env.ACCESS_TOKEN_EXPIRES || '15m';
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expires });
};

export const generateRefreshToken = (payload) => {
  // Adding a random component mitigates token replay attacks even if payload is same.
  const random = crypto.randomBytes(16).toString('hex');
  const fullPayload = { ...payload, rand: random };
  const expires = process.env.REFRESH_TOKEN_EXPIRES || '7d';
  return jwt.sign(fullPayload, getRefreshSecret(), { expiresIn: expires });
};

// Store a bcrypt hash of the refresh token (not the JWT itself) for rotation & revocation.
export const hashRefreshToken = async (token) => {
  const saltRounds = 10;
  return bcrypt.hash(token, saltRounds);
};

export const compareRefreshToken = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
