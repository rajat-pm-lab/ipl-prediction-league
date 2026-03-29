const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db.js');

const leaderboardRoutes = require('./routes/leaderboard.js');
const playerRoutes = require('./routes/player.js');
const matchRoutes = require('./routes/matches.js');
const adminRoutes = require('./routes/admin.js');
const authRoutes = require('./routes/auth.js');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    stages: {
      STAGE_1: { label: 'Stage 1', color: '#2979FF', weeks: [1, 2, 3, 4] },
      STAGE_2: { label: 'Stage 2', color: '#FF6D00', weeks: [5, 6, 7, 8] },
      STAGE_3: { label: 'Stage 3', color: '#FFD700', weeks: [9] },
    },
    prizes: {
      weekly: { 1: 700, 2: 300 },
      stage: { 1: 2500, 2: 1500, 3: 1000 },
      overall: { 1: 9000, 2: 5000, 3: 3500, 4: 2500, 5: 1500 },
    },
    teams: [
      { abbr: 'CSK', name: 'Chennai Super Kings', color: '#FFD700' },
      { abbr: 'MI', name: 'Mumbai Indians', color: '#004BA0' },
      { abbr: 'RCB', name: 'Royal Challengers Bengaluru', color: '#D4213D' },
      { abbr: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D' },
      { abbr: 'DC', name: 'Delhi Capitals', color: '#004C93' },
      { abbr: 'SRH', name: 'Sunrisers Hyderabad', color: '#FF822A' },
      { abbr: 'PBKS', name: 'Punjab Kings', color: '#ED1B24' },
      { abbr: 'RR', name: 'Rajasthan Royals', color: '#254AA5' },
      { abbr: 'GT', name: 'Gujarat Titans', color: '#1C1C2B' },
      { abbr: 'LSG', name: 'Lucknow Super Giants', color: '#A72056' },
    ],
  });
});

app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`ILL Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
