import { TestResult } from '../utils/LogUtil';

/**
 * TestListener — hooks into WebdriverIO lifecycle to track every test
 * and feed real-time data into TestRegistry for report generation.
 */
export class TestListener {
  private static startTimes: Map<string, number> = new Map();

  static onTestStart(title: string) {
    TestListener.startTimes.set(title, Date.now());
    console.log(`  ▶ ${title}`);
  }

  static onTestPass(title: string) {
    const start = TestListener.startTimes.get(title) || Date.now();
    const duration = Date.now() - start;
    console.log(`  ✅ PASS [${duration}ms] ${title}`);
  }

  static onTestFail(title: string, error: Error) {
    const start = TestListener.startTimes.get(title) || Date.now();
    const duration = Date.now() - start;
    console.log(`  ❌ FAIL [${duration}ms] ${title}`);
    console.log(`     ${error?.message || 'Unknown error'}`);
  }

  static onTestSkip(title: string) {
    console.log(`  ⏭ SKIP ${title}`);
  }

  static onSuiteStart(name: string) {
    console.log(`\n📦 Suite: ${name}`);
    console.log('─'.repeat(60));
  }

  static onSuiteEnd(name: string, stats: { passed: number; failed: number; skipped: number }) {
    const total = stats.passed + stats.failed + stats.skipped;
    const rate = total > 0 ? ((stats.passed / total) * 100).toFixed(1) : '0';
    console.log(`\n📊 ${name}: ${stats.passed}/${total} passed (${rate}%)`);
    console.log('─'.repeat(60));
  }

  static onRunComplete(stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }) {
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
    console.log('\n' + '═'.repeat(60));
    console.log('🏁 TEST RUN COMPLETE');
    console.log('═'.repeat(60));
    console.log(`  Total:    ${stats.total}`);
    console.log(`  Passed:   ${stats.passed} ✅`);
    console.log(`  Failed:   ${stats.failed} ❌`);
    console.log(`  Skipped:  ${stats.skipped} ⏭`);
    console.log(`  Pass Rate: ${rate}%`);
    console.log(`  Duration:  ${(stats.duration / 1000).toFixed(1)}s`);
    console.log('═'.repeat(60) + '\n');
  }
}
