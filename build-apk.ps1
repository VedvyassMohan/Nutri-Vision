# Automatically configure Android SDK and build APK for Nutri-Vision

$ErrorActionPreference = "Stop"
$sdkDir = "C:\Users\Vedvyass M\Music\Nutri-vision\android-sdk"
$zipPath = "$sdkDir\cmdline-tools.zip"

$jdkDir = "$sdkDir\jdk"
$jdkZipPath = "$sdkDir\openjdk.zip"

if (-not (Test-Path $sdkDir)) {
    Write-Host "Creating SDK directory..."
    New-Item -ItemType Directory -Path $sdkDir | Out-Null
}

if (-not (Test-Path "$jdkDir\bin\java.exe")) {
    Write-Host "Downloading portable OpenJDK 21 (190MB) from Adoptium..."
    curl.exe -L -o $jdkZipPath "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse"
    
    Write-Host "Extracting OpenJDK..."
    if (Test-Path "$sdkDir\temp-jdk") { Remove-Item -Recurse -Force "$sdkDir\temp-jdk" }
    Expand-Archive -Path $jdkZipPath -DestinationPath "$sdkDir\temp-jdk"
    
    Write-Host "Structuring JDK folders..."
    $unzippedFolder = Get-ChildItem -Path "$sdkDir\temp-jdk" -Directory | Select-Object -First 1
    Move-Item -Path $unzippedFolder.FullName -Destination $jdkDir
    
    # Clean up temp JDK files
    Remove-Item -Recurse -Force "$sdkDir\temp-jdk"
    Remove-Item -Force $jdkZipPath
}

# Override Java to use our portable JDK 21 (with jlink and all dev tools)
$env:JAVA_HOME = $jdkDir
$env:PATH = "$jdkDir\bin;" + $env:PATH
$env:ANDROID_HOME = $sdkDir

if (-not (Test-Path "$sdkDir\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android Command Line Tools (126MB)..."
    curl.exe -L -o $zipPath "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    
    Write-Host "Extracting Command Line Tools..."
    if (Test-Path "$sdkDir\temp") { Remove-Item -Recurse -Force "$sdkDir\temp" }
    Expand-Archive -Path $zipPath -DestinationPath "$sdkDir\temp"
    
    Write-Host "Structuring folders..."
    New-Item -ItemType Directory -Path "$sdkDir\cmdline-tools" -ErrorAction SilentlyContinue | Out-Null
    Move-Item -Path "$sdkDir\temp\cmdline-tools" -Destination "$sdkDir\cmdline-tools\latest"
    
    # Clean up temp files
    Remove-Item -Recurse -Force "$sdkDir\temp"
    Remove-Item -Force $zipPath
}

Write-Host "Writing local.properties..."
$localProps = "sdk.dir=C\:\\Users\\Vedvyass M\\Music\\Nutri-vision\\android-sdk"
Set-Content -Path "C:\Users\Vedvyass M\Music\Nutri-vision\android\local.properties" -Value $localProps

Write-Host "Accepting Android SDK licenses..."
$sdkManager = "$sdkDir\cmdline-tools\latest\bin\sdkmanager.bat"
# Piping 'y' 30 times is required because sdkmanager prompts for multiple licenses
$yes = @("y") * 30
$yes | & $sdkManager --sdk_root=$sdkDir --licenses

Write-Host "Installing Android SDK platforms and tools (this may take a minute)..."
# We run the command line tools to fetch platform-tools, platforms 36, and build tools 35.0.0
$yes | & $sdkManager --sdk_root=$sdkDir "platform-tools" "platforms;android-36" "build-tools;35.0.0"

Write-Host "Building web application..."
npm run build

Write-Host "Syncing assets to Capacitor..."
npx cap sync android

Write-Host "Compiling Android APK (using JDK 21)..."


cd android
.\gradlew.bat assembleDebug
cd ..

$apkPath = "C:\Users\Vedvyass M\Music\Nutri-vision\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "`n========================================================"
    Write-Host "SUCCESS! The Android APK has been successfully built!"
    Write-Host "APK Location: $apkPath"
    Write-Host "========================================================"
} else {
    Write-Error "Failed to locate output APK file."
}
