# AGENT.md — Quick-Start Context for AI Sessions

This file captures the full project state so any AI session can get up to speed instantly without Rajat re-explaining everything.

---

## Project in One Line
Indian Lappa League (ILL) — private IPL 2026 prediction league for 12 NSIT alumni. Players predict match winners weekly. Points, leaderboard, prizes tracked on a web dashboard.

---

## Two Repos

| Repo | What It Is | Live URL |
| --- | --- | --- |
| `ipl-league-sheets` | **Active prototype** — Google Sheets backend, serverless scoring | https://ipl-league-sheets.vercel.app |
| `ipl-prediction-league` | Shaan's work — traditional Node.js backend (separate, don't touch without Rajat confirming) | ipl-prediction-league.vercel.app |

**Always work in \****`ipl-league-sheets`**\*\* unless explicitly told otherwise.**

---

## Players (12 active)
Source of truth: `lib/constants.js` PLAYERS array and NAME_ALIASES map.

| ID | Name | Nickname | Photo |
| --- | --- | --- | --- |
| 1 | Aditya | Adi | initials |
| 2 | Aman | — | initials |
| 3 | Deepanshu | Pincha | initials |
| 4 | Rajjo | Rajat | ✓ |
| 5 | Shan | Shaan | initials |
| 6 | Shivek | — | initials |
| 7 | Shubham | Gungun | initials |
| 8 | Sudarshan | Suddi | initials |
| 9 | Suyash | — | initials |
| 10 | Tushar | Tushar Bhasin | initials |
| 12 | Vikrant | — | ✓ |
| 13 | Vipul | — | ✓ |

ID 11 (Utkarsh) was removed. IDs intentionally non-sequential.
If player roster changes, update `NAME_ALIASES` in `lib/constants.js`.

---

## Scoring
- Correct pick: **10 pts** | Wrong: **0 pts** | No Result (rain): **5 pts** | Missed: **0 pts**
- Rules editable in Google Sheet `Rules` tab — no code deploy needed
- Tied points = same rank (competition ranking: 1, 1, 3 not 1, 2, 3)

---

## Tournament Structure
| Stage | Weeks | Color |
| --- | --- | --- |
| Stage 1 | Weeks 1-3 | Electric Blue |
| Stage 2 | Weeks 4-6 | Vivid Orange |
| Stage 3 | Weeks 7-9 | Championship Gold |

(Stage boundaries defined in `lib/constants.js` STAGES object — edit there to change.)

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
| --- | --- |
| `lib/constants.js` | Players, teams, stages, NAME_ALIASES (nicknames → player IDs), `getStageForWeek()` |
| `lib/sheets.js` | Sheets API client. Reads Match Results, Rules, Week N, Weekly Rules tabs. Auto-derives status from winner. |
| `lib/scoring.js` | Scoring engine. `computeWeeklyScores(…, weeklyOverrides)`. `rankLeaderboard` uses running-rank variable (not `sorted[i-1].rank`). |
| `api/sheets-data.js` | Main endpoint. Returns players, weeklyData, matchSchedule, weeklyRules, weekComplete, cumulativePoints. 60s CDN cache. |
| `api/cron/update-results.js` | Daily cron (11:30 PM IST) — auto-fetches results from CricAPI if `CRICKET_API_KEY` set. |
| `02-prototype/ill-dashboard/src/data/DataContext.jsx` | React context. Fetches API, falls back to static sampleData. `rankAndSort` uses running-rank variable. |
| `02-prototype/ill-dashboard/src/pages/Leaderboard.jsx` | 4 tabs: Weekly, Stage, Overall, Picks. Shows rules strip per week. Passes `weekComplete` to table. |
| `02-prototype/ill-dashboard/src/components/LeaderboardTable.jsx` | Table with rank badges, winner/runner-up labels (only when `weekComplete=true`). |
| `02-prototype/ill-dashboard/src/components/PredictionsView.jsx` | Picks tab: accordion match cards with all players' picks per week. |

---

## Google Sheet
**ID:** `15YEBSCRUec2f0DhPmYLVipr8h9A944KViB7INRVfeMc`

| Tab | What it contains |
| --- | --- |
| `Rules` | Default scoring points per stage (stage1_points, stage2_points, stage3_points columns) |
| `Weekly Rules` | *(optional)* Per-week rule overrides. Columns: `week`, `rule_id`, `points`, `note`. If absent, falls back to Rules tab. |
| `Match Results` | All 74 matches + winner column (admin fills winner after each match) |
| `Week N` | Player predictions for week N (paste from Google Form CSV) |

### How to update rules week-by-week
- To change points for a specific week: add a row in **Weekly Rules** tab (e.g., week=9, rule_id=correct_pick, points=20, note=Playoffs double!)
- To change stage-wide defaults: edit `stage1_points`/`stage2_points`/`stage3_points` in **Rules** tab
- No code deploy needed. Changes reflect on site within 60 seconds.

---

## Vercel Env Vars (ipl-league-sheets project)
- `GOOGLE_SHEETS_ID`
- ipl-sheets-bot@ipl-league-491802.iam.gserviceaccount.com`GOOGLE_SHEETS_CLIENT_EMAIL` — ipl-sheets-bot@ipl-league-491802.iam.gserviceaccount.com
- `GOOGLE_SHEETS_PRIVATE_KEY` — rotate if ever exposed in plaintext chat
- `CRON_SECRET`
- `CRICKET_API_KEY` — (optional) CricAPI free tier, 100 calls/day

---

## Known Bugs Fixed (don't reintroduce)
1. **Status field bug** — `status` column in sheet used to block scoring. Now auto-derived from `winner` column. Only `winner` matters.
2. **Blank future weeks** — weeks with no data now show all players at 0, not blank screen.
3. **Tied rank (critical)** — `rankLeaderboard` and `rankAndSort` both had a bug: `sorted[i-1].rank` read from the pre-map array where `rank` was never set (always undefined). Fixed by using a running `currentRank` variable instead. Never revert to the `sorted[i-1].rank` pattern.
4. **Winner labels showing prematurely** — "₹700 Winner" / "₹300 Runner-up" labels showed mid-week and on empty future weeks. Fixed: labels only show when `weekComplete=true` (all matches in week have a winner filled in).
5. **All-zero weeks showing rank 1 for everyone** — future weeks showed everyone at rank 1 (tied). Fixed: zero-fallback now assigns sequential ranks (i+1).

---

## Weekly Twist Mechanics (player-specific rules)

Some weeks have special scoring mechanics beyond BAU. These are collected via Google Form (extra columns) and applied automatically by the scoring engine.

### Week 2 — Double Dip + Hate Team

**Double Dip** (compulsory):
- Player picks ONE match as their Double Dip game
- Correct prediction on that match: **+20 pts**
- Wrong prediction: **-10 pts**
- Google Form column: any column containing "double" (e.g., "Double Dip Match")
- Value: the match number (e.g., "Match 14" or just "14")

**Hate Team** (optional):
- Player picks ONE team they hate
- In ANY match that team plays this week, player is FORCED to predict against them
- Hate team LOSES: **+15 pts** (+10 correct + 5 bonus)
- Hate team WINS: **-5 pts** (penalty)
- If no hate team chosen: BAU scoring applies
- Google Form column: any column containing "hate" (e.g., "Hate Team")
- Value: team abbreviation (CSK, MI, RCB, etc.)

**Corner case**: Double Dip game CANNOT be a hate team game. If a player picks the same match, hate team scoring takes priority (not double dip).

**How the Week 2 sheet tab should look**:
- All regular match prediction columns (as usual)
- Extra column: `Double Dip Match` — player enters match number
- Extra column: `Hate Team` — player enters team abbreviation (or leaves blank)

**UI badges in Picks tab**:
- `DD` orange badge = this is the player's double dip match
- `💀CSK` pink badge = player's hate team is playing this match
- Points shown as `+20`/`-10` for DD, `+15`/`-5` for hate team matches

---

## Rajat's Preferences
- Mobile-first design (480px max-width, accordion UI)
- Keep it simple — avoid over-engineering
- No code deploy needed for data/rule changes (that's the whole point of Sheets backend)
- Commit and push after each significant change so Vercel auto-deploys
- Don't touch `ipl-prediction-league` repo unless Rajat explicitly says so
