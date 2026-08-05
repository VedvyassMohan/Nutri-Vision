# Run Standalone Native React Native App on USB Connected Android Phone (No Expo Go)
$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\Vedvyass M\Music\Nutri-vision\android-sdk"
$adbPath = "$sdkDir\platform-tools\adb.exe"

$env:JAVA_HOME = "$sdkDir\jdk"
$env:ANDROID_HOME = $sdkDir
$env:PATH = "$sdkDir\jdk\bin;$sdkDir\platform-tools;" + $env:PATH

Write-Host "Checking USB Connected Android Devices..." -ForegroundColor Cyan
& $adbPath devices

Write-Host "`nBuilding & Installing Standalone Native React Native App on USB Android Device..." -ForegroundColor Green
npx expo run:android
