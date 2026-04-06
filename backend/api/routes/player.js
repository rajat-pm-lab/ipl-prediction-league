const express = require('express');
const router = express.Router();
const db = require('../db.js');
const { recalculateOverallLeaderboard } = require('../services/scoring.js');

/**
 * @swagger
 * /api/player/{id}:
 *   get:
 *     summary: Get player profile with stats
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *     responses:
 *       200:
 *         description: Player profile with overall stats, weekly points, team predictions
 */
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

/**
 * @swagger
 * /api/player/{id}/predictions:
 *   get:
 *     summary: Get player's match predictions
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Player ID
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: Filter by week number
 *     responses:
 *       200:
 *         description: Player's prediction history
 */
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

router.get('/:id/h2h/:opponentId', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const opponentId = parseInt(req.params.opponentId);

    const user = db.users.findUnique(userId);
    const opponent = db.users.findUnique(opponentId);
    
    if (!user || !opponent) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const userPredictions = db.predictions.findMany({ where: { userId } });
    const opponentPredictions = db.predictions.findMany({ where: { userId: opponentId } });

    let mutualWins = 0;
    let mutualLosses = 0;
    let ties = 0;
    let userCorrect = 0;
    let opponentCorrect = 0;

    for (const p of userPredictions) {
      const match = db.matches.findUnique(p.matchId);
      if (!match || !match.winner) continue;

      const oppPred = opponentPredictions.find(op => op.matchId === p.matchId);
      if (!oppPred) continue;

      if (p.predictedWinner === match.winner) userCorrect++;
      if (oppPred.predictedWinner === match.winner) opponentCorrect++;

      if (p.predictedWinner === match.winner && oppPred.predictedWinner !== match.winner) {
        mutualWins++;
      } else if (oppPred.predictedWinner === match.winner && p.predictedWinner !== match.winner) {
        mutualLosses++;
      } else if (p.predictedWinner === match.winner && oppPred.predictedWinner === match.winner) {
        ties++;
      }
    }

    const userWeekly = db.weeklyResults.findMany({ where: { userId } });
    const oppWeekly = db.weeklyResults.findMany({ where: { userId: opponentId } });

    const userTotalPoints = userWeekly.reduce((sum, w) => sum + w.totalPoints, 0);
    const oppTotalPoints = oppWeekly.reduce((sum, w) => sum + w.totalPoints, 0);

    const userWeeklyWins = userWeekly.filter(w => w.rank === 1).length;
    const oppWeeklyWins = oppWeekly.filter(w => w.rank === 1).length;

    res.json({
      player: { id: user.id, name: user.name },
      opponent: { id: opponent.id, name: opponent.name },
      stats: {
        mutualMatches: mutualWins + mutualLosses + ties,
        playerWins: mutualWins,
        opponentWins: mutualLosses,
        ties,
        playerCorrect,
        opponentCorrect,
        playerTotalPoints,
        opponentTotalPoints,
        playerWeeklyWins,
        opponentWeeklyWins,
      },
    });
  } catch (error) {
    console.error('Head to head error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/all', async (req, res) => {
  try {
    const users = db.users.findMany().filter(u => u.role === 'PARTICIPANT');
    res.json({ players: users.map(u => ({ id: u.id, name: u.name })) });
  } catch (error) {
    console.error('Get all players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
