import express from 'express';
import cors from 'cors';
import * as db from './excelDb.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for base64 images

// ─── Helper ──────────────────────────────────────────────────

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function sanitizeUser(user) {
  // Remove password from response
  const { password, ...safe } = user;
  return safe;
}

// ─── Auth ────────────────────────────────────────────────────

app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const newUser = db.createUser(req.body);
    db.recordLogin(newUser.id);

    res.status(201).json(sanitizeUser(newUser));
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    db.recordLogin(user.id);
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Users ───────────────────────────────────────────────────

app.put('/api/users/:id', (req, res) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Streak ──────────────────────────────────────────────────

app.post('/api/users/:id/login', (req, res) => {
  try {
    db.recordLogin(req.params.id);
    const streak = db.getStreakInfo(req.params.id);
    res.json(streak);
  } catch (err) {
    console.error('Record login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id/streak', (req, res) => {
  try {
    const streak = db.getStreakInfo(req.params.id);
    res.json(streak);
  } catch (err) {
    console.error('Get streak error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Meals ───────────────────────────────────────────────────

app.get('/api/users/:id/meals', (req, res) => {
  try {
    const date = req.query.date || getToday();
    const meals = db.getMealsByDate(req.params.id, date);
    res.json(meals);
  } catch (err) {
    console.error('Get meals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/:id/meals', (req, res) => {
  try {
    const meal = db.addMeal(req.params.id, req.body);
    res.status(201).json(meal);
  } catch (err) {
    console.error('Add meal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id/meals/:mealId', (req, res) => {
  try {
    db.removeMeal(req.params.id, req.params.mealId);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove meal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Macros ──────────────────────────────────────────────────

app.get('/api/users/:id/macros', (req, res) => {
  try {
    const date = req.query.date || getToday();
    const macros = db.getMacrosByDate(req.params.id, date);
    res.json(macros);
  } catch (err) {
    console.error('Get macros error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Water ───────────────────────────────────────────────────

app.get('/api/users/:id/water', (req, res) => {
  try {
    const date = req.query.date || getToday();
    const water = db.getWater(req.params.id, date);
    res.json(water);
  } catch (err) {
    console.error('Get water error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id/water', (req, res) => {
  try {
    const date = req.query.date || getToday();
    db.setWater(req.params.id, date, req.body.glasses);
    res.json({ success: true });
  } catch (err) {
    console.error('Set water error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Stats ───────────────────────────────────────────────────

app.get('/api/users/:id/stats', (req, res) => {
  try {
    const stats = db.getStats(req.params.id);
    res.json(stats);
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Start ───────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  🍎 Nutri Vision API Server`);
  console.log(`  ➜  Running on: http://localhost:${PORT}`);
  console.log(`  ➜  Excel file: server/data.xlsx\n`);
});
