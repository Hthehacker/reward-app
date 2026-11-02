# VELOOP Rewards – Giveaway Platform & Administrative Management Ecosystem

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Mongoose%209.1-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A fintech-grade, production-ready **Giveaway Section, Coin Ledger, Admin Portal, and Anti-Fraud Backend** built for **VELOOP Rewards**. Crafted with a premium, trustworthy visual identity (dark-slate glassmorphism, subtle illumination, zero cheap casino/gambling tropes) and backed by an authoritative Express/MongoDB server architecture where client requests are never trusted.

---

## 1. Project Overview & Architectural Boundaries

The VELOOP Rewards Giveaway module provides verified platform members with an engaging, trustworthy way to participate in exclusive hardware and digital voucher draws using virtual credits (**VEs**, **SVEs**, and **Tokens**).

The application is structured around strict architectural separation of concerns:
> **Frontend = Presentation, Accessibility, & Responsive Experience**  
> **Backend = Authority, Authentication, Authorization, & Rate Limiting**  
> **Database = Ledger of Record, Compound Uniqueness, & Financial Integrity**

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19.2 (Functional Components & Hooks)
- **Bundler & Tooling**: Vite 8.3, Oxlint (ESLint Linter)
- **Routing**: React Router DOM 7.18 (Nested Admin Routes, Dynamic Detail Routes)
- **Styling**: Pure CSS Modules (`*.module.css`), Responsive Grid, Bootstrap 5 utilities
- **Icons & Effects**: `lucide-react`, `canvas-confetti`

### Backend
- **Runtime**: Node.js v20+ / v22 (ES Modules)
- **Web Framework**: Express.js 5.3
- **Database & ODM**: MongoDB (Atlas Compatible), Mongoose 9.11
- **Security & Headers**: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`
- **Logging**: `morgan` (dev/production aware), structured operational error logging

---

## 3. Core Features & Capabilities

### Public User Portal
- **Hero & Countdown Banner**: 3D reward imagery, live cycle status badges, auto-ticking countdown with synchronized server time.
- **Social Proof Winner Marquee**: Continuous marquee ticker broadcasting privacy-masked winners (`VE****21 won an iPhone 15 Pro!`), pausing on hover.
- **Live Metrics Dashboard**: Real-time counter of active giveaways, participants, and prizes won.
- **Featured Giveaways Grid**: Hardware, gift cards, and token prize pools with category filtering.
- **Dedicated Prize Detail Pages (`/giveaway/:slug`)**: Deep-linked URL routes displaying full technical specifications, rules, wallet balance checks, and atomic entry buttons.
- **Winner Reveal & Historical Archive**:
  - *Active Event*: Strictly communicates that winners are pending until countdown ends.
  - *Ended Event*: Displays verified winners with claim deadlines and action buttons.
  - *Past Events Tab*: Historical archive of completed giveaway rounds.
- **Prize Claim System**:
  - *Physical Goods (iPhone, Apple Watch, AirPods)*: Validates Full Name, Phone, Delivery Address, City, State, and PIN Code.
  - *Digital Vouchers (Amazon)*: Validates Email Address only without requesting unnecessary postal details.

### Administrative Portal (`/admin`)
- **Strict Role-Based Access Control (RBAC)**: All `/api/admin/*` endpoints and `/admin/*` frontend routes are strictly guarded by JWT authentication and `role === 'admin'`.
- **Giveaway Management**: Create, edit, delete, and transition giveaway lifecycles (`UPCOMING`, `ACTIVE`, `ENDED`, `ARCHIVED`).
- **Provably Fair Winner Selection**: Admin trigger to run randomized Fisher-Yates server-side winner draws with atomic participation locking.
- **Coin & Wallet Ledger Management**:
  - Aggregate wallet statistics across all community members.
  - Searchable, auditable coin adjustment tool (Add / Deduct VEs, SVEs, or Tokens) with mandatory audit reasons.
  - Zero-negative-balance enforcement on all deductions.
- **Participant & Entry Tracking**: Live audit table of member entries, deducted currencies, and security hashes.
- **Audit Logs & Fraud Detection**: Real-time inspection of system security events, rate limit hits, and risk scores.

---

## 4. Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | No | `5000` | HTTP port for the Express API |
| `NODE_ENV` | Yes | `production` / `development` | Environment mode (activates secure cookies & error masking in production) |
| `MONGO_URI` | Yes | `mongodb+srv://...` | MongoDB Atlas or local MongoDB connection string |
| `JWT_SECRET` | Yes | *(32+ char random string)* | Cryptographic key used to sign and verify Access Tokens |
| `REFRESH_TOKEN_SECRET` | Yes | *(32+ char random string)* | Cryptographic key used to sign and verify Refresh Tokens |
| `CLIENT_URL` | Yes | `https://your-frontend.vercel.app` | Frontend origin for CORS and credentials authorization |
| `ADMIN_EMAIL` | Optional | `admin@veloop.io` | Seed admin email for `npm run seed-admin` |
| `ADMIN_PASSWORD` | Optional | *(Strong password)* | Seed admin password for `npm run seed-admin` |

### Frontend (`frontend/.env`)
| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Yes | `https://api.yourdomain.com/api` | Base URL of the backend API |

> [!IMPORTANT]
> Never commit `.env` files to source control. Use `backend/.env.example` and `frontend/.env.example` as templates.

---

## 5. Local Setup & Development Commands

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance on port 27017 or a free MongoDB Atlas cluster

### 2. Backend Installation & Start
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Seed demo dataset (Prizes, Giveaways, Personas)
npm run seed

# Seed production administrator account
npm run seed-admin

# Start development server
npm run dev

# Run automated integration test suites
npm test
```

### 3. Frontend Installation & Start
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev

# Run linter
npm run lint

# Build production bundle
npm run build
```

---

## 6. Testing & Automated Verification

The backend includes a comprehensive, zero-dependency automated verification suite covering:
1. System health check
2. Authoritative entry fee enforcement
3. Insufficient balance atomic rejection
4. Double participation prevention (compound unique DB index)
5. Live giveaway winner privacy (never shows false winners during active rounds)
6. Masked winner identifiers for public privacy
7. Prize claim validation (physical address vs gift card email)
8. User registration and password hashing
9. Persistent authentication via httpOnly cookies
10. Strict RBAC (normal users blocked from `/api/admin/*` with 403 Forbidden)
11. Admin login and giveaway CRUD operations
12. Admin coin stats, credit additions, and negative-balance prevention

### Running Tests
```bash
cd backend
npm test
```

**Results:**
- `test-suite.js`: **26 PASSED, 0 FAILED**
- `test-coin-management.js`: **32 PASSED, 0 FAILED**
- **Total: 58 PASSED, 0 FAILED**

---

## 7. Production Deployment Guide

### Option A: Frontend on Vercel / Netlify
1. Connect your repository to Vercel or Netlify.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api`
6. Single Page Application (SPA) routing is pre-configured via `frontend/vercel.json` and `frontend/public/_redirects` to ensure clean page refreshes without 404 errors.

### Option B: Backend on Render / Railway
1. Create a Web Service connected to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Set Environment Variables in your host dashboard:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/veloop_rewards?retryWrites=true&w=majority
   JWT_SECRET=<generated_secret_string>
   REFRESH_TOKEN_SECRET=<generated_secret_string>
   CLIENT_URL=https://your-frontend.vercel.app
   ```
6. Run initial database setup in the host web shell or local machine connecting to Atlas:
   ```bash
   npm run seed-admin
   ```

---

## 8. Client Handover Checklist

- [x] **Zero Hardcoded Secrets**: All JWT secrets, database connection strings, and admin credentials reside in `.env` files.
- [x] **Git Hygiene**: `.env` and `data/` directories are strictly excluded via `.gitignore`.
- [x] **Strict Authentication**: Password hashing verified via `bcryptjs` with salt factor 10–12; tokens signed with expiration and stored in secure `httpOnly` cookies.
- [x] **Rate Limiting**: Configured for join attempts (12/min), claims (10/min), and auth (30/15min in production).
- [x] **NoSQL Injection & Input Validation**: Mongoose schema casting and ObjectId validation middleware prevent malformed queries.
- [x] **Production Error Sanitization**: Internal error stack traces and database technical errors are masked from end-users in production (`NODE_ENV=production`).
- [x] **Atomic Financial Deductions**: Race conditions and balance underflows prevented using MongoDB conditional `$inc` queries.
- [x] **Responsive Viewport Compatibility**: Verified across mobile (320px–480px), tablet (768px–1024px), and desktop (1280px+).
- [x] **Production Build Verified**: Frontend builds with 0 errors via `npm run build`.
- [x] **Documentation & Setup Scripts**: Standalone admin seeder (`seedAdmin.js`) and database reset protections in place.

---

## 9. Known Limitations & Recommendations

1. **Multi-Region Replica Sets**: For multi-region deployments with high concurrency on winner selection, utilize MongoDB Atlas Multi-Region clusters with Write Concern `majority`.
2. **Third-Party Email Delivery**: Prize claims and gift card voucher emails are currently recorded in the database and audit trail. Integrate SendGrid, Postmark, or AWS SES for live SMTP delivery.
3. **SMS / OTP Verification**: Phone verification on physical claims records user phone numbers. Integrate Twilio or Firebase Auth if live SMS one-time-passcode verification is desired.

---

## 10. License

Developed for **VELOOP Rewards Ecosystem**. All rights reserved.
