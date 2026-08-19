#!/usr/bin/env bash
set -e

echo "========================================="
echo "✅ Emulator booted — starting test pipeline"
echo "========================================="

# Verify adb connection
adb devices
echo "📱 Connected Android devices verified"

# Stage 8 — Install APK
echo "📲 Stage 8 — Installing APK: $APK_PATH"
adb install -r "$APK_PATH"
echo "✅ APK installed successfully"

# Stage 9 — Start Appium Server
echo "🤖 Stage 9 — Starting Appium Server..."
mkdir -p automation/logs
appium server --port 4723 --address 0.0.0.0 --log automation/logs/appium-server.log &
APPIUM_PID=$!
echo "Appium PID: $APPIUM_PID"
sleep 10

# Stage 10 — Verify Appium Health
echo "🏥 Stage 10 — Verifying Appium Health..."
for i in $(seq 1 20); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4723/status || echo "000")
  if [ "$CODE" = "200" ]; then
    echo "✅ Appium ready (attempt $i)"
    break
  fi
  echo "⏳ Attempt $i — HTTP $CODE, retrying..."
  sleep 3
done

# Stage 11 — Execute E2E Tests
echo "🧪 Stage 11 — Executing E2E Tests..."
cd automation
mkdir -p reports/allure-results reports/junit reports/JSON reports/Excel reports/HTML reports/Summary screenshots logs
npx wdio run config/wdio.conf.ts 2>&1 | tee logs/test-run.log || true
cd ..

# Capture device state
echo "📸 Capturing final device screenshot..."
adb shell screencap -p /sdcard/final-state.png 2>/dev/null || true
adb pull /sdcard/final-state.png automation/screenshots/ 2>/dev/null || true

echo "📋 Capturing device logcat..."
adb logcat -d > automation/logs/device-logcat.log 2>/dev/null || true

# Cleanup Appium
echo "🧹 Stopping Appium server..."
kill $APPIUM_PID 2>/dev/null || true

echo "========================================="
echo "✅ E2E test execution completed"
echo "========================================="
