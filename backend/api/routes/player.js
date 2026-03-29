const express = require('express');
const router = express.Router();
const db = require('../db.js');
const { recalculateOverallLeaderboard } = require('../services/scoring.js');

router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = db.users.findUnique(userId);
    if (!user) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const weeklyResults = db.weeklyResults.findMany({ where: { userId } });
    const weeks = db.weeks.findMany().sort((a, b) => a.weekNumber - b.weekNumber);

    const overall = weeklyResults.reduce(
      (acc, r) => ({
        points: acc.points + r.totalPoints,
        wins: acc.wins + r.wins,
        losses: acc.losses + r.losses,
        draws: acc.draws + r.draws,
        predicted: acc.predicted + r.predicted,
      }),
      { points: 0, wins: 0, losses: 0, draws: 0, predicted: 0 }
    );

    overall.accuracy =
      overall.wins + overall.losses > 0
        ? ((overall.wins / (overall.wins + overall.losses)) * 100).toFixed(1)
        : 0;

    const leaderboard = recalculateOverallLeaderboard();
    const rank = leaderboard.findIndex(r => r.userId === userId) + 1;

    const weeklyPoints = weeks
      .map(w => {
        const wr = weeklyResults.find(r => r.weekId === w.id);
        return wr ? { week: w.weekNumber, points: wr.totalPoints } : null;
      })
      .filter(Boolean);

    const predictions = db.predictions.findMany({ where: { userId } });
    const teamPredictions = {};
    for (const p of predictions) {
      teamPredictions[p.predictedWinner] = (teamPredictions[p.predictedWinner] || 0) + 1;
    }
    const teamPredictionsArray = Object.entries(teamPredictions)
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count);

    const prizeEarnings = weeklyResults.reduce(
      (acc, r) => ({
        weekly: acc.weekly + r.prizeAmount,
        stage: 0,
        overall: 0,
      }),
      { weekly: 0, stage: 0, overall: 0 }
    );
    prizeEarnings.total = prizeEarnings.weekly + prizeEarnings.stage + prizeEarnings.overall;

    res.json({
      id: user.id,
      name: user.name,
      initials: user.name.substring(0, 2).toUpperCase(),
      avatarUrl: user.avatarUrl,
      role: user.role,
      overall: {
        rank,
        ...overall,
      },
      weeklyPoints,
      prizeEarnings,
      teamPredictions: teamPredictionsArray,
    });
  } catch (error) {
    console.error('Player profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/predictions', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const weekNum = req.query.week ? parseInt(req.query.week) : null;

    let predictions = db.predictions.findMany({ where: { userId } });

    if (weekNum) {
      const matches = db.matches.findMany({ where: { weekNumber: weekNum } });
      const matchIds = matches.map(m => m.id);
      predictions = predictions.filter(p => matchIds.includes(p.matchId));
    }

    const history = predictions.map(p => {
      const match = db.matches.findUnique(p.matchId);
      return {
        matchNum: match ? match.matchNumber : null,
        home: match ? match.teamHome : null,
        away: match ? match.teamAway : null,
        predicted: p.predictedWinner,
        winner: match ? match.winner : null,
        result:
          match && match.result === 'NO_RESULT'
            ? 'draw'
            : p.predictedWinner === (match ? match.winner : null)
            ? 'correct'
            : 'incorrect',
        points: p.pointsAwarded,
      };
    }).filter(h => h.matchNum);

    res.json({ history });
  } catch (error) {
    console.error('Player predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
