# Indian Lappa League Backend

Free deployable Node.js backend for the IPL Prediction League.

## Quick Start

```bash
cd backend

# Install dependencies
npm install

# Start server (auto-creates database with seed data)
npm start
```

Server runs at `http://localhost:3001`

## Default Login (Development)
- **Admin:** vikrant@example.com / ill2026
- **All users:** `<name>@example.com` / ill2026

## Deployment Options

### Option 1: Vercel (Recommended - Free)

1. Create new Vercel project for the `backend` folder
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` (optional - uses JSON file by default)
   - `JWT_SECRET` (optional - uses default for dev)
3. Deploy!

### Option 2: Railway ($5/month)

```bash
cd backend
railway init
railway up
```

### Option 3: Render (Free tier)

Create Web Service with:
- Build command: `npm install`
- Start command: `npm start`

### Option 4: Docker

```bash
docker build -t ill-backend .
docker run -p 3001:3001 ill-backend
```

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | App configuration |
| GET | `/api/leaderboard/weekly?week=N` | Weekly standings |
| GET | `/api/leaderboard/stage?stage=STAGE_1` | Stage standings |
| GET | `/api/leaderboard/overall` | Overall standings |
| GET | `/api/leaderboard/cumulative` | Points over time |
| GET | `/api/player/:id` | Player profile |
| GET | `/api/player/:id/predictions?week=N` | Player predictions |
| GET | `/api/matches?week=N` | Match schedule |

### Authentication Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |

### Admin Only

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/match-result` | Enter match result |
| POST | `/api/admin/sync-predictions` | Sync predictions |
| POST | `/api/admin/upload-predictions` | Upload CSV predictions |
| POST | `/api/admin/override-score` | Override points |
| GET | `/api/admin/audit-log` | View audit log |

## Scoring Rules

- Correct prediction: **10 points**
- Incorrect prediction: **0 points**
- No Result (rain): **5 points** (everyone)
- Late submission: **0 points**

## Prize Structure

- **Weekly:** 1st ₹700, 2nd ₹300
- **Stage:** 1st ₹2500, 2nd ₹1500, 3rd ₹1000
- **Overall:** 1st ₹9000, 2nd ₹5000, 3rd ₹3500, 4th ₹2500, 5th ₹1500

## Tech Stack

- Node.js + Express
- JSON file storage (auto-created)
- JWT Authentication
