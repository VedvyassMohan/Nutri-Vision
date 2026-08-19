/**
 * ExcelReporter — generates multi-sheet Excel report from execution-results.json
 */
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { TestResult } from '../utils/LogUtil';

const REPORTS_DIR = path.resolve(__dirname, '../reports/Excel');

export class ExcelReporter {
  static async generate() {
    const resultsPath = path.resolve(__dirname, '../reports/execution-results.json');
    let results: TestResult[] = [];

    if (fs.existsSync(resultsPath)) {
      results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    }

    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    await ExcelReporter.writeMainReport(results);
    await ExcelReporter.writeSummaryReport(results);
    console.log('📊 Excel reports generated in', REPORTS_DIR);
  }

  static async writeMainReport(results: TestResult[]) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Nutri-Vision QA Bot';
    wb.created = new Date();

    const HEADER_FILL: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF0ABAB5' }
    };
    const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    const cols = [
      { header: 'Test ID', key: 'id', width: 22 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Test Name', key: 'name', width: 45 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Duration (ms)', key: 'duration', width: 16 },
      { header: 'Error Message', key: 'errorMessage', width: 40 },
      { header: 'Screenshot', key: 'screenshotPath', width: 35 },
      { header: 'Timestamp', key: 'timestamp', width: 28 },
    ];

    // Sheet 1: All Tests
    const allSheet = wb.addWorksheet('All Tests');
    allSheet.columns = cols;
    allSheet.getRow(1).eachCell(cell => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
    });
    results.forEach(r => {
      const row = allSheet.addRow(r);
      const statusCell = row.getCell('status');
      statusCell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: r.status === 'PASSED' ? 'FF10B981' : r.status === 'FAILED' ? 'FFEF4444' : 'FFFBBF24' }
      };
      statusCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Sheet 2: Passed
    const passSheet = wb.addWorksheet('Passed Tests');
    passSheet.columns = cols;
    passSheet.getRow(1).eachCell(cell => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; });
    results.filter(r => r.status === 'PASSED').forEach(r => passSheet.addRow(r));

    // Sheet 3: Failed
    const failSheet = wb.addWorksheet('Failed Tests');
    failSheet.columns = cols;
    failSheet.getRow(1).eachCell(cell => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; });
    results.filter(r => r.status === 'FAILED').forEach(r => failSheet.addRow(r));

    // Sheet 4: Skipped
    const skipSheet = wb.addWorksheet('Skipped Tests');
    skipSheet.columns = cols;
    skipSheet.getRow(1).eachCell(cell => { cell.fill = HEADER_FILL; cell.font = HEADER_FONT; });
    results.filter(r => r.status === 'SKIPPED').forEach(r => skipSheet.addRow(r));

    // Sheet 5: Execution Metrics
    const metricsSheet = wb.addWorksheet('Execution Metrics');
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
    const avgDuration = total > 0 ? (results.reduce((a, r) => a + r.duration, 0) / total).toFixed(0) : '0';

    metricsSheet.addRows([
      ['Metric', 'Value'],
      ['Total Tests', total],
      ['Passed', passed],
      ['Failed', failed],
      ['Skipped', skipped],
      ['Pass Rate', `${passRate}%`],
      ['Avg Duration', `${avgDuration}ms`],
      ['Run Date', new Date().toISOString()],
      ['App Package', 'com.nutrivision.expo'],
      ['Framework', 'WebdriverIO + Appium'],
    ]);

    // Sheet 6: Module Summary
    const moduleSheet = wb.addWorksheet('Module Summary');
    moduleSheet.addRow(['Module', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate']);
    const modules = [...new Set(results.map(r => r.module))];
    modules.forEach(mod => {
      const modResults = results.filter(r => r.module === mod);
      const mp = modResults.filter(r => r.status === 'PASSED').length;
      const mf = modResults.filter(r => r.status === 'FAILED').length;
      const ms = modResults.filter(r => r.status === 'SKIPPED').length;
      const mr = modResults.length > 0 ? ((mp / modResults.length) * 100).toFixed(1) + '%' : '0%';
      moduleSheet.addRow([mod, modResults.length, mp, mf, ms, mr]);
    });

    // Sheet 7: Defect Summary
    const defectSheet = wb.addWorksheet('Defect Summary');
    defectSheet.addRow(['Test ID', 'Module', 'Test Name', 'Failure Reason', 'Screenshot']);
    results.filter(r => r.status === 'FAILED').forEach(r => {
      defectSheet.addRow([r.id, r.module, r.name, r.errorMessage || '', r.screenshotPath || '']);
    });

    const mainPath = path.join(REPORTS_DIR, 'Automation_Test_Report.xlsx');
    await wb.xlsx.writeFile(mainPath);
    console.log('📑 Main report:', mainPath);

    // Passed-only
    const passWb = new ExcelJS.Workbook();
    const pSheet = passWb.addWorksheet('Passed');
    pSheet.columns = cols;
    results.filter(r => r.status === 'PASSED').forEach(r => pSheet.addRow(r));
    await passWb.xlsx.writeFile(path.join(REPORTS_DIR, 'Passed_Test_Cases.xlsx'));

    // Failed-only
    const failWb = new ExcelJS.Workbook();
    const fSheet = failWb.addWorksheet('Failed');
    fSheet.columns = cols;
    results.filter(r => r.status === 'FAILED').forEach(r => fSheet.addRow(r));
    await failWb.xlsx.writeFile(path.join(REPORTS_DIR, 'Failed_Test_Cases.xlsx'));
  }

  static async writeSummaryReport(results: TestResult[]) {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Summary');
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASSED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';

    sheet.addRows([
      ['Nutri-Vision Android E2E Execution Summary'],
      [],
      ['Total Tests', total],
      ['Passed', passed],
      ['Failed', failed],
      ['Skipped', skipped],
      ['Pass Rate', `${passRate}%`],
      ['Generated', new Date().toISOString()],
    ]);

    await wb.xlsx.writeFile(path.join(REPORTS_DIR, 'Execution_Summary.xlsx'));
  }
}
