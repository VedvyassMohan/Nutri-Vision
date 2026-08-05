import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@nutrivision_user';
const USERS_LIST_KEY = '@nutrivision_users_db';

export const asyncAuthService = {
  async getCurrentUser() {
    try {
      const json = await AsyncStorage.getItem(USER_KEY);
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.warn('Error reading current user:', e);
      return null;
    }
  },

  async login(email, password) {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_LIST_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];
      const found = users.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!found) {
        throw new Error('Invalid email or password');
      }

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(found));
      return found;
    } catch (e) {
      throw e;
    }
  },

  async signup(name, email, password) {
    try {
      const usersJson = await AsyncStorage.getItem(USERS_LIST_KEY);
      const users = usersJson ? JSON.parse(usersJson) : [];

      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw new Error('An account with this email already exists');
      }

      const newUser = {
        id: 'usr_' + Date.now(),
        name,
        email,
        password,
        height: 170,
        weight: 70,
        age: 25,
        gender: 'Male',
        goal: 'Maintain Weight',
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
        photo: null,
        darkMode: false,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await AsyncStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
      return newUser;
    } catch (e) {
      throw e;
    }
  },

  async updateUser(updates) {
    try {
      const current = await this.getCurrentUser();
      if (!current) return null;

      const updated = { ...current, ...updates };

      // Calculate BMR & Goals if height/weight/age/gender/goal changed
      const height = parseFloat(updated.height) || 170;
      const weight = parseFloat(updated.weight) || 70;
      const age = parseFloat(updated.age) || 25;
      const gender = updated.gender || 'Male';
      const goal = updated.goal || 'Maintain Weight';

      // Mifflin-St Jeor Equation
      let bmr = 10 * weight + 6.25 * height - 5 * age;
      bmr += gender === 'Female' ? -161 : 5;

      let tdee = Math.round(bmr * 1.375); // Light activity

      if (goal.includes('Lose Weight')) {
        tdee -= 300;
      } else if (goal.includes('Gain Muscle')) {
        tdee += 300;
      }

      tdee = Math.max(1200, tdee);

      updated.calorieGoal = tdee;
      updated.proteinGoal = Math.round((tdee * 0.3) / 4);
      updated.carbsGoal = Math.round((tdee * 0.45) / 4);
      updated.fatGoal = Math.round((tdee * 0.25) / 9);

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));

      // Update in USERS_LIST_KEY
      const usersJson = await AsyncStorage.getItem(USERS_LIST_KEY);
      if (usersJson) {
        const users = JSON.parse(usersJson);
        const idx = users.findIndex(u => u.id === updated.id);
        if (idx !== -1) {
          users[idx] = updated;
          await AsyncStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
        }
      }

      return updated;
    } catch (e) {
      console.warn('Error updating user:', e);
      return null;
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Logout error:', e);
    }
  }
};
