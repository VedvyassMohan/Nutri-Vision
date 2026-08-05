# 🥗 Nutri-Vision — Native React Native Mobile Application

Nutri-Vision is a 100% offline, fully local mobile application built with **React Native** and **Expo**. All user data, meal logging, macro calculations, hydration cycle reminders, and food vision intelligence run entirely on your local device with zero external server dependencies.

---

## 📱 Features

- **100% Local & Offline Data Storage**: Uses `@react-native-async-storage/async-storage` for meals, water logs, streaks, and user preferences.
- **Native React Native Components**: Built using native `View`, `Text`, `TouchableOpacity`, `ScrollView`, `TextInput`, `Modal`, `StyleSheet`, and `react-native-svg`.
- **SVG Calorie Progress Ring**: Dynamic gradient SVG circle tracking consumed vs goal calories.
- **Water Cycle & Hydration Tracker**: 250ml interactive glass matrix, interval countdown timer, and daily target controls.
- **Login Streak Tracker**: Tracks consecutive login days with a weekly dot indicator.
- **Meal Log & Macro Breakdown**: Track Protein, Carbs, and Fats with visual goal progress bars.
- **Centered Floating `+` Add Meal Button**: Quick access to log meals from any view.
- **Native 80% Bottom Sheet Modal**: Camera capture (`expo-image-picker`), gallery upload, food dataset search, portion multiplier scaling, and text description ingredient parser.
- **BMR / TDEE Macro Calculator**: Automatic goal adjustments based on height factor, weight, age, gender, and fitness target.
- **Dark Mode Support**: Full light & dark theme toggle.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+ or v20+)
- Expo Go app on your physical mobile device OR Android Studio Emulator / iOS Simulator

### 1. Install Dependencies
```bash
cd expo-app
npm install
```

### 2. Start Expo Development Server
```bash
npm start
```
Or run directly on Android emulator / connected device:
```bash
npm run android
```

### 3. Open on Device / Emulator
- Scan the QR code displayed in your terminal using the **Expo Go** app on Android or iOS.
- Or press `a` in the terminal to launch directly in your Android Emulator.
