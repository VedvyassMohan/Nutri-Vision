import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.resolve(__dirname, '../logs');
const LOG_FILE = path.join(LOGS_DIR, `test-run-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export class LogUtil {
  static log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${message}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
  }

  static info(msg: string)  { LogUtil.log('INFO', msg); }
  static warn(msg: string)  { LogUtil.log('WARN', msg); }
  static error(msg: string) { LogUtil.log('ERROR', msg); }
  static debug(msg: string) { LogUtil.log('DEBUG', msg); }

  static testStart(testId: string, name: string) {
    LogUtil.info(`▶ STARTED: [${testId}] ${name}`);
  }

  static testPass(testId: string, name: string, duration?: number) {
    LogUtil.info(`✅ PASSED: [${testId}] ${name}${duration ? ` (${duration}ms)` : ''}`);
  }

  static testFail(testId: string, name: string, reason: string) {
    LogUtil.error(`❌ FAILED: [${testId}] ${name} | Reason: ${reason}`);
  }

  static testSkip(testId: string, name: string, reason: string) {
    LogUtil.warn(`⏭ SKIPPED: [${testId}] ${name} | Reason: ${reason}`);
  }

  static getLogPath(): string {
    return LOG_FILE;
  }
}

/**
 * Global execution registry – tracks all results for report generation
 */
export interface TestResult {
  id: string;
  module: string;
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED';
  duration: number;
  errorMessage?: string;
  screenshotPath?: string;
  timestamp: string;
}

export const TestRegistry: TestResult[] = [];

export function recordResult(result: TestResult) {
  TestRegistry.push(result);
  const registryPath = path.join(LOGS_DIR, '../reports/execution-results.json');
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify(TestRegistry, null, 2));
}
