import AsyncStorage from '@react-native-async-storage/async-storage';

const getMealsKey = (userId) => `@nutrivision_meals_${userId}`;
const getWaterKey = (userId) => `@nutrivision_water_${userId}`;
const getStreakKey = (userId) => `@nutrivision_streak_${userId}`;

export const asyncDbService = {
  // ── Meals & Macros ────────────────────────────────────────────────────────
  async getTodaysMeals(userId) {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals = json ? JSON.parse(json) : [];
      const todayStr = new Date().toISOString().split('T')[0];
      return allMeals.filter(m => m.date === todayStr);
    } catch (e) {
      console.warn('Error reading meals:', e);
      return [];
    }
  },

  async getTodaysMacros(userId) {
    try {
      const meals = await this.getTodaysMeals(userId);
      return meals.reduce((acc, m) => ({
        calories: acc.calories + (m.cal || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (e) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
  },

  async addMeal(userId, meal) {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals = json ? JSON.parse(json) : [];
      const newMeal = {
        id: 'meal_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...meal
      };
      allMeals.unshift(newMeal);
      await AsyncStorage.setItem(getMealsKey(userId), JSON.stringify(allMeals));
      return newMeal;
    } catch (e) {
      console.warn('Error adding meal:', e);
      return null;
    }
  },

  async removeMeal(userId, mealId) {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals = json ? JSON.parse(json) : [];
      const updated = allMeals.filter(m => m.id !== mealId);
      await AsyncStorage.setItem(getMealsKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.warn('Error removing meal:', e);
    }
  },

  // ── Water Cycle Tracker ───────────────────────────────────────────────────
  async getWater(userId) {
    try {
      const json = await AsyncStorage.getItem(getWaterKey(userId));
      const data = json ? JSON.parse(json) : {};
      const todayStr = new Date().toISOString().split('T')[0];

      if (data.date !== todayStr) {
        // Reset glasses count for a new day
        return {
          date: todayStr,
          glasses: 0,
          goal: data.goal || 8,
          targetLiters: data.targetLiters || 2.0,
          timerEnabled: data.timerEnabled !== undefined ? data.timerEnabled : true,
          intervalMinutes: data.intervalMinutes || 25
        };
      }
      return data;
    } catch (e) {
      return { glasses: 0, goal: 8, targetLiters: 2.0, timerEnabled: true, intervalMinutes: 25 };
    }
  },

  async setWater(userId, updates) {
    try {
      const current = await this.getWater(userId);
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(getWaterKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error saving water:', e);
      return null;
    }
  },

  async logGlass(userId, delta = 1) {
    try {
      const current = await this.getWater(userId);
      const newCount = Math.max(0, (current.glasses || 0) + delta);
      const updated = { ...current, glasses: newCount };
      await AsyncStorage.setItem(getWaterKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error logging glass:', e);
      return null;
    }
  },

  // ── Login Streaks ─────────────────────────────────────────────────────────
  async recordLogin(userId) {
    try {
      const json = await AsyncStorage.getItem(getStreakKey(userId));
      let streak = json ? JSON.parse(json) : { currentStreak: 1, lastLoginDate: '', history: [] };
      const todayStr = new Date().toISOString().split('T')[0];

      if (streak.lastLoginDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yestStr = yesterday.toISOString().split('T')[0];

        if (streak.lastLoginDate === yestStr) {
          streak.currentStreak += 1;
        } else if (streak.lastLoginDate !== todayStr) {
          streak.currentStreak = 1;
        }

        streak.lastLoginDate = todayStr;
        if (!streak.history.includes(todayStr)) {
          streak.history.push(todayStr);
        }

        await AsyncStorage.setItem(getStreakKey(userId), JSON.stringify(streak));
      }
      return streak;
    } catch (e) {
      console.warn('Error recording login streak:', e);
      return { currentStreak: 1 };
    }
  },

  async getStreak(userId) {
    try {
      const json = await AsyncStorage.getItem(getStreakKey(userId));
      const streak = json ? JSON.parse(json) : { currentStreak: 1, history: [] };

      // Build weekDays Array [Mon..Sun]
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      const currentDayIdx = (now.getDay() + 6) % 7; // Mon=0 .. Sun=6

      const weekDays = daysOfWeek.map((label, idx) => {
        const diff = idx - currentDayIdx;
        const d = new Date();
        d.setDate(now.getDate() + diff);
        const dateStr = d.toISOString().split('T')[0];
        const active = streak.history ? streak.history.includes(dateStr) : false;
        return { label, active };
      });

      return {
        currentStreak: streak.currentStreak || 1,
        weekDays
      };
    } catch (e) {
      return { currentStreak: 1, weekDays: [] };
    }
  },

  async getStats(userId) {
    try {
      const mealsJson = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals = mealsJson ? JSON.parse(mealsJson) : [];
      const streak = await this.getStreak(userId);

      const totalMealsLogged = allMeals.length;
      const totalCals = allMeals.reduce((sum, m) => sum + (m.cal || 0), 0);
      const uniqueDays = new Set(allMeals.map(m => m.date)).size || 1;
      const avgCalories = Math.round(totalCals / uniqueDays);

      return {
        avgCalories,
        bestStreak: Math.max(streak.currentStreak || 1, 1),
        totalMealsLogged
      };
    } catch (e) {
      return { avgCalories: 0, bestStreak: 1, totalMealsLogged: 0 };
    }
  }
};
