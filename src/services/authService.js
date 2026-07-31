import { dbService } from './dbService';

const USERS_KEY = 'nutrivision_users';
const CURRENT_USER_KEY = 'nutrivision_current_user';
const API_BASE = 'http://localhost:5000/api';

export const authService = {
  // Simulate network delay
  delay: (ms = 400) => new Promise(resolve => setTimeout(resolve, ms)),

  getUsers: () => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  saveUser: (user) => {
    const users = authService.getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  signUp: async (userData) => {
    await authService.delay();
    const users = authService.getUsers();
    
    if (users.some(u => u.email === userData.email)) {
      throw new Error('User already exists with this email');
    }

    const newUser = {
      height: '170',
      weight: '70',
      age: '25',
      gender: 'Male',
      goal: 'Maintain Weight',
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    authService.saveUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    dbService.recordLogin(newUser.id);
    authService.calculateAndSaveGoals();

    // Sync to SQL backend
    try {
      await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, password: newUser.password, id: newUser.id })
      });
    } catch (err) {
      console.warn('SQL Auth sync note:', err.message);
    }

    return authService.getCurrentUser() || newUser;
  },

  login: async (email, password) => {
    await authService.delay();
    const users = authService.getUsers();
    let user = users.find(u => u.email === email && u.password === password);

    // Try SQL backend authentication
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.user) {
          user = { ...user, ...json.user };
        }
      }
    } catch (err) {
      console.warn('SQL Login note:', err.message);
    }

    if (!user) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    dbService.recordLogin(user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: () => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(CURRENT_USER_KEY);
  },

  calculateAndSaveGoals: () => {
    const user = authService.getCurrentUser();
    if (!user) return;

    const { height, weight, age, gender, goal } = user;
    if (!height || !weight || !age) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);

    // 1. BMR (Mifflin-St Jeor formula)
    let bmr;
    if (gender?.toLowerCase() === 'male') {
      bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    // 2. TDEE
    const tdee = bmr * 1.375;

    let calories = tdee;
    let proteinMultiplier = 1.4;
    let fatMultiplier = 0.8;

    if (goal?.includes('Lose')) {
      calories = tdee - 300;
      proteinMultiplier = 1.6;
      fatMultiplier = 0.7;
    } else if (goal?.includes('Gain')) {
      calories = tdee + 300;
      proteinMultiplier = 1.8;
      fatMultiplier = 0.8;
    } else {
      calories = tdee;
      proteinMultiplier = 1.4;
      fatMultiplier = 0.8;
    }
    
    calories = Math.round(calories);

    const heightFactor = h / 170;

    let proteinGoal = Math.round(w * proteinMultiplier * heightFactor);
    let fatGoal = Math.round(w * fatMultiplier * heightFactor);

    const proteinCals = proteinGoal * 4;
    const fatCals = fatGoal * 9;
    const remainingCals = Math.max(0, calories - (proteinCals + fatCals));
    let carbsGoal = Math.round(remainingCals / 4);

    const updatedUser = authService.updateUser({
      calorieGoal: calories,
      proteinGoal: proteinGoal,
      fatGoal: fatGoal,
      carbsGoal: carbsGoal
    });

    return updatedUser;
  },

  updateUser: async (updatedData) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) return;

    const newUser = { ...currentUser, ...updatedData };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    // Update in users list too
    const users = authService.getUsers();
    const userIndex = users.findIndex(u => u.id === newUser.id);
    if (userIndex !== -1) {
      users[userIndex] = newUser;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // Sync to SQL database
    try {
      await fetch(`${API_BASE}/user/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newUser.id,
          calorieGoal: newUser.calorieGoal,
          proteinGoal: newUser.proteinGoal,
          carbsGoal: newUser.carbsGoal,
          fatGoal: newUser.fatGoal,
          weight: newUser.weight,
          height: newUser.height,
          age: newUser.age,
          gender: newUser.gender,
          activityLevel: newUser.activityLevel,
          darkMode: newUser.darkMode
        })
      });
    } catch (err) {
      console.warn('SQL User update note:', err.message);
    }

    return newUser;
  }
};
