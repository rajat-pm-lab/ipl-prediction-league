const express = require('express');
const router = express.Router();
const db = require('../db.js');
const { scoreMatch, recalculateWeeklyLeaderboard } = require('../services/scoring.js');
const { authMiddleware, adminOnly } = require('../middleware/auth.js');

router.use(authMiddleware);
router.use(adminOnly);

/**
 * @swagger
 * /api/admin/match-result:
 *   post:
 *     summary: Enter match result and trigger scoring
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - result
 *             properties:
 *               matchId:
 *                 type: integer
 *                 description: Match database ID
 *                 example: 1
 *               result:
 *                 type: string
 *                 enum: [HOME_WIN, AWAY_WIN, NO_RESULT]
 *                 example: HOME_WIN
 *               winner:
 *                 type: string
 *                 description: Winning team abbreviation (required for HOME_WIN/AWAY_WIN)
 *                 example: KKR
 *     responses:
 *       200:
 *         description: Match result entered, points calculated
 *       403:
 *         description: Admin access required
 */
router.post('/match-result', async (req, res) => {
  try {
    const { matchId, result, winner } = req.body;

    if (!matchId || !result) {
      return res.status(400).json({ error: 'matchId and result are required' });
    }

    const match = db.matches.findUnique(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updatedMatch = db.matches.update(matchId, {
      result,
      winner: result === 'NO_RESULT' ? null : winner,
    });

    await scoreMatch(matchId);

    const predictions = db.predictions.findMany({ where: { matchId } });
    const users = db.users.findMany();

    const pointsAwarded = {};
    predictions.forEach(p => {
      const user = users.find(u => u.id === p.userId);
      if (user) pointsAwarded[user.name] = p.pointsAwarded;
    });

    res.json({
      match: updatedMatch.matchNumber,
      result: updatedMatch.result,
      winner: updatedMatch.winner,
      pointsAwarded,
    });
  } catch (error) {
    console.error('Match result error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/sync-predictions:
 *   post:
 *     summary: Sync predictions from Google Form data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekNumber
 *               - predictions
 *             properties:
 *               weekNumber:
 *                 type: integer
 *                 example: 1
 *               predictions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     playerName:
 *                       type: string
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     picks:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                       example:
 *                         "1": "KKR"
 *                         "2": "CSK"
 *     responses:
 *       200:
 *         description: Predictions synced successfully
 */
router.post('/sync-predictions', async (req, res) => {
  try {
    const { weekNumber, predictions } = req.body;

    if (!weekNumber || !predictions) {
      return res.status(400).json({ error: 'weekNumber and predictions are required' });
    }

    const matches = db.matches.findMany({ where: { weekNumber } });
    const users = db.users.findMany();
    
    const results = { synced: 0, errors: [] };

    for (const pred of predictions) {
      const user = users.find(u => u.name.toLowerCase() === pred.playerName.toLowerCase());

      if (!user) {
        results.errors.push(`User not found: ${pred.playerName}`);
        continue;
      }

      for (const [matchNumStr, predictedWinner] of Object.entries(pred.picks || {})) {
        const matchNum = parseInt(matchNumStr);
        const match = matches.find(m => m.matchNumber === matchNum);
        
        if (!match) {
          results.errors.push(`Match not found: ${matchNum}`);
          continue;
        }

        const submittedAt = pred.submittedAt ? new Date(pred.submittedAt) : new Date();
        const isValid = submittedAt < new Date(match.dateTime);

        db.predictions.upsert(user.id, match.id, {
          predictedWinner,
          submittedAt: submittedAt.toISOString(),
          isValid,
          pointsAwarded: 0,
        }, {
          predictedWinner,
          submittedAt: submittedAt.toISOString(),
          isValid,
          pointsAwarded: 0,
        });

        results.synced++;
      }
    }

    for (const match of matches) {
      if (match.result !== 'PENDING') {
        await scoreMatch(match.id);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Sync predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/upload-predictions:
 *   post:
 *     summary: Upload predictions from CSV data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekNumber
 *               - csvData
 *             properties:
 *               weekNumber:
 *                 type: integer
 *               csvData:
 *                 type: string
 *                 description: CSV string with headers
 *     responses:
 *       200:
 *         description: Predictions uploaded
 */
router.post('/upload-predictions', async (req, res) => {
  try {
    const { weekNumber, csvData } = req.body;

    if (!weekNumber || !csvData) {
      return res.status(400).json({ error: 'weekNumber and csvData are required' });
    }

    const predictions = parseCSV(csvData);
    
    const matches = db.matches.findMany({ where: { weekNumber } });
    const users = db.users.findMany();
    
    const results = { synced: 0, errors: [] };

    for (const pred of predictions) {
      const user = users.find(u => u.name.toLowerCase() === pred.playerName.toLowerCase());

      if (!user) {
        results.errors.push(`User not found: ${pred.playerName}`);
        continue;
      }

      for (const [matchNumStr, predictedWinner] of Object.entries(pred.picks || {})) {
        const matchNum = parseInt(matchNumStr);
        const match = matches.find(m => m.matchNumber === matchNum);
        
        if (!match) continue;

        const submittedAt = pred.submittedAt ? new Date(pred.submittedAt) : new Date();
        const isValid = submittedAt < new Date(match.dateTime);

        db.predictions.upsert(user.id, match.id, {
          predictedWinner,
          submittedAt: submittedAt.toISOString(),
          isValid,
          pointsAwarded: 0,
        }, {
          predictedWinner,
          submittedAt: submittedAt.toISOString(),
          isValid,
          pointsAwarded: 0,
        });

        results.synced++;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Upload predictions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const predictions = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const pred = {
      playerName: cols[1],
      submittedAt: cols[0],
      picks: {},
    };

    for (let j = 2; j < cols.length; j++) {
      pred.picks[j - 1] = cols[j];
    }

    predictions.push(pred);
  }

  return predictions;
}

/**
 * @swagger
 * /api/admin/override-score:
 *   post:
 *     summary: Override a prediction's points (with audit log)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - predictionId
 *               - newPoints
 *               - reason
 *             properties:
 *               predictionId:
 *                 type: integer
 *               newPoints:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Score overridden successfully
 */
router.post('/override-score', async (req, res) => {
  try {
    const { predictionId, newPoints, reason } = req.body;

    if (!predictionId || newPoints === undefined || !reason) {
      return res.status(400).json({ error: 'predictionId, newPoints, and reason are required' });
    }

    const predictions = db.predictions.findMany({});
    const prediction = predictions.find(p => p.id === predictionId);

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    db.scoreOverrides.create({
      predictionId,
      originalPoints: prediction.pointsAwarded,
      newPoints,
      reason,
      overriddenBy: req.user.id,
      createdAt: new Date().toISOString(),
    });

    db.predictions.update(predictionId, { pointsAwarded: newPoints });

    const match = db.matches.findUnique(prediction.matchId);
    if (match) {
      await recalculateWeeklyLeaderboard(match.weekNumber);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Override score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/audit-log:
 *   get:
 *     summary: View all score overrides and admin actions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all admin actions
 */
router.get('/audit-log', async (req, res) => {
  try {
    const overrides = db.scoreOverrides.findMany();
    const users = db.users.findMany();
    const predictions = db.predictions.findMany();
    const matches = db.matches.findMany();

    const auditLog = overrides.map(o => {
      const prediction = predictions.find(p => p.id === o.predictionId);
      const user = prediction ? users.find(u => u.id === prediction.userId) : null;
      const match = prediction ? matches.find(m => m.id === prediction.matchId) : null;
      const admin = users.find(u => u.id === o.overriddenBy);

      return {
        id: o.id,
        playerName: user ? user.name : null,
        matchNum: match ? match.matchNumber : null,
        originalPoints: o.originalPoints,
        newPoints: o.newPoints,
        reason: o.reason,
        adminName: admin ? admin.name : null,
        createdAt: o.createdAt,
      };
    });

    res.json({ auditLog });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/matches:
 *   post:
 *     summary: Create or update matches
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matches
 *             properties:
 *               matches:
 *                 type: array
 *     responses:
 *       200:
 *         description: Matches created
 */
router.post('/matches', async (req, res) => {
  try {
    const { matches } = req.body;

    if (!matches || !Array.isArray(matches)) {
      return res.status(400).json({ error: 'matches array is required' });
    }

    const created = [];
    for (const match of matches) {
      const createdMatch = db.matches.upsert(match.matchNumber, match);
      created.push(createdMatch);
    }

    res.json({ created: created.length });
  } catch (error) {
    console.error('Create matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
