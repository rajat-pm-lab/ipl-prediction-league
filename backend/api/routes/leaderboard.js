const express = require('express');
const router = express.Router();
const db = require('../db.js');
const {
  recalculateWeeklyLeaderboard,
  recalculateStageLeaderboard,
  recalculateOverallLeaderboard,
  STAGE_CONFIG,
} = require('../services/scoring.js');

router.get('/weekly', async (req, res) => {
  try {
    const weekNum = parseInt(req.query.week) || 1;
    
    const week = db.weeks.findUnique(weekNum);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }

    const results = db.weeklyResults.findMany({ where: { weekId: week.id } });
    const users = db.users.findMany();

    const enriched = results.map(r => {
      const user = users.find(u => u.id === r.userId);
      return { ...r, user };
    });

    enriched.sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);

    const leaderboard = enriched.map((r, i) => ({
      rank: i + 1,
      playerId: r.user.id,
      playerName: r.user.name,
      playerInitials: r.user.name.substring(0, 2).toUpperCase(),
      avatarUrl: r.user.avatarUrl,
      predicted: r.predicted,
      played: r.wins + r.losses + r.draws,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.totalPoints,
      prizeAmount: i === 0 ? 700 : i === 1 ? 300 : 0,
      isLappa: i === enriched.length - 1,
    }));

    res.json({
      week: weekNum,
      stage: week.stage,
      stageInfo: STAGE_CONFIG[week.stage],
      leaderboard,
    });
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stage', async (req, res) => {
  try {
    const stage = req.query.stage || 'STAGE_1';
    const config = STAGE_CONFIG[stage];
    
    if (!config) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const results = recalculateStageLeaderboard(stage);

    const leaderboard = results.map((r, i) => ({
      rank: i + 1,
      playerId: r.userId,
      playerName: r.user.name,
      playerInitials: r.user.name.substring(0, 2).toUpperCase(),
      avatarUrl: r.user.avatarUrl,
      predicted: r.predicted,
      played: r.wins + r.losses + r.draws,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.totalPoints,
      weeklyWins: r.weeklyWins,
      prizeAmount: [2500, 1500, 1000][i] || 0,
    }));

    res.json({
      stage,
      stageInfo: config,
      weeks: config.weeks,
      leaderboard,
    });
  } catch (error) {
    console.error('Stage leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/overall', async (req, res) => {
  try {
    const results = recalculateOverallLeaderboard();

    const leaderboard = results.map((r, i) => ({
      rank: i + 1,
      playerId: r.userId,
      playerName: r.user.name,
      playerInitials: r.user.name.substring(0, 2).toUpperCase(),
      avatarUrl: r.user.avatarUrl,
      predicted: r.predicted,
      played: r.wins + r.losses + r.draws,
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      points: r.totalPoints,
      weeklyWins: r.weeklyWins,
      accuracy: r.predicted > 0 
        ? ((r.wins / (r.wins + r.losses)) * 100).toFixed(1) 
        : 0,
      prizeAmount: [9000, 5000, 3500, 2500, 1500][i] || 0,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Overall leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cumulative', async (req, res) => {
  try {
    const users = db.users.findMany();
    const cumulativeData = [];

    for (const user of users) {
      const weeklyResults = db.weeklyResults.findMany({ where: { userId: user.id } });
      const weeks = db.weeks.findMany().sort((a, b) => a.weekNumber - b.weekNumber);

      let total = 0;
      const weekPoints = [{ week: 0, points: 0 }];

      for (const week of weeks) {
        const wr = weeklyResults.find(r => r.weekId === week.id);
        if (wr) {
          total += wr.totalPoints;
          weekPoints.push({ week: week.weekNumber, points: total });
        }
      }

      cumulativeData.push({
        playerId: user.id,
        name: user.name,
        initials: user.name.substring(0, 2).toUpperCase(),
        weeks: weekPoints,
      });
    }

    res.json({ cumulativeData });
  } catch (error) {
    console.error('Cumulative data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
