import XLSX from 'xlsx';
import { existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, 'data.xlsx');

// ─── Sheet Definitions ──────────────────────────────────────

const SHEETS = {
  Users: ['id', 'name', 'email', 'password', 'height', 'weight', 'age', 'gender', 'goal', 'calorieGoal', 'proteinGoal', 'fatGoal', 'carbsGoal', 'darkMode', 'photo', 'createdAt'],
  Meals: ['id', 'userId', 'name', 'cal', 'protein', 'carbs', 'fat', 'time', 'emoji', 'image', 'date', 'createdAt'],
  Streaks: ['userId', 'currentStreak', 'longestStreak', 'lastLoginDate', 'loginHistory'],
  Water: ['userId', 'date', 'glasses', 'goal']
};

// ─── Core Read / Write ───────────────────────────────────────

function ensureFile() {
  if (!existsSync(DATA_FILE)) {
    const wb = XLSX.utils.book_new();
    for (const [sheetName, headers] of Object.entries(SHEETS)) {
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
    XLSX.writeFile(wb, DATA_FILE);
  }
}

function readWorkbook() {
  ensureFile();
  return XLSX.readFile(DATA_FILE);
}

function saveWorkbook(wb) {
  XLSX.writeFile(wb, DATA_FILE);
}

function getSheetData(sheetName) {
  const wb = readWorkbook();
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return data;
}

function writeSheet(wb, sheetName, data) {
  const headers = SHEETS[sheetName];
  // Ensure all rows have all columns (even if empty)
  const cleanData = data.map(row => {
    const clean = {};
    for (const h of headers) {
      clean[h] = row[h] !== undefined ? row[h] : '';
    }
    return clean;
  });
  const ws = XLSX.utils.json_to_sheet(cleanData, { header: headers });
  wb.Sheets[sheetName] = ws;
}

// ─── Users ───────────────────────────────────────────────────

export function getUsers() {
  return getSheetData('Users');
}

export function getUserById(id) {
  const users = getUsers();
  return users.find(u => String(u.id) === String(id)) || null;
}

export function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
}

export function createUser(userData) {
  const wb = readWorkbook();
  const users = getSheetData('Users');

  const newUser = {
    id: Date.now().toString(),
    name: userData.name || '',
    email: userData.email || '',
    password: userData.password || '',
    height: userData.height || '',
    weight: userData.weight || '',
    age: userData.age || '',
    gender: userData.gender || '',
    goal: userData.goal || '',
    calorieGoal: userData.calorieGoal || '',
    proteinGoal: userData.proteinGoal || '',
    fatGoal: userData.fatGoal || '',
    carbsGoal: userData.carbsGoal || '',
    darkMode: userData.darkMode || false,
    photo: userData.photo || '',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeSheet(wb, 'Users', users);
  saveWorkbook(wb);
  return newUser;
}

export function updateUser(id, updatedData) {
  const wb = readWorkbook();
  const users = getSheetData('Users');
  const idx = users.findIndex(u => String(u.id) === String(id));
  if (idx === -1) return null;

  // Merge updates
  for (const [key, val] of Object.entries(updatedData)) {
    if (key !== 'id' && SHEETS.Users.includes(key)) {
      users[idx][key] = val;
    }
  }

  writeSheet(wb, 'Users', users);
  saveWorkbook(wb);
  return users[idx];
}

// ─── Streaks ─────────────────────────────────────────────────

function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getStreakData(userId) {
  const streaks = getSheetData('Streaks');
  const row = streaks.find(s => String(s.userId) === String(userId));
  if (!row) {
    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: '',
      loginHistory: ''
    };
  }
  return row;
}

export function recordLogin(userId) {
  const wb = readWorkbook();
  const streaks = getSheetData('Streaks');
  const today = getToday();

  let idx = streaks.findIndex(s => String(s.userId) === String(userId));

  if (idx === -1) {
    // First login ever
    streaks.push({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: today,
      loginHistory: today
    });
  } else {
    const row = streaks[idx];

    // Already recorded today
    if (row.lastLoginDate === today) {
      return row;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (row.lastLoginDate === yesterdayStr) {
      row.currentStreak = (parseInt(row.currentStreak) || 0) + 1;
    } else {
      row.currentStreak = 1;
    }

    if (row.currentStreak > (parseInt(row.longestStreak) || 0)) {
      row.longestStreak = row.currentStreak;
    }

    // Append today to login history
    const history = row.loginHistory ? row.loginHistory.split(',') : [];
    if (!history.includes(today)) {
      history.push(today);
    }
    // Keep last 30
    while (history.length > 30) history.shift();
    row.loginHistory = history.join(',');
    row.lastLoginDate = today;

    streaks[idx] = row;
  }

  writeSheet(wb, 'Streaks', streaks);
  saveWorkbook(wb);
  return streaks.find(s => String(s.userId) === String(userId));
}

export function getStreakInfo(userId) {
  const raw = getStreakData(userId);
  const currentStreak = parseInt(raw.currentStreak) || 0;
  const longestStreak = parseInt(raw.longestStreak) || 0;
  const loginHistory = raw.loginHistory ? raw.loginHistory.split(',') : [];

  // Build Mon-Sun array for current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    weekDays.push({
      label: dayLabels[i],
      date: dateStr,
      active: loginHistory.includes(dateStr)
    });
  }

  return { currentStreak, longestStreak, weekDays };
}

// ─── Meals ───────────────────────────────────────────────────

export function getMealsByDate(userId, date) {
  const meals = getSheetData('Meals');
  return meals.filter(m => String(m.userId) === String(userId) && m.date === date);
}

export function addMeal(userId, mealData) {
  const wb = readWorkbook();
  const meals = getSheetData('Meals');
  const today = getToday();

  const newMeal = {
    id: mealData.id || Date.now().toString(),
    userId,
    name: mealData.name || 'New Meal',
    cal: mealData.cal || 0,
    protein: mealData.protein || 0,
    carbs: mealData.carbs || 0,
    fat: mealData.fat || 0,
    time: mealData.time || 'Just Now',
    emoji: mealData.emoji || '🍽️',
    image: mealData.image || '',
    date: today,
    createdAt: new Date().toISOString()
  };

  meals.push(newMeal);
  writeSheet(wb, 'Meals', meals);
  saveWorkbook(wb);
  return newMeal;
}

export function removeMeal(userId, mealId) {
  const wb = readWorkbook();
  const meals = getSheetData('Meals');
  const filtered = meals.filter(m => !(String(m.userId) === String(userId) && String(m.id) === String(mealId)));

  writeSheet(wb, 'Meals', filtered);
  saveWorkbook(wb);
}

export function getMacrosByDate(userId, date) {
  const meals = getMealsByDate(userId, date);
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (parseFloat(m.cal) || 0),
      protein: acc.protein + (parseFloat(m.protein) || 0),
      carbs: acc.carbs + (parseFloat(m.carbs) || 0),
      fat: acc.fat + (parseFloat(m.fat) || 0)
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// ─── Water ───────────────────────────────────────────────────

export function getWater(userId, date) {
  const water = getSheetData('Water');
  const row = water.find(w => String(w.userId) === String(userId) && w.date === date);
  return row ? { glasses: parseInt(row.glasses) || 0, goal: parseInt(row.goal) || 8 } : { glasses: 0, goal: 8 };
}

export function setWater(userId, date, glasses) {
  const wb = readWorkbook();
  const water = getSheetData('Water');
  const idx = water.findIndex(w => String(w.userId) === String(userId) && w.date === date);

  if (idx === -1) {
    water.push({ userId, date, glasses, goal: 8 });
  } else {
    water[idx].glasses = glasses;
  }

  writeSheet(wb, 'Water', water);
  saveWorkbook(wb);
}

// ─── Stats ───────────────────────────────────────────────────

export function getStats(userId) {
  const meals = getSheetData('Meals').filter(m => String(m.userId) === String(userId));
  const streakRaw = getStreakData(userId);

  const totalMealsLogged = meals.length;
  const totalCalories = meals.reduce((sum, m) => sum + (parseFloat(m.cal) || 0), 0);

  // Unique days with meals
  const uniqueDays = new Set(meals.map(m => m.date)).size;
  const avgCalories = uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0;

  return {
    avgCalories,
    bestStreak: parseInt(streakRaw.longestStreak) || 0,
    totalMealsLogged
  };
}
