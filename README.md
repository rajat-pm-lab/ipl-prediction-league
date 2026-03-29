# Indian Lappa League

A private prediction league for NSIT alumni (2012-2016 batch) to predict IPL match winners and compete for weekly and phase-wise prizes.

## Project Structure

```
ipl-prediction-league/
├── CLAUDE.md              # AI assistant instructions
├── 01-design/             # UX mockups, data model, architecture
│   ├── PRD.md             # Product Requirements Document
│   ├── schema.prisma      # Database schema
│   └── SDE-HANDOFF.md    # Developer handoff guide
├── 02-prototype/          # React frontend
│   └── ill-dashboard/     # Dashboard application
└── backend/               # Node.js backend API
    ├── api/               # API routes and services
    ├── prisma/            # Database schema and seed
    └── vercel.json        # Vercel deployment config
```

## Quick Start

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Initialize database with seed data
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Backend runs at `http://localhost:3001`

### Frontend Setup

```bash
cd 02-prototype/ill-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:5173`

## Deployment (Free)

### Option 1: Vercel (Recommended)

1. **Backend**: Create new Vercel project for `/backend` folder
   - Set environment variable: `DATABASE_URL` (use Supabase free PostgreSQL)
   - Set environment variable: `JWT_SECRET`

2. **Frontend**: Deploy from `/02-prototype/ill-dashboard`
   - Set environment variable: `VITE_API_URL` = your backend URL

### Option 2: Railway

```bash
# Backend
cd backend
railway init
railway up

# Set DATABASE_URL and JWT_SECRET in Railway dashboard
```

### Option 3: Render

Create Web Services for both frontend and backend with auto-deploy from GitHub.

## Default Credentials (Development)

| User | Email | Password | Role |
|------|-------|----------|------|
| Vikrant | vikrant@example.com | ill2026 | ADMIN |
| All others | `<name>@example.com` | ill2026 | PARTICIPANT |

## API Endpoints

### Public
- `GET /api/leaderboard/weekly?week=N` - Weekly standings
- `GET /api/leaderboard/stage?stage=STAGE_1` - Stage standings
- `GET /api/leaderboard/overall` - Overall standings
- `GET /api/leaderboard/cumulative` - Points over time
- `GET /api/player/:id` - Player profile
- `GET /api/matches?week=N` - Match schedule

### Authentication Required
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Admin Only
- `POST /api/admin/match-result` - Enter match result
- `POST /api/admin/sync-predictions` - Sync predictions from Google Form
- `POST /api/admin/override-score` - Override score with reason

## Scoring Rules

| Outcome | Points |
|---------|--------|
| Correct prediction | 10 |
| Incorrect prediction | 0 |
| Rain / No Result | 5 (everyone) |
| Late submission | 0 |

## Prize Structure

| Category | Pool | Prizes |
|----------|------|--------|
| Weekly (9 weeks) | ₹9,000 | 1st ₹700, 2nd ₹300 |
| Stage (3 stages) | ₹15,000 | 1st ₹2,500, 2nd ₹1,500, 3rd ₹1,000 |
| Overall | ₹21,500 | 1st ₹9,000, 2nd ₹5,000, 3rd ₹3,500, 4th ₹2,500, 5th ₹1,500 |
| **Total** | **₹45,500** | |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Deployment | Vercel |
