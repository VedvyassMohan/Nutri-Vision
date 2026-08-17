# CI/CD Execution Guide — GitHub Actions & GitHub Pages

## Pipeline Architecture (21 Stages)

```
[ Push / PR / Schedule ]
       │
       ▼
Stage 1: Checkout Repository
Stage 2: Setup Java 17
Stage 3: Setup Android SDK & Tools
Stage 4: Install JS Dependencies
Stage 5: Build Debug APK via Gradle
       │
       ▼
Stage 6: Create & Launch Android Emulator (macos-13 runner)
Stage 7: Verify Emulator Boot Readiness
Stage 8: Install APK onto Emulator
Stage 9: Launch Appium 2.x Server
Stage 10: Verify Appium Health Check
Stage 11: Execute 400+ Appium E2E Test Cases
       │
       ▼
Stage 12: Capture Screenshots on Failure
Stage 13: Capture Device & Appium Logcat Logs
Stage 14: Generate 7-Sheet Excel Report (Automation_Test_Report.xlsx)
Stage 15: Generate HTML Dashboard & Execution Reports
Stage 16: Generate JSON Results Data Payload
Stage 17: Generate GitHub Actions Step Summary (Markdown)
Stage 18: Upload All Artifacts (30-Day Retention)
       │
       ▼
Stage 19: Prepare Pages Structure (latest/ & history/build-N/)
Stage 20: Generate History & Navigation Index
Stage 21: Deploy to GitHub Pages (gh-pages branch)
```

## GitHub Actions Workflows
- `.github/workflows/android-e2e.yml`: Main 21-stage build, test, and deploy workflow.
- `.github/workflows/deploy-reports.yml`: Dedicated report archiving and Pages deployment workflow.

## Triggering the Pipeline
- **Automatic**: Triggered on `push` to `main` or `develop`, or on `pull_request`.
- **Scheduled**: Scheduled cron runs daily at 02:00 UTC.
- **Manual**: Triggerable via `workflow_dispatch` button under GitHub Actions tab.
