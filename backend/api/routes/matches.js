const express = require('express');
const router = express.Router();
const db = require('../db.js');

router.get('/', async (req, res) => {
  try {
    const weekNum = req.query.week ? parseInt(req.query.week) : null;

    let matches = db.matches.findMany();
    if (weekNum) {
      matches = matches.filter(m => m.weekNumber === weekNum);
    }
    matches.sort((a, b) => a.matchNumber - b.matchNumber);

    res.json({
      matches: matches.map(m => ({
        matchNum: m.matchNumber,
        home: m.teamHome,
        away: m.teamAway,
        venue: m.venue,
        dateTime: m.dateTime,
        weekNumber: m.weekNumber,
        stage: m.stage,
        result: m.result === 'PENDING' ? null : m.result,
        winner: m.winner,
      })),
    });
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:matchNum', async (req, res) => {
  try {
    const matchNum = parseInt(req.params.matchNum);
    
    const match = db.matches.findUnique(matchNum);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const predictions = db.predictions.findMany({ where: { matchId: match.id } });
    const users = db.users.findMany();

    res.json({
      matchNum: match.matchNumber,
      home: match.teamHome,
      away: match.teamAway,
      venue: match.venue,
      dateTime: match.dateTime,
      weekNumber: match.weekNumber,
      stage: match.stage,
      result: match.result === 'PENDING' ? null : match.result,
      winner: match.winner,
      predictions: predictions.map(p => {
        const user = users.find(u => u.id === p.userId);
        return {
          playerId: p.userId,
          playerName: user ? user.name : null,
          predicted: p.predictedWinner,
          isValid: p.isValid,
        };
      }),
    });
  } catch (error) {
    console.error('Match detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
