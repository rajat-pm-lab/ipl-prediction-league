const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const defaultData = {
  users: [
    { id: 1, name: 'Aditya', email: 'aditya@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'GRIEVANCE', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 2, name: 'Aman', email: 'aman@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 3, name: 'Deepanshu', email: 'deepanshu@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 4, name: 'Rajjo', email: 'rajjo@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 5, name: 'Shan', email: 'shan@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'AUDIT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 6, name: 'Shivek', email: 'shivek@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 7, name: 'Shubham', email: 'shubham@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'AUDIT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 8, name: 'Sudarshan', email: 'sudarshan@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 9, name: 'Suyash', email: 'suyash@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 10, name: 'Tushar', email: 'tushar@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 11, name: 'Utkarsh', email: 'utkarsh@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'PARTICIPANT', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 12, name: 'Vikrant', email: 'vikrant@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'ADMIN', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
    { id: 13, name: 'Vipul', email: 'vipul@example.com', password: '$2a$10$NRwFYUEK/nN.T0Vbnt0lMuNZOYr13fIP.jx/mmh4EApMXM8DsCVde', role: 'FINANCE', avatarUrl: null, paymentStatus: 'PENDING', createdAt: new Date().toISOString() },
  ],
  matches: [],
  predictions: [],
  weeklyResults: [],
  scoreOverrides: [],
  weeks: [],
  nextId: { user: 14, match: 1, prediction: 1, weekResult: 1, override: 1 }
};

function initDB() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_PATH)) {
    const matches = generateMatchSchedule();
    const weeks = generateWeeks();
    const data = { ...defaultData, matches, weeks };
    saveDB(data);
    console.log('Database initialized with seed data');
  }
}

function generateWeeks() {
  const weeks = [];
  const stages = { 1: 'STAGE_1', 2: 'STAGE_1', 3: 'STAGE_1', 4: 'STAGE_1', 5: 'STAGE_2', 6: 'STAGE_2', 7: 'STAGE_2', 8: 'STAGE_2', 9: 'STAGE_3' };
  
  for (let i = 1; i <= 9; i++) {
    const baseDate = new Date(2026, 2, 22);
    baseDate.setDate(baseDate.getDate() + (i - 1) * 7);
    const startDate = baseDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const deadline = new Date(startDate);
    deadline.setHours(14, 0, 0, 0);
    
    weeks.push({
      id: i,
      weekNumber: i,
      stage: stages[i],
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      submissionDeadline: deadline.toISOString(),
      isActive: i === 1
    });
  }
  return weeks;
}

function generateMatchSchedule() {
  const matches = [];
  const teamPairs = [
    ['KKR', 'RCB'], ['CSK', 'MI'], ['DC', 'PBKS'], ['GT', 'SRH'], ['LSG', 'RR'],
    ['MI', 'KKR'], ['RCB', 'CSK'], ['SRH', 'DC'], ['PBKS', 'GT'], ['RR', 'LSG'],
    ['MI', 'RCB'], ['KKR', 'CSK'], ['DC', 'GT'], ['SRH', 'RR'], ['LSG', 'PBKS'],
    ['RCB', 'DC'], ['CSK', 'MI'], ['RCB', 'KKR'], ['DC', 'SRH'], ['GT', 'LSG'],
    ['PBKS', 'RR'], ['MI', 'RCB'], ['SRH', 'CSK'], ['KKR', 'DC'], ['RR', 'GT'],
    ['LSG', 'MI'], ['CSK', 'PBKS'], ['RCB', 'SRH'], ['KKR', 'LSG'], ['DC', 'RR'],
    ['GT', 'MI'], ['RR', 'RCB'], ['CSK', 'DC'], ['PBKS', 'KKR'], ['LSG', 'SRH'],
    ['MI', 'GT'], ['RCB', 'PBKS'], ['KKR', 'RR'], ['DC', 'CSK'], ['SRH', 'LSG'],
    ['RR', 'MI'], ['PBKS', 'SRH'], ['GT', 'DC'], ['CSK', 'RR'], ['LSG', 'RCB'],
    ['SRH', 'MI'], ['RCB', 'GT'], ['KKR', 'PBKS'], ['DC', 'LSG'], ['CSK', 'SRH'],
    ['MI', 'RR'], ['PBKS', 'RCB'], ['GT', 'KKR'], ['CSK', 'LSG'], ['DC', 'PBKS'],
    ['SRH', 'RCB'], ['RR', 'KKR'], ['MI', 'PBKS'], ['LSG', 'CSK'], ['GT', 'SRH'],
    ['RCB', 'MI'], ['KKR', 'GT'], ['CSK', 'LSG'], ['DC', 'PBKS'], ['SRH', 'RCB'],
    ['RR', 'KKR'], ['MI', 'PBKS'], ['LSG', 'CSK'], ['GT', 'SRH'],
  ];
  
  const stages = { 1: 'STAGE_1', 2: 'STAGE_1', 3: 'STAGE_1', 4: 'STAGE_1', 5: 'STAGE_2', 6: 'STAGE_2', 7: 'STAGE_2', 8: 'STAGE_2', 9: 'STAGE_3' };
  let matchNum = 1;
  
  for (let week = 1; week <= 9; week++) {
    const matchesThisWeek = week === 9 ? 4 : (week === 4 || week === 8 ? 8 : 9);
    const baseDate = new Date(2026, 2, 22);
    baseDate.setDate(baseDate.getDate() + (week - 1) * 7);
    
    for (let i = 0; i < matchesThisWeek && matchNum <= 74; i++) {
      const [home, away] = teamPairs[matchNum - 1] || ['TBD', 'TBD'];
      const matchDate = new Date(baseDate);
      matchDate.setDate(matchDate.getDate() + Math.floor(i / 2));
      matchDate.setHours(i % 2 === 0 ? 15 : 19, 30, 0, 0);
      
      matches.push({
        id: matchNum,
        matchNumber: matchNum,
        teamHome: home,
        teamAway: away,
        venue: 'IPL 2026',
        dateTime: matchDate.toISOString(),
        weekNumber: week,
        stage: stages[week],
        result: 'PENDING',
        winner: null,
        createdAt: new Date().toISOString()
      });
      matchNum++;
    }
  }
  
  return matches;
}

function loadDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    initDB();
    return loadDB();
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const db = {
  users: {
    findMany: () => loadDB().users,
    findUnique: (id) => loadDB().users.find(u => u.id === id),
    findFirst: (query) => {
      const users = loadDB().users;
      if (query && query.where && query.where.email) return users.find(u => u.email === query.where.email);
      if (query && query.where && query.where.name) return users.find(u => u.name.toLowerCase() === query.where.name.toLowerCase());
      return null;
    },
    create: (data) => {
      const dbData = loadDB();
      const user = { ...data.data, id: dbData.nextId.user++ };
      dbData.users.push(user);
      saveDB(dbData);
      return user;
    },
    update: (id, data) => {
      const dbData = loadDB();
      const idx = dbData.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        dbData.users[idx] = { ...dbData.users[idx], ...data };
        saveDB(dbData);
        return dbData.users[idx];
      }
      return null;
    }
  },
  matches: {
    findMany: (query = {}) => {
      const dbData = loadDB();
      let matches = dbData.matches;
      if (query && query.where && query.where.weekNumber) matches = matches.filter(m => m.weekNumber === query.where.weekNumber);
      if (query && query.orderBy) matches.sort((a, b) => a.matchNumber - b.matchNumber);
      return matches;
    },
    findUnique: (id) => loadDB().matches.find(m => m.id === id || m.matchNumber === id),
    update: (id, data) => {
      const dbData = loadDB();
      const idx = dbData.matches.findIndex(m => m.id === id);
      if (idx !== -1) {
        dbData.matches[idx] = { ...dbData.matches[idx], ...data };
        saveDB(dbData);
        return dbData.matches[idx];
      }
      return null;
    },
    upsert: (matchNumber, data) => {
      const dbData = loadDB();
      const idx = dbData.matches.findIndex(m => m.matchNumber === matchNumber);
      if (idx !== -1) {
        dbData.matches[idx] = { ...dbData.matches[idx], ...data };
        saveDB(dbData);
        return dbData.matches[idx];
      } else {
        const match = { ...data, id: dbData.nextId.match++, matchNumber };
        dbData.matches.push(match);
        saveDB(dbData);
        return match;
      }
    }
  },
  predictions: {
    findMany: (query = {}) => {
      const dbData = loadDB();
      let predictions = dbData.predictions;
      if (query && query.where && query.where.userId) predictions = predictions.filter(p => p.userId === query.where.userId);
      if (query && query.where && query.where.matchId) predictions = predictions.filter(p => p.matchId === query.where.matchId);
      return predictions;
    },
    findUnique: (userId, matchId) => loadDB().predictions.find(p => p.userId === userId && p.matchId === matchId),
    upsert: (userId, matchId, createData, updateData) => {
      const dbData = loadDB();
      const idx = dbData.predictions.findIndex(p => p.userId === userId && p.matchId === matchId);
      if (idx !== -1) {
        dbData.predictions[idx] = { ...dbData.predictions[idx], ...updateData };
        saveDB(dbData);
        return dbData.predictions[idx];
      } else {
        const prediction = { ...createData, id: dbData.nextId.prediction++, userId, matchId };
        dbData.predictions.push(prediction);
        saveDB(dbData);
        return prediction;
      }
    },
    update: (id, data) => {
      const dbData = loadDB();
      const idx = dbData.predictions.findIndex(p => p.id === id);
      if (idx !== -1) {
        dbData.predictions[idx] = { ...dbData.predictions[idx], ...data };
        saveDB(dbData);
        return dbData.predictions[idx];
      }
      return null;
    }
  },
  weeks: {
    findMany: () => loadDB().weeks.sort((a, b) => a.weekNumber - b.weekNumber),
    findUnique: (weekNumber) => loadDB().weeks.find(w => w.weekNumber === weekNumber)
  },
  weeklyResults: {
    findMany: (query = {}) => {
      const dbData = loadDB();
      let results = dbData.weeklyResults;
      if (query && query.where && query.where.weekId) results = results.filter(r => r.weekId === query.where.weekId);
      if (query && query.where && query.where.userId) results = results.filter(r => r.userId === query.where.userId);
      return results;
    },
    upsert: (weekId, userId, createData) => {
      const dbData = loadDB();
      const idx = dbData.weeklyResults.findIndex(r => r.weekId === weekId && r.userId === userId);
      if (idx !== -1) {
        dbData.weeklyResults[idx] = { ...dbData.weeklyResults[idx], ...createData };
        saveDB(dbData);
        return dbData.weeklyResults[idx];
      } else {
        const result = { ...createData, id: dbData.nextId.weekResult++, weekId, userId };
        dbData.weeklyResults.push(result);
        saveDB(dbData);
        return result;
      }
    },
    update: (id, data) => {
      const dbData = loadDB();
      const idx = dbData.weeklyResults.findIndex(r => r.id === id);
      if (idx !== -1) {
        dbData.weeklyResults[idx] = { ...dbData.weeklyResults[idx], ...data };
        saveDB(dbData);
        return dbData.weeklyResults[idx];
      }
      return null;
    }
  },
  scoreOverrides: {
    findMany: () => loadDB().scoreOverrides,
    create: (data) => {
      const dbData = loadDB();
      const override = { ...data, id: dbData.nextId.override++ };
      dbData.scoreOverrides.push(override);
      saveDB(dbData);
      return override;
    }
  }
};

module.exports = db;
