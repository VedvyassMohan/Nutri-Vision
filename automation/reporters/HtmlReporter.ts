/**
 * HtmlReporter — generates execution-report.html + dashboard.html + trends.html
 */
import fs from 'fs';
import path from 'path';
import { TestResult } from '../utils/LogUtil';

const REPORTS_DIR = path.resolve(__dirname, '../reports/HTML');

export class HtmlReporter {
  static async generate() {
    const resultsPath = path.resolve(__dirname, '../reports/execution-results.json');
    let results: TestResult[] = [];

    if (fs.existsSync(resultsPath)) {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    HtmlReporter.writeExecutionReport(results);
    HtmlReporter.writeDashboard(results);
    HtmlReporter.writeTrends(results);
    HtmlReporter.writeMarkdownSummary(results);
    console.log('🌐 HTML reports generated in', REPORTS_DIR);
  }

  static writeExecutionReport(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    const modules = [...new Set(results.map(r => r.module))];

    const moduleRows = modules.map(mod => {
      const mr = results.filter(r => r.module === mod);
      const mp = mr.filter(r => r.status === 'PASSED').length;
      const mf = mr.filter(r => r.status === 'FAILED').length;
      const rate = mr.length > 0 ? ((mp / mr.length) * 100).toFixed(0) : '0';
      return `<tr>
        <td>${mod}</td><td>${mr.length}</td>
        <td style="color:#10b981;font-weight:700">${mp}</td>
        <td style="color:#ef4444;font-weight:700">${mf}</td>
        <td><div class="bar-bg"><div class="bar-fill" style="width:${rate}%"></div></div>${rate}%</td>
      </tr>`;
    }).join('');

    const testRows = results.map(r => {
      const statusColor = r.status === 'PASSED' ? '#10b981' : r.status === 'FAILED' ? '#ef4444' : '#f59e0b';
      const statusIcon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⏭';
      return `<tr>
        <td><code>${r.id}</code></td>
        <td>${r.module}</td>
        <td>${r.name}</td>
        <td><span class="badge badge-${r.priority?.toLowerCase()}">${r.priority}</span></td>
        <td style="color:${statusColor};font-weight:700">${statusIcon} ${r.status}</td>
        <td>${r.duration}ms</td>
        <td style="color:#ef4444;font-size:11px">${r.errorMessage || '—'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nutri-Vision Android E2E Test Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }
  .header { background: linear-gradient(135deg, #0abab5 0%, #0891b2 100%); padding: 32px 40px; }
  .header h1 { font-size: 28px; font-weight: 900; color: white; }
  .header p { color: rgba(255,255,255,0.8); margin-top: 6px; }
  .container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #1e293b; border-radius: 16px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.06); }
  .stat-num { font-size: 36px; font-weight: 900; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .passed { color: #10b981; } .failed { color: #ef4444; } .skipped { color: #f59e0b; } .total { color: #0abab5; }
  .section { background: #1e293b; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.06); }
  .section h2 { font-size: 18px; font-weight: 800; margin-bottom: 16px; color: #0abab5; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #0f172a; color: #94a3b8; padding: 10px 12px; text-align: left; font-weight: 700; font-size: 11px; text-transform: uppercase; }
  td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  tr:hover td { background: rgba(10, 186, 181, 0.04); }
  code { background: rgba(10, 186, 181, 0.1); color: #0abab5; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
  .badge { padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; }
  .badge-high { background: rgba(239,68,68,0.15); color: #ef4444; }
  .badge-medium { background: rgba(245,158,11,0.15); color: #f59e0b; }
  .badge-low { background: rgba(16,185,129,0.15); color: #10b981; }
  .bar-bg { display: inline-block; width: 80px; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; vertical-align: middle; margin-right: 6px; }
  .bar-fill { height: 100%; background: #0abab5; border-radius: 4px; }
  .pass-ring { width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#0abab5 ${passRate}%, #1e293b 0); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .pass-ring-inner { width: 90px; height: 90px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: #0abab5; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .info-label { color: #94a3b8; font-size: 13px; }
  .info-val { font-weight: 700; font-size: 13px; }
</style>
</head>
<body>
<div class="header">
  <h1>🥗 Nutri-Vision Android E2E Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()} | Framework: WebdriverIO + Appium | App: com.nutrivision.expo</p>
</div>
<div class="container">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-num total">${total}</div><div class="stat-label">Total Tests</div></div>
    <div class="stat-card"><div class="stat-num passed">${passed}</div><div class="stat-label">Passed</div></div>
    <div class="stat-card"><div class="stat-num failed">${failed}</div><div class="stat-label">Failed</div></div>
    <div class="stat-card"><div class="stat-num skipped">${skipped}</div><div class="stat-label">Skipped</div></div>
    <div class="stat-card">
      <div class="pass-ring"><div class="pass-ring-inner">${passRate}%</div></div>
      <div class="stat-label">Pass Rate</div>
    </div>
  </div>

  <div class="section">
    <h2>📱 Test Environment</h2>
    <div class="info-grid">
      <div>
        <div class="info-item"><span class="info-label">App Package</span><span class="info-val">com.nutrivision.expo</span></div>
        <div class="info-item"><span class="info-label">Platform</span><span class="info-val">Android</span></div>
        <div class="info-item"><span class="info-label">Framework</span><span class="info-val">WebdriverIO + Appium</span></div>
      </div>
      <div>
        <div class="info-item"><span class="info-label">Run Date</span><span class="info-val">${new Date().toISOString()}</span></div>
        <div class="info-item"><span class="info-label">Total Modules</span><span class="info-val">${modules.length}</span></div>
        <div class="info-item"><span class="info-label">Retry Count</span><span class="info-val">2</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Module-wise Summary</h2>
    <table>
      <tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr>
      ${moduleRows}
    </table>
  </div>

  <div class="section">
    <h2>🧪 Test Case Details</h2>
    <table>
      <tr><th>Test ID</th><th>Module</th><th>Test Name</th><th>Priority</th><th>Status</th><th>Duration</th><th>Error</th></tr>
      ${testRows}
    </table>
  </div>
</div>
</body>
</html>`;

    fs.writeFileSync(path.join(REPORTS_DIR, 'execution-report.html'), html);
  }

  static writeDashboard(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Nutri-Vision QA Dashboard</title>
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
  .dash { background: #1e293b; border-radius: 24px; padding: 48px; max-width: 600px; width: 100%; text-align: center; }
  h1 { font-size: 24px; font-weight: 900; color: #0abab5; margin-bottom: 8px; }
  p { color: #94a3b8; margin-bottom: 32px; }
  .ring { width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(#0abab5 ${passRate}%, #0f172a 0); display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; }
  .ring-inner { width: 140px; height: 140px; background: #1e293b; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .ring-pct { font-size: 32px; font-weight: 900; color: #0abab5; }
  .ring-label { font-size: 12px; color: #94a3b8; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .card { background: #0f172a; border-radius: 12px; padding: 16px; }
  .card-num { font-size: 28px; font-weight: 900; }
  .card-label { font-size: 11px; color: #94a3b8; }
  .g { color: #10b981; } .r { color: #ef4444; } .t { color: #0abab5; }
  a { display: block; margin-top: 24px; color: #0abab5; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<div class="dash">
  <h1>🥗 Nutri-Vision QA Dashboard</h1>
  <p>${new Date().toLocaleDateString()}</p>
  <div class="ring"><div class="ring-inner"><div class="ring-pct">${passRate}%</div><div class="ring-label">Pass Rate</div></div></div>
  <div class="grid">
    <div class="card"><div class="card-num t">${total}</div><div class="card-label">Total</div></div>
    <div class="card"><div class="card-num g">${passed}</div><div class="card-label">Passed</div></div>
    <div class="card"><div class="card-num r">${failed}</div><div class="card-label">Failed</div></div>
  </div>
  <a href="execution-report.html">→ View Full Report</a>
</div>
</body>
</html>`;

    fs.writeFileSync(path.join(REPORTS_DIR, 'dashboard.html'), html);
  }

  static writeTrends(results: TestResult[]) {
    // Minimal trends page — would grow with each CI run adding to history
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Test Trends</title>
<style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:40px;}</style>
</head>
<body>
<h1 style="color:#0abab5">📈 Test Execution Trends</h1>
<p style="color:#94a3b8;margin-top:12px">Historical trends are maintained per CI build in /reports/history/. Each build appends its results to this page.</p>
<p style="margin-top:24px">Latest run: ${new Date().toISOString()} | ${results.length} tests</p>
</body>
</html>`;

    fs.writeFileSync(path.join(REPORTS_DIR, 'trends.html'), html);
  }

  static writeMarkdownSummary(results: TestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    const passedList = results.filter(r => r.status === 'PASSED').slice(0, 20)
      .map(r => `✅ \`${r.id}\` — ${r.name}`).join('\n');
    const failedList = results.filter(r => r.status === 'FAILED')
      .map(r => `❌ \`${r.id}\` — ${r.name}\n  > ${r.errorMessage || 'Unknown error'}`).join('\n');

    const md = `# 🥗 Nutri-Vision Android E2E Execution Summary

| Metric | Value |
|---|---|
| **Total Tests** | ${total} |
| **Passed** | ✅ ${passed} |
| **Failed** | ❌ ${failed} |
| **Skipped** | ⏭ ${skipped} |
| **Pass Rate** | **${passRate}%** |
| **Run Date** | ${new Date().toISOString()} |
| **App Package** | \`com.nutrivision.expo\` |
| **Framework** | WebdriverIO + Appium |

## ✅ Passed Tests (Top 20)

${passedList || 'None'}

## ❌ Failed Tests

${failedList || 'None — all tests passed!'}

---

[📊 View Full HTML Report](./HTML/execution-report.html) | [📑 View Excel Report](./Excel/Automation_Test_Report.xlsx)
`;

    const summaryDir = path.resolve(__dirname, '../reports/Summary');
    fs.mkdirSync(summaryDir, { recursive: true });
    fs.writeFileSync(path.join(summaryDir, 'summary.md'), md);
    console.log('📝 Markdown summary written.');
  }
}
