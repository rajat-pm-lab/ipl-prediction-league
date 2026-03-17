# SDE Handoff — Indian Lappa League

**For:** Developer building the production app
**From:** Rajat Singh (PM)
**Date:** March 17, 2026

---

## What You're Building

A **real-time IPL prediction leaderboard** for 13 friends. The frontend prototype is already built (React + Vite, deployed on Vercel). Your job is to wire up the **backend data pipeline** so the dashboard shows real data instead of sample data.

**Two data sources need stitching:**
1. **Google Form responses** — weekly predictions from 13 players
2. **Live match results** — who won each IPL match

**One output:** Leaderboard that auto-updates points, rankings, and prizes.

---

## Repo & Prototype

- **Repo:** https://github.com/rajat-pm-lab/ipl-prediction-league
- **Prototype:** `02-prototype/ill-dashboard/` (React + Vite)
- **PRD:** `01-design/PRD.md` (full rules, scoring, prizes)
- **Data model:** `01-design/schema.prisma` (Prisma schema, PostgreSQL)
- **Sample data:** `02-prototype/ill-dashboard/src/data/sampleData.js` — replace this with real API calls

---

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Google Form  │────▶│   Backend    │────▶│  Dashboard   │
│ (Predictions)│     │  (Node.js)   │     │  (React)     │
└──────────────┘     │              │     └──────────────┘
                     │  Scoring     │
┌──────────────┐     │  Engine      │
│ Cricket API  │────▶│              │
│ (or Admin)   │     └──────┬───────┘
└──────────────┘            │
                     ┌──────▼───────┐
                     │  PostgreSQL  │
                     │  (Supabase)  │
                     └──────────────┘
```

---

## Data Pipeline: Step by Step

### Pipeline 1: Google Form → Predictions DB

**How it works today:** Admin (Vikrant) sends a Google Form each week. 13 players fill it out before the first match of that week. Each row = one player's predictions for all matches that week.

**What you need to build:**

#### Option A: Google Sheets API (Recommended)
1. Google Form responses auto-populate a Google Sheet
2. Backend reads the sheet via Google Sheets API (service account)
3. Cron job or admin-triggered sync pulls new responses
4. Parse each row → create `Prediction` records in DB

```
Google Form → Google Sheet → Sheets API → Backend → Prediction table
```

**API endpoint:**
```
POST /api/admin/sync-predictions
  Query: ?weekNumber=3
  Auth: Admin only

  Steps:
  1. Fetch Google Sheet rows for the given week
  2. For each row:
     a. Match player name → Participant.id
     b. For each match column, create/update Prediction record
     c. Validate: if match already started at submittedAt, mark isValid=false
  3. Return: { synced: 13, errors: [] }
```

**Google Sheet expected format:**

| Timestamp | Name | Match 15: CSK vs MI | Match 16: RCB vs DC | Match 17: KKR vs SRH | ... |
|---|---|---|---|---|---|
| 2026-03-23 14:30 | Rajjo | CSK | DC | KKR | ... |
| 2026-03-23 15:12 | Aman | MI | RCB | SRH | ... |

- Column A = Google Form timestamp (use this as `submittedAt`)
- Column B = Player name (must match `Participant.name` exactly)
- Columns C onwards = one column per match, value = team abbreviation predicted to win

#### Option B: CSV Upload (Simpler fallback)
1. Admin downloads Google Sheet as CSV
2. Uploads CSV via admin panel
3. Backend parses and creates Prediction records

```
POST /api/admin/upload-predictions
  Body: multipart/form-data with CSV file
  Query: ?weekNumber=3
```

### Pipeline 2: Match Results → Scoring

**Two options for getting match results:**

#### Option A: Manual Admin Entry (MVP — build this first)
Admin enters result after each match via admin panel.

```
POST /api/admin/match-result
  Body: { matchId: 15, result: "HOME_WIN" }   // or "AWAY_WIN" or "NO_RESULT"
  Auth: Admin only

  Steps:
  1. Update Match.result and Match.winner
  2. Run scoring engine (see below)
  3. Recalculate leaderboards
  4. Return: { match: 15, pointsAwarded: { Rajjo: 10, Aman: 0, ... } }
```

#### Option B: Cricket API Auto-Fetch (P2 — nice to have)
Use a cricket API to auto-fetch results after matches end.

**Recommended APIs:**
- **CricAPI** (cricapi.com) — free tier, simple REST
- **Cricbuzz unofficial** — scraping, less reliable
- **ESPNcricinfo API** — unofficial but comprehensive

```
Cron job: every 15 min during match hours (14:00-01:00 IST)
  1. Fetch today's IPL match status from API
  2. If match completed and result not yet in DB:
     a. Update Match.result
     b. Run scoring engine
     c. Log auto-update in audit trail
```

---

## Scoring Engine (Critical — get this right)

This is the core logic. Must match the rulebook exactly.

```javascript
// Called after every match result is entered
async function scoreMatch(matchId) {
  const match = await db.match.findUnique({ where: { id: matchId } })
  const predictions = await db.prediction.findMany({ where: { matchId } })

  for (const pred of predictions) {
    let points = 0

    if (!pred.isValid) {
      // Late submission — match had already started
      points = 0
    } else if (match.result === 'NO_RESULT') {
      // Rain/abandoned — everyone gets 5
      points = 5
    } else if (pred.predictedWinner === match.winner) {
      // Correct prediction
      points = 10
    } else {
      // Incorrect
      points = 0
    }

    await db.prediction.update({
      where: { id: pred.id },
      data: { pointsAwarded: points }
    })
  }

  // Also award 0 to players who didn't submit (no Prediction row exists)
  // They simply have no record = 0 points

  // Recalculate weekly leaderboard
  await recalculateWeeklyLeaderboard(match.weekNumber)
}
```

### Leaderboard Calculation

```javascript
async function recalculateWeeklyLeaderboard(weekNumber) {
  const week = await db.week.findUnique({ where: { weekNumber } })
  const matches = await db.match.findMany({ where: { weekNumber } })
  const matchIds = matches.map(m => m.id)

  // For each participant
  for (const participant of allParticipants) {
    const preds = await db.prediction.findMany({
      where: { participantId: participant.id, matchId: { in: matchIds } }
    })

    const wins = preds.filter(p => p.pointsAwarded === 10).length
    const losses = preds.filter(p => p.pointsAwarded === 0 && p.isValid).length
    const draws = preds.filter(p => p.pointsAwarded === 5).length
    const totalPoints = preds.reduce((sum, p) => sum + p.pointsAwarded, 0)

    await db.weeklyResult.upsert({
      where: { weekId_participantId: { weekId: week.id, participantId: participant.id } },
      update: { totalPoints, wins, losses, draws },
      create: { weekId: week.id, participantId: participant.id, totalPoints, wins, losses, draws, rank: 0 }
    })
  }

  // Rank by points (desc), then tiebreakers
  await applyRankings(week.id)
}
```

### Tiebreaker Logic (in order)

```javascript
function tiebreaker(a, b) {
  // 1. Total points (higher wins)
  if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints

  // 2. Most correct predictions (count of 10-pt results)
  if (a.wins !== b.wins) return b.wins - a.wins

  // 3. Most weekly wins (weeks where player ranked #1)
  if (a.weeklyWins !== b.weeklyWins) return b.weeklyWins - a.weeklyWins

  // 4. Highest points in Stage 3 (playoffs)
  if (a.stage3Points !== b.stage3Points) return b.stage3Points - a.stage3Points

  // 5. Admin decision (manual override)
  return 0
}
```

---

## API Endpoints Summary

### Public (authenticated participants)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/leaderboard/weekly?week=3` | Weekly leaderboard for a given week |
| GET | `/api/leaderboard/stage?stage=1` | Stage leaderboard (aggregated) |
| GET | `/api/leaderboard/overall` | Overall tournament standings |
| GET | `/api/player/:id` | Player profile + stats |
| GET | `/api/player/:id/predictions?week=3` | Player's match-by-match predictions |
| GET | `/api/matches?week=3` | Match schedule + results for a week |

### Admin only

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/admin/sync-predictions` | Pull predictions from Google Sheet |
| POST | `/api/admin/upload-predictions` | Upload CSV of predictions |
| POST | `/api/admin/match-result` | Enter match result + trigger scoring |
| POST | `/api/admin/override-score` | Override a prediction's points (with reason) |
| GET | `/api/admin/audit-log` | View all overrides and admin actions |
| POST | `/api/admin/matches` | Add/edit match schedule |

---

## Leaderboard Response Shape

The frontend currently uses this data shape (see `sampleData.js`). Match this in your API responses:

```json
// GET /api/leaderboard/weekly?week=3
{
  "week": 3,
  "stage": "STAGE_1",
  "leaderboard": [
    {
      "rank": 1,
      "playerId": 4,
      "playerName": "Rajjo",
      "playerInitials": "RJ",
      "avatarUrl": null,
      "predicted": 7,
      "played": 7,
      "wins": 5,
      "losses": 2,
      "draws": 0,
      "points": 50,
      "prizeAmount": 700
    }
  ]
}
```

```json
// GET /api/player/:id
{
  "id": 4,
  "name": "Rajjo",
  "role": "PARTICIPANT",
  "overall": {
    "rank": 2,
    "points": 140,
    "wins": 12,
    "losses": 7,
    "draws": 2,
    "predicted": 21,
    "accuracy": 63.2
  },
  "weeklyPoints": [
    { "week": 1, "points": 40 },
    { "week": 2, "points": 50 },
    { "week": 3, "points": 50 }
  ],
  "prizeEarnings": {
    "weekly": 700,
    "stage": 0,
    "overall": 0,
    "total": 700
  },
  "teamPredictions": [
    { "team": "CSK", "count": 5 },
    { "team": "MI", "count": 3 }
  ]
}
```

---

## Database Setup

Use the Prisma schema at `01-design/schema.prisma`. Recommended hosting: **Supabase** (free PostgreSQL + realtime).

```bash
# Setup
npm install prisma @prisma/client
npx prisma migrate dev --name init

# Seed the 13 players
npx prisma db seed
```

### Seed Data (13 players)

```javascript
const players = [
  { name: 'Aditya', role: 'GRIEVANCE' },
  { name: 'Aman', role: 'PARTICIPANT' },
  { name: 'Deepanshu', role: 'PARTICIPANT' },
  { name: 'Rajjo', role: 'PARTICIPANT' },
  { name: 'Shan', role: 'AUDIT' },
  { name: 'Shivek', role: 'PARTICIPANT' },
  { name: 'Shubham', role: 'AUDIT' },
  { name: 'Sudarshan', role: 'PARTICIPANT' },
  { name: 'Suyash', role: 'PARTICIPANT' },
  { name: 'Tushar', role: 'PARTICIPANT' },
  { name: 'Utkarsh', role: 'PARTICIPANT' },
  { name: 'Vikrant', role: 'ADMIN' },
  { name: 'Vipul', role: 'FINANCE' },
]
```

### Match Schedule Seed

74 matches total. Admin can bulk import from IPL schedule. Schema:

```javascript
{ matchNumber: 1, teamHome: 'KKR', teamAway: 'RCB', dateTime: '2026-03-22T19:30:00+05:30', weekNumber: 1, stage: 'STAGE_1' }
```

---

## Week + Stage Mapping

| Week | Dates (Sun-Sat) | Stage | Approx Matches |
|---|---|---|---|
| 1 | Mar 22 - Mar 28 | Stage 1 | ~9 |
| 2 | Mar 29 - Apr 4 | Stage 1 | ~9 |
| 3 | Apr 5 - Apr 11 | Stage 1 | ~9 |
| 4 | Apr 12 - Apr 18 | Stage 1 | ~8 |
| 5 | Apr 19 - Apr 25 | Stage 2 | ~9 |
| 6 | Apr 26 - May 2 | Stage 2 | ~9 |
| 7 | May 3 - May 9 | Stage 2 | ~9 |
| 8 | May 10 - May 16 | Stage 2 | ~8 |
| 9 | May 17 - May 25 | Stage 3 | 4 (playoffs) |

> Week runs **Sunday through Saturday**. A match belongs to whichever week its date falls in.

---

## Auth (Simple)

This is a private 13-person app. Keep auth simple:

- **Option A (Recommended):** Invite-link with magic link / OTP via email
- **Option B:** Simple password login (admin sets passwords for all 13)
- **Option C:** Google OAuth (everyone has Gmail)

Admin panel needs role-based access — only `ADMIN` role can access `/api/admin/*` endpoints.

---

## Deployment

| Layer | Recommendation |
|---|---|
| Frontend | Vercel (already deployed) |
| Backend | Vercel Serverless Functions or Railway |
| Database | Supabase (free PostgreSQL) |
| Google Sheets | Service account with Sheets API v4 |

---

## Build Priority

### Week 1 — MVP (before IPL starts)
1. Database setup + seed players + match schedule
2. Admin: enter match results → scoring engine runs
3. Admin: sync/upload predictions from Google Sheet
4. API: weekly/stage/overall leaderboard endpoints
5. Connect frontend to real API (replace `sampleData.js`)

### Week 2 — Polish
6. Player profile API
7. Auth (even basic password)
8. Admin panel UI

### Later — Nice to Have
9. Cricket API auto-fetch results
10. Instagram Story share (canvas → image → Web Share API)
11. Real-time updates (Supabase realtime subscriptions)

---

## Files to Hand Off

| File | What it is |
|---|---|
| `01-design/PRD.md` | Full product requirements + rules |
| `01-design/schema.prisma` | Database schema (Prisma) |
| `01-design/SDE-HANDOFF.md` | This document |
| `02-prototype/ill-dashboard/` | Working React prototype (reference UI) |
| `02-prototype/ill-dashboard/src/data/sampleData.js` | Data shapes to match in API |

---

## Key Rules (Don't Miss These)

1. **Submission deadline** = before the first match of that week starts. If a player submits after a match has started, predictions for that match (and any earlier matches) score 0.
2. **No Result = 5 points to everyone** (not just those who predicted).
3. **Missing prediction = 0 points** (no Prediction row in DB).
4. **Predictions are locked** once submitted. No edits.
5. **Prize amounts are fixed** — see PRD section 4 for the full table.
6. **Lappa badge** — last place each week gets "Lappa of the Week" label (fun/banter element, important to the group).

---

*Questions? Ask Rajat. The PRD has all the detailed rules and the prototype shows the exact UI to build.*
