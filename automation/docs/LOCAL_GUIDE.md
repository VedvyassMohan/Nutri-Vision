# Local Execution Guide — Nutri-Vision Appium E2E Automation

## Prerequisites
- **Node.js**: v20 or v22
- **Java JDK**: 17+
- **Android SDK & Build Tools**: API level 33/34
- **Appium**: 2.x (`npm install -g appium && appium driver install uiautomator2`)
- **Android Device/Emulator**: Booted with USB debugging or ADB connected (`adb devices`)

## Quick Start Commands

```bash
# 1. Navigate to automation directory
cd automation

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start Appium Server (in a separate terminal)
appium server --port 4723

# 4. Build and Install APK to connected device/emulator
cd ../expo-app
npm install --legacy-peer-deps
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
cd android && ./gradlew app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 5. Execute Test Suite
cd ../../automation
npm test

# 6. Execute Specific Suites
npm run test:auth
npm run test:meals
npm run test:profile
npm run test:navigation
npm run test:validation
npm run test:accessibility
npm run test:regression

# 7. Generate Excel & HTML Reports manually
npm run report:all
```
