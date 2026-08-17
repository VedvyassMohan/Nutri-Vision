# Repository & Environment Configuration Guide

## Environment Variables
The automation framework supports the following environment variables:

| Variable | Default Value | Description |
|---|---|---|
| `ANDROID_DEVICE_NAME` | `emulator-5554` | Android device name or AVD identifier |
| `ANDROID_VERSION` | `13.0` | Target Android OS version |
| `APK_PATH` | `./expo-app/android/app/build/outputs/apk/debug/app-debug.apk` | Absolute or relative path to app APK |
| `APPIUM_PORT` | `4723` | Port for Appium HTTP server |

## Framework Architecture & Selector Strategy
- **Pattern**: Page Object Model (POM)
- **Selector Strategy**: Accessibility IDs (`~<accessibility-id>`) prioritized for robust cross-platform test automation.
- **Data Drivers**: `automation/data/testData.json` drives runtime test generation across all 20 modules without hardcoded test logic.
- **Reporting**: ExcelJS for 7-sheet workbook generation + Vanilla HTML/CSS for interactive reporting dashboards + Allure / JUnit XML reporters.
