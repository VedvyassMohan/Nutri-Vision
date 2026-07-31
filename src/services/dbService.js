const API_BASE = 'http://localhost:5000/api';
const DATA_PREFIX = 'nutrivision_data_';

function getToday() {
  return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function getDefaultData() {
  return {
    meals: {},
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastLoginDate: null,
      loginHistory: []
    },
    water: {},
    stats: {
      totalMealsLogged: 0,
      totalCaloriesConsumed: 0
    }
  };
}

export const dbService = {
  // ─── Core Storage ──────────────────────────────────────────────

  getUserData(userId) {
    const raw = localStorage.getItem(DATA_PREFIX + userId);
    if (!raw) return getDefaultData();
    try {
      const parsed = JSON.parse(raw);
      return { ...getDefaultData(), ...parsed };
    } catch {
      return getDefaultData();
    }
  },

  saveUserData(userId, data) {
    localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
  },

  // ─── Streak Tracking ───────────────────────────────────────

  async recordLogin(userId) {
    const data = this.getUserData(userId);
    const today = getToday();

    // Async sync with SQL backend database
    try {
      const res = await fetch(`${API_BASE}/streak/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const json = await res.json();
        data.streak.currentStreak = json.currentStreak;
        data.streak.longestStreak = json.longestStreak;
        data.streak.lastLoginDate = today;
        data.streak.loginHistory = json.loginHistory;
        this.saveUserData(userId, data);
        return data;
      }
    } catch (err) {
      console.warn('SQL Backend sync note:', err.message);
    }

    // Local fallback
    if (data.streak.lastLoginDate === today) return data;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.streak.lastLoginDate === yesterdayStr) {
      data.streak.currentStreak += 1;
    } else {
      data.streak.currentStreak = 1;
    }

    if (data.streak.currentStreak > data.streak.longestStreak) {
      data.streak.longestStreak = data.streak.currentStreak;
    }

    if (!data.streak.loginHistory.includes(today)) {
      data.streak.loginHistory.push(today);
    }

    data.streak.lastLoginDate = today;
    this.saveUserData(userId, data);
    return data;
  },

  getStreak(userId) {
    const data = this.getUserData(userId);
    const { currentStreak, longestStreak, loginHistory } = data.streak;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);

    const weekDays = [];
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
  },

  // ─── Meals ─────────────────────────────────────────────────

  async addMeal(userId, meal) {
    const data = this.getUserData(userId);
    const today = getToday();

    if (!data.meals[today]) {
      data.meals[today] = [];
    }

    const mealEntry = {
      ...meal,
      id: meal.id || Date.now(),
      createdAt: new Date().toISOString()
    };

    data.meals[today].unshift(mealEntry);
    data.stats.totalMealsLogged += 1;
    data.stats.totalCaloriesConsumed += (meal.cal || 0);

    this.saveUserData(userId, data);

    // Sync to SQL database
    try {
      await fetch(`${API_BASE}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, meal: mealEntry })
      });
    } catch (err) {
      console.warn('SQL Meal Sync note:', err.message);
    }

    return mealEntry;
  },

  async removeMeal(userId, mealId) {
    const data = this.getUserData(userId);
    const today = getToday();

    if (!data.meals[today]) return;

    const mealIndex = data.meals[today].findIndex(m => String(m.id) === String(mealId));
    if (mealIndex !== -1) {
      const removed = data.meals[today][mealIndex];
      data.meals[today].splice(mealIndex, 1);

      data.stats.totalMealsLogged = Math.max(0, data.stats.totalMealsLogged - 1);
      data.stats.totalCaloriesConsumed = Math.max(0, data.stats.totalCaloriesConsumed - (removed.cal || 0));
    }

    this.saveUserData(userId, data);

    // Sync deletion to SQL database
    try {
      await fetch(`${API_BASE}/meals/${userId}/${mealId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('SQL Meal Delete sync note:', err.message);
    }
  },

  getTodaysMeals(userId) {
    const data = this.getUserData(userId);
    const today = getToday();
    return data.meals[today] || [];
  },

  getTodaysMacros(userId) {
    const meals = this.getTodaysMeals(userId);
    const raw = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.cal || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return {
      calories: Math.round(raw.calories),
      protein: Math.round(raw.protein * 100) / 100,
      carbs: Math.round(raw.carbs * 100) / 100,
      fat: Math.round(raw.fat * 100) / 100
    };
  },

  // ─── Water ─────────────────────────────────────────────────

  getWater(userId) {
    const data = this.getUserData(userId);
    const today = getToday();
    if (!data.water[today]) {
      data.water[today] = {
        glasses: 0,
        goal: 8,
        targetLiters: 2.0,
        timerEnabled: true,
        intervalMinutes: 25,
        completedCycles: 0,
        lastDrinkTime: null
      };
    }
    return data.water[today];
  },

  async setWater(userId, waterObj) {
    const data = this.getUserData(userId);
    const today = getToday();
    const updatedWater = {
      ...(data.water[today] || { glasses: 0, goal: 8, targetLiters: 2.0, timerEnabled: true, intervalMinutes: 25, completedCycles: 0 }),
      ...waterObj
    };
    data.water[today] = updatedWater;
    this.saveUserData(userId, data);

    // Sync with SQL Database
    try {
      await fetch(`${API_BASE}/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          glasses: updatedWater.glasses,
          goal: updatedWater.goal,
          targetLiters: updatedWater.targetLiters,
          timerEnabled: updatedWater.timerEnabled,
          intervalMinutes: updatedWater.intervalMinutes,
          completedCycles: updatedWater.completedCycles
        })
      });
    } catch (err) {
      console.warn('SQL Water Sync note:', err.message);
    }

    return updatedWater;
  },

  logGlass(userId, delta = 1) {
    const current = this.getWater(userId);
    const newGlasses = Math.max(0, current.glasses + delta);
    const goal = current.goal || 8;
    const completed = Math.floor(newGlasses / goal);
    
    return this.setWater(userId, {
      glasses: newGlasses,
      completedCycles: completed,
      lastDrinkTime: new Date().toISOString()
    });
  },

  // ─── Stats ─────────────────────────────────────────────────

  getStats(userId) {
    const data = this.getUserData(userId);
    const { longestStreak } = data.streak;
    const { totalMealsLogged, totalCaloriesConsumed } = data.stats;

    const daysWithMeals = Object.keys(data.meals).filter(
      day => data.meals[day] && data.meals[day].length > 0
    ).length;

    const avgCalories = daysWithMeals > 0
      ? Math.round(totalCaloriesConsumed / daysWithMeals)
      : 0;

    return {
      avgCalories,
      bestStreak: longestStreak,
      totalMealsLogged
    };
  }
};
