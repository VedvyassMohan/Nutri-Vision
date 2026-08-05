# Run Nutri-Vision React Native App on USB Connected Android Phone
$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\Vedvyass M\Music\Nutri-vision\android-sdk"
$adbPath = "$sdkDir\platform-tools\adb.exe"

$env:ANDROID_HOME = $sdkDir
$env:PATH = "$sdkDir\platform-tools;" + $env:PATH

Write-Host "Checking USB Connected Android Devices..." -ForegroundColor Cyan
& $adbPath devices

Write-Host "`nLaunching Expo React Native App on USB Android Device..." -ForegroundColor Green
npx expo start --android
