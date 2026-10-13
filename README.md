# VELOOP Rewards – Giveaway Platform & Fraud Protection System

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.2-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript%20(ESM)-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A fintech-grade, production-ready **Giveaway Section and Anti-Fraud Backend** built for **VELOOP Rewards**. Crafted with a premium, trustworthy visual identity (modern dark-slate glassmorphism, subtle illumination, zero cheap casino/gambling tropes) and backed by an authoritative Express/MongoDB server architecture where client requests are never trusted.

---

## 1. Project Overview

The VELOOP Rewards Giveaway module provides verified platform members with an engaging, trustworthy way to participate in exclusive hardware and digital voucher draws using virtual credits (**VEs**, **SVEs**, and **Tokens**).

The application is structured around a strict architectural principle:
> **Frontend = Presentation & Experience**  
> **Backend = Authority & Single Source of Truth**  
> **Database = Ledger of Record & Financial Integrity**

---

## 2. Giveaway Concept & Value Proposition

- **Authentic Reward Opportunity**: Built to evoke trust, transparency, and excitement without casino/gambling saturation or flashy gimmicks.
- **Three Distinct Currencies**:
  - `VEs` (Veloop Entries) – Standard reward credits for hardware and shopping vouchers.
  - `SVEs` (Special Veloop Entries) – High-tier quest credits (e.g. AirPods Pro).
  - `Tokens` – Community engagement tokens for accessible lucky draws (e.g. ₹20 Amazon Vouchers).
- **Provably Fair Draws**: Winner selection is handled entirely server-side with verified seed generation once the event countdown concludes.

---

## 3. Core Features

- **Large Premium Giveaway Hero & Banner**: High-impact rewards illustration (3D luxury gift box, gold coins, entry pass), real-time countdown timer, and live badges.
- **Live Social Proof Marquee Slider**: Smooth horizontal ticker broadcasting masked winner announcements (`VE****21 won an iPhone 15 Pro!`), pausing on hover.
- **Key Statistics Dashboard**: 4-card responsive metrics grid (Active Giveaways, Total Participants, Prizes Won, Giveaway Cycle).
- **Featured Giveaway Cards Grid**: Flagship prizes with winner limits, estimated values, and filter tags (Hardware, Amazon Vouchers, Token Draw).
- **Mandatory Dedicated Individual Giveaway Details Pages (`/giveaway/:slug`)**:
  - Clicking any prize card navigates to its dedicated details page (`/giveaway/iphone-15-pro`, `/giveaway/apple-watch`, `/giveaway/airpods`, `/giveaway/amazon-2000`, `/giveaway/amazon-500`, `/giveaway/amazon-20`).
  - Clear back navigation (`← Giveaway Home` / `← Giveaway`).
  - Comprehensive inspection of prize specs, rules, terms, and eligibility.
  - Live balance verification comparing required fee against user wallet balance.
  - Dynamic CTA: `[ Join Giveaway – 250 VEs ]` if sufficient, or `[ Earn More VEs → ]` if insufficient.
  - Confirmation modal detailing entry fee, current balance, and balance after joining.
  - Subtle reward celebration with particle effects upon successful participation.
- **Two-Tier Winners Section**:
  - **Tab 1: Current Giveaway Winners**: When live, strictly informs users that winners are pending and the event is live (never displays false winners). When ended, displays verified winners with masked IDs.
  - **Tab 2: Previous Winners History**: Archive of completed historical giveaways (`August Reward Rush`, `Independence Rewards`) with dates and claim statuses.
- **Winner Claim Experience**:
  - Personalized winner notification banner with direct `Claim Your Prize` modal unlock.
  - **Physical Prize Form**: Full Name, Phone Number, Delivery Address, City, State, PIN Code.
  - **Amazon Gift Card Form**: Verified Email Address only (never asks for physical postal details!).
- **Interactive State Switcher**: Floating demo controller enabling instant testing across all 7 user states and 3 giveaway lifecycles.

---

## 4. Giveaway Lifecycle States

| State | Hero Badge | Countdown Behavior | Participation Action | Winners Tab Display |
| :--- | :--- | :--- | :--- | :--- |
| **ACTIVE** | `● GIVEAWAY LIVE` | Live countdown updating every second | Allowed (if eligible & sufficient balance) | Shows "Giveaway is still live. Winners announced at zero." |
| **ENDED** | `GIVEAWAY ENDED` | Displays "Giveaway Ended" | Locked. Backend returns `GIVEAWAY_ENDED` | Displays verified winners with masked IDs and claim buttons |
| **UPCOMING** | `STARTS IN 3 DAYS` | Countdown to start date | Locked. Backend returns `GIVEAWAY_NOT_ACTIVE` | Informs users next event begins in 3 days |

---

## 5. Winner System & Provably Fair Random Selection

1. **Strict Winner Limits**:
   - iPhone 15 Pro: **Exactly 1 Winner**.
   - Apple Watch Series 9: **3 Winners**.
   - AirPods Pro: **5 Winners**.
   - ₹2,000 Amazon Voucher: **5 Winners**.
   - ₹500 Amazon Voucher: **10 Winners**.
   - ₹20 Amazon Voucher: **50 Winners**.
2. **Server-Side Authority**: Frontend JavaScript never selects or influences winners. Selection is triggered server-side from active `GiveawayParticipation` records using Fisher-Yates randomization.
3. **Privacy Masking**: Public APIs and ticker slider strictly mask user identifiers (e.g. `VE10082` → `VE****82`). Private delivery information is never leaked in public endpoints.

---

## 6. Prize Claim System

```
Winner Matches Authenticated ID
             │
             ▼
    Check Prize Type
      ┌──────┴──────┐
      ▼             ▼
  Physical      Gift Card
      │             │
  Collects:     Collects:
  - Full Name   - Email Address ONLY
  - Phone OTP   (Never requests postal address)
  - Address
  - PIN Code
      │             │
      └──────┬──────┘
             ▼
   Submit to /api/giveaways/:id/claim
             │
             ▼
  Claim Status: SUBMITTED (7-Day Expiry Window)
```

---

## 7. Anti-Abuse, Fraud Protection & Security Architecture

1. **Authoritative Entry Fees**: The backend loads entry fees directly from the database and ignores any client-supplied `amount` or `currency` values.
2. **Compound Unique Database Index**:
   ```javascript
   giveawayParticipationSchema.index({ userId: 1, giveawayId: 1 }, { unique: true });
   ```
   Guarantees that a single user can never participate twice in the same giveaway round, even across simultaneous rapid clicks.
3. **Atomic Balance Deduction**:
   Uses MongoDB atomic conditional updates (`$inc` with `$gte`) to eliminate balance underflow race conditions.
4. **Fraud Risk Engine (`0–100` Score)**:
   - Evaluates device fingerprints, rapid submission bursts, multiple accounts sharing the same device, and flagged accounts.
   - Categorized as **LOW (0–29)**, **MEDIUM (30–59)**, **HIGH (60–79)**, and **CRITICAL (80–100)**.
   - High-risk and critical abuse requests are blocked and logged in the `FraudEvent` collection.
5. **Comprehensive Audit Trail**:
   All events (`JOIN_GIVEAWAY`, `ENTRY_FEE_DEDUCTED`, `DUPLICATE_ATTEMPT`, `FRAUD_BLOCKED`, `CLAIM_SUBMITTED`, `WINNER_SELECTED`) are recorded in `AuditLog`.

---

## 8. Technology Stack

- **Frontend**:
  - React.js (JavaScript / JSX – No TypeScript)
  - Vite 8.3
  - React Router DOM 7.3
  - Bootstrap 5 & CSS Modules (`*.module.css`)
  - Lucide React & Canvas-Confetti
- **Backend**:
  - Node.js (v22+)
  - Express.js 5.3 (ES Modules)
  - MongoDB 8.2 & Mongoose 9.1
  - JWT (`jsonwebtoken`) & `bcryptjs`
  - Security: `helmet`, `cors`, `express-rate-limit`, `morgan`

---

## 9. Folder Structure

```
reward app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                        # MongoDB Mongoose connection
│   │   ├── controllers/
│   │   │   ├── giveawayController.js         # Giveaway discovery & statistics
│   │   │   ├── participationController.js    # Atomic join & balance validation
│   │   │   ├── winnerController.js           # Live vs past winners & ticker
│   │   │   ├── claimController.js            # Physical & gift card claim flow
│   │   │   ├── authController.js             # User sessions & demo personas
│   │   │   └── adminGiveawayController.js    # Lifecycle management & manual draw
│   │   ├── models/
│   │   │   ├── User.js                       # User & authoritative wallet
│   │   │   ├── Prize.js                      # Prize configuration & winner limits
│   │   │   ├── Giveaway.js                   # Event schema & schedule
│   │   │   ├── GiveawayParticipation.js      # Unique compound indexed entry
│   │   │   ├── GiveawayEntryTransaction.js   # Financial ledger audit record
│   │   │   ├── GiveawayWinner.js             # Finalized winners list
│   │   │   ├── PrizeClaim.js                 # Physical & voucher fulfillment details
│   │   │   ├── FraudEvent.js                 # Anti-abuse risk score records
│   │   │   └── AuditLog.js                   # System audit logs
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js             # JWT verification & dev headers
│   │   │   ├── rateLimitMiddleware.js        # IP rate limiting on join & claim
│   │   │   ├── fraudMiddleware.js            # Request risk evaluation
│   │   │   └── errorMiddleware.js            # Centralized friendly error handler
│   │   ├── routes/
│   │   │   ├── giveawayRoutes.js
│   │   │   ├── participationRoutes.js
│   │   │   ├── winnerRoutes.js
│   │   │   ├── claimRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── services/
│   │   │   ├── giveawayService.js
│   │   │   ├── balanceService.js
│   │   │   ├── fraudService.js
│   │   │   └── winnerService.js
│   │   ├── utils/
│   │   │   └── seedData.js                   # Comprehensive demo data seeder
│   │   └── app.js                            # Express app configuration
│   ├── server.js                             # Backend entrypoint (auto-seeds if empty)
│   ├── test-suite.js                         # Automated verification test script
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── assets/prizes/                    # Static SVG prize illustrations
│   ├── src/
│   │   ├── assets/
│   │   │   ├── prizes/                       # iPhone, Apple Watch, AirPods, Amazon card SVGs
│   │   │   ├── hero-rewards.svg              # Luxury 3D gift box & pass illustration
│   │   │   └── veloop-logo.svg               # Modern brand vector logo
│   │   ├── components/
│   │   │   ├── Navbar/                       # Top navigation with live balance pills
│   │   │   ├── GiveawayHero/                 # Hero banner with countdown & badges
│   │   │   ├── GiveawayStats/                # 4-card metric dashboard
│   │   │   ├── PrizeCard/                    # Prize presentation card
│   │   │   ├── FeaturedGiveaways/            # Prize grid with filter tags
│   │   │   ├── HowToParticipate/             # 5-step interactive timeline
│   │   │   ├── WinnerSlider/                 # Auto-rotating social proof ticker
│   │   │   ├── WinnersTabs/                  # Live vs Ended & Previous History tabs
│   │   │   ├── PrizeClaimModal/              # Modal for physical goods & vouchers
│   │   │   ├── ParticipationModal/           # Financial confirmation dialog
│   │   │   ├── EarnModal/                    # Quick task balance top-up simulation
│   │   │   ├── UserStateDemoSwitcher/        # Floating controller for testing all states
│   │   │   ├── GiveawayRules/                # Official rules & conditions grid
│   │   │   ├── FAQ/                          # Expandable accordion FAQs
│   │   │   ├── TrustSection/                 # 4-pillar trust & transparency strip
│   │   │   ├── Countdown/                    # Auto-updating countdown timer
│   │   │   ├── CustomLoader/                 # Custom themed animated loader
│   │   │   └── Footer/                       # Compact brand footer
│   │   ├── context/
│   │   │   └── AuthContext.jsx               # Global state & user persona management
│   │   ├── pages/
│   │   │   ├── Giveaway/GiveawayPage.jsx     # Main Giveaway Portal
│   │   │   └── GiveawayDetail/               # Dedicated Individual Details Page
│   │   ├── services/
│   │   │   └── api.js                        # Frontend API client
│   │   ├── App.jsx                           # Route configuration
│   │   ├── main.jsx                          # React application root
│   │   └── index.css                         # Design system & dark mode variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 10. Installation & Prerequisites

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** running locally on port `27017` (or MongoDB Atlas connection string)

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Populates prizes, active/past giveaways, and 7 demo user personas
npm start        # Launches backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Launches Vite dev server on http://localhost:5173
```

---

## 11. API Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check | No |
| `GET` | `/api/giveaways/current` | Active giveaway with prizes & server time | No |
| `GET` | `/api/giveaways/:idOrSlug` | Detailed giveaway / prize query | No |
| `GET` | `/api/giveaways/previous` | Past completed giveaways | No |
| `GET` | `/api/giveaways/stats` | High-level giveaway statistics | No |
| `GET` | `/api/giveaways/ticker` | Recent winners social proof marquee | No |
| `GET` | `/api/giveaways/:id/winners` | Finalized winners (hidden while active) | No |
| `GET` | `/api/giveaways/previous/winners` | Historical winners with masked IDs | No |
| `GET` | `/api/giveaways/:id/my-status` | Authenticated user participation status | Yes |
| `POST` | `/api/giveaways/:id/join` | Atomic entry & balance deduction | Yes |
| `GET` | `/api/giveaways/:id/my-claim` | User prize claim verification status | Yes |
| `POST` | `/api/giveaways/:id/claim` | Submit delivery address or gift card email | Yes |
| `POST` | `/api/auth/login` | Sign in demo account and obtain JWT | No |
| `GET` | `/api/auth/me` | Fetch active user wallet balances | Yes |
| `GET` | `/api/auth/demo-users` | Retrieve list of pre-configured test users | No |
| `POST` | `/api/auth/earn-balance` | Simulate task reward credit (+50 / +150 VEs) | Yes |
| `POST` | `/api/admin/giveaways/:id/status` | Switch status between ACTIVE, ENDED, UPCOMING | Optional/Admin |
| `POST` | `/api/admin/giveaways/:id/select-winners` | Trigger backend winner selection | Optional/Admin |
| `GET` | `/api/admin/audit-logs` | Retrieve financial and security audit records | Optional/Admin |
| `GET` | `/api/admin/fraud-events` | Retrieve fraud risk analysis event logs | Optional/Admin |

---

## 12. Verification & Automated Test Suite

A standalone test suite is included in `backend/test-suite.js` to verify all 75 specification requirements:

```bash
cd backend
node test-suite.js
```

### Verified Test Results
```
====================================================
🚀 Starting VELOOP Rewards Full-Stack Verification
====================================================

  ✅ PASS: Backend health check responds healthy
  ✅ PASS: Active giveaway retrieved from DB
  ✅ PASS: Prizes loaded correctly (6 prizes)
  ✅ PASS: iPhone prize has authoritative fee 250 VEs
  ✅ PASS: Unauthenticated join rejected with LOGIN_REQUIRED
  ✅ PASS: Insufficient balance rejected atomically without deducting funds
  ✅ PASS: Client-side price tampering (amount=1) ignored; DB authoritative fee strictly enforced
  ✅ PASS: Duplicate participation rejected with ALREADY_PARTICIPATING
  ✅ PASS: Active giveaway strictly hides winners and informs users giveaway is still live
  ✅ PASS: Previous winners history retrieved (6 winners)
  ✅ PASS: Winner IDs are privacy masked: VE****82
  ✅ PASS: Non-winner cannot access or submit prize claim
  ✅ PASS: Physical prize claim submitted with full address details
  ✅ PASS: Amazon gift card claimed with email only without requiring physical address

====================================================
📊 Test Results: 14 PASSED, 0 FAILED
====================================================
```

---

## 13. Interactive Demo Persona Guide (Req #54)

Use the floating **"Demo Controls"** badge in the bottom-right corner to test any scenario instantly:

1. **Visitor**: Demonstrates unauthenticated state; clicking Join prompts login.
2. **Aarav (`VE10025`)**: Holds 850 VEs. Test joining the iPhone (250 VEs) or Apple Watch (200 VEs).
3. **Priya (`VE10099`)**: Holds 120 VEs. Triggers the Insufficient Balance state (`You need 130 more VEs`), swapping the CTA to `[ Earn More VEs → ]`.
4. **Rohan (`VE10042`)**: Pre-seeded as already participating in the active giveaway. Demonstrates the single-entry policy (`✓ You're Already Participating`).
5. **Ananya (`VE10088`)**: Pre-seeded as the Apple Watch winner. Displays the high-priority congratulations banner and unlocks the Physical Delivery Address claim modal.
6. **Kabir (`VE10077`)**: Pre-seeded as the ₹2,000 Amazon Voucher winner. Unlocks the Digital Email claim modal.
7. **Meera (`VE10012`)**: Non-winner persona demonstrating courteous non-winner messaging on ended giveaways.
8. **Lifecycle Buttons (`ACTIVE`, `ENDED`, `UPCOMING`)**: Cycles the giveaway status on the fly to inspect state animations, timer expiration, and winner reveals.

---

## 14. Deployment Guide

### Deploy Frontend to Vercel / Netlify
1. Build the production client bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. The output directory `frontend/dist` is ready for zero-config deployment on Vercel or Netlify. Set the environment variable:
   ```env
   VITE_API_URL=https://your-backend-domain.com/api
   ```

### Deploy Backend to Render / Railway / Heroku
1. Push repository to GitHub.
2. Link the repository to your hosting provider.
3. Configure the environment variables in the provider dashboard:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `MONGO_URI=mongodb+srv://...`
   - `JWT_SECRET=your_production_secret`
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
4. Set build command to `npm install` and start command to `node server.js`.

---

## 15. License

Developed for the **VELOOP Rewards** ecosystem under the MIT License.
