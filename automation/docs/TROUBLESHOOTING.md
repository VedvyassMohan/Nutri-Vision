# Troubleshooting Guide — Common Issues & Solutions

## 1. `npm ci` Lockfile Out-of-Sync Error
- **Symptom**: `npm error 'npm ci' can only install packages when package.json and package-lock.json are in sync`.
- **Solution**: Workflows use `npm install --legacy-peer-deps` without `cache: npm` in `setup-node` to avoid strict lockfile validation failures on CI.

## 2. Emulator Startup Timeout
- **Symptom**: `adb wait-for-device` times out after 10 minutes.
- **Solution**: The workflow uses the `macos-13` runner with hardware acceleration (HAXM/Hypervisor) enabled to boot Android emulators in under 2 minutes.

## 3. Appium Server Connection Refused (`ECONNREFUSED 127.0.0.1:4723`)
- **Symptom**: WebdriverIO fails to connect to Appium.
- **Solution**: Verify Appium server is running on port 4723 (`curl http://localhost:4723/status`). The workflow includes Stage 10 health check polling before starting tests.

## 4. Gradle Build Failure on CI
- **Symptom**: `gradle-wrapper.properties` file not found or invalid URL.
- **Solution**: Ensure `distributionUrl` in `expo-app/android/gradle/wrapper/gradle-wrapper.properties` uses standard HTTPS URL (`https\://services.gradle.org/distributions/gradle-8.8-all.zip`) and not local file paths.

## 5. GitHub Pages 404 Error
- **Symptom**: `https://<user>.github.io/<repo>/reports/latest/execution-report.html` returns 404.
- **Solution**: Navigate to GitHub Repository -> **Settings** -> **Pages** -> **Source** -> Select **`gh-pages` branch** -> Save.
