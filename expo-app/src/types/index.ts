export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  height: number;
  weight: number;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  goal: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  photo?: string | null;
  darkMode?: boolean;
  createdAt?: string;
}

export interface Meal {
  id: string;
  date: string;
  time: string;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji?: string;
  image?: string | null;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WaterData {
  date?: string;
  glasses: number;
  goal: number;
  targetLiters: number;
  timerEnabled: boolean;
  intervalMinutes: number;
}

export interface WeekDay {
  label: string;
  active: boolean;
}

export interface StreakData {
  currentStreak: number;
  weekDays: WeekDay[];
}

export interface RecipeItem {
  id?: string;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  category?: string;
  emoji?: string;
}

export interface ParsedAdditions {
  additions: { item: string; cal: number }[];
  extraCal: number;
  extraProtein?: number;
  extraCarbs?: number;
  extraFat?: number;
}

export interface ParsedDescriptionResult {
  textAdditions: ParsedAdditions;
  weightGram: number | null;
  detectedRecipe: RecipeItem | null;
  multiplier: number | null;
}

export interface VisionResult {
  isValidFood: boolean;
  foodName?: string;
  cal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  emoji?: string;
  confidence?: number;
  source?: string;
  errorMessage?: string;
}
