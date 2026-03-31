# AGENT.md — Quick-Start Context for AI Sessions

This file captures the full project state so any AI session can get up to speed instantly without Rajat re-explaining everything.

---

## Project in One Line
Indian Lappa League (ILL) — private IPL 2026 prediction league for 12 NSIT alumni. Players predict match winners weekly. Points, leaderboard, prizes tracked on a web dashboard.

---

## Two Repos

| Repo | What It Is | Live URL |
|---|---|---|
| `ipl-league-sheets` | **Active prototype** — Google Sheets backend, serverless scoring | https://ipl-league-sheets.vercel.app |
| `ipl-prediction-league` | Shaan's work — traditional Node.js backend (separate, don't touch without Rajat confirming) | ipl-prediction-league.vercel.app |

**Always work in `ipl-league-sheets` unless explicitly told otherwise.**

---

## Players (12 active)
| ID | Name | Nickname | Photo |
|---|---|---|---|
| 1 | Rajat | Rajjo | ✓ |
| 2 | Vikrant | — | ✓ |
| 3 | Vipul | — | ✓ |
| 4 | Deepanshu | Pincha | initials |
| 5 | Shubham | Gungun | initials |
| 6 | Sudarshan | Suddi | initials |
| 7 | Aditya | Adi | initials |
| 8 | Shan | Shaan | initials |
| 9 | Akash | — | initials |
| 10 | Kartik | — | initials |
| 12 | Himanshu | — | initials |
| 13 | Nishant | — | initials |

ID 11 (Utkarsh) was removed. IDs intentionally non-sequential.

---

## Scoring
- Correct pick: **10 pts** | Wrong: **0 pts** | No Result (rain): **5 pts** | Missed: **0 pts**
- Rules editable in Google Sheet `Rules` tab — no code deploy needed
- Tied points = same rank (competition ranking: 1, 1, 3 not 1, 2, 3)

---

## Tournament Structure
| Stage | Weeks | Matches |
|---|---|---|
| Stage 1 | Weeks 1-4 | First 35 league matches |
| Stage 2 | Weeks 5-8 | Next 35 league matches |
| Stage 3 | Week 9 | Playoffs (4 matches) |

- Entry fee: Rs. 3,500/player | Total prize pool: Rs. 45,500
- Weekly: Rs. 1,000/week (winner Rs. 700, runner-up Rs. 300)
- Stage: Rs. 5,000/stage (1st Rs. 2,500, 2nd Rs. 1,500, 3rd Rs. 1,000)
- Overall: Rs. 21,500 (top 5)

---

## Data Flow
```
Google Form → CSV download → paste into Google Sheet "Week N" tab
                                        ↓
                           Admin fills "winner" in Match Results tab
                                        ↓
                           /api/sheets-data (60s cache) → React frontend
```

---

## Key Code Files (ipl-league-sheets repo)
| File | Purpose |
|---|---|
| `lib/constants.js` | Players, teams, stages, NAME_ALIASES (nicknames → player IDs) |
| `lib/sheets.js` | Google Sheets API client. Auto-derives status from winner column. |
| `lib/scoring.js` | Scoring engine. `rankLeaderboard` does competition ranking. |
| `api/sheets-data.js` | Main endpoint. Returns all data for frontend. 60s cache. |
| `02-prototype/ill-dashboard/src/data/DataContext.jsx` | React context. Fetches API, falls back to static. |
| `02-prototype/ill-dashboard/src/pages/Leaderboard.jsx` | 4 tabs: Weekly, Stage, Overall, Picks |

---

## Google Sheet
**ID:** `15YEBSCRUec2f0DhPmYLVipr8h9A944KViB7INRVfeMc`

| Tab | What it contains |
|---|---|
| `Rules` | Scoring points per stage — edit here to change rules |
| `Match Results` | All 74 matches + winner column (admin fills winner after each match) |
| `Week N` | Player predictions for week N (paste from Google Form CSV) |

---

## Vercel Env Vars (ipl-league-sheets project)
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SHEETS_CLIENT_EMAIL` — ipl-sheets-bot@ipl-league-491802.iam.gserviceaccount.com
- `GOOGLE_SHEETS_PRIVATE_KEY` — rotate if ever exposed in plaintext chat
- `CRON_SECRET`
- `CRICKET_API_KEY` — (optional) CricAPI free tier, 100 calls/day

---

## Known Bugs Fixed (don't reintroduce)
1. **Status field bug** — `status` column in sheet used to block scoring. Now auto-derived from `winner` column. Only `winner` matters.
2. **Blank future weeks** — weeks with no data now show all players at 0, not blank screen.
3. **Tied rank** — players with same points now share rank (fixed March 31, 2026).

---

## Rajat's Preferences
- Mobile-first design (480px max-width, accordion UI)
- Keep it simple — avoid over-engineering
- No code deploy needed for data/rule changes (that's the whole point of Sheets backend)
- Commit and push after each significant change so Vercel auto-deploys
- Don't touch `ipl-prediction-league` repo unless Rajat explicitly says so
