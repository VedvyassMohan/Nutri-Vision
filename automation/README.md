# 🥗 Nutri-Vision Android E2E Automation Framework

## Overview

Enterprise-grade Android E2E automation framework built with **WebdriverIO + Appium + TypeScript**.

- ✅ **510+ Dynamic Test Cases** — generated at runtime from `data/testData.json`
- ✅ **No hardcoded test steps** — all tests are data-driven
- ✅ **Page Object Model** architecture
- ✅ **Excel + HTML + JSON reports** auto-generated
- ✅ **GitHub Pages** report publishing
- ✅ **21-stage CI/CD pipeline** on every push

---

## 📁 Folder Structure

```
automation/
├── config/
│   └── wdio.conf.ts         — WebdriverIO + Appium config
├── pages/
│   ├── BasePage.ts          — Base Page Object (retry, scroll, tap, etc.)
│   ├── AppPages.ts          — LoginPage, HomePage, ProfilePage, NavigationPage
│   └── MealsPage.ts        — MealsPage, AddMealPage
├── tests/
│   ├── auth/auth.spec.ts           — 40+ Auth tests
│   ├── meals/meals.spec.ts         — 80+ Meal tests
│   ├── profile/profile.spec.ts     — 20+ Profile tests
│   ├── navigation/navigation.spec.ts — 30+ Nav tests
│   ├── validation/validation.spec.ts — 40+ Validation tests
│   ├── accessibility/              — 20+ A11Y tests
│   └── regression/                 — 50+ Regression + Perf tests
├── data/
│   └── testData.json        — 🔑 All test data (add new data = new test cases!)
├── utils/
│   ├── LogUtil.ts           — Logging + TestRegistry
│   ├── ScreenshotUtil.ts    — Auto-screenshot on failure
│   └── TestRunner.ts        — Dynamic test executor
├── reporters/
│   ├── ExcelReporter.ts     — 7-sheet Excel workbook generator
│   └── HtmlReporter.ts      — HTML report + dashboard + markdown
└── reports/                 — Auto-generated reports
    ├── Excel/
    │   ├── Automation_Test_Report.xlsx
    │   ├── Passed_Test_Cases.xlsx
    │   ├── Failed_Test_Cases.xlsx
    │   └── Execution_Summary.xlsx
    ├── HTML/
    │   ├── execution-report.html
    │   ├── dashboard.html
    │   └── trends.html
    ├── JSON/
    │   └── execution-results.json
    └── Summary/
        └── summary.md
```

---

## 🚀 Local Execution Guide

### Prerequisites

- Node.js 20+
- Java 17+
- Android Studio / Android SDK
- Appium 2.x
- Connected Android device or emulator

### Step 1 — Install Dependencies

```bash
cd automation
npm install
npm install -g appium
appium driver install uiautomator2
```

### Step 2 — Start Android Emulator

```bash
emulator -avd <your-avd-name> -no-audio -no-snapshot
```

### Step 3 — Build & Install APK

```bash
cd expo-app
npx react-native bundle --platform android --dev false --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
cd android && ./gradlew app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 4 — Start Appium Server

```bash
appium server --port 4723
```

### Step 5 — Run All Tests

```bash
cd automation
npm test
```

### Step 6 — Run Specific Suite

```bash
npm run test:meals
npm run test:auth
npm run test:regression
```

### Step 7 — Generate Reports

```bash
npm run report:all
```

### Step 8 — View Reports

Open `automation/reports/HTML/execution-report.html` in browser.

---

## 📊 How Test Cases Are Generated Dynamically

Tests are **NOT hardcoded**. Here's how they scale automatically:

| Data File Entry | Tests Generated |
|---|---|
| 1 new meal in `testData.meals` | +6 new test cases (add, description, 4 portions) |
| 1 new valid user in `testData.users.validUsers` | +3 new auth tests (login, logout, session) |
| 1 new invalid user in `testData.users.invalidUsers` | +1 new validation test |
| 1 new search query in `testData.searchQueries.valid` | +1 new search test + 1 perf test |
| 1 new profile entry in `testData.profileData.valid` | +1 new profile test |

**To add new test cases: just update `data/testData.json`!**

---

## 🔄 CI/CD Pipeline Stages

| Stage | Description |
|---|---|
| 1 | Checkout repository |
| 2 | Setup Java 17 |
| 3 | Setup Android SDK |
| 4 | Install Node.js dependencies |
| 5 | Build Debug APK |
| 6 | Create + Start Android Emulator |
| 7 | Verify emulator readiness |
| 8 | Install APK on emulator |
| 9 | Start Appium server |
| 10 | Verify Appium health |
| 11 | Execute E2E tests (510+ dynamic cases) |
| 12 | Capture device screenshots |
| 13 | Capture device logs |
| 14 | Generate Excel report |
| 15 | Generate HTML report |
| 16 | Save JSON report |
| 17 | Publish GitHub Actions summary |
| 18 | Upload all artifacts (30-day retention) |
| 19 | Prepare GitHub Pages structure |
| 20 | Archive to history |
| 21 | Deploy to GitHub Pages |

---

## 📄 GitHub Pages Live Reports

After first successful CI run:

```
https://VedvyassMohan.github.io/Nutri-Vision/reports/latest/HTML/execution-report.html
https://VedvyassMohan.github.io/Nutri-Vision/reports/latest/HTML/dashboard.html
```

---

## 🔧 Troubleshooting

| Issue | Fix |
|---|---|
| Emulator not starting | Ensure HAXM is installed. Use `macos-latest` runner for CI. |
| Appium connection refused | Wait 10s after `appium server` before running tests. |
| APK install fails | Use `adb install -r` flag. Ensure USB debugging is enabled. |
| Element not found | Check accessibility IDs in the app match selectors in page objects. |
| Tests failing intermittently | Framework has built-in retry (2 attempts). Increase `mochaOpts.retries`. |

---

## 📌 Configuration

Edit `automation/config/wdio.conf.ts` to change:
- Appium port
- Device name
- Android version
- App package / activity
- Retry count
- Test timeout
