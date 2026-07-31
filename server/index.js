import express from 'express';
import cors from 'cors';
import { query } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// ─── AUTH & USER ENDPOINTS ───────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, id } = req.body;
    let user = null;

    if (id) {
      user = await query.get('SELECT * FROM users WHERE id = ?', [id]);
    } else if (email) {
      user = await query.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    if (!user) {
      // Auto register demo user if initial setup
      const newId = id || 'usr_' + Date.now();
      const name = email ? email.split('@')[0] : 'Demo User';
      await query.run(
        `INSERT INTO users (id, name, email, password, height, weight, gender, activity_level, goal_type, calorie_goal, protein_goal, carbs_goal, fat_goal, dark_mode) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, name, email || 'user@nutrivision.com', password || '123456', 170, 70, 'male', 'moderate', 'maintain', 2000, 150, 200, 65, 0]
      );
      user = await query.get('SELECT * FROM users WHERE id = ?', [newId]);
    }

    // Format boolean / numbers
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      age: user.age || 25,
      height: user.height || 170,
      weight: user.weight || 70,
      gender: user.gender || 'male',
      activityLevel: user.activity_level || 'moderate',
      goalType: user.goal_type || 'maintain',
      calorieGoal: user.calorie_goal || 2000,
      proteinGoal: user.protein_goal || 150,
      carbsGoal: user.carbs_goal || 200,
      fatGoal: user.fat_goal || 65,
      darkMode: Boolean(user.dark_mode)
    };

    res.json({ success: true, user: formattedUser });
  } catch (err) {
    console.error('SQL Auth Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/goals', async (req, res) => {
  try {
    const { userId, calorieGoal, proteinGoal, carbsGoal, fatGoal, weight, height, age, gender, activityLevel, darkMode } = req.body;
    
    await query.run(
      `UPDATE users SET 
        calorie_goal = COALESCE(?, calorie_goal),
        protein_goal = COALESCE(?, protein_goal),
        carbs_goal = COALESCE(?, carbs_goal),
        fat_goal = COALESCE(?, fat_goal),
        weight = COALESCE(?, weight),
        height = COALESCE(?, height),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        activity_level = COALESCE(?, activity_level),
        dark_mode = COALESCE(?, dark_mode)
       WHERE id = ?`,
      [calorieGoal, proteinGoal, carbsGoal, fatGoal, weight, height, age, gender, activityLevel, darkMode ? 1 : 0, userId]
    );

    const updatedRow = await query.get('SELECT * FROM users WHERE id = ?', [userId]);
    res.json({ success: true, user: updatedRow });
  } catch (err) {
    console.error('SQL Goals Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── MEALS ENDPOINTS ─────────────────────────────────────────────

app.get('/api/meals/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = getToday();
    const rows = await query.all('SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at DESC', [userId, today]);
    
    const meals = rows.map(r => ({
      id: r.id,
      name: r.name,
      cal: r.cal,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      emoji: r.emoji,
      image: r.image,
      date: r.date,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    res.json({ success: true, meals });
  } catch (err) {
    console.error('SQL Meals Get Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/meals', async (req, res) => {
  try {
    const { userId, meal } = req.body;
    const today = getToday();
    const mealId = meal.id ? String(meal.id) : 'meal_' + Date.now();

    await query.run(
      `INSERT INTO meals (id, user_id, name, cal, protein, carbs, fat, emoji, image, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mealId, userId, meal.name, meal.cal || 0, meal.protein || 0, meal.carbs || 0, meal.fat || 0, meal.emoji || '🍽️', meal.image || null, today]
    );

    res.json({ success: true, mealId });
  } catch (err) {
    console.error('SQL Meal Add Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meals/:userId/:mealId', async (req, res) => {
  try {
    const { userId, mealId } = req.params;
    await query.run('DELETE FROM meals WHERE user_id = ? AND id = ?', [userId, mealId]);
    res.json({ success: true });
  } catch (err) {
    console.error('SQL Meal Delete Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── WATER ENDPOINTS ─────────────────────────────────────────────

app.get('/api/water/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = getToday();
    let row = await query.get('SELECT * FROM water WHERE user_id = ? AND date = ?', [userId, today]);

    if (!row) {
      await query.run(
        `INSERT OR IGNORE INTO water (user_id, date, glasses, goal, target_liters, timer_enabled, interval_minutes, completed_cycles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, today, 0, 8, 2.0, 1, 25, 0]
      );
      row = await query.get('SELECT * FROM water WHERE user_id = ? AND date = ?', [userId, today]);
    }

    res.json({
      success: true,
      water: {
        glasses: row.glasses,
        goal: row.goal,
        targetLiters: row.target_liters,
        timerEnabled: Boolean(row.timer_enabled),
        intervalMinutes: row.interval_minutes,
        completedCycles: row.completed_cycles
      }
    });
  } catch (err) {
    console.error('SQL Water Get Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/water', async (req, res) => {
  try {
    const { userId, glasses, goal, targetLiters, timerEnabled, intervalMinutes, completedCycles } = req.body;
    const today = getToday();

    await query.run(
      `INSERT INTO water (user_id, date, glasses, goal, target_liters, timer_enabled, interval_minutes, completed_cycles)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
        glasses = COALESCE(excluded.glasses, glasses),
        goal = COALESCE(excluded.goal, goal),
        target_liters = COALESCE(excluded.target_liters, target_liters),
        timer_enabled = COALESCE(excluded.timer_enabled, timer_enabled),
        interval_minutes = COALESCE(excluded.interval_minutes, interval_minutes),
        completed_cycles = COALESCE(excluded.completed_cycles, completed_cycles)`,
      [userId, today, glasses, goal, targetLiters, timerEnabled !== undefined ? (timerEnabled ? 1 : 0) : 1, intervalMinutes, completedCycles]
    );

    const row = await query.get('SELECT * FROM water WHERE user_id = ? AND date = ?', [userId, today]);
    res.json({
      success: true,
      water: {
        glasses: row.glasses,
        goal: row.goal,
        targetLiters: row.target_liters,
        timerEnabled: Boolean(row.timer_enabled),
        intervalMinutes: row.interval_minutes,
        completedCycles: row.completed_cycles
      }
    });
  } catch (err) {
    console.error('SQL Water Post Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── STREAKS ENDPOINTS ───────────────────────────────────────────

app.post('/api/streak/login', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = getToday();
    let streak = await query.get('SELECT * FROM streaks WHERE user_id = ?', [userId]);

    let currentStreak = 1;
    let longestStreak = 1;
    let loginHistory = [today];

    if (streak) {
      loginHistory = JSON.parse(streak.login_history || '[]');
      if (streak.last_login_date === today) {
        // Already recorded today
        currentStreak = streak.current_streak;
        longestStreak = streak.longest_streak;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (streak.last_login_date === yesterdayStr) {
          currentStreak = streak.current_streak + 1;
        } else {
          currentStreak = 1;
        }

        longestStreak = Math.max(streak.longest_streak, currentStreak);
        if (!loginHistory.includes(today)) {
          loginHistory.push(today);
        }
        if (loginHistory.length > 30) {
          loginHistory = loginHistory.slice(-30);
        }

        await query.run(
          `UPDATE streaks SET current_streak = ?, longest_streak = ?, last_login_date = ?, login_history = ? WHERE user_id = ?`,
          [currentStreak, longestStreak, today, JSON.stringify(loginHistory), userId]
        );
      }
    } else {
      await query.run(
        `INSERT INTO streaks (user_id, current_streak, longest_streak, last_login_date, login_history)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, 1, 1, today, JSON.stringify([today])]
      );
    }

    res.json({ success: true, currentStreak, longestStreak, loginHistory });
  } catch (err) {
    console.error('SQL Streak Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Nutri-Vision SQL Backend API Server running on http://localhost:${PORT}`);
});
