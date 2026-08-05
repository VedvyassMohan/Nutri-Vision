import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, Macros, WaterData, StreakData, WeekDay } from '../types';

const getMealsKey = (userId: string) => `@nutrivision_meals_${userId}`;
const getWaterKey = (userId: string) => `@nutrivision_water_${userId}`;
const getStreakKey = (userId: string) => `@nutrivision_streak_${userId}`;

export const asyncDbService = {
  async getTodaysMeals(userId: string): Promise<Meal[]> {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals: Meal[] = json ? JSON.parse(json) : [];
      const todayStr = new Date().toISOString().split('T')[0];
      return allMeals.filter(m => m.date === todayStr);
    } catch (e) {
      console.warn('Error reading meals:', e);
      return [];
    }
  },

  async getTodaysMacros(userId: string): Promise<Macros> {
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

  async addMeal(userId: string, meal: Omit<Meal, 'id' | 'date' | 'time'>): Promise<Meal | null> {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals: Meal[] = json ? JSON.parse(json) : [];
      const newMeal: Meal = {
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

  async removeMeal(userId: string, mealId: string): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals: Meal[] = json ? JSON.parse(json) : [];
      const updated = allMeals.filter(m => m.id !== mealId);
      await AsyncStorage.setItem(getMealsKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.warn('Error removing meal:', e);
    }
  },

  async getWater(userId: string): Promise<WaterData> {
    try {
      const json = await AsyncStorage.getItem(getWaterKey(userId));
      const data: WaterData = json ? JSON.parse(json) : {};
      const todayStr = new Date().toISOString().split('T')[0];

      if (data.date !== todayStr) {
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

  async setWater(userId: string, updates: Partial<WaterData>): Promise<WaterData | null> {
    try {
      const current = await this.getWater(userId);
      const updated: WaterData = { ...current, ...updates };
      await AsyncStorage.setItem(getWaterKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error saving water:', e);
      return null;
    }
  },

  async logGlass(userId: string, delta: number = 1): Promise<WaterData | null> {
    try {
      const current = await this.getWater(userId);
      const newCount = Math.max(0, (current.glasses || 0) + delta);
      const updated: WaterData = { ...current, glasses: newCount };
      await AsyncStorage.setItem(getWaterKey(userId), JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('Error logging glass:', e);
      return null;
    }
  },

  async recordLogin(userId: string): Promise<{ currentStreak: number }> {
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
      return { currentStreak: streak.currentStreak || 1 };
    } catch (e) {
      return { currentStreak: 1 };
    }
  },

  async getStreak(userId: string): Promise<StreakData> {
    try {
      const json = await AsyncStorage.getItem(getStreakKey(userId));
      const streak = json ? JSON.parse(json) : { currentStreak: 1, history: [] };

      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      const currentDayIdx = (now.getDay() + 6) % 7;

      const weekDays: WeekDay[] = daysOfWeek.map((label, idx) => {
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

  async getStats(userId: string): Promise<{ avgCalories: number; bestStreak: number; totalMealsLogged: number }> {
    try {
      const mealsJson = await AsyncStorage.getItem(getMealsKey(userId));
      const allMeals: Meal[] = mealsJson ? JSON.parse(mealsJson) : [];
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
