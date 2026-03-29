const STAGE_CONFIG = {
  STAGE_1: { weeks: [1, 2, 3, 4], label: 'Stage 1', color: '#2979FF' },
  STAGE_2: { weeks: [5, 6, 7, 8], label: 'Stage 2', color: '#FF6D00' },
  STAGE_3: { weeks: [9], label: 'Stage 3', color: '#FFD700' },
};

const PRIZES = {
  weekly: { 1: 700, 2: 300 },
  stage: { 1: 2500, 2: 1500, 3: 1000 },
  overall: { 1: 9000, 2: 5000, 3: 3500, 4: 2500, 5: 1500 },
};

async function recalculateWeeklyLeaderboard(weekNumber) {
  const db = require('../db.js');
  const week = db.weeks.findUnique(weekNumber);
  if (!week) return;

  const matches = db.matches.findMany({ where: { weekNumber } });
  const matchIds = matches.map(m => m.id);
  const users = db.users.findMany();

  for (const user of users) {
    const preds = db.predictions.findMany({
      where: { userId: user.id }
    }).filter(p => matchIds.includes(p.matchId));

    const wins = preds.filter(p => p.pointsAwarded === 10).length;
    const losses = preds.filter(p => p.pointsAwarded === 0 && p.isValid).length;
    const draws = preds.filter(p => p.pointsAwarded === 5).length;
    const totalPoints = preds.reduce((sum, p) => sum + p.pointsAwarded, 0);

    db.weeklyResults.upsert(week.id, user.id, {
      totalPoints,
      wins,
      losses,
      draws,
      predicted: preds.length,
      rank: 0,
      prizeAmount: 0
    });
  }

  applyWeeklyRankings(week.id);
}

function applyWeeklyRankings(weekId) {
  const db = require('../db.js');
  const results = db.weeklyResults.findMany({ where: { weekId } });
  const users = db.users.findMany();
  
  const enriched = results.map(r => {
    const user = users.find(u => u.id === r.userId);
    return { ...r, user };
  });

  const sorted = enriched.sort((a, b) => tiebreaker(a, b));
  
  for (let i = 0; i < sorted.length; i++) {
    const position = i + 1;
    const prizeAmount = PRIZES.weekly[position] || 0;
    db.weeklyResults.update(sorted[i].id, { rank: position, prizeAmount });
  }
}

function tiebreaker(a, b) {
  if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
  if (a.wins !== b.wins) return b.wins - a.wins;
  return 0;
}

async function scoreMatch(matchId) {
  const db = require('../db.js');
  const match = db.matches.findUnique(matchId);
  if (!match || match.result === 'PENDING') return;

  const predictions = db.predictions.findMany({ where: { matchId } });

  for (const pred of predictions) {
    let points = 0;

    if (!pred.isValid) {
      points = 0;
    } else if (match.result === 'NO_RESULT') {
      points = 5;
    } else if (pred.predictedWinner === match.winner) {
      points = 10;
    }

    db.predictions.update(pred.id, { pointsAwarded: points });
  }

  await recalculateWeeklyLeaderboard(match.weekNumber);
}

function recalculateStageLeaderboard(stage) {
  const db = require('../db.js');
  const config = STAGE_CONFIG[stage];
  if (!config) return [];

  const weeks = db.weeks.findMany().filter(w => config.weeks.includes(w.weekNumber));
  const users = db.users.findMany();
  const results = [];

  for (const user of users) {
    const weeklyResults = [];
    for (const week of weeks) {
      const wr = db.weeklyResults.findMany({ where: { weekId: week.id, userId: user.id } });
      weeklyResults.push(...wr);
    }

    const totalPoints = weeklyResults.reduce((sum, r) => sum + r.totalPoints, 0);
    const wins = weeklyResults.reduce((sum, r) => sum + r.wins, 0);
    const losses = weeklyResults.reduce((sum, r) => sum + r.losses, 0);
    const draws = weeklyResults.reduce((sum, r) => sum + r.draws, 0);
    const predicted = weeklyResults.reduce((sum, r) => sum + r.predicted, 0);
    const weeklyWins = weeklyResults.filter(r => r.rank === 1).length;

    results.push({
      userId: user.id,
      user,
      totalPoints,
      wins,
      losses,
      draws,
      predicted,
      weeklyWins,
    });
  }

  return results.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.weeklyWins !== b.weeklyWins) return b.weeklyWins - a.weeklyWins;
    return 0;
  });
}

function recalculateOverallLeaderboard() {
  const db = require('../db.js');
  const users = db.users.findMany();
  const allResults = db.weeklyResults.findMany();
  const weeks = db.weeks.findMany();
  const results = [];

  for (const user of users) {
    const weeklyResults = allResults.filter(r => r.userId === user.id);

    const totalPoints = weeklyResults.reduce((sum, r) => sum + r.totalPoints, 0);
    const wins = weeklyResults.reduce((sum, r) => sum + r.wins, 0);
    const losses = weeklyResults.reduce((sum, r) => sum + r.losses, 0);
    const draws = weeklyResults.reduce((sum, r) => sum + r.draws, 0);
    const predicted = weeklyResults.reduce((sum, r) => sum + r.predicted, 0);
    const weeklyWins = weeklyResults.filter(r => r.rank === 1).length;

    const stage3Weeks = weeks.filter(w => w.stage === 'STAGE_3');
    const stage3Results = weeklyResults.filter(r =>
      stage3Weeks.some(w => w.id === r.weekId)
    );
    const stage3Points = stage3Results.reduce((sum, r) => sum + r.totalPoints, 0);

    results.push({
      userId: user.id,
      user,
      totalPoints,
      wins,
      losses,
      draws,
      predicted,
      weeklyWins,
      stage3Points,
    });
  }

  return results.sort((a, b) => {
    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints;
    if (a.wins !== b.wins) return b.wins - a.wins;
    if (a.weeklyWins !== b.weeklyWins) return b.weeklyWins - a.weeklyWins;
    if (a.stage3Points !== b.stage3Points) return b.stage3Points - a.stage3Points;
    return 0;
  });
}

module.exports = {
  scoreMatch,
  recalculateWeeklyLeaderboard,
  recalculateStageLeaderboard,
  recalculateOverallLeaderboard,
  STAGE_CONFIG,
  PRIZES
};
